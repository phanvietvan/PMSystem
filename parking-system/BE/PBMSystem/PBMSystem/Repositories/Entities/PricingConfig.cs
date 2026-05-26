using System;

namespace Repositories.Entities;

public class PricingConfig : BaseEntity
{
    /// <summary>Vehicle type display name (e.g. "Xe máy", "Ô tô 4-7 chỗ", "SUV / Bán tải").</summary>
    public string Type { get; set; } = string.Empty;

    /// <summary>Price as a formatted string (e.g. "30.000").</summary>
    public string Price { get; set; } = "0";

    /// <summary>Unit label (e.g. "VNĐ / Giờ", "VNĐ / Lượt").</summary>
    public string Sub { get; set; } = "VNĐ / Giờ";
}
