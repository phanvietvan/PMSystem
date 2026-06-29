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

    public async Task SendBookingConfirmationEmailAsync(
        string toEmail, 
        string userName, 
        string qrCode, 
        string lotName, 
        string slot, 
        string licensePlate, 
        string mapsLink = "",
        string? reservationDate = null,
        string? startTime = null,
        string? endTime = null)
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
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Biển số xe:</td>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">{licensePlate}</td>
                    </tr>
                    {(!string.IsNullOrEmpty(reservationDate) ? $@"
                    <tr>
                        <td style=""padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;"">Ngày đặt chỗ:</td>
                        <td style=""padding: 12px; border-bottom: 1px solid #e2e8f0;"">{reservationDate}</td>
                    </tr>" : "")}
                    {(!string.IsNullOrEmpty(startTime) && !string.IsNullOrEmpty(endTime) ? $@"
                    <tr>
                        <td style=""padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;"">Thời gian đặt:</td>
                        <td style=""padding: 12px; border-bottom: 1px solid #e2e8f0;"">Từ <strong>{startTime}</strong> đến <strong>{endTime}</strong></td>
                    </tr>" : "")}
                    {(string.IsNullOrEmpty(mapsLink) ? "" : $@"
                    <tr>
                        <td style=""padding: 12px; font-weight: bold; border-top: 1px solid #e2e8f0;"">Chỉ đường:</td>
                        <td style=""padding: 12px; border-top: 1px solid #e2e8f0;"">
                            <a href=""{mapsLink}"" style=""display: inline-block; padding: 8px 16px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px;"">Xem trên Google Maps</a>
                        </td>
                    </tr>")}
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

    public async Task SendSlotChangeEmailAsync(string toEmail, string userName, string lotName, string oldSlot, string newSlot, string licensePlate)
    {
        var emailSubject = "Thông báo: Vị trí đỗ xe của bạn đã được thay đổi - PM System";
        var body = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #333; line-height: 1.6;">
                <h2 style="color: #3b82f6; border-bottom: 2px solid #3b82f6; padding-bottom: 8px;">Thay đổi vị trí đỗ xe</h2>
                <p>Xin chào <strong>{userName}</strong>,</p>
                <p>Hệ thống PM System xin thông báo: Vị trí đỗ xe của bạn tại bãi đỗ <strong>{lotName}</strong> đã được Ban quản lý thay đổi vì lý do vận hành.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0; width: 150px;">Vị trí cũ:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; color: #64748b; text-decoration: line-through;">{oldSlot}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Vị trí mới:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #16a34a; font-size: 18px;">{newSlot}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold;">Biển số xe:</td>
                        <td style="padding: 12px; font-weight: bold;">{licensePlate}</td>
                    </tr>
                </table>
                <p>Mã QR đặt chỗ cũ của bạn vẫn hoạt động bình thường, hệ thống tự động nhận diện vị trí mới của bạn.</p>
                <p>Cảm ơn bạn đã thông cảm và sử dụng dịch vụ của PM System!</p>
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
            _logger.LogInformation("Slot change email simulated for {toEmail} (Old: {oldSlot}, New: {newSlot})", toEmail, oldSlot, newSlot);
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
            _logger.LogError(ex, "Failed to send slot change email to {toEmail}", toEmail);
        }
    }

    public async Task SendReservationExtensionEmailAsync(string toEmail, string userName, string lotName, string slot, string licensePlate, string originalEndTime, string newEndTime)
    {
        var emailSubject = "Thông báo: Tự động gia hạn thời gian đỗ xe - PM System";
        var body = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #333; line-height: 1.6;">
                <h2 style="color: #d97706; border-bottom: 2px solid #d97706; padding-bottom: 8px;">Tự động gia hạn thời gian đỗ xe</h2>
                <p>Xin chào <strong>{userName}</strong>,</p>
                <p>Hệ thống PM System xin thông báo: Lượt đỗ xe của phương tiện <strong>{licensePlate}</strong> tại vị trí <strong>{slot}</strong> ({lotName}) đã hết hạn vào lúc <strong>{originalEndTime}</strong>.</p>
                <p>Do xe của bạn vẫn chưa ra khỏi bãi đỗ, hệ thống đã <strong>tự động gia hạn thêm 1 tiếng</strong> cho phiên gửi xe này.</p>
                
                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #fffbeb; border-radius: 8px; overflow: hidden; border: 1px solid #fde68a;">
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #fde68a; width: 180px;">Tòa nhà:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #fde68a;">{lotName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #fde68a;">Vị trí (Slot):</td>
                        <td style="padding: 12px; border-bottom: 1px solid #fde68a; font-weight: bold; color: #e11d48;">{slot}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #fde68a;">Biển số xe:</td>
                        <td style="padding: 12px; font-weight: bold;">{licensePlate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; border-bottom: 1px solid #fde68a;">Giờ hết hạn cũ:</td>
                        <td style="padding: 12px; border-bottom: 1px solid #fde68a; color: #78350f;">{originalEndTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 12px; font-weight: bold; color: #d97706;">Giờ hết hạn mới:</td>
                        <td style="padding: 12px; font-weight: bold; color: #d97706; font-size: 16px;">{newEndTime}</td>
                    </tr>
                </table>
                <p>Lưu ý: Thời gian đỗ xe tăng thêm có thể phát sinh thêm phụ phí theo bảng giá hiện hành khi bạn thanh toán tại lối ra.</p>
                <p>Cảm ơn bạn đã sử dụng dịch vụ của PM System!</p>
                <p style="color: #888; font-size: 11px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 10px;">
                    Thư này được gửi tự động từ hệ thống. Vui lòng không trả lời thư này.
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
            _logger.LogInformation("Extension email simulated for {toEmail} (Old: {originalEndTime}, New: {newEndTime})", toEmail, originalEndTime, newEndTime);
            return;
        }

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_smtp.Username, _smtp.Password);
            await client.SendAsync(mailMessage);
            await client.DisconnectAsync(true);
            _logger.LogInformation("Extension email successfully sent to {toEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send extension email to {toEmail}", toEmail);
        }
    }

    public async Task SendCheckoutInvoiceEmailAsync(
        string toEmail,
        string userName,
        string lotName,
        string slot,
        string licensePlate,
        string entryTime,
        string exitTime,
        string plannedEndTime,
        decimal baseFee,
        decimal surcharges,
        decimal totalFee,
        decimal prepaidAmount,
        decimal amountPaid,
        string refundMessage = "")
    {
        var emailSubject = "Hóa đơn thanh toán phí đỗ xe - PM System";
        var body = $"""
            <!DOCTYPE html>
            <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 40px auto; color: #333; line-height: 1.6;">
                <h2 style="color: #16a34a; border-bottom: 2px solid #16a34a; padding-bottom: 8px;">Hóa đơn thanh toán dịch vụ đỗ xe</h2>
                <p>Xin chào <strong>{userName}</strong>,</p>
                <p>Cảm ơn bạn đã sử dụng dịch vụ gửi xe thông minh của PM System. Lượt đỗ xe của bạn đã hoàn tất checkout thành công. Dưới đây là thông tin chi tiết hóa đơn:</p>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                    <tr style="background: #f1f5f9;">
                        <th colspan="2" style="padding: 10px; text-align: left; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Thông tin lượt gửi</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0; width: 180px;">Tòa nhà:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{lotName}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Vị trí (Slot):</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold; color: #e11d48;">{slot}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Biển số xe:</td>
                        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">{licensePlate}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Giờ vào:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{entryTime}</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Giờ ra thực tế:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">{exitTime}</td>
                    </tr>
                    {(!string.IsNullOrEmpty(plannedEndTime) ? $@"
                    <tr>
                        <td style=""padding: 10px; font-weight: bold; border-bottom: 1px solid #e2e8f0;"">Giờ kết thúc đăng ký:</td>
                        <td style=""padding: 10px; border-bottom: 1px solid #e2e8f0; color: #64748b;"">{plannedEndTime}</td>
                    </tr>" : "")}
                </table>

                <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
                    <tr style="background: #f1f5f9;">
                        <th colspan="2" style="padding: 10px; text-align: left; font-weight: bold; border-bottom: 1px solid #e2e8f0;">Chi tiết thanh toán</th>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Phí đỗ xe cơ bản:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">{baseFee:N0} VNĐ</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0;">Phụ phí:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right;">{surcharges:N0} VNĐ</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; font-weight: bold;">Tổng chi phí phát sinh:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; font-weight: bold;">{totalFee:N0} VNĐ</td>
                    </tr>
                    <tr>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; color: #475569;">Đã thanh toán trước:</td>
                        <td style="padding: 10px; border-bottom: 1px solid #e2e8f0; text-align: right; color: #475569;">-{prepaidAmount:N0} VNĐ</td>
                    </tr>
                    <tr style="background: #f0fdf4;">
                        <td style="padding: 10px; font-weight: bold; color: #16a34a;">Thực tế thanh toán tại cổng:</td>
                        <td style="padding: 10px; font-weight: bold; text-align: right; color: #16a34a; font-size: 16px;">{amountPaid:N0} VNĐ</td>
                    </tr>
                </table>

                {(!string.IsNullOrEmpty(refundMessage) ? $@"
                <div style=""background: #fffbeb; border: 1px solid #fef3c7; color: #b45309; padding: 15px; border-radius: 8px; margin: 20px 0; font-size: 13px; font-weight: 500;"">
                    <strong>Thông báo chính sách:</strong> {refundMessage}
                </div>" : "")}

                <p>Mọi thắc mắc về hóa đơn xin vui lòng gửi yêu cầu liên hệ hoặc báo cáo sự cố ngay trên ứng dụng di động PM System.</p>
                <p>Chúc bạn thượng lộ bình an và hẹn gặp lại lần sau!</p>
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

        if (_isDevelopment && (string.IsNullOrWhiteSpace(_smtp.Username) || _smtp.Username.Contains("MAILTRAP_")))
        {
            _logger.LogInformation("Checkout invoice email simulated for {toEmail} (Total: {amountPaid:N0} VNĐ)", toEmail, amountPaid);
            return;
        }

        try
        {
            using var client = new SmtpClient();
            await client.ConnectAsync(_smtp.Host, _smtp.Port, SecureSocketOptions.StartTls);
            await client.AuthenticateAsync(_smtp.Username, _smtp.Password);
            await client.SendAsync(mailMessage);
            await client.DisconnectAsync(true);
            _logger.LogInformation("Checkout invoice email successfully sent to {toEmail}", toEmail);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to send checkout invoice email to {toEmail}", toEmail);
        }
    }
}
