namespace Repositories.Helpers;

/// <summary>
/// Vietnam wall-clock time (UTC+7). Use for all business timestamps in PBMS —
/// do not store/compare reservation or session times in UTC.
/// JWT/token expiry may still use DateTime.UtcNow (RFC 7519).
/// </summary>
public static class VietnamTime
{
    public static readonly TimeSpan Offset = TimeSpan.FromHours(7);

    /// <summary>Current time in Vietnam as Unspecified (no Z in JSON).</summary>
    public static DateTime Now => DateTime.UtcNow.Add(Offset);

    public static DateTime Today => Now.Date;

    public static string TodayIso => Now.ToString("yyyy-MM-dd");

    /// <summary>Normalize a value that may have been stored as UTC into VN wall clock.</summary>
    public static DateTime AsVietnam(DateTime value)
    {
        if (value.Kind == DateTimeKind.Utc)
            return DateTime.SpecifyKind(value.Add(Offset), DateTimeKind.Unspecified);
        // Legacy rows saved as UTC-Unspecified: if clearly "UTC-shaped" vs VN Now, callers should prefer Now.
        return DateTime.SpecifyKind(value, DateTimeKind.Unspecified);
    }
}
