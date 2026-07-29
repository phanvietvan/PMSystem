using System;
using Repositories.Helpers;

namespace Repositories.Entities;

public class ParkingSession : BaseEntity
{
    /// <summary>The authenticated user who owns this session. Null for walk-in/anonymous sessions.</summary>
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    public string LicensePlate { get; set; } = string.Empty;
    public string QrCode { get; set; } = string.Empty;
    public string? EntryPhoto { get; set; }
    public string? ExitPhoto { get; set; }
    public DateTime EntryTime { get; set; } = VietnamTime.Now;
    public DateTime? ExitTime { get; set; }
    public string Status { get; set; } = "Active"; // "Active" or "Completed"
    public string? ExitLicensePlate { get; set; }
    public bool? IsPlateMatched { get; set; }
    public bool? IsCheckedIn { get; set; } = false;

    // Reservation fields
    public Guid? ParkingLotId { get; set; }
    public ParkingLot? ParkingLot { get; set; }
    public string? ParkingLotName { get; set; }
    public string? VehicleType { get; set; }
    public string? ReservationDate { get; set; }
    public string? ReservationStartTime { get; set; }
    public string? ReservationEndTime { get; set; }
    public string? ReservationEndDate { get; set; }
    public string? ParkingSlot { get; set; }

    public bool? IsReminderSent { get; set; } = false;

    public System.Collections.Generic.ICollection<ParkingSessionSurcharge> Surcharges { get; set; } = new System.Collections.Generic.List<ParkingSessionSurcharge>();
}
