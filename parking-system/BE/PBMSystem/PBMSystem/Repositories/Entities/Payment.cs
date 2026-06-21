using System;

namespace Repositories.Entities;

public class Payment : BaseEntity
{
    /// <summary>Associated Parking Session ID.</summary>
    public Guid SessionId { get; set; }

    /// <summary>The user who performed the payment. Null for walk-in/anonymous payments.</summary>
    public Guid? UserId { get; set; }

    /// <summary>License plate of the paid vehicle.</summary>
    public string LicensePlate { get; set; } = string.Empty;

    /// <summary>Paid amount in VND.</summary>
    public decimal Amount { get; set; }

    /// <summary>Payment method used (e.g. Visa, MoMo, Apple Pay).</summary>
    public string PaymentMethod { get; set; } = "Visa"; // "Visa", "MoMo", "Apple Pay"

    /// <summary>Transaction status (e.g. Success, Pending, Failed).</summary>
    public string Status { get; set; } = "Success";

    /// <summary>A unique external transaction ID.</summary>
    public string TransactionId { get; set; } = string.Empty;

    /// <summary>Time when the transaction was completed.</summary>
    public DateTime TransactionTime { get; set; } = DateTime.UtcNow;

    /// <summary>Mã giao dịch từ VNPay (vnp_TransactionNo).</summary>
    public string? VnPayTransactionNo { get; set; }

    /// <summary>Mã phản hồi từ VNPay (vnp_ResponseCode). "00" = thành công.</summary>
    public string? VnPayResponseCode { get; set; }
}

