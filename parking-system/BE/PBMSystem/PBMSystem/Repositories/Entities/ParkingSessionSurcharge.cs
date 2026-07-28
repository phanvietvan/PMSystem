using System;

namespace Repositories.Entities;

public class ParkingSessionSurcharge : BaseEntity
{
    public Guid SessionId { get; set; }
    public ParkingSession Session { get; set; } = null!;

    public string Name { get; set; } = string.Empty;
    public decimal Amount { get; set; }
}
