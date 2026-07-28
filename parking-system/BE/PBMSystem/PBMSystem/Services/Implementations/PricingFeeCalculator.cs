using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Text.Json;
using Repositories.Entities;

namespace Services.Implementations;

/// <summary>
/// Shared parking fee calculation from PricingConfig rows (Admin bảng giá).
/// </summary>
public static class PricingFeeCalculator
{
    public static string ResolveVehicleType(string? sessionVehicleType, string? userLicensePlateField, string? sessionPlate)
    {
        if (!string.IsNullOrWhiteSpace(sessionVehicleType))
            return NormalizeCategory(sessionVehicleType);

        // Fallback: match plate in user's vehicle JSON → use that vehicle's type
        if (!string.IsNullOrWhiteSpace(userLicensePlateField) && !string.IsNullOrWhiteSpace(sessionPlate))
        {
            var cleanSession = sessionPlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpperInvariant();
            var raw = userLicensePlateField.Trim();
            if (raw.StartsWith("[") && raw.EndsWith("]"))
            {
                try
                {
                    using var doc = JsonDocument.Parse(raw);
                    if (doc.RootElement.ValueKind == JsonValueKind.Array)
                    {
                        foreach (var item in doc.RootElement.EnumerateArray())
                        {
                             string? plate = null;
                             string? type = null;
                             if (item.TryGetProperty("plate", out var p) || item.TryGetProperty("Plate", out p))
                                 plate = p.GetString();
                             if (item.TryGetProperty("type", out var t) || item.TryGetProperty("Type", out t))
                                 type = t.GetString();

                             if (string.IsNullOrEmpty(plate)) continue;
                             var clean = plate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpperInvariant();
                             if (clean == cleanSession && !string.IsNullOrWhiteSpace(type))
                                 return NormalizeCategory(type);
                        }
                    }
                }
                catch { /* ignore */ }
            }
        }

        return "car";
    }

    public static string NormalizeCategory(string? vehicleType)
    {
        var raw = (vehicleType ?? "car").Trim().ToLowerInvariant();
        var ascii = RemoveDiacritics(raw);

        if (raw is "motorbike" or "motorcycle" ||
            ascii.Contains("bike") || ascii.Contains("motor") || ascii.Contains("xe may") ||
            ascii.Contains("bicycle") || ascii.Contains("dap") || ascii.Contains("dien") ||
            raw.Contains("xe máy") || raw.Contains("xe đạp"))
            return "bike";

        if (ascii.Contains("suv") || ascii.Contains("ban tai") || ascii.Contains("pickup") ||
            (ascii.Contains("tai") && ascii.Contains("ban")) || raw.Contains("bán tải"))
            return "suv";

        if (raw is "automobile" or "sedan" ||
            ascii.Contains("car") || ascii.Contains("o to") || ascii.Contains("oto") ||
            ascii.Contains("4-7") || ascii.Contains("4 7") || raw.Contains("ô tô"))
            return "car";

        return "car";
    }

    public static bool MatchesCategory(string pricingTypeLabel, string category)
    {
        var typeLower = (pricingTypeLabel ?? "").ToLowerInvariant();
        var ascii = RemoveDiacritics(typeLower);

        return category switch
        {
            "bike" => ascii.Contains("xe may") || ascii.Contains("bike") || ascii.Contains("motor") ||
                      typeLower.Contains("xe máy"),
            "car" => ascii.Contains("o to") || ascii.Contains("oto") || ascii.Contains("car") ||
                     ascii.Contains("4-7") || typeLower.Contains("ô tô"),
            "suv" => ascii.Contains("suv") || ascii.Contains("ban tai") || ascii.Contains("pickup") ||
                     typeLower.Contains("bán tải"),
            _ => false
        };
    }

    public static decimal ParsePrice(string? priceStr)
    {
        if (string.IsNullOrWhiteSpace(priceStr)) return 0;
        // "30.000" or "30,000" or "30000" → 30000
        var clean = priceStr.Replace(".", "").Replace(",", "").Replace(" ", "").Trim();
        return decimal.TryParse(clean, NumberStyles.Number, CultureInfo.InvariantCulture, out var v) ? v : 0;
    }

    public static bool IsHourlyUnit(string? sub)
    {
        var s = (sub ?? "").ToLowerInvariant();
        return s.Contains("giờ") || s.Contains("gio") || s.Contains("hour");
    }

    public static decimal Calculate(
        DateTime entryTime,
        DateTime exitTime,
        string? vehicleType,
        IEnumerable<(string Type, string Price, string Sub)> pricingRows)
    {
        var elapsed = exitTime - entryTime;
        var elapsedMinutes = (int)Math.Ceiling(Math.Max(0, elapsed.TotalMinutes));
        if (elapsedMinutes <= 0) elapsedMinutes = 1;

        var category = NormalizeCategory(vehicleType);
        decimal baseRate = category switch
        {
            "bike" => 10000,
            "suv" => 30000,
            _ => 20000
        };
        var isHourly = category != "bike";

        var rows = pricingRows?.ToList() ?? new List<(string, string, string)>();
        var matched = rows.FirstOrDefault(r => MatchesCategory(r.Type, category));
        if (!string.IsNullOrWhiteSpace(matched.Type))
        {
            var parsed = ParsePrice(matched.Price);
            if (parsed > 0) baseRate = parsed;
            isHourly = IsHourlyUnit(matched.Sub);
        }

        if (isHourly)
        {
            var hours = (int)Math.Max(1, Math.Ceiling(elapsedMinutes / 60.0));
            return baseRate * hours;
        }

        return baseRate;
    }

    public static decimal CalculateFromConfigs(
        DateTime entryTime,
        DateTime exitTime,
        string? vehicleType,
        IEnumerable<PricingConfig> configs)
    {
        var rows = configs.Select(c => (c.Type ?? "", c.Price ?? "0", c.Sub ?? ""));
        return Calculate(entryTime, exitTime, vehicleType, rows);
    }

    public static decimal CalculateFromJsonArray(
        DateTime entryTime,
        DateTime exitTime,
        string? vehicleType,
        string json)
    {
        var rows = new List<(string, string, string)>();
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind == JsonValueKind.Array)
            {
                foreach (var elem in doc.RootElement.EnumerateArray())
                {
                    var type = elem.TryGetProperty("type", out var t) ? t.GetString() ?? "" : "";
                    var price = elem.TryGetProperty("price", out var p) ? p.GetString() ?? "0" : "0";
                    var sub = elem.TryGetProperty("sub", out var s) ? s.GetString() ?? "" : "";
                    rows.Add((type, price, sub));
                }
            }
        }
        catch { /* ignore */ }

        return Calculate(entryTime, exitTime, vehicleType, rows);
    }

    public static decimal NetPayable(decimal baseFee, decimal prepaidAmount, decimal surchargeTotal = 0)
        => Math.Max(0, baseFee + surchargeTotal - prepaidAmount);

    private static string RemoveDiacritics(string text)
    {
        var normalized = text.Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder();
        foreach (var c in normalized)
        {
            var uc = CharUnicodeInfo.GetUnicodeCategory(c);
            if (uc != UnicodeCategory.NonSpacingMark)
                sb.Append(c);
        }
        return sb.ToString().Normalize(NormalizationForm.FormC);
    }
}
