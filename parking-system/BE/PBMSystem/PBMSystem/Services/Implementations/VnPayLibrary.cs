using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace Services.Implementations;

/// <summary>
/// VNPay payment gateway helper.
/// Tạo URL thanh toán và xác minh chữ ký callback theo chuẩn VNPay 2.1.0
/// 
/// QUAN TRỌNG: VNPay yêu cầu WebUtility.UrlEncode (space → "+")
/// KHÔNG dùng Uri.EscapeDataString (space → "%20") — sẽ gây "Sai chữ ký"
/// </summary>
public static class VnPayLibrary
{
    // ── Build Payment URL ────────────────────────────────────────────────────

    /// <summary>
    /// Tạo URL thanh toán VNPay đã ký HMAC-SHA512.
    /// requestData phải là SortedDictionary để tự động sắp xếp key A-Z.
    /// </summary>
    public static string CreatePaymentUrl(string baseUrl, string hashSecret, SortedDictionary<string, string> requestData)
    {
        var queryBuilder = new StringBuilder();

        foreach (var kv in requestData)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                // VNPay dùng WebUtility.UrlEncode: space → "+" (KHÔNG phải %20)
                queryBuilder.Append(WebUtility.UrlEncode(kv.Key));
                queryBuilder.Append('=');
                queryBuilder.Append(WebUtility.UrlEncode(kv.Value));
                queryBuilder.Append('&');
            }
        }

        // Chuỗi để tính hash (bỏ "&" cuối)
        var hashData = queryBuilder.ToString().TrimEnd('&');

        // Tính HMAC-SHA512
        var secureHash = HmacSha512(hashSecret, hashData);

        // URL = base + "?" + params + "vnp_SecureHash=" + hash
        return baseUrl + "?" + queryBuilder + "vnp_SecureHash=" + secureHash;
    }

    // ── Verify Return/IPN Signature ──────────────────────────────────────────

    /// <summary>
    /// Xác minh chữ ký HMAC-SHA512 từ callback VNPay Return URL.
    /// </summary>
    public static bool ValidateSignature(IEnumerable<KeyValuePair<string, string>> responseParams, string hashSecret)
    {
        // Tách vnp_SecureHash ra khỏi danh sách, sắp xếp các params còn lại A-Z
        var data = new SortedDictionary<string, string>(StringComparer.Ordinal);
        string? receivedHash = null;

        foreach (var kv in responseParams)
        {
            if (kv.Key.Equals("vnp_SecureHash", StringComparison.OrdinalIgnoreCase))
                receivedHash = kv.Value;
            else if (!kv.Key.Equals("vnp_SecureHashType", StringComparison.OrdinalIgnoreCase))
                data[kv.Key] = kv.Value;
        }

        if (string.IsNullOrEmpty(receivedHash)) return false;

        // Build raw hash string — giống cách tạo URL
        var rawBuilder = new StringBuilder();
        foreach (var kv in data)
        {
            if (!string.IsNullOrEmpty(kv.Value))
            {
                rawBuilder.Append(WebUtility.UrlEncode(kv.Key));
                rawBuilder.Append('=');
                rawBuilder.Append(WebUtility.UrlEncode(kv.Value));
                rawBuilder.Append('&');
            }
        }

        var rawData = rawBuilder.ToString().TrimEnd('&');
        var computedHash = HmacSha512(hashSecret, rawData);

        return string.Equals(computedHash, receivedHash, StringComparison.OrdinalIgnoreCase);
    }

    // ── Private ──────────────────────────────────────────────────────────────

    public static string HmacSha512(string key, string data)
    {
        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(key));
        var hash = hmac.ComputeHash(Encoding.UTF8.GetBytes(data));
        return BitConverter.ToString(hash).Replace("-", "").ToLower();
    }
}
