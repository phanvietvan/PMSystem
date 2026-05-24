using System.ComponentModel.DataAnnotations;

namespace Repositories.DTOs;

// ── Requests — Auth ───────────────────────────────────────────────────────────

public class RegisterRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    public string? FirstName { get; set; }
    public string? LastName { get; set; }
}

public class LoginRequest
{
    [Required]
    public string EmailOrUsername { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class RefreshTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class ChangePasswordRequest
{
    [Required]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

public class RevokeTokenRequest
{
    [Required]
    public string RefreshToken { get; set; } = string.Empty;
}

public class GoogleLoginRequest
{
    [Required]
    public string IdToken { get; set; } = string.Empty;
}

public class UpdateProfileRequest
{
    [Required(ErrorMessage = "Tên không được để trống."), MinLength(2, ErrorMessage = "Tên phải chứa ít nhất 2 ký tự."), MaxLength(50, ErrorMessage = "Tên không được vượt quá 50 ký tự.")]
    [RegularExpression(@"^[\p{L}\s]+$", ErrorMessage = "Tên chỉ được chứa chữ cái và khoảng trắng.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Họ không được để trống."), MinLength(2, ErrorMessage = "Họ phải chứa ít nhất 2 ký tự."), MaxLength(50, ErrorMessage = "Họ không được vượt quá 50 ký tự.")]
    [RegularExpression(@"^[\p{L}\s]+$", ErrorMessage = "Họ chỉ được chứa chữ cái và khoảng trắng.")]
    public string LastName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Số điện thoại không được để trống.")]
    [RegularExpression(@"^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$", ErrorMessage = "Số điện thoại không đúng định dạng Việt Nam.")]
    public string PhoneNumber { get; set; } = string.Empty;

    [Required]
    public string Address { get; set; } = string.Empty;

    public string? LicensePlate { get; set; }
    public string? VehicleType { get; set; }
}

public class AdminUpdateUserRequest
{
    [Required(ErrorMessage = "Tên không được để trống."), MinLength(2, ErrorMessage = "Tên phải chứa ít nhất 2 ký tự."), MaxLength(50, ErrorMessage = "Tên không được vượt quá 50 ký tự.")]
    [RegularExpression(@"^[\p{L}\s]+$", ErrorMessage = "Tên chỉ được chứa chữ cái và khoảng trắng.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Họ không được để trống."), MinLength(2, ErrorMessage = "Họ phải chứa ít nhất 2 ký tự."), MaxLength(50, ErrorMessage = "Họ không được vượt quá 50 ký tự.")]
    [RegularExpression(@"^[\p{L}\s]+$", ErrorMessage = "Họ chỉ được chứa chữ cái và khoảng trắng.")]
    public string LastName { get; set; } = string.Empty;

    [RegularExpression(@"^(0|\+84|84)(3|5|7|8|9)[0-9]{8}$", ErrorMessage = "Số điện thoại không đúng định dạng Việt Nam.")]
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? LicensePlate { get; set; }
    public string? VehicleType { get; set; }

    [Required]
    public string Role { get; set; } = "User";

    [Required]
    public string Status { get; set; } = "Active";
}

// ── Requests — OTP Registration ───────────────────────────────────────────────

/// <summary>Step 1: send a 6-digit OTP to the given email before registering.</summary>
public class SendRegisterOtpRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

/// <summary>Step 2: verify the OTP and complete registration in one call.</summary>
public class VerifyRegisterOtpRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(6, MinimumLength = 6)]
    public string Otp { get; set; } = string.Empty;

    [Required, MinLength(3), MaxLength(50)]
    public string Username { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required(ErrorMessage = "Tên không được để trống."), MinLength(2, ErrorMessage = "Tên phải chứa ít nhất 2 ký tự."), MaxLength(50, ErrorMessage = "Tên không được vượt quá 50 ký tự.")]
    [RegularExpression(@"^[\p{L}\s]+$", ErrorMessage = "Tên chỉ được chứa chữ cái và khoảng trắng.")]
    public string FirstName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Họ không được để trống."), MinLength(2, ErrorMessage = "Họ phải chứa ít nhất 2 ký tự."), MaxLength(50, ErrorMessage = "Họ không được vượt quá 50 ký tự.")]
    [RegularExpression(@"^[\p{L}\s]+$", ErrorMessage = "Họ chỉ được chứa chữ cái và khoảng trắng.")]
    public string LastName { get; set; } = string.Empty;
}

// ── Requests — Forgot / Reset Password ───────────────────────────────────────

/// <summary>Step 1: send a 6-digit OTP to the registered email.</summary>
public class ForgotPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;
}

/// <summary>Step 1.5: verify the forgot password OTP before advancing.</summary>
public class VerifyForgotPasswordOtpRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(6, MinimumLength = 6)]
    public string Otp { get; set; } = string.Empty;
}

/// <summary>Step 2: verify the OTP and set a new password.</summary>
public class ResetPasswordRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required, StringLength(6, MinimumLength = 6)]
    public string Otp { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string NewPassword { get; set; } = string.Empty;
}

// ── Responses ─────────────────────────────────────────────────────────────────

public class AuthResponse
{
    public string AccessToken { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public DateTime AccessTokenExpiry { get; set; }
    public UserResponse User { get; set; } = null!;
}

public class UserResponse
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? LicensePlate { get; set; }
    public string? VehicleType { get; set; }
    public string? AvatarUrl { get; set; }
    public string Role { get; set; } = "User";
    public string Status { get; set; } = "Active";
    public DateTime? LastLoginAt { get; set; }
    public DateTime CreatedAt { get; set; }
}

/// <summary>
/// Response for OTP send endpoints.
/// In development: otpCode is populated so FE can test without checking email.
/// In production: otpCode is always null.
/// </summary>
public class OtpSendResponse
{
    public string Message { get; set; } = string.Empty;

    /// <summary>
    /// Only present in development mode. Null in production.
    /// Allows FE-BE integration testing without SMTP credentials.
    /// </summary>
    public string? OtpCode { get; set; }
}

// ── Wrapper ───────────────────────────────────────────────────────────────────

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string? Message { get; set; }
    public T? Data { get; set; }
    public List<string>? Errors { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null) =>
        new() { Success = true, Data = data, Message = message };

    public static ApiResponse<T> Fail(string message, List<string>? errors = null) =>
        new() { Success = false, Message = message, Errors = errors };
}
