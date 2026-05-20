using MailKit.Net.Smtp;
using MailKit.Security;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using MimeKit;
using Repositories.Configuration;
using Services.Interfaces;

namespace Services.Implementations;

public class EmailService : IEmailService
{
    private readonly SmtpSettings _smtp;
    private readonly ILogger<EmailService> _logger;
    private readonly bool _isDevelopment;

    public EmailService(
        IOptions<SmtpSettings> smtpOptions,
        ILogger<EmailService> logger,
        IHostEnvironment env)
    {
        _smtp = smtpOptions.Value;
        _logger = logger;
        _isDevelopment = env.IsDevelopment();
    }

    /// <summary>
    /// Three modes depending on environment and config:
    ///
    ///   Development + EnableMailtrap = false (default)
    ///     → Skips SMTP entirely. OTP is logged to console and returned
    ///       in the API response. No credentials needed.
    ///
    ///   Development + EnableMailtrap = true
    ///     → Sends a real email to the Mailtrap sandbox inbox.
    ///       OTP is still returned in the API response for convenience.
    ///       Requires valid Mailtrap SMTP credentials in appsettings.Development.json.
    ///
    ///   Production
    ///     → Sends a real email via the configured SMTP provider.
    ///       OTP is never included in the API response.
    /// </summary>
    public async Task<string?> SendOtpEmailAsync(string toEmail, string otp, EmailOtpPurpose purpose)
    {
        if (_isDevelopment && !_smtp.EnableMailtrap)
            return await HandleDevModeAsync(toEmail, otp, purpose);

        if (_isDevelopment && _smtp.EnableMailtrap)
            return await HandleMailtrapModeAsync(toEmail, otp, purpose);

        // Production — real SMTP, OTP never exposed in response
        await SendSmtpAsync(toEmail, otp, purpose);
        return null;
    }

    // ── Modes ─────────────────────────────────────────────────────────────────

    /// <summary>
    /// Dev default: no SMTP, OTP goes to console and API response.
    /// Flip EnableMailtrap to true in appsettings.Development.json to switch modes.
    /// </summary>
    private Task<string?> HandleDevModeAsync(string toEmail, string otp, EmailOtpPurpose purpose)
    {
        _logger.LogWarning(
            "──────────────────────────────────────────────\n" +
            "  [DEV] OTP EMAIL — NOT SENT VIA SMTP\n" +
            "  To    : {Email}\n" +
            "  Purpose: {Purpose}\n" +
            "  Code  : {Otp}\n" +
            "  Tip   : Set SmtpSettings.EnableMailtrap = true\n" +
            "          in appsettings.Development.json to test\n" +
            "          with a real Mailtrap inbox instead.\n" +
            "──────────────────────────────────────────────",
            toEmail, purpose, otp);

        return Task.FromResult<string?>(otp);
    }

    /// <summary>
    /// Dev opt-in: sends to Mailtrap sandbox, OTP also returned in response
    /// so the frontend doesn't need to check the inbox during testing.
    /// </summary>
    private async Task<string?> HandleMailtrapModeAsync(string toEmail, string otp, EmailOtpPurpose purpose)
    {
        _logger.LogInformation(
            "[DEV + MAILTRAP] Sending OTP to {Email} via Mailtrap sandbox", toEmail);

        try
        {
            await SendSmtpAsync(toEmail, otp, purpose);

            _logger.LogInformation(
                "[DEV + MAILTRAP] Email delivered to Mailtrap inbox for {Email}. " +
                "OTP also included in API response for convenience.", toEmail);
        }
        catch (Exception ex)
        {
            // Mailtrap send failed — fall back to console-only so dev work isn't blocked.
            _logger.LogError(ex,
                "[DEV + MAILTRAP] Failed to send via Mailtrap. " +
                "Check your Username/Password in appsettings.Development.json. " +
                "OTP: {Otp}", otp);
        }

        // Always return OTP in dev+mailtrap mode regardless of send result
        return otp;
    }

    // ── SMTP Core ─────────────────────────────────────────────────────────────

    private async Task SendSmtpAsync(string toEmail, string otp, EmailOtpPurpose purpose)
    {
        var (subject, body) = BuildEmailContent(otp, purpose);

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromAddress));
        message.To.Add(MailboxAddress.Parse(toEmail));
        message.Subject = subject;
        message.Body = new TextPart("html") { Text = body };

        using var client = new SmtpClient();

        // StartTls works for Mailtrap (port 587) and most production SMTP providers.
        await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_smtp.Username, _smtp.Password);
        await client.SendAsync(message);
        await client.DisconnectAsync(true);

        _logger.LogInformation(
            "OTP email sent to {Email} via {Host}:{Port}", toEmail, _smtp.Host, _smtp.Port);
    }

    // ── Email Templates ───────────────────────────────────────────────────────

    private static (string subject, string body) BuildEmailContent(string otp, EmailOtpPurpose purpose)
    {
        return purpose switch
        {
            EmailOtpPurpose.Registration => (
                subject: "Your PBMSystem Registration Code",
                body: $"""
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 480px; margin: 40px auto; color: #333;">
                        <h2 style="color: #1a1a2e;">Welcome to PBMSystem</h2>
                        <p>Use the code below to complete your registration.
                           It expires in <strong>5 minutes</strong>.</p>
                        <div style="font-size: 36px; font-weight: bold; letter-spacing: 12px;
                                    background: #f4f4f4; padding: 20px; text-align: center;
                                    border-radius: 8px; margin: 24px 0;">
                            {otp}
                        </div>
                        <p style="color: #888; font-size: 13px;">
                            If you did not request this, you can safely ignore this email.
                        </p>
                    </body>
                    </html>
                    """
            ),
            EmailOtpPurpose.ForgotPassword => (
                subject: "Your PBMSystem Password Reset Code",
                body: $"""
                    <!DOCTYPE html>
                    <html>
                    <body style="font-family: Arial, sans-serif; max-width: 480px; margin: 40px auto; color: #333;">
                        <h2 style="color: #1a1a2e;">Password Reset Request</h2>
                        <p>Use the code below to reset your password.
                           It expires in <strong>5 minutes</strong>.</p>
                        <div style="font-size: 36px; font-weight: bold; letter-spacing: 12px;
                                    background: #f4f4f4; padding: 20px; text-align: center;
                                    border-radius: 8px; margin: 24px 0;">
                            {otp}
                        </div>
                        <p style="color: #888; font-size: 13px;">
                            If you did not request this, you can safely ignore this email.
                            Your password will not change unless you complete this process.
                        </p>
                    </body>
                    </html>
                    """
            ),
            _ => throw new ArgumentOutOfRangeException(nameof(purpose))
        };
    }
}
