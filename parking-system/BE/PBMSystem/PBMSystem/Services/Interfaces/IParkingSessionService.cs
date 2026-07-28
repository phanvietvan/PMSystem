using Repositories.DTOs;
using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace Services.Interfaces;

/// <summary>
/// Service interface covering all business logic for reservations and parking sessions.
/// </summary>
public interface IParkingSessionService
{
    Task<ServiceResult<ParkingSession>> CheckInAsync(CheckInRequest request, Guid? authenticatedUserId);
    Task<ServiceResult<CancelRefundInfo>> GetCancelPreviewAsync(Guid sessionId, Guid? requesterUserId = null, bool isStaffOrAdmin = false);
    Task<ServiceResult<CancelSessionResponse>> CancelSessionAsync(Guid sessionId, Guid? requesterUserId = null, bool isStaffOrAdmin = false);
    Task<ServiceResult<ParkingSession>> ChangeSlotAsync(Guid sessionId, string newSlot);
    Task<ServiceResult<MySessionResponse>> GetMySessionAsync(Guid userId);
    Task<ServiceResult<List<ParkingSession>>> GetHistoryAsync(Guid userId);
    Task<ServiceResult<VerifySessionResponse>> VerifyAsync(string qrCode);
    Task<ServiceResult<CheckOutResponse>> CheckOutAsync(CheckOutRequest request);
    Task<ServiceResult<List<ActivePlateDTO>>> GetActivePlatesAsync();
    Task<ServiceResult<List<string>>> GetActiveSlotsAsync();
    Task<ServiceResult<List<ParkingSession>>> GetActiveByPlatesAsync(List<string> plates);
    Task<ServiceResult<Dictionary<string, string>>> GetSlotsStatusAsync(string parkingLotName);
    Task<ServiceResult<ParkingSession>> GateScanAsync(GateScanRequest request);
    Task<ServiceResult<List<GetAllSessionsResponse>>> GetAllAsync();
    Task<ServiceResult<string>> GetPricingAsync();
    Task<ServiceResult<bool>> SavePricingAsync(System.Text.Json.JsonElement pricing);
    Task<ServiceResult<ParkingSession>> ExtendSessionAsync(Guid sessionId, string newEndTime);
    
    // Fee calculation logic is shared
    decimal CalculateFee(DateTime entryTime, DateTime exitTime, string? vehicleType);
    bool UserOwnsPlate(User user, string? sessionPlate);
    Task ProcessReservationsAsync();
    Task ProcessCheckedInExtensionsAsync();
}
