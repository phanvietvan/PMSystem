using System;

namespace Repositories.Entities;

public class ParkingSlot : BaseEntity
{
    public Guid ParkingLotId { get; set; }
    public ParkingLot ParkingLot { get; set; } = null!;

    public string SlotName { get; set; } = string.Empty;
    public int FloorNumber { get; set; }
    public bool IsLocked { get; set; } = false;
}
