namespace Repositories.Configuration;

/// <summary>
/// Strongly-typed binding for the "SmtpSettings" section in appsettings.json.
/// Injected via IOptions&lt;SmtpSettings&gt; in EmailService.
///
/// Development flow:
///   EnableMailtrap = false — skip SMTP; OTP logged / returned in API response.
///   EnableMailtrap = true  — send via real SMTP (Gmail, Mailtrap, …) when credentials are valid.
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
    /// Development only. Despite the name, this means "enable real SMTP send".
    /// true  → send via Host/Username/Password (Gmail App Password, Mailtrap, etc.)
    /// false → simulate only (OTP in console / API response).
    /// Ignored in Production.
    /// </summary>
    public bool EnableMailtrap { get; set; } = true;
}
