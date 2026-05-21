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
    
    // New Reservation fields
    public string? ParkingLotName { get; set; }
    public string? VehicleType { get; set; }
    public string? ReservationDate { get; set; }
    public string? ReservationStartTime { get; set; }
    public string? ParkingSlot { get; set; }
}
