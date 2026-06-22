using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Repositories.Implementations;

/// <summary>
/// Implementation of IParkingSessionRepository using EF Core and MongoDB.
/// </summary>
public class ParkingSessionRepository : Repository<ParkingSession>, IParkingSessionRepository
{
    public ParkingSessionRepository(AppDbContext context) : base(context) { }

    public async Task<bool> IsSlotTakenAsync(string parkingLotName, string parkingSlot)
    {
        return await _dbSet.AnyAsync(ps => ps.Status == "Active" 
                                     && ps.ParkingLotName == parkingLotName 
                                     && ps.ParkingSlot == parkingSlot);
    }

    public async Task<List<ParkingSession>> GetActiveSessionsAsync()
    {
        return await _dbSet.Where(ps => ps.Status == "Active").ToListAsync();
    }

    public async Task<ParkingSession?> GetActiveByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Where(ps => ps.UserId == userId && ps.Status == "Active")
            .OrderByDescending(ps => ps.EntryTime)
            .FirstOrDefaultAsync();
    }

    public async Task<List<ParkingSession>> GetAllOrderByEntryTimeDescAsync()
    {
        return await _dbSet.OrderByDescending(ps => ps.EntryTime).ToListAsync();
    }

    public async Task<ParkingSession?> GetActiveByQrCodeAsync(string qrCode)
    {
        return await _dbSet.FirstOrDefaultAsync(ps => ps.QrCode == qrCode && ps.Status == "Active");
    }

    public async Task<List<string>> GetActiveSlotsAsync()
    {
        return await _dbSet
            .Where(ps => ps.Status == "Active" && !string.IsNullOrEmpty(ps.ParkingSlot))
            .Select(ps => ps.ParkingSlot!)
            .Distinct()
            .ToListAsync();
    }

    public async Task<List<ParkingSession>> GetAllOrderByCreatedAtDescAsync()
    {
        return await _dbSet.OrderByDescending(ps => ps.CreatedAt).ToListAsync();
    }
}
