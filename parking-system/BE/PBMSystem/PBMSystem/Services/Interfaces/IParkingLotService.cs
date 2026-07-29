using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Interfaces
{
    public interface IParkingLotService
    {
        Task<List<ParkingLot>> GetAllAsync();
        Task<ParkingLot> CreateAsync(ParkingLot request);
        Task<ParkingLot> UpdateAsync(Guid id, ParkingLot request);
        Task<object> DeleteAsync(Guid id);
        Task<ParkingLot> LockSlotAsync(Guid id, string slot);
        Task<ParkingLot> UnlockSlotAsync(Guid id, string slot);
        Task<ParkingLot> ToggleAcceptingEntriesAsync(Guid id);
    }
}
