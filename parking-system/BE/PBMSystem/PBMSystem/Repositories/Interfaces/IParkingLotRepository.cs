using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Interfaces
{
    public interface IParkingLotRepository
    {
        Task<List<ParkingLot>> GetAllAsync();
        Task<ParkingLot?> GetByIdAsync(Guid id);
        Task AddAsync(ParkingLot lot);
        Task UpdateAsync(ParkingLot lot);
        Task<ParkingLot?> LockSlotAsync(Guid lotId, string slotName);
        Task<ParkingLot?> UnlockSlotAsync(Guid lotId, string slotName);
        Task ReplaceFloorsAsync(Guid parkingLotId, IReadOnlyList<ParkingLotFloor> floors);
        Task ReplaceSlotsAsync(Guid parkingLotId, IReadOnlyList<ParkingSlot> slots);
    }
}
