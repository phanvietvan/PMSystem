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
            // Entity is already tracked from GetById. Do NOT call Update():
            // it re-marks newly added Floors/Slots as Modified → concurrency 500
            // when child tables are empty or soft-delete filters apply.
            await _context.SaveChangesAsync();
        }

        public async Task ReplaceFloorsAsync(Guid parkingLotId, IReadOnlyList<ParkingLotFloor> floors)
        {
            foreach (var entry in _context.ChangeTracker.Entries<ParkingLotFloor>()
                         .Where(e => e.Entity.ParkingLotId == parkingLotId)
                         .ToList())
            {
                entry.State = EntityState.Detached;
            }

            var trackedLot = _context.ChangeTracker.Entries<ParkingLot>()
                .FirstOrDefault(e => e.Entity.Id == parkingLotId)?.Entity;
            if (trackedLot != null)
                trackedLot.FloorsList = new List<ParkingLotFloor>();

            await _context.ParkingLotFloors
                .IgnoreQueryFilters()
                .Where(f => f.ParkingLotId == parkingLotId)
                .ExecuteDeleteAsync();

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
            foreach (var entry in _context.ChangeTracker.Entries<ParkingSlot>()
                         .Where(e => e.Entity.ParkingLotId == parkingLotId)
                         .ToList())
            {
                entry.State = EntityState.Detached;
            }

            var trackedLot = _context.ChangeTracker.Entries<ParkingLot>()
                .FirstOrDefault(e => e.Entity.Id == parkingLotId)?.Entity;
            if (trackedLot != null)
                trackedLot.Slots = new List<ParkingSlot>();

            await _context.ParkingSlots
                .IgnoreQueryFilters()
                .Where(s => s.ParkingLotId == parkingLotId)
                .ExecuteDeleteAsync();

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
