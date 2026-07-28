using System;

namespace Repositories.Entities;

public class UserVehicle : BaseEntity
{
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public string LicensePlate { get; set; } = string.Empty;
    public string VehicleType { get; set; } = "car";
}
