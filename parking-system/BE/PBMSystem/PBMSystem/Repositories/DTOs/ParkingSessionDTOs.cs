namespace Repositories.DTOs;

public class CheckInRequest
{
    public string LicensePlate { get; set; } = string.Empty;
    public string? EntryPhoto { get; set; }
    public string? ParkingLotName { get; set; }
    public string? VehicleType { get; set; }
    public string? ReservationDate { get; set; }
    public string? ReservationStartTime { get; set; }
    public string? ParkingSlot { get; set; }
    public System.Guid? UserId { get; set; }
    public decimal? PrepaidAmount { get; set; }
}

public class CheckOutRequest
{
    public string QrCode { get; set; } = string.Empty;
    public string ExitLicensePlate { get; set; } = string.Empty;
    public string? ExitPhoto { get; set; }
    public List<SurchargeDTO>? ExtraFees { get; set; }
}

public class SurchargeDTO
{
    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}

public class GateScanRequest
{
    public string QrCode { get; set; } = string.Empty;
    public string? EntryPhoto { get; set; }
}
