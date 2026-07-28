using System;

namespace Repositories.Entities;

public class ParkingLotFloor : BaseEntity
{
    public Guid ParkingLotId { get; set; }
    public ParkingLot ParkingLot { get; set; } = null!;

    public int FloorNumber { get; set; }
    public int Capacity { get; set; }
}
