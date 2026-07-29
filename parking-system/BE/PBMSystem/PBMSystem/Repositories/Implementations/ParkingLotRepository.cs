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
    }
}
