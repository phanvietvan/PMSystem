using Repositories.Entities;
using Repositories.Implementations;
using Repositories.Interfaces;
using Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Implementations
{
    public class ParkingLotService : IParkingLotService
    {
        private readonly IParkingLotRepository _repository;

        public ParkingLotService(IParkingLotRepository repository)
        {
            _repository = repository;
        }

        public async Task<List<ParkingLot>> GetAllAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<ParkingLot> CreateAsync(ParkingLot request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new Exception("Tên chi nhánh không được trống.");

            var lot = new ParkingLot
            {
                Name = request.Name.Trim(),
                Latitude = request.Latitude,
                Longitude = request.Longitude,
                Floor = request.Floor,
                Block = request.Block,
                Floors = request.Floors ?? new List<int> { 1, 2, 3 },
                Address = request.Address,
                Capacity = request.Capacity > 0 ? request.Capacity : 50,
                FloorCapacities = request.FloorCapacities ?? new Dictionary<string, int>()
            };

            await _repository.AddAsync(lot);

            return lot;
        }

        public async Task<ParkingLot> UpdateAsync(Guid id, ParkingLot request)
        {
            var lot = await _repository.GetByIdAsync(id);

            if (lot == null)
                throw new Exception("Không tìm thấy bãi xe.");

            lot.Name = request.Name?.Trim() ?? lot.Name;
            lot.Latitude = request.Latitude ?? lot.Latitude;
            lot.Longitude = request.Longitude ?? lot.Longitude;
            lot.Floor = request.Floor ?? lot.Floor;
            lot.Block = request.Block ?? lot.Block;
            lot.Floors = request.Floors ?? lot.Floors;
            lot.Address = request.Address ?? lot.Address;

            if (request.Capacity > 0)
                lot.Capacity = request.Capacity;

            if (request.FloorCapacities != null)
                lot.FloorCapacities = request.FloorCapacities;

            await _repository.UpdateAsync(lot);

            return lot;
        }

        public async Task<object> DeleteAsync(Guid id)
        {
            var lot = await _repository.GetByIdAsync(id);

            if (lot == null)
                throw new Exception("Không tìm thấy bãi xe.");

            lot.IsDeleted = true;

            await _repository.UpdateAsync(lot);

            return new
            {
                message = "Đã xóa chi nhánh."
            };
        }

        public async Task<ParkingLot> LockSlotAsync(Guid id, string slot)
        {
            var lot = await _repository.GetByIdAsync(id);

            if (lot == null)
                throw new Exception("Không tìm thấy bãi xe.");

            if (lot.LockedSlots == null)
                lot.LockedSlots = new List<string>();

            if (!lot.LockedSlots.Contains(slot))
            {
                lot.LockedSlots.Add(slot);
                await _repository.UpdateAsync(lot);
            }

            return lot;
        }

        public async Task<ParkingLot> UnlockSlotAsync(Guid id, string slot)
        {
            var lot = await _repository.GetByIdAsync(id);

            if (lot == null)
                throw new Exception("Không tìm thấy bãi xe.");

            if (lot.LockedSlots != null &&
                lot.LockedSlots.Contains(slot))
            {
                lot.LockedSlots.Remove(slot);
                await _repository.UpdateAsync(lot);
            }

            return lot;
        }
    }
}