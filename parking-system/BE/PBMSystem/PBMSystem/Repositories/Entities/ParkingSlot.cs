using Repositories.Enums;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Entities
{
    public class ParkingSlot : BaseEntity
    {
        public string SlotCode { get; set; } = string.Empty;

        public ParkingSlotStatus Status { get; set; }
            = ParkingSlotStatus.AVAILABLE;

        public string? Floor { get; set; }

        public string? Zone { get; set; }

        public string? VehicleType { get; set; }

        public string? QrCode { get; set; }
    }
}
