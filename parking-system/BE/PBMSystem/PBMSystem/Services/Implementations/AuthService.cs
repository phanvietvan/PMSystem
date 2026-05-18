using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Repositories.Configuration;
using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Enums;
using Repositories.Interfaces;
using Services.Interfaces;
using Google.Apis.Auth;
using System.Text.Json;
using System.Text.RegularExpressions;

namespace Services.Implementations;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IRefreshTokenRepository _tokenRepo;
    private readonly ITokenService _tokenService;
    private readonly IEmailService _emailService;
    private readonly JwtSettings _jwt;
    private readonly ILogger<AuthService> _logger;

    // Cooldown window — one OTP send allowed per email per this duration.
    private static readonly TimeSpan OtpCooldown = TimeSpan.FromSeconds(60);

    public AuthService(
        IUserRepository userRepo,
        IRefreshTokenRepository tokenRepo,
        ITokenService tokenService,
        IEmailService emailService,
        IOptions<JwtSettings> jwtOptions,
        ILogger<AuthService> logger)
    {
        _userRepo = userRepo;
        _tokenRepo = tokenRepo;
        _tokenService = tokenService;
        _emailService = emailService;
        _jwt = jwtOptions.Value;
        _logger = logger;
    }

    // ── OTP Registration — Step 1 ─────────────────────────────────────────────

    public async Task<ApiResponse<OtpSendResponse>> SendRegisterOtpAsync(SendRegisterOtpRequest request)
    {
        var email = request.Email.ToLower().Trim();

        // Only reject if there is a fully registered (active/banned/inactive) account with this email.
        // A pending verification record is allowed to re-request OTP.
        var existingUser = await _userRepo.GetByEmailAsync(email);
        if (existingUser != null && existingUser.Status != UserStatus.PendingVerification)
        {
            return ApiResponse<OtpSendResponse>.Fail("This email is already registered.");
        }

        // Reuse a pending record if one exists so re-requesting a code
        // doesn't create duplicate rows in the database.
        var pending = await _userRepo.GetPendingByEmailAsync(email);

        if (pending is null)
        {
            pending = new User
            {
                Email = email,
                Username = "pending_" + Guid.NewGuid().ToString("N"),
                PasswordHash = string.Empty,
                Status = UserStatus.PendingVerification
            };
            await _userRepo.AddAsync(pending);
            await _userRepo.SaveChangesAsync(); // persist so cooldown check works on new record
        }

        // ── Cooldown check ────────────────────────────────────────────────────
        var cooldownResult = CheckOtpCooldown<OtpSendResponse>(pending.OtpLastSentAt);
        if (cooldownResult is not null)
            return cooldownResult;

        // ── Generate and send ─────────────────────────────────────────────────
        var otp = GenerateOtp();
        pending.OtpCode = otp;
        pending.OtpExpiry = DateTime.UtcNow.AddMinutes(1);
        pending.OtpLastSentAt = DateTime.UtcNow;
        _userRepo.Update(pending);
        await _userRepo.SaveChangesAsync();

        var devOtp = await _emailService.SendOtpEmailAsync(email, otp, EmailOtpPurpose.Registration);

        _logger.LogInformation("Registration OTP sent to {Email}", email);

        return ApiResponse<OtpSendResponse>.Ok(new OtpSendResponse
        {
            Message = "OTP sent. Please check your email.",
            OtpCode = devOtp  // null in production
        });
    }

    public async Task<ApiResponse<AuthResponse>> VerifyRegisterOtpAsync(
        VerifyRegisterOtpRequest request, string? ipAddress = null)
    {
        var email = request.Email.ToLower().Trim();
        var pending = await _userRepo.GetPendingByEmailAsync(email);

        if (string.IsNullOrWhiteSpace(request.Otp) || 
            pending is null || 
            string.IsNullOrWhiteSpace(pending.OtpCode) || 
            pending.OtpCode != request.Otp)
        {
            return ApiResponse<AuthResponse>.Fail("Invalid OTP.");
        }

        if (pending.OtpExpiry < DateTime.UtcNow)
            return ApiResponse<AuthResponse>.Fail("OTP has expired. Please request a new one.");

        if (await _userRepo.UsernameExistsAsync(request.Username))
            return ApiResponse<AuthResponse>.Fail("Username is already taken.");

        if (!IsStrongPassword(request.Password, out var pwdError))
            return ApiResponse<AuthResponse>.Fail(pwdError);

        // Complete registration — clear all OTP fields after successful use
        pending.Username = request.Username.ToLower().Trim();
        pending.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        pending.FirstName = request.FirstName?.Trim();
        pending.LastName = request.LastName?.Trim();
        pending.Status = UserStatus.Active;
        pending.OtpCode = null;
        pending.OtpExpiry = null;
        pending.OtpLastSentAt = null;
        _userRepo.Update(pending);
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("User registered via OTP: {UserId} ({Email})", pending.Id, pending.Email);
        return await IssueTokensAsync(pending, ipAddress);
    }

    // ── Forgot Password — Step 1 ──────────────────────────────────────────────

    public async Task<ApiResponse<OtpSendResponse>> SendForgotPasswordOtpAsync(ForgotPasswordRequest request)
    {
        var email = request.Email.ToLower().Trim();
        var user = await _userRepo.GetByEmailAsync(email);

        if (user is null)
        {
            _logger.LogWarning("Forgot password requested for unknown email: {Email}", email);
            return ApiResponse<OtpSendResponse>.Fail("Email không tồn tại trong hệ thống.");
        }

        // ── Cooldown check ────────────────────────────────────────────────────
        var cooldownResult = CheckOtpCooldown<OtpSendResponse>(user.OtpLastSentAt);
        if (cooldownResult is not null)
            return cooldownResult;

        // ── Generate and send ─────────────────────────────────────────────────
        var otp = GenerateOtp();
        user.OtpCode = otp;
        user.OtpExpiry = DateTime.UtcNow.AddMinutes(1);
        user.OtpLastSentAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();

        var devOtp = await _emailService.SendOtpEmailAsync(email, otp, EmailOtpPurpose.ForgotPassword);

        _logger.LogInformation("Password reset OTP sent to {Email}", email);

        return ApiResponse<OtpSendResponse>.Ok(new OtpSendResponse
        {
            Message = "If that email is registered, an OTP has been sent.",
            OtpCode = devOtp  // null in production
        });
    }


    // ── Forgot Password — Step 1.5 ────────────────────────────────────────────


    public async Task<ApiResponse<bool>> VerifyForgotPasswordOtpAsync(VerifyForgotPasswordOtpRequest request)
    {
        var email = request.Email.ToLower().Trim();
        var user = await _userRepo.GetByEmailAsync(email);

        if (string.IsNullOrWhiteSpace(request.Otp) || 
            user is null || 
            string.IsNullOrWhiteSpace(user.OtpCode) || 
            user.OtpCode != request.Otp)
        {
            return ApiResponse<bool>.Fail("Invalid OTP.");
        }

        if (user.OtpExpiry < DateTime.UtcNow)
            return ApiResponse<bool>.Fail("OTP has expired. Please request a new one.");

        return ApiResponse<bool>.Ok(true, "OTP verified successfully.");
    }


    // ── Forgot Password — Step 2 ──────────────────────────────────────────────


    public async Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request)
    {
        var email = request.Email.ToLower().Trim();
        var user = await _userRepo.GetByEmailAsync(email);

        if (string.IsNullOrWhiteSpace(request.Otp) || 
            user is null || 
            string.IsNullOrWhiteSpace(user.OtpCode) || 
            user.OtpCode != request.Otp)
        {
            return ApiResponse<bool>.Fail("Invalid OTP.");
        }

        if (user.OtpExpiry < DateTime.UtcNow)
            return ApiResponse<bool>.Fail("OTP has expired. Please request a new one.");

        if (!IsStrongPassword(request.NewPassword, out var pwdError))
            return ApiResponse<bool>.Fail(pwdError);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        user.OtpCode = null;
        user.OtpExpiry = null;
        user.OtpLastSentAt = null;
        _userRepo.Update(user);

        // Revoke all sessions — force re-login on all devices after reset
        await _tokenRepo.RevokeAllUserTokensAsync(user.Id, "Password reset via OTP");
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("Password reset completed for {UserId}", user.Id);
        return ApiResponse<bool>.Ok(true, "Password has been reset successfully.");
    }

    // ── Login ─────────────────────────────────────────────────────────────────

    public async Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request, string? ipAddress = null)
    {
        var user = await _userRepo.GetByEmailOrUsernameAsync(request.EmailOrUsername);

        if (user is null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return ApiResponse<AuthResponse>.Fail("Invalid credentials.");

        if (user.Status == UserStatus.Banned)
            return ApiResponse<AuthResponse>.Fail("Your account has been suspended.");

        if (user.Status == UserStatus.Inactive)
            return ApiResponse<AuthResponse>.Fail("Account is inactive.");

        if (user.Status == UserStatus.PendingVerification)
            return ApiResponse<AuthResponse>.Fail("Please complete email verification before logging in.");

        user.LastLoginAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("User logged in: {UserId}", user.Id);
        return await IssueTokensAsync(user, ipAddress);
    }

    // ── Refresh Token ─────────────────────────────────────────────────────────

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

    // ── Revoke Token ──────────────────────────────────────────────────────────

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

    // ── Change Password ───────────────────────────────────────────────────────

    public async Task<ApiResponse<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user is null)
            return ApiResponse<bool>.Fail("User not found.");

        if (!BCrypt.Net.BCrypt.Verify(request.CurrentPassword, user.PasswordHash))
            return ApiResponse<bool>.Fail("Current password is incorrect.");

        if (!IsStrongPassword(request.NewPassword, out var pwdError))
            return ApiResponse<bool>.Fail(pwdError);

        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        _userRepo.Update(user);

        await _tokenRepo.RevokeAllUserTokensAsync(userId, "Password changed");
        await _userRepo.SaveChangesAsync();

        return ApiResponse<bool>.Ok(true, "Password changed successfully.");
    }

    // ── Get Profile ───────────────────────────────────────────────────────────

    public async Task<ApiResponse<UserResponse>> GetProfileAsync(Guid userId)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user is null)
            return ApiResponse<UserResponse>.Fail("User not found.");

        return ApiResponse<UserResponse>.Ok(MapToResponse(user));
    }

    public async Task<ApiResponse<AuthResponse>> LoginWithGoogleAsync(string idToken, string? ipAddress = null)
    {
        try
        {
            string email = "";
            string firstName = "Google";
            string lastName = "User";
            string? avatarUrl = null;

            if (idToken.Contains('.'))
            {
                try
                {
                    var payload = await GoogleJsonWebSignature.ValidateAsync(idToken);
                    if (payload != null)
                    {
                        email = payload.Email.ToLower().Trim();
                        firstName = payload.GivenName ?? "Google";
                        lastName = payload.FamilyName ?? "User";
                        avatarUrl = payload.Picture;
                    }
                }
                catch (InvalidJwtException)
                {
                    // Fall back to UserInfo for access tokens
                }
            }

            if (string.IsNullOrEmpty(email))
            {
                using var httpClient = new HttpClient();
                var response = await httpClient.GetAsync(
                    $"https://www.googleapis.com/oauth2/v3/userinfo?access_token={idToken}");
                if (!response.IsSuccessStatusCode)
                    return ApiResponse<AuthResponse>.Fail("Invalid Google token.");

                var json = await response.Content.ReadAsStringAsync();
                using var doc = System.Text.Json.JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.TryGetProperty("email", out var emailProp))
                    email = emailProp.GetString()?.ToLower().Trim() ?? "";
                if (root.TryGetProperty("given_name", out var givenProp))
                    firstName = givenProp.GetString() ?? "Google";
                if (root.TryGetProperty("family_name", out var familyProp))
                    lastName = familyProp.GetString() ?? "User";
                if (root.TryGetProperty("picture", out var pictureProp))
                    avatarUrl = pictureProp.GetString();
            }

            if (string.IsNullOrEmpty(email))
                return ApiResponse<AuthResponse>.Fail("Could not retrieve email from Google token.");

            var user = await _userRepo.GetByEmailOrUsernameAsync(email);

            if (user is null)
            {
                user = await CreateGoogleUserAsync(email, firstName, lastName, avatarUrl);
                _logger.LogInformation("New user auto-registered via Google: {UserId} ({Email})", user.Id, user.Email);
            }
            else
            {
                if (user.Status == UserStatus.Banned)
                    return ApiResponse<AuthResponse>.Fail("Your account has been suspended.");

                if (user.Status == UserStatus.Inactive)
                    return ApiResponse<AuthResponse>.Fail("Account is inactive.");

                // Always sync / update the avatar URL from Google if present and changed
                if (!string.IsNullOrEmpty(avatarUrl) && user.AvatarUrl != avatarUrl)
                {
                    user.AvatarUrl = avatarUrl;
                }

                if (user.Status == UserStatus.PendingVerification)
                {
                    await CompletePendingGoogleUserAsync(user, email, firstName, lastName, avatarUrl);
                    _logger.LogInformation("Pending user completed registration via Google: {UserId}", user.Id);
                }
                else
                {
                    user.LastLoginAt = DateTime.UtcNow;
                    _userRepo.Update(user);
                    await _userRepo.SaveChangesAsync();
                    _logger.LogInformation("User logged in via Google: {UserId}", user.Id);
                }
            }

            return await IssueTokensAsync(user, ipAddress);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error validating Google token.");
            return ApiResponse<AuthResponse>.Fail("Google login failed due to an internal error.");
        }
    }

    public async Task<ApiResponse<UserResponse>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request)
    {
        var user = await _userRepo.GetByIdAsync(userId);
        if (user is null)
            return ApiResponse<UserResponse>.Fail("User not found.");

        if (!IsValidLicensePlate(request.LicensePlate))
            return ApiResponse<UserResponse>.Fail("Biển số xe không đúng định dạng. Ký tự thứ 3 bắt buộc là chữ cái (Ví dụ: 29A-123.45 hoặc 59G1-12345).");

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.PhoneNumber = request.PhoneNumber.Trim();
        user.Address = request.Address.Trim();
        user.LicensePlate = request.LicensePlate.Trim();
        user.VehicleType = request.VehicleType.Trim();
        
        if (request.AvatarUrl != null)
        {
            user.AvatarUrl = request.AvatarUrl;
        }

        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("Profile updated for user: {UserId}", userId);
        return ApiResponse<UserResponse>.Ok(MapToResponse(user), "Profile updated successfully.");
    }

    public async Task<ApiResponse<IEnumerable<UserResponse>>> GetAllUsersAsync()
    {
        var users = await _userRepo.GetAllAsync();
        var response = users
            .Where(u => u.Status != UserStatus.PendingVerification)
            .Select(MapToResponse);
        return ApiResponse<IEnumerable<UserResponse>>.Ok(response);
    }

    public async Task<ApiResponse<UserResponse>> UpdateUserAsAdminAsync(
        Guid actorId,
        string actorRole,
        Guid targetUserId,
        AdminUpdateUserRequest request)
    {
        if (!Enum.TryParse<UserRole>(request.Role, true, out var newRole))
            return ApiResponse<UserResponse>.Fail("Invalid role.");

        if (!Enum.TryParse<UserStatus>(request.Status, true, out var newStatus))
            return ApiResponse<UserResponse>.Fail("Invalid status.");

        if (actorRole.Equals(nameof(UserRole.Staff), StringComparison.OrdinalIgnoreCase)
            && newRole == UserRole.Admin)
            return ApiResponse<UserResponse>.Fail("Staff cannot assign Admin role.");

        var user = await _userRepo.GetByIdAsync(targetUserId);
        if (user is null)
            return ApiResponse<UserResponse>.Fail("User not found.");

        if (!string.IsNullOrWhiteSpace(request.LicensePlate) && !IsValidLicensePlate(request.LicensePlate))
            return ApiResponse<UserResponse>.Fail("Biển số xe không đúng định dạng. Ký tự thứ 3 bắt buộc là chữ cái (Ví dụ: 29A-123.45 hoặc 59G1-12345).");

        user.FirstName = request.FirstName.Trim();
        user.LastName = request.LastName.Trim();
        user.PhoneNumber = request.PhoneNumber?.Trim();
        user.Address = request.Address?.Trim();
        user.LicensePlate = request.LicensePlate?.Trim();
        user.VehicleType = request.VehicleType?.Trim();
        user.Role = newRole;
        user.Status = newStatus;

        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation(
            "User {TargetId} updated by {ActorId} ({ActorRole})", targetUserId, actorId, actorRole);
        return ApiResponse<UserResponse>.Ok(MapToResponse(user), "User updated successfully.");
    }

    public async Task<ApiResponse<bool>> DeleteUserAsync(Guid actorId, string actorRole, Guid targetUserId)
    {
        if (actorId == targetUserId)
            return ApiResponse<bool>.Fail("Bạn không thể tự xóa chính mình.");

        var user = await _userRepo.GetByIdAsync(targetUserId);
        if (user is null)
            return ApiResponse<bool>.Fail("Không tìm thấy người dùng.");

        if (user.Role == UserRole.Admin && !actorRole.Equals(nameof(UserRole.Admin), StringComparison.OrdinalIgnoreCase))
            return ApiResponse<bool>.Fail("Chỉ Quản trị viên mới được xóa tài khoản Quản trị viên khác.");

        _userRepo.SoftDelete(user);
        await _userRepo.SaveChangesAsync();

        _logger.LogInformation("User {TargetId} soft-deleted by {ActorId} ({ActorRole})", targetUserId, actorId, actorRole);
        return ApiResponse<bool>.Ok(true, "Xóa người dùng thành công.");
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private static bool ValidateSinglePlate(string plate)
    {
        if (string.IsNullOrWhiteSpace(plate)) return false;
        var clean = Regex.Replace(plate, @"[-.\s]", "").ToUpper();
        return Regex.IsMatch(clean, @"^\d{2}[A-Z][A-Z0-9]?\d{4,5}$");
    }

    private static bool IsValidLicensePlate(string? licensePlate)
    {
        if (string.IsNullOrWhiteSpace(licensePlate)) return false;
        var trimmed = licensePlate.Trim();

        if (trimmed.StartsWith("[") && trimmed.EndsWith("]"))
        {
            try
            {
                using var doc = JsonDocument.Parse(trimmed);
                if (doc.RootElement.ValueKind != JsonValueKind.Array) return false;
                
                var array = doc.RootElement;
                if (array.GetArrayLength() == 0) return false;

                foreach (var element in array.EnumerateArray())
                {
                    string? plate = null;
                    if (element.TryGetProperty("plate", out var plateProp))
                    {
                        plate = plateProp.GetString();
                    }
                    else if (element.TryGetProperty("Plate", out var platePropUpper))
                    {
                        plate = platePropUpper.GetString();
                    }

                    if (string.IsNullOrWhiteSpace(plate) || !ValidateSinglePlate(plate))
                    {
                        return false;
                    }
                }
                return true;
            }
            catch
            {
                // Fallback
            }
        }

        return ValidateSinglePlate(trimmed);
    }

    private async Task<User> CreateGoogleUserAsync(string email, string firstName, string lastName, string? avatarUrl)
    {
        var username = await GenerateUniqueUsernameAsync(email.Split('@')[0]);
        var role = email.Equals("vietvanphan04@gmail.com", StringComparison.OrdinalIgnoreCase) ? UserRole.Admin : UserRole.User;
        var user = new User
        {
            Email = email,
            Username = username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N")),
            FirstName = firstName,
            LastName = lastName,
            AvatarUrl = avatarUrl,
            Status = UserStatus.Active,
            Role = role
        };

        await _userRepo.AddAsync(user);
        await _userRepo.SaveChangesAsync();
        return user;
    }

    private async Task CompletePendingGoogleUserAsync(User user, string email, string firstName, string lastName, string? avatarUrl)
    {
        if (string.IsNullOrEmpty(user.Username))
            user.Username = await GenerateUniqueUsernameAsync(email.Split('@')[0]);

        if (string.IsNullOrEmpty(user.PasswordHash))
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString("N"));

        user.FirstName = firstName;
        user.LastName = lastName;
        user.AvatarUrl = avatarUrl;
        user.Status = UserStatus.Active;
        if (email.Equals("vietvanphan04@gmail.com", StringComparison.OrdinalIgnoreCase))
        {
            user.Role = UserRole.Admin;
        }
        user.OtpCode = null;
        user.OtpExpiry = null;
        user.OtpLastSentAt = null;
        user.LastLoginAt = DateTime.UtcNow;
        _userRepo.Update(user);
        await _userRepo.SaveChangesAsync();
    }

    private async Task<string> GenerateUniqueUsernameAsync(string baseUsername)
    {
        var username = baseUsername.ToLower().Trim();
        var count = 1;
        while (await _userRepo.UsernameExistsAsync(username))
            username = $"{baseUsername.ToLower().Trim()}{count++}";
        return username;
    }

    /// <summary>
    /// Checks whether the given OtpLastSentAt timestamp is within the cooldown window.
    /// Returns a failure response with the seconds remaining if still cooling down,
    /// or null if the send is allowed to proceed.
    /// Shared by both registration and forgot-password send flows.
    /// </summary>
    private static ApiResponse<T>? CheckOtpCooldown<T>(DateTime? otpLastSentAt)
    {
        if (otpLastSentAt is null)
            return null; // first send — no cooldown

        var elapsed = DateTime.UtcNow - otpLastSentAt.Value;
        if (elapsed >= OtpCooldown)
            return null; // cooldown has passed — allow send

        var secondsRemaining = (int)(OtpCooldown - elapsed).TotalSeconds + 1;
        return ApiResponse<T>.Fail(
            $"Please wait {secondsRemaining} second{(secondsRemaining == 1 ? "" : "s")} before requesting a new code.");
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

    /// <summary>Cryptographically random 6-digit OTP, zero-padded.</summary>
    private static string GenerateOtp()
    {
        var bytes = new byte[4];
        System.Security.Cryptography.RandomNumberGenerator.Fill(bytes);
        var value = Math.Abs(BitConverter.ToInt32(bytes, 0)) % 1_000_000;
        return value.ToString("D6");
    }

    private static UserResponse MapToResponse(User user) => new()
    {
        Id = user.Id,
        Email = user.Email,
        Username = user.Username,
        FirstName = user.FirstName,
        LastName = user.LastName,
        PhoneNumber = user.PhoneNumber,
        Address = user.Address,
        LicensePlate = user.LicensePlate,
        VehicleType = user.VehicleType,
        AvatarUrl = user.AvatarUrl,
        Role = user.Role.ToString(),
        Status = user.Status.ToString(),
        LastLoginAt = user.LastLoginAt,
        CreatedAt = user.CreatedAt
    };

    public async Task<ApiResponse<bool>> CheckEmailRegisteredAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
        {
            return ApiResponse<bool>.Fail("Email không được để trống.");
        }
        var cleanedEmail = email.ToLower().Trim();
        try
        {
            var addr = new System.Net.Mail.MailAddress(cleanedEmail);
            if (addr.Address != cleanedEmail)
            {
                return ApiResponse<bool>.Fail("Email không hợp lệ.");
            }
        }
        catch
        {
            return ApiResponse<bool>.Fail("Email không đúng định dạng.");
        }

        var existingUser = await _userRepo.GetByEmailAsync(cleanedEmail);
        if (existingUser != null && existingUser.Status != UserStatus.PendingVerification)
        {
            return ApiResponse<bool>.Fail("Email này đã được đăng ký.");
        }
        return ApiResponse<bool>.Ok(true, "Email khả dụng.");
    }

    private static bool IsStrongPassword(string password, out string errorMessage)
    {
        if (string.IsNullOrWhiteSpace(password))
        {
            errorMessage = "Mật khẩu không được để trống.";
            return false;
        }

        if (password.Length < 8)
        {
            errorMessage = "Mật khẩu phải chứa ít nhất 8 ký tự.";
            return false;
        }

        bool hasUpper = false;
        bool hasLower = false;
        bool hasDigit = false;
        bool hasSpecial = false;

        foreach (char c in password)
        {
            if (char.IsUpper(c)) hasUpper = true;
            else if (char.IsLower(c)) hasLower = true;
            else if (char.IsDigit(c)) hasDigit = true;
            else if (!char.IsLetterOrDigit(c)) hasSpecial = true;
        }

        if (!hasUpper || !hasLower || !hasDigit || !hasSpecial)
        {
            errorMessage = "Mật khẩu phải bao gồm cả chữ hoa, chữ thường, chữ số và ít nhất một ký tự đặc biệt.";
            return false;
        }

        errorMessage = string.Empty;
        return true;
    }
}
