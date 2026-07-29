using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Repositories.Implementations;

/// <summary>
/// Implementation of IParkingSessionRepository using EF Core and SQL Server.
/// </summary>
public class ParkingSessionRepository : Repository<ParkingSession>, IParkingSessionRepository
{
    public ParkingSessionRepository(AppDbContext context) : base(context) { }

    public async Task<bool> IsSlotTakenAsync(Guid? parkingLotId, string? parkingLotName, string parkingSlot)
    {
        // Inline status checks — EF cannot translate helper methods like IsBusyStatus().
        var isSessionActive = await _dbSet.AnyAsync(ps =>
            (ps.Status == "Active" || ps.Status == "PendingPayment" || ps.Status == "Pending")
            && ps.ParkingSlot == parkingSlot
            && (
                (parkingLotId.HasValue && ps.ParkingLotId == parkingLotId)
                || (parkingLotId.HasValue && ps.ParkingLotId == null && ps.ParkingLotName == parkingLotName)
                || (!parkingLotId.HasValue && ps.ParkingLotName == parkingLotName)
            ));
        if (isSessionActive) return true;

        if (parkingLotId.HasValue)
        {
            return await _context.ParkingSlots.AnyAsync(s =>
                s.IsLocked
                && s.SlotName == parkingSlot
                && s.ParkingLotId == parkingLotId.Value);
        }

        return await _context.ParkingSlots.AnyAsync(s =>
            s.IsLocked
            && s.SlotName == parkingSlot
            && s.ParkingLot.Name == parkingLotName);
    }

    // Backward-compatible overload used by older call sites during transition.
    public Task<bool> IsSlotTakenAsync(string parkingLotName, string parkingSlot) =>
        IsSlotTakenAsync(null, parkingLotName, parkingSlot);

    public async Task<List<ParkingSession>> GetActiveSessionsAsync()
    {
        return await _dbSet
            .Where(ps => ps.Status == "Active" || ps.Status == "PendingPayment" || ps.Status == "Pending")
            .ToListAsync();
    }

    public async Task<ParkingSession?> GetActiveByUserIdAsync(Guid userId)
    {
        return await _dbSet
            .Where(ps =>
                ps.UserId == userId
                && (ps.Status == "Active" || ps.Status == "PendingPayment" || ps.Status == "Pending"))
            .OrderByDescending(ps => ps.EntryTime)
            .FirstOrDefaultAsync();
    }

    public async Task<List<ParkingSession>> GetAllOrderByEntryTimeDescAsync()
    {
        return await _dbSet.OrderByDescending(ps => ps.EntryTime).ToListAsync();
    }

    public async Task<ParkingSession?> GetActiveByQrCodeAsync(string qrCode)
    {
        var normalized = NormalizeQr(qrCode);
        return await _dbSet.FirstOrDefaultAsync(ps =>
            (ps.QrCode == qrCode || ps.QrCode == normalized)
            && (ps.Status == "Active" || ps.Status == "PendingPayment" || ps.Status == "Pending"));
    }

    public async Task<ParkingSession?> GetByQrCodeAsync(string qrCode)
    {
        var normalized = NormalizeQr(qrCode);
        return await _dbSet
            .OrderByDescending(ps => ps.CreatedAt)
            .FirstOrDefaultAsync(ps => ps.QrCode == qrCode || ps.QrCode == normalized);
    }

    private static string NormalizeQr(string qrCode)
    {
        if (string.IsNullOrWhiteSpace(qrCode)) return string.Empty;
        var trimmed = qrCode.Trim();
        // Accept pasted URLs that embed QR_xxx / QR-xxx
        var match = System.Text.RegularExpressions.Regex.Match(
            trimmed,
            @"QR[_-][A-Za-z0-9\-]+",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase);
        return match.Success ? match.Value.ToUpperInvariant() : trimmed.ToUpperInvariant();
    }

    public async Task<List<string>> GetActiveSlotsAsync()
    {
        return await _dbSet
            .Where(ps =>
                (ps.Status == "Active" || ps.Status == "PendingPayment" || ps.Status == "Pending")
                && !string.IsNullOrEmpty(ps.ParkingSlot))
            .Select(ps => ps.ParkingSlot!)
            .Distinct()
            .ToListAsync();
    }

    public async Task<List<ParkingSession>> GetAllOrderByCreatedAtDescAsync()
    {
        return await _dbSet.OrderByDescending(ps => ps.CreatedAt).ToListAsync();
    }

    public async Task AddSurchargesAsync(Guid sessionId, IEnumerable<ParkingSessionSurcharge> surcharges)
    {
        foreach (var s in surcharges)
        {
            s.SessionId = sessionId;
            await _context.ParkingSessionSurcharges.AddAsync(s);
        }
    }
}
