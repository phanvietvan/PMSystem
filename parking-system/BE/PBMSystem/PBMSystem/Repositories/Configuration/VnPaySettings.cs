namespace Repositories.Configuration;

/// <summary>
/// Strongly-typed binding for the "VnPaySettings" section in appsettings.json.
/// Injected via IOptions&lt;VnPaySettings&gt; in PaymentsController.
/// </summary>
public class VnPaySettings
{
    /// <summary>Terminal ID / Mã Website (vnp_TmnCode) từ VNPay.</summary>
    public string TmnCode { get; set; } = string.Empty;

    /// <summary>Chuỗi bí mật tạo checksum (vnp_HashSecret) từ VNPay.</summary>
    public string HashSecret { get; set; } = string.Empty;

    /// <summary>URL cổng thanh toán VNPay (sandbox hoặc production).</summary>
    public string BaseUrl { get; set; } = "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html";

    /// <summary>URL FE nhận kết quả sau khi thanh toán xong.</summary>
    public string ReturnUrl { get; set; } = "http://localhost:5173/payment/vnpay-return";

    public string Version { get; set; } = "2.1.0";
    public string Command { get; set; } = "pay";
    public string CurrCode { get; set; } = "VND";
    public string Locale { get; set; } = "vn";
}
