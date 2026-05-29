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

    public async Task SendBookingConfirmationEmailAsync(string toEmail, string userName, string qrCode, string lotName, string slot, string licensePlate)
    {
        var emailSubject = "Xác nhận đặt chỗ thành công - PM System";
        var body = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #333; line-height: 1.6;">
                <h2 style="color: #1a1a2e; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Xác nhận đặt chỗ bãi đỗ xe</h2>
                <p>Xin chào <strong>{userName}</strong>,</p>
                <p>Cảm ơn bạn đã tin tưởng và sử dụng dịch vụ của PM System. Dưới đây là thông tin chi tiết về lượt đặt chỗ của bạn:</p>

                <div style="text-align: center; margin: 35px 0;">
                    <div style="display: inline-block; padding: 15px; background: #ffffff; border: 2px solid #e2e8f0; border-radius: 16px;">
                        <img src="https://quickchart.io/qr?text={qrCode}&size=250" alt="Mã QR Đặt chỗ" style="display: block; margin: 0 auto; width: 250px; height: 250px;" />
                    </div>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f4f6f9; border-radius: 8px; overflow: hidden;">
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0; width: 150px;">Mã QR đặt chỗ:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-family: monospace; font-size: 18px; color: #0050cb; font-weight: bold; letter-spacing: 2px;">{qrCode}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Tòa nhà:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0;">{lotName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Vị trí (Slot):</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #e11d48;">{slot}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold;">Biển số xe:</td>
                        <td style="padding: 12px; font-weight: bold;">{licensePlate}</td>
                    </tr>
                </table>
                <p>Vui lòng xuất trình mã QR này tại trạm kiểm soát lối vào để nhân viên xác thực.</p>
                <p style="color: #888; font-size: 11px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                    Thư này được gửi tự động từ hệ thống quản lý đỗ xe PM System. Vui lòng không trả lời thư này.
                </p>
            </body>
            </html>
            """;

        var mailMessage = new MimeMessage();
        mailMessage.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromAddress));
        mailMessage.To.Add(MailboxAddress.Parse(toEmail));
        mailMessage.Subject = emailSubject;
        mailMessage.Body = new TextPart("html") { Text = body };

        if (_isDevelopment && (string.IsNullOrWhiteSpace(_smtp.Username) || _smtp.Username.Contains("MAILTRAP_") || _smtp.Username.Contains("REPLACE_WITH")))
        {
            _logger.LogInformation("Booking confirmation email simulated for {toEmail} with QR {qrCode}", toEmail, qrCode);
            return;
        }

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_smtp.Username, _smtp.Password);
            await client.SendAsync(mailMessage);
            await client.DisconnectAsync(true);
            _logger.LogInformation("Booking confirmation email successfully sent to {toEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send booking confirmation email to {toEmail}", toEmail);
        }
    }

    public async Task SendReservationReminderEmailAsync(string toEmail, string userName, string lotName, string slot, string licensePlate)
    {
        var emailSubject = "Nhắc nhở: Sắp đến giờ gửi xe - PM System";
        var body = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #333; line-height: 1.6;">
                <h2 style="color: #1a1a2e; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Nhắc nhở sắp đến giờ gửi xe</h2>
                <p>Xin chào <strong>{userName}</strong>,</p>
                <p>Hệ thống PM System xin thông báo: Chỉ còn khoảng <strong>15 phút nữa</strong> là đến giờ đặt chỗ gửi xe của bạn tại <strong>{lotName}</strong> (Vị trí: <strong>{slot}</strong>).</p>
                <p>Vui lòng sắp xếp thời gian để đến bãi đỗ đúng giờ. Nếu sau 10 phút kể từ giờ đặt mà bạn chưa đến, hệ thống sẽ tự động hủy chỗ để nhường cho khách hàng khác.</p>
                <p>Biển số đăng ký: <strong>{licensePlate}</strong></p>
                <p style="color: #888; font-size: 11px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                    Thư này được gửi tự động từ hệ thống.
                </p>
            </body>
            </html>
            """;

        var mailMessage = new MimeMessage();
        mailMessage.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromAddress));
        mailMessage.To.Add(MailboxAddress.Parse(toEmail));
        mailMessage.Subject = emailSubject;
        mailMessage.Body = new TextPart("html") { Text = body };

        if (_isDevelopment && (string.IsNullOrWhiteSpace(_smtp.Username) || _smtp.Username.Contains("MAILTRAP_")))
        {
            _logger.LogInformation("Reminder email simulated for {toEmail}", toEmail);
            return;
        }

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_smtp.Username, _smtp.Password);
            await client.SendAsync(mailMessage);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send reminder email to {toEmail}", toEmail);
        }
    }

    public async Task SendReservationCancellationEmailAsync(string toEmail, string userName, string lotName, string slot, string licensePlate)
    {
        var emailSubject = "Thông báo: Đặt chỗ đã bị hủy - PM System";
        var body = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #333; line-height: 1.6;">
                <h2 style="color: #e11d48; border-bottom: 2px solid #e11d48; padding-bottom: 8px;">Hủy đặt chỗ tự động</h2>
                <p>Xin chào <strong>{userName}</strong>,</p>
                <p>Hệ thống PM System rất tiếc phải thông báo: Lượt đặt chỗ của bạn tại <strong>{lotName}</strong> (Vị trí: <strong>{slot}</strong>, Biển số: <strong>{licensePlate}</strong>) đã bị <strong>tự động hủy</strong>.</p>
                <p>Lý do: Bạn đã không check-in quá 10 phút so với giờ hẹn gửi xe.</p>
                <p>Nếu bạn vẫn có nhu cầu gửi xe, vui lòng lên hệ thống để đặt lại một chỗ khác nhé. Cảm ơn bạn đã sử dụng dịch vụ và hẹn gặp lại bạn lần sau!</p>
                <p style="color: #888; font-size: 11px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                    Thư này được gửi tự động từ hệ thống.
                </p>
            </body>
            </html>
            """;

        var mailMessage = new MimeMessage();
        mailMessage.From.Add(new MailboxAddress(_smtp.FromName, _smtp.FromAddress));
        mailMessage.To.Add(MailboxAddress.Parse(toEmail));
        mailMessage.Subject = emailSubject;
        mailMessage.Body = new TextPart("html") { Text = body };

        if (_isDevelopment && (string.IsNullOrWhiteSpace(_smtp.Username) || _smtp.Username.Contains("MAILTRAP_")))
        {
            _logger.LogInformation("Cancellation email simulated for {toEmail}", toEmail);
            return;
        }

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_smtp.Username, _smtp.Password);
            await client.SendAsync(mailMessage);
            await client.DisconnectAsync(true);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send cancellation email to {toEmail}", toEmail);
        }
    }
}
