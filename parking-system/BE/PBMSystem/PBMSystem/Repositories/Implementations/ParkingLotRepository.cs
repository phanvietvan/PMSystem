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
                .OrderBy(x => x.CreatedAt)
                .ToListAsync();
        }

        public async Task<ParkingLot?> GetByIdAsync(Guid id)
        {
            return await _context.ParkingLots.FindAsync(id);
        }

        public async Task AddAsync(ParkingLot parkingLot)
        {
            await _context.ParkingLots.AddAsync(parkingLot);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ParkingLot parkingLot)
        {
            _context.ParkingLots.Update(parkingLot);
            await _context.SaveChangesAsync();
        }
    }
}
