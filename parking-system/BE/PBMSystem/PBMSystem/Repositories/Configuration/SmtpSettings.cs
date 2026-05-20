namespace Repositories.Configuration;

/// <summary>
/// Strongly-typed binding for the "SmtpSettings" section in appsettings.json.
/// Injected via IOptions&lt;SmtpSettings&gt; in EmailService.
///
/// Development flow:
///   EnableMailtrap = false (default) — OTP returned in API response, no SMTP used.
///   EnableMailtrap = true            — OTP sent to Mailtrap sandbox inbox via SMTP.
///
/// Production:
///   EnableMailtrap is ignored. Real SMTP is always used.
/// </summary>
public class SmtpSettings
{
    public string Host { get; set; } = string.Empty;
    public int Port { get; set; } = 587;
    public string Username { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
    public string FromAddress { get; set; } = string.Empty;
    public string FromName { get; set; } = string.Empty;

    /// <summary>
    /// Development only. Set to true to route emails through Mailtrap sandbox
    /// so you can inspect them in the inbox. Set to false to skip SMTP entirely
    /// and receive the OTP directly in the API response instead.
    /// Has no effect in Production — real SMTP is always used there.
    /// </summary>
    public bool EnableMailtrap { get; set; } = true;
}
