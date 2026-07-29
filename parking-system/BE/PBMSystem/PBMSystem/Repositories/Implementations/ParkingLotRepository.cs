using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Repositories.Implementations
{
    public class ParkingLotRepository : IParkingLotRepository
    {
        private readonly AppDbContext _context;

        public ParkingLotRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<ParkingLot>> GetAllAsync()
        {
            return await _context.ParkingLots
                .Include(x => x.Slots)
                .Include(x => x.FloorsList)
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<ParkingLot?> GetByIdAsync(Guid id)
        {
            return await _context.ParkingLots
                .Include(x => x.Slots)
                .Include(x => x.FloorsList)
                .FirstOrDefaultAsync(x => x.Id == id);
        }

        public async Task AddAsync(ParkingLot parkingLot)
        {
            await _context.ParkingLots.AddAsync(parkingLot);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ParkingLot parkingLot)
        {
            // Entity is already tracked from GetById. Do NOT call _context.ParkingLots.Update():
            // it re-marks newly added Slots/Floors as Modified → concurrency 500 on empty tables.
            await _context.SaveChangesAsync();
        }

        public async Task<ParkingLot?> LockSlotAsync(Guid lotId, string slotName)
        {
            var lot = await _context.ParkingLots
                .Include(x => x.Slots)
                .Include(x => x.FloorsList)
                .FirstOrDefaultAsync(x => x.Id == lotId);

            if (lot == null) return null;

            var existingSlot = lot.Slots.FirstOrDefault(s => s.SlotName == slotName);
            if (existingSlot == null)
            {
                // Add directly to DbSet so EF tracks it as Added, not Modified
                var newSlot = new ParkingSlot
                {
                    ParkingLotId = lot.Id,
                    SlotName = slotName,
                    FloorNumber = 1,
                    IsLocked = true
                };
                await _context.ParkingSlots.AddAsync(newSlot);
            }
            else if (!existingSlot.IsLocked)
            {
                existingSlot.IsLocked = true;
            }

            await _context.SaveChangesAsync();

            return lot;
        }

        public async Task<ParkingLot?> UnlockSlotAsync(Guid lotId, string slotName)
        {
            var lot = await _context.ParkingLots
                .Include(x => x.Slots)
                .Include(x => x.FloorsList)
                .FirstOrDefaultAsync(x => x.Id == lotId);

            if (lot == null) return null;

            var existingSlot = lot.Slots.FirstOrDefault(s => s.SlotName == slotName);
            if (existingSlot != null && existingSlot.IsLocked)
            {
                existingSlot.IsLocked = false;
            }

            await _context.SaveChangesAsync();

            return lot;
        }

        public async Task ReplaceFloorsAsync(Guid parkingLotId, IReadOnlyList<ParkingLotFloor> floors)
        {
            var existing = await _context.ParkingLotFloors
                .IgnoreQueryFilters()
                .Where(f => f.ParkingLotId == parkingLotId)
                .ToListAsync();

            _context.ParkingLotFloors.RemoveRange(existing);

            var trackedLot = _context.ChangeTracker.Entries<ParkingLot>()
                .FirstOrDefault(e => e.Entity.Id == parkingLotId)?.Entity;
            if (trackedLot != null)
                trackedLot.FloorsList = new List<ParkingLotFloor>();

            if (floors.Count == 0)
                return;

            foreach (var floor in floors)
            {
                floor.ParkingLotId = parkingLotId;
                floor.IsDeleted = false;
                floor.UpdatedAt = null;
            }

            await _context.ParkingLotFloors.AddRangeAsync(floors);
        }

        public async Task ReplaceSlotsAsync(Guid parkingLotId, IReadOnlyList<ParkingSlot> slots)
        {
            var existing = await _context.ParkingSlots
                .IgnoreQueryFilters()
                .Where(s => s.ParkingLotId == parkingLotId)
                .ToListAsync();

            _context.ParkingSlots.RemoveRange(existing);

            var trackedLot = _context.ChangeTracker.Entries<ParkingLot>()
                .FirstOrDefault(e => e.Entity.Id == parkingLotId)?.Entity;
            if (trackedLot != null)
                trackedLot.Slots = new List<ParkingSlot>();

            if (slots.Count == 0)
                return;

            foreach (var slot in slots)
            {
                slot.ParkingLotId = parkingLotId;
                slot.IsDeleted = false;
                slot.UpdatedAt = null;
            }

            await _context.ParkingSlots.AddRangeAsync(slots);
        }
    }
}
