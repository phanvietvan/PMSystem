namespace Repositories.DTOs;

public class CheckInRequest
{
    public string LicensePlate { get; set; } = string.Empty;
    public string? EntryPhoto { get; set; }
    public string? ParkingLotName { get; set; }
    public string? VehicleType { get; set; }
    public string? ReservationDate { get; set; }
    public string? ReservationStartTime { get; set; }
    public string? ReservationEndTime { get; set; }
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

public class ChangeSlotRequest
{
    public string NewSlot { get; set; } = string.Empty;
}

public class ServiceResult<T>
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public T? Data { get; set; }
    public int StatusCode { get; set; }

    public static ServiceResult<T> Ok(T data) => new() { Success = true, Data = data, StatusCode = 200 };
    public static ServiceResult<T> BadRequest(string msg) => new() { Success = false, ErrorMessage = msg, StatusCode = 400 };
    public static ServiceResult<T> NotFound(string msg) => new() { Success = false, ErrorMessage = msg, StatusCode = 404 };
}

public class MySessionResponse
{
    public bool HasActiveSession { get; set; }
    public Repositories.Entities.ParkingSession? Session { get; set; }
    public decimal? Fee { get; set; }
    public int? DurationMinutes { get; set; }
}

public class VerifyUserDTO
{
    public System.Guid Id { get; set; }
    public string? Email { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? PhoneNumber { get; set; }
    public string? Address { get; set; }
    public string? LicensePlate { get; set; }
    public string? VehicleType { get; set; }
    public string? AvatarUrl { get; set; }
}

public class VerifySessionResponse
{
    public Repositories.Entities.ParkingSession Session { get; set; } = null!;
    public decimal Fee { get; set; }
    public int DurationMinutes { get; set; }
    public decimal PrepaidAmount { get; set; }
    public VerifyUserDTO? User { get; set; }
}

public class CheckOutResponse
{
    public Repositories.Entities.ParkingSession Session { get; set; } = null!;
    public decimal Fee { get; set; }
    public bool IsPlateMatched { get; set; }
    public string Message { get; set; } = string.Empty;
}

public class ActivePlateDTO
{
    public string LicensePlate { get; set; } = string.Empty;
    public string? ParkingLotName { get; set; }
}

public class GetAllUserDTO
{
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string? Email { get; set; }
    public string? PhoneNumber { get; set; }
    public string? AvatarUrl { get; set; }
}

public class GetAllSessionsResponse
{
    public System.Guid Id { get; set; }
    public System.Guid? UserId { get; set; }
    public string LicensePlate { get; set; } = string.Empty;
    public System.DateTime EntryTime { get; set; }
    public System.DateTime? ExitTime { get; set; }
    public string Status { get; set; } = string.Empty;
    public string QrCode { get; set; } = string.Empty;
    public decimal? TotalFee { get; set; }
    public bool? IsCheckedIn { get; set; }
    public string? EntryPhoto { get; set; }
    public string? ExitPhoto { get; set; }
    public System.DateTime CreatedAt { get; set; }
    public string? ParkingLotName { get; set; }
    public string? ParkingSlot { get; set; }
    public string? VehicleType { get; set; }
    public string? ReservationDate { get; set; }
    public string? ReservationStartTime { get; set; }
    public string? ReservationEndTime { get; set; }
    public GetAllUserDTO? User { get; set; }
}
