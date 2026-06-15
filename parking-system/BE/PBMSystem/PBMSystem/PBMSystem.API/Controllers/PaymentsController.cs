using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Microsoft.Extensions.Options;
using Repositories;
using Repositories.Entities;
using Repositories.Configuration;
using Services.Implementations;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly VnPaySettings _vnPaySettings;

    public PaymentsController(AppDbContext context, IOptions<VnPaySettings> vnPayOptions)
    {
        _context = context;
        _vnPaySettings = vnPayOptions.Value;
    }

    // ── Existing Endpoints ────────────────────────────────────────────────────

    [HttpGet]
    public async Task<IActionResult> GetAllPayments()
    {
        var payments = await _context.Payments
            .OrderByDescending(p => p.TransactionTime)
            .ToListAsync();
        return Ok(payments);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPayment(Guid id)
    {
        var payment = await _context.Payments.FindAsync(id);
        if (payment == null) return NotFound();
        return Ok(payment);
    }

    // ── VNPay Endpoints ───────────────────────────────────────────────────────

    /// <summary>
    /// Tạo URL thanh toán VNPay.
    /// FE gọi endpoint này trước, nhận URL rồi redirect người dùng sang VNPay.
    /// </summary>
    [HttpPost("vnpay/create-payment-url")]
    public IActionResult CreateVnPayPaymentUrl([FromBody] VnPayCreatePaymentRequest request)
    {
        if (request.Amount <= 0)
            return BadRequest(new { message = "Số tiền thanh toán không hợp lệ." });

        var now = DateTime.UtcNow.AddHours(7); // Giờ Việt Nam
        var txnRef = request.OrderId ?? $"PAY{now:yyyyMMddHHmmss}{new Random().Next(1000, 9999)}";

        // VNPay yêu cầu số tiền * 100 (đơn vị: đồng * 100)
        var amountInVnd = ((long)Math.Round(request.Amount)) * 100;

        var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        if (ipAddress == "::1") ipAddress = "127.0.0.1"; // localhost IPv6 -> IPv4

        var requestData = new SortedDictionary<string, string>
        {
            ["vnp_Version"]   = _vnPaySettings.Version,
            ["vnp_Command"]   = _vnPaySettings.Command,
            ["vnp_TmnCode"]   = _vnPaySettings.TmnCode,
            ["vnp_Amount"]    = amountInVnd.ToString(),
            ["vnp_CurrCode"]  = _vnPaySettings.CurrCode,
            ["vnp_TxnRef"]    = txnRef,
            ["vnp_OrderInfo"] = (request.OrderInfo ?? $"Thanh toan dau xe {txnRef}").Substring(
                                    0, Math.Min(255, (request.OrderInfo ?? $"Thanh toan dau xe {txnRef}").Length)),
            ["vnp_OrderType"] = "other",
            ["vnp_Locale"]    = _vnPaySettings.Locale,
            ["vnp_ReturnUrl"] = _vnPaySettings.ReturnUrl,
            ["vnp_IpAddr"]    = ipAddress,
            ["vnp_CreateDate"]= now.ToString("yyyyMMddHHmmss"),
            ["vnp_ExpireDate"]= now.AddMinutes(15).ToString("yyyyMMddHHmmss")
        };

        var paymentUrl = VnPayLibrary.CreatePaymentUrl(_vnPaySettings.BaseUrl, _vnPaySettings.HashSecret, requestData);


        return Ok(new
        {
            paymentUrl,
            txnRef,
            message = "URL thanh toán VNPay đã được tạo thành công."
        });
    }

    /// <summary>
    /// Xác minh kết quả thanh toán VNPay (Return URL callback).
    /// FE gọi endpoint này sau khi VNPay redirect về /payment/vnpay-return.
    /// LƯU Ý: Đọc trực tiếp từ Request.Query vì VNPay dùng tên param có dấu "_"
    /// (vnp_ResponseCode) không tự bind vào property C# PascalCase (VnpResponseCode).
    /// </summary>
    [HttpGet("vnpay/verify")]
    public async Task<IActionResult> VerifyVnPayPayment()
    {
        // 1. Đọc tất cả params từ Request.Query
        var requestParams = Request.Query
            .Select(q => new KeyValuePair<string, string>(q.Key, q.Value.ToString()))
            .ToList();

        // Đọc từng param quan trọng trực tiếp bằng tên gốc VNPay
        var vnpResponseCode      = Request.Query["vnp_ResponseCode"].ToString();
        var vnpTransactionStatus = Request.Query["vnp_TransactionStatus"].ToString();
        var vnpTransactionNo     = Request.Query["vnp_TransactionNo"].ToString();
        var vnpTxnRef            = Request.Query["vnp_TxnRef"].ToString();
        var vnpAmountStr         = Request.Query["vnp_Amount"].ToString();
        long.TryParse(vnpAmountStr, out var vnpAmount);

        // 2. Xác minh chữ ký HMAC-SHA512
        var isValidSignature = VnPayLibrary.ValidateSignature(requestParams, _vnPaySettings.HashSecret);

        if (!isValidSignature)
        {
            return BadRequest(new
            {
                success = false,
                message = "Chữ ký không hợp lệ. Giao dịch có thể bị giả mạo.",
                vnpResponseCode
            });
        }

        // 3. Kiểm tra mã phản hồi VNPay: "00" = thành công
        bool isPaid = vnpResponseCode == "00" && vnpTransactionStatus == "00";

        // 4. Lưu payment record vào DB nếu thành công
        if (isPaid)
        {
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                SessionId = Guid.Empty,
                LicensePlate = string.Empty,
                Amount = vnpAmount / 100m,
                PaymentMethod = "VNPay",
                Status = "Completed",
                TransactionId = vnpTxnRef,
                VnPayTransactionNo = vnpTransactionNo,
                VnPayResponseCode = vnpResponseCode,
                TransactionTime = DateTime.UtcNow
            };

            // Nếu tìm thấy payment pending trùng TxnRef, cập nhật thay vì tạo mới
            if (!string.IsNullOrEmpty(vnpTxnRef))
            {
                var pendingPayment = await _context.Payments
                    .FirstOrDefaultAsync(p => p.TransactionId == vnpTxnRef);

                if (pendingPayment != null)
                {
                    pendingPayment.Status = "Completed";
                    pendingPayment.VnPayTransactionNo = vnpTransactionNo;
                    pendingPayment.VnPayResponseCode = vnpResponseCode;
                    pendingPayment.TransactionTime = DateTime.UtcNow;
                    await _context.SaveChangesAsync();
                }
                else
                {
                    await _context.Payments.AddAsync(payment);
                    await _context.SaveChangesAsync();
                }
            }

            return Ok(new
            {
                success = true,
                isPaid = true,
                vnpResponseCode,
                vnpTransactionNo,
                amount = vnpAmount / 100m,
                txnRef = vnpTxnRef,
                message = "Thanh toán VNPay thành công."
            });
        }

        // 5. Thanh toán thất bại — trả về mã lỗi chi tiết
        return Ok(new
        {
            success = false,
            isPaid = false,
            vnpResponseCode,
            txnRef = vnpTxnRef,
            message = GetVnPayErrorMessage(vnpResponseCode)
        });
    }

    
    // ── Helper ────────────────────────────────────────────────────────────────

    private static string GetVnPayErrorMessage(string? code) => code switch
    {
        "07" => "Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).",
        "09" => "Thẻ/Tài khoản chưa đăng ký dịch vụ InternetBanking tại ngân hàng.",
        "10" => "Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần.",
        "11" => "Đã hết hạn chờ thanh toán. Vui lòng thực hiện lại giao dịch.",
        "12" => "Thẻ/Tài khoản bị khóa.",
        "13" => "Nhập sai mật khẩu OTP. Vui lòng thực hiện lại giao dịch.",
        "24" => "Khách hàng hủy giao dịch.",
        "51" => "Tài khoản không đủ số dư để thực hiện giao dịch.",
        "65" => "Tài khoản đã vượt quá hạn mức giao dịch trong ngày.",
        "75" => "Ngân hàng thanh toán đang bảo trì.",
        "79" => "Nhập sai mật khẩu thanh toán quá số lần quy định.",
        "99" => "Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê).",
        _ => "Giao dịch không thành công. Vui lòng thử lại."
    };
}

// ── Request / Response DTOs ───────────────────────────────────────────────────

public class VnPayCreatePaymentRequest
{
    public decimal Amount { get; set; }
    public string? OrderInfo { get; set; }
    public string? OrderId { get; set; }
}

public class VnPayCallbackParams
{
    public string? VnpTmnCode { get; set; }
    public string? VnpBankCode { get; set; }
    public string? VnpBankTranNo { get; set; }
    public string? VnpCardType { get; set; }
    public string? VnpOrderInfo { get; set; }
    public string? VnpTransactionNo { get; set; }
    public string? VnpResponseCode { get; set; }
    public string? VnpTransactionStatus { get; set; }
    public string? VnpTxnRef { get; set; }
    public string? VnpSecureHashType { get; set; }
    public string? VnpSecureHash { get; set; }
    public long VnpAmount { get; set; }
    public string? VnpPayDate { get; set; }
}
