using System;
using Repositories.Helpers;

namespace Repositories.Entities;

public class Payment : BaseEntity
{
    /// <summary>Associated Parking Session ID.</summary>
    public Guid SessionId { get; set; }
    public ParkingSession? Session { get; set; }

    /// <summary>The user who performed the payment. Null for walk-in/anonymous payments.</summary>
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    /// <summary>Paid amount in VND.</summary>
    public decimal Amount { get; set; }

    /// <summary>Payment method used (e.g. Visa, MoMo, Apple Pay).</summary>
    public string PaymentMethod { get; set; } = "Visa"; // "Visa", "MoMo", "Apple Pay"

    /// <summary>Transaction status (e.g. Success, Pending, Failed).</summary>
    public string Status { get; set; } = "Success";

    /// <summary>A unique external transaction ID.</summary>
    public string TransactionId { get; set; } = string.Empty;

    /// <summary>Time when the transaction was completed.</summary>
    public DateTime TransactionTime { get; set; } = VietnamTime.Now;

    /// <summary>Mã giao dịch từ VNPay (vnp_TransactionNo).</summary>
    public string? VnPayTransactionNo { get; set; }

    /// <summary>Mã phản hồi từ VNPay (vnp_ResponseCode). "00" = thành công.</summary>
    public string? VnPayResponseCode { get; set; }
}

