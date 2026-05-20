using System;

namespace Repositories.Entities;

public class ParkingSession : BaseEntity
{
    public string LicensePlate { get; set; } = string.Empty;
    public string QrCode { get; set; } = string.Empty;
    public string? EntryPhoto { get; set; }
    public string? ExitPhoto { get; set; }
    public DateTime EntryTime { get; set; } = DateTime.UtcNow;
    public DateTime? ExitTime { get; set; }
    public string Status { get; set; } = "Active"; // "Active" or "Completed"
    public string? ExitLicensePlate { get; set; }
    public bool? IsPlateMatched { get; set; }
}
