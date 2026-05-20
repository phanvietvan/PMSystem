namespace Services.Interfaces;

/// <summary>
/// Contract for sending transactional emails.
/// In development: OTP is logged to console and returned in the API response,
/// so FE-BE integration testing works without SMTP credentials.
/// In production: MailKit sends real email via SMTP.
/// </summary>
public interface IEmailService
{
    /// <summary>
    /// Sends an OTP email. Returns the OTP string so the caller can
    /// include it in the dev-mode API response (null in production).
    /// </summary>
    Task<string?> SendOtpEmailAsync(string toEmail, string otp, EmailOtpPurpose purpose);
}

public enum EmailOtpPurpose
{
    Registration,
    ForgotPassword
}
