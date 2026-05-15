using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Repositories.Configuration;
using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Enums;
using Repositories.Interfaces;
using Services.Interfaces;

namespace Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IRefreshTokenRepository _tokenRepo;
    private readonly ITokenService _tokenService;
    private readonly JwtSettings _jwt;
    private readonly ILogger<AuthService> _logger;

    public AuthService(
        IUserRepository userRepo,
        IRefreshTokenRepository tokenRepo,
        ITokenService tokenService,
        IOptions<JwtSettings> jwtOptions,
        ILogger<AuthService> logger)
    {
        _userRepo = userRepo;
        _tokenRepo = tokenRepo;
        _tokenService = tokenService;
        _jwt = jwtOptions.Value;
        _logger = logger;
    }

    public async Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request, string? ipAddress = null)
    {
        if (await _userRepo.EmailExistsAsync(request.Email))
            return ApiResponse<AuthResponse>.Fail("Email is already registered.");

        if (await _userRepo.UsernameExistsAsync(request.Username))
            return ApiResponse<AuthResponse>.Fail("Username is already taken.");

        var user = new User
        {
            Email = request.Email.ToLower().Trim(),
            Username = request.Username.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FirstName = request.FirstName?.Trim(),
            LastName = request.LastName?.Trim(),
            Status = UserStatus.Active
        };

        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("New user registered: {UserId} ({Email})", user.Id, user.Email);
        return await IssueTokensAsync(user, ipAddress);
    }

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request, string? ipAddress = null)
    {
        var user = await _userRepo.GetByEmailOrUsernameAsync(request.EmailOrUsername);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return ApiResponse<AuthResponse>.Fail("Invalid credentials.");

        if (user.Status == UserStatus.Banned)
            return ApiResponse<AuthResponse>.Fail("Your account has been suspended.");

        if (user.Status == UserStatus.Inactive)
            return ApiResponse<AuthResponse>.Fail("Account is inactive.");

        user.LastLoginAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("User logged in: {UserId}", user.Id);
        return await IssueTokensAsync(user, ipAddress);
    }

    public async Task<ApiResponse<AuthResponse>> RefreshTokenAsync(string refreshToken, string? ipAddress = null)
    {
        var stored = await _tokenRepo.GetActiveTokenAsync(refreshToken);

        if (stored is null)
            return ApiResponse<AuthResponse>.Fail("Invalid refresh token.");

        if (!stored.IsActive)
            return ApiResponse<AuthResponse>.Fail("Refresh token has expired or been revoked.");

        stored.IsRevoked = true;
        stored.RevokedAt = DateTime.UtcNow;
        stored.RevokedReason = "Replaced by rotation";
        _tokenRepo.Update(stored);

        _logger.LogInformation("Refresh token rotated for user: {UserId}", stored.UserId);
        return await IssueTokensAsync(stored.User, ipAddress, stored);
    }

    public async Task<ApiResponse<bool>> RevokeTokenAsync(string refreshToken, string? ipAddress = null)
    {
        var stored = await _tokenRepo.GetActiveTokenAsync(refreshToken);

        if (stored is null || !stored.IsActive)
            return ApiResponse<bool>.Fail("Token not found or already inactive.");

        stored.IsRevoked = true;
        stored.RevokedAt = DateTime.UtcNow;
        stored.RevokedReason = "Manual revocation";
        _tokenRepo.Update(stored);
        await _tokenRepo.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Token revoked.");
    }

    public async Task<ApiResponse<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user is null)
            return ApiResponse<bool>.Fail("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return ApiResponse<bool>.Fail("Current password is incorrect.");

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        _userRepo.Update(user);

        await _tokenRepo.RevokeAllUserTokensAsync(userId, "Password changed");
        await _userRepo.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Password changed successfully.");
    }

    public async Task<ApiResponse<UserResponse>> GetProfileAsync(Guid userId)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user is null)
            return ApiResponse<UserResponse>.Fail("User not found.");

        return ApiResponse<UserResponse>.Ok(MapToResponse(user));
    }

    private async Task<ApiResponse<AuthResponse>> IssueTokensAsync(
        User user, string? ipAddress, RefreshToken? replacedToken = null)
    {
        var accessToken = _tokenService.GenerateAccessToken(user);
        var rawRefreshToken = _tokenService.GenerateRefreshToken();

        var refreshToken = new RefreshToken
        {
            UserId = user.Id,
            Token = rawRefreshToken,
            ExpiresAt = DateTime.UtcNow.AddDays(_jwt.RefreshTokenExpiryDays),
            CreatedByIp = ipAddress,
            ReplacedByToken = replacedToken?.Token
        };

        await _tokenRepo.AddAsync(refreshToken);
        await _tokenRepo.SaveChangesAsync();

        return ApiResponse<AuthResponse>.Ok(new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = rawRefreshToken,
            AccessTokenExpiry = _tokenService.GetAccessTokenExpiry(),
            User = MapToResponse(user)
        });
    }

    private static UserResponse MapToResponse(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Username = user.Username,
        FirstName = user.FirstName,
        LastName = user.LastName,
        CreatedAt = user.CreatedAt
    };
}
