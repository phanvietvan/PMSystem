using Repositories.DTOs;

namespace Services.Interfaces;

/// <summary>
/// Core authentication contract.
/// Add new auth-related operations here and implement in AuthService.
/// </summary>
public interface IAuthService
{
    // ── Standard Auth ─────────────────────────────────────────────────────────
    Task<ApiResponse<AuthResponse>> LoginAsync(LoginRequest request, string? ipAddress = null);
    Task<ApiResponse<AuthResponse>> RefreshTokenAsync(string refreshToken, string? ipAddress = null);
    Task<ApiResponse<bool>> RevokeTokenAsync(string refreshToken, string? ipAddress = null);
    Task<ApiResponse<bool>> ChangePasswordAsync(Guid userId, ChangePasswordRequest request);
    Task<ApiResponse<UserResponse>> GetProfileAsync(Guid userId);
    Task<ApiResponse<AuthResponse>> LoginWithGoogleAsync(string idToken, string? ipAddress = null);
    Task<ApiResponse<UserResponse>> UpdateProfileAsync(Guid userId, UpdateProfileRequest request);
    Task<ApiResponse<IEnumerable<UserResponse>>> GetAllUsersAsync();
    Task<ApiResponse<UserResponse>> UpdateUserAsAdminAsync(
        Guid actorId, string actorRole, Guid targetUserId, AdminUpdateUserRequest request);
    Task<ApiResponse<bool>> DeleteUserAsync(Guid actorId, string actorRole, Guid targetUserId);

    // ── OTP Registration ──────────────────────────────────────────────────────
    Task<ApiResponse<OtpSendResponse>> SendRegisterOtpAsync(SendRegisterOtpRequest request);
    Task<ApiResponse<AuthResponse>> VerifyRegisterOtpAsync(VerifyRegisterOtpRequest request, string? ipAddress = null);
    Task<ApiResponse<bool>> CheckEmailRegisteredAsync(string email);

    // ── Forgot / Reset Password ───────────────────────────────────────────────
    Task<ApiResponse<OtpSendResponse>> SendForgotPasswordOtpAsync(ForgotPasswordRequest request);
    Task<ApiResponse<bool>> VerifyForgotPasswordOtpAsync(VerifyForgotPasswordOtpRequest request);
    Task<ApiResponse<bool>> ResetPasswordAsync(ResetPasswordRequest request);
}
