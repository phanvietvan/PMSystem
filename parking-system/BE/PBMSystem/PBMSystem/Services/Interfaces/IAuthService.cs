using Repositories.DTOs;

namespace Services.Interfaces;

/// <summary>
/// Core authentication contract.
/// Add new auth-related operations here and implement in AuthService.
/// </summary>
public interface IAuthService
{
    Task<ApiResponse<AuthResponse>> RegisterAsync(RegisterRequest request, string? ipAddress = null);
    Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request, string? ipAddress = null);
    Task<ApiResponse<AuthResponse>> GoogleLoginAsync(GoogleLoginRequest request, string? ipAddress = null);
    Task<ApiResponse<AuthResponse>> RefreshTokenAsync(string refreshToken, string? ipAddress = null);
    Task<ApiResponse<bool>> RevokeTokenAsync(string refreshToken, string? ipAddress = null);
    Task<ApiResponse<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<ApiResponse<UserResponse>> GetProfileAsync(Guid userId);
    Task<ApiResponse<IEnumerable<UserResponse>>> GetAllUsersAsync();
}
