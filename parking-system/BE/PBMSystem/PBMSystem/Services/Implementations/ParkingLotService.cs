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

        private void PopulateLegacyFields(ParkingLot lot)
        {
            if (lot == null) return;
            lot.Floors = lot.FloorsList.Select(f => f.FloorNumber).OrderBy(f => f).ToList();
            if (lot.Floors.Count == 0) lot.Floors = new List<int> { 1, 2, 3 };

            var dict = new Dictionary<string, int>();
            foreach (var f in lot.FloorsList)
            {
                dict[$"Tầng {f.FloorNumber}"] = f.Capacity;
                dict[f.FloorNumber.ToString()] = f.Capacity;
                f.ParkingLot = null!; // break JSON cycle FloorsList <-> ParkingLot
            }
            if (dict.Count == 0)
            {
                dict["Tầng 1"] = 50; dict["1"] = 50;
                dict["Tầng 2"] = 50; dict["2"] = 50;
                dict["Tầng 3"] = 50; dict["3"] = 50;
            }
            lot.FloorCapacities = dict;
            lot.LockedSlots = lot.Slots.Where(s => s.IsLocked).Select(s => s.SlotName).ToList();
            foreach (var s in lot.Slots)
                s.ParkingLot = null!; // break JSON cycle Slots <-> ParkingLot
        }

        public async Task<List<ParkingLot>> GetAllAsync()
        {
            var list = await _repository.GetAllAsync();
            foreach (var lot in list)
            {
                PopulateLegacyFields(lot);
            }
            return list;
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
                Address = request.Address,
                Capacity = request.Capacity > 0 ? request.Capacity : 50
            };

            // Populate FloorsList
            var requestFloors = request.Floors ?? new List<int> { 1, 2, 3 };
            foreach (var f in requestFloors)
            {
                var cap = 50;
                if (request.FloorCapacities != null && request.FloorCapacities.TryGetValue($"Tầng {f}", out var c))
                    cap = c;
                else if (request.FloorCapacities != null && request.FloorCapacities.TryGetValue(f.ToString(), out c))
                    cap = c;

                lot.FloorsList.Add(new ParkingLotFloor
                {
                    FloorNumber = f,
                    Capacity = cap
                });
            }

            // Populate locked slots
            if (request.LockedSlots != null)
            {
                foreach (var s in request.LockedSlots)
                {
                    lot.Slots.Add(new ParkingSlot
                    {
                        SlotName = s,
                        FloorNumber = 1,
                        IsLocked = true
                    });
                }
            }

            await _repository.AddAsync(lot);
            PopulateLegacyFields(lot);
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
            lot.Address = request.Address ?? lot.Address;

            if (request.Capacity > 0)
                lot.Capacity = request.Capacity;

            // Sync floors list if updated
            if (request.Floors != null)
            {
                lot.FloorsList.Clear();
                foreach (var f in request.Floors)
                {
                    var cap = 50;
                    if (request.FloorCapacities != null && request.FloorCapacities.TryGetValue($"Tầng {f}", out var c))
                        cap = c;
                    else if (request.FloorCapacities != null && request.FloorCapacities.TryGetValue(f.ToString(), out c))
                        cap = c;

                    lot.FloorsList.Add(new ParkingLotFloor
                    {
                        FloorNumber = f,
                        Capacity = cap
                    });
                }
            }

            // Sync locked slots if updated
            if (request.LockedSlots != null)
            {
                lot.Slots.Clear();
                foreach (var s in request.LockedSlots)
                {
                    lot.Slots.Add(new ParkingSlot
                    {
                        SlotName = s,
                        FloorNumber = 1,
                        IsLocked = true
                    });
                }
            }

            await _repository.UpdateAsync(lot);
            PopulateLegacyFields(lot);
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
            var lot = await _repository.LockSlotAsync(id, slot);
            if (lot == null)
                throw new Exception("Không tìm thấy bãi xe.");
            PopulateLegacyFields(lot);
            return lot;
        }

        public async Task<ParkingLot> UnlockSlotAsync(Guid id, string slot)
        {
            var lot = await _repository.UnlockSlotAsync(id, slot);
            if (lot == null)
                throw new Exception("Không tìm thấy bãi xe.");
            PopulateLegacyFields(lot);
            return lot;
        }
    }
}