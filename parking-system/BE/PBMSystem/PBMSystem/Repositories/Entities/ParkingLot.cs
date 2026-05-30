using System;
using System.Collections.Generic;

namespace Repositories.Entities;

public class ParkingLot : BaseEntity
{
    public string Name { get; set; } = string.Empty;
    public string Latitude { get; set; } = "10.7717";
    public string Longitude { get; set; } = "106.7044";
    public string Floor { get; set; } = "Tầng 1";
    public string Block { get; set; } = "Block A";
    public List<int> Floors { get; set; } = new List<int> { 1, 2, 3 };
    public string? Address { get; set; }
    public int? Capacity { get; set; } = 50;
    public Dictionary<string, int>? FloorCapacities { get; set; } = new Dictionary<string, int>();
    public List<string>? LockedSlots { get; set; } = new List<string>();
}
