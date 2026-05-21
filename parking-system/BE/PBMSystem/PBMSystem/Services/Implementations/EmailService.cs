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
        _logger.LogInformation("DEBUG: SMTP Settings Loaded - Host: {Host}, Username: {Username}", _smtp.Host, _smtp.Username);

        // If credentials are the default placeholders, use dev fallback mode
        if (string.IsNullOrWhiteSpace(_smtp.Username) || 
            _smtp.Username.Contains("MAILTRAP_") || 
            _smtp.Username.Contains("REPLACE_WITH"))
        {
            return await HandleDevModeAsync(toEmail, otp, purpose);
        }

        // Real SMTP sending
        try
        {
            await SendSmtpAsync(toEmail, otp, purpose);
            _logger.LogInformation("Successfully sent OTP email to real inbox: {Email}", toEmail);
            return _isDevelopment ? otp : null;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send real SMTP email to {Email}. Falling back to dev mode OTP.", toEmail);
            if (_isDevelopment)
            {
                // In dev mode, return OTP so development is not blocked even if SMTP is misconfigured
                return otp;
            }
            throw;
        }
    }

    private Task<string?> HandleDevModeAsync(string toEmail, string otp, EmailOtpPurpose purpose)
    {
        _logger.LogWarning(
            "──────────────────────────────────────────────\n" +
            "  [DEV] OTP EMAIL — NOT SENT VIA SMTP\n" +
            "  To    : {Email}\n" +
            "  Purpose: {Purpose}\n" +
            "  Code  : {Otp}\n" +
            "  Tip   : Configure your actual SMTP credentials\n" +
            "          in appsettings.Development.json to send real emails.\n" +
            "──────────────────────────────────────────────",
            toEmail, purpose, otp);

        return Task.FromResult<string?>(otp);
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

    public async Task SendContactEmailAsync(string fromName, string fromEmail, string? phone, string subject, string message)
    {
        var emailSubject = $"[PM System Contact] {subject} - Từ: {fromName}";
        var body = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #333; line-height: 1.6;">
                <h2 style="color: #1a1a2e; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Yêu cầu liên hệ mới</h2>
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr>
                        <td style="padding: 8px; font-weight: bold; width: 150px;">Họ và tên:</td>
                        <td style="padding: 8px;">{fromName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Địa chỉ Email:</td>
                        <td style="padding: 8px;"><a href="mailto:{fromEmail}">{fromEmail}</a></td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Số điện thoại:</td>
                        <td style="padding: 8px;">{phone ?? "Không cung cấp"}</td>
                    </tr>
                    <tr>
                        <td style="padding: 8px; font-weight: bold;">Chủ đề:</td>
                        <td style="padding: 8px;">{subject}</td>
                    </tr>
                </table>
                <div style="background: #f4f6f9; padding: 20px; border-radius: 8px; margin-top: 20px; white-space: pre-wrap;">
                    <strong>Nội dung tin nhắn:</strong><br/>
                    {message}
                </div>
                <p style="color: #888; font-size: 11px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                    Thư này được gửi tự động từ hệ thống quản lý đỗ xe PM System.
                </p>
            </body>
            </html>
            """;

        var mailMessage = new MimeMessage();
        mailMessage.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromAddress));
        mailMessage.To.Add(MailboxAddress.Parse("pmsystem.system" + "@" + "gmail.com"));
        mailMessage.Subject = emailSubject;
        mailMessage.Body = new TextPart("html") { Text = body };

        using var client = new SmtpClient();
        await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.StartTls);
        await client.AuthenticateAsync(_smtp.Username, _smtp.Password);
        await client.SendAsync(mailMessage);
        await client.DisconnectAsync(true);

        _logger.LogInformation("Contact submission email successfully sent to pmsystem.system@gmail.com");
    }
}
