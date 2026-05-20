using Repositories.Enums;

namespace Repositories.Entities;

/// <summary>
/// Core user entity. Extend this for profile fields, roles, etc.
/// </summary>
public class User : BaseEntity
{
    public string Email { get; set; } = string.Empty;
    public string Username { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public UserStatus Status { get; set; } = UserStatus.Active;
    public UserRole Role { get; set; } = UserRole.User;
    public DateTime? LastLoginAt { get; set; }

    // OTP — shared between Registration and Forgot Password flows
    public string? OtpCode { get; set; }
    public DateTime? OtpExpiry { get; set; }

    /// <summary>
    /// Timestamp of the last OTP send. Used to enforce a 60-second cooldown
    /// between sends per email — prevents spam/abuse of the send-otp endpoints.
    /// </summary>
    public DateTime? OtpLastSentAt { get; set; }

    // Navigation
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}
