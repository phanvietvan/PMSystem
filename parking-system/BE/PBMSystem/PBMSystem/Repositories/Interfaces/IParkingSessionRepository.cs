using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Repositories.Interfaces;

/// <summary>
/// Specialized repository interface for ParkingSession database queries.
/// </summary>
public interface IParkingSessionRepository : IRepository<ParkingSession>
{
    Task<bool> IsSlotTakenAsync(Guid? parkingLotId, string? parkingLotName, string parkingSlot);
    Task<bool> IsSlotTakenAsync(string parkingLotName, string parkingSlot);
    Task<List<ParkingSession>> GetActiveSessionsAsync();
    Task<ParkingSession?> GetActiveByUserIdAsync(Guid userId);
    Task<List<ParkingSession>> GetAllOrderByEntryTimeDescAsync();
    Task<ParkingSession?> GetActiveByQrCodeAsync(string qrCode);
    Task<ParkingSession?> GetByQrCodeAsync(string qrCode);
    Task<List<string>> GetActiveSlotsAsync();
    Task<List<ParkingSession>> GetAllOrderByCreatedAtDescAsync();
}
