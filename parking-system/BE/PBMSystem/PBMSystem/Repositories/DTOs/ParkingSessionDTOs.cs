namespace Repositories.DTOs;

public class CheckInRequest
{
    public string LicensePlate { get; set; } = string.Empty;
    public string? EntryPhoto { get; set; }
}

public class CheckOutRequest
{
    public string QrCode { get; set; } = string.Empty;
    public string ExitLicensePlate { get; set; } = string.Empty;
    public string? ExitPhoto { get; set; }
}
