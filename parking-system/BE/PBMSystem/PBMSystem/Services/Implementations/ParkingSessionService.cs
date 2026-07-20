using Microsoft.EntityFrameworkCore;
using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Services.Implementations;

/// <summary>
/// Business logic for reservation and parking sessions.
/// </summary>
public class ParkingSessionService : IParkingSessionService
{
    private readonly IParkingSessionRepository _sessionRepository;
    private readonly IRepository<ParkingLot> _lotRepository;
    private readonly IRepository<Payment> _paymentRepository;
    private readonly IUserRepository _userRepository;
    private readonly IEmailService _emailService;
    private readonly IRepository<AppNotification> _notificationRepository;

    public ParkingSessionService(
        IParkingSessionRepository sessionRepository,
        IRepository<ParkingLot> lotRepository,
        IRepository<Payment> paymentRepository,
        IUserRepository userRepository,
        IEmailService emailService,
        IRepository<AppNotification> notificationRepository)
    {
        _sessionRepository = sessionRepository;
        _lotRepository = lotRepository;
        _paymentRepository = paymentRepository;
        _userRepository = userRepository;
        _emailService = emailService;
        _notificationRepository = notificationRepository;
    }

    public async Task<ServiceResult<ParkingSession>> CheckInAsync(CheckInRequest request, Guid? authenticatedUserId)
    {
        if (string.IsNullOrWhiteSpace(request.LicensePlate))
            return ServiceResult<ParkingSession>.BadRequest("Biển số xe không được trống.");

        // Verify if the parking slot is already locked/reserved in the selected building
        if (!string.IsNullOrWhiteSpace(request.ParkingLotName) && !string.IsNullOrWhiteSpace(request.ParkingSlot))
        {
            var parkingLot = await _lotRepository.FirstOrDefaultAsync(l => l.Name == request.ParkingLotName);
            if (parkingLot != null && parkingLot.LockedSlots != null && parkingLot.LockedSlots.Contains(request.ParkingSlot))
            {
                return ServiceResult<ParkingSession>.BadRequest($"Vị trí đỗ {request.ParkingSlot} tại {request.ParkingLotName} hiện đang được bảo trì. Vui lòng chọn vị trí khác!");
            }

            var isSlotTaken = await _sessionRepository.IsSlotTakenAsync(request.ParkingLotName, request.ParkingSlot);
            if (isSlotTaken)
            {
                return ServiceResult<ParkingSession>.BadRequest($"Vị trí đỗ {request.ParkingSlot} tại {request.ParkingLotName} hiện đã bị khóa hoặc đang bận. Vui lòng chọn vị trí khác!");
            }
        }

        if (!string.IsNullOrEmpty(request.ReservationDate))
        {
            if (string.IsNullOrEmpty(request.ReservationStartTime) || string.IsNullOrEmpty(request.ReservationEndTime))
            {
                return ServiceResult<ParkingSession>.BadRequest("Thời gian bắt đầu và kết thúc đặt chỗ không được để trống.");
            }

            if (DateTime.TryParse($"{request.ReservationDate} {request.ReservationStartTime}", out var startTimeObj) &&
                DateTime.TryParse($"{request.ReservationDate} {request.ReservationEndTime}", out var endTimeObj))
            {
                if (endTimeObj <= startTimeObj)
                {
                    return ServiceResult<ParkingSession>.BadRequest("Giờ kết thúc phải sau giờ bắt đầu.");
                }

                // Check overlap with existing reservations for the same slot on the same day
                var existingSessions = await _sessionRepository.FindAsync(ps =>
                    (ps.Status == "Active" || ps.Status == "PendingPayment") &&
                    ps.ParkingLotName == request.ParkingLotName &&
                    ps.ParkingSlot == request.ParkingSlot &&
                    ps.ReservationDate == request.ReservationDate);

                foreach (var ps in existingSessions)
                {
                    if (DateTime.TryParse($"{ps.ReservationDate} {ps.ReservationStartTime}", out var existStart) &&
                        DateTime.TryParse($"{ps.ReservationDate} {ps.ReservationEndTime}", out var existEnd))
                    {
                        if (startTimeObj < existEnd && endTimeObj > existStart)
                        {
                            return ServiceResult<ParkingSession>.BadRequest(
                                $"Vị trí đỗ {request.ParkingSlot} tại {request.ParkingLotName} đã được đặt trong khung giờ từ {ps.ReservationStartTime} đến {ps.ReservationEndTime} cùng ngày. Vui lòng chọn khung giờ hoặc vị trí khác!");
                        }
                    }
                }
            }
            else
            {
                return ServiceResult<ParkingSession>.BadRequest("Định dạng ngày hoặc giờ đặt chỗ không hợp lệ.");
            }
        }

        Guid? userId = request.UserId;
        if (!userId.HasValue && authenticatedUserId.HasValue)
        {
            userId = authenticatedUserId;
        }

        // Prevent duplicate active sessions for the same vehicle (license plate)
        var cleanLicensePlate = request.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
        var allSessions = await _sessionRepository.GetActiveSessionsAsync();
        var existingActive = allSessions.FirstOrDefault(ps => 
            ps.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanLicensePlate &&
            ps.ParkingLotName == request.ParkingLotName);

        if (existingActive != null)
        {
            return ServiceResult<ParkingSession>.BadRequest($"Xe với biển số {request.LicensePlate} đang có phiên đỗ xe hoạt động tại {existingActive.ParkingLotName}. Vui lòng thanh toán phiên hiện tại trước khi đặt chỗ mới.");
        }

        var qrCode = $"QR_{Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper()}";

        var session = new ParkingSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            LicensePlate = request.LicensePlate.Trim().ToUpper(),
            QrCode = qrCode,
            EntryPhoto = request.EntryPhoto,
            EntryTime = DateTime.UtcNow,
            Status = (!string.IsNullOrEmpty(request.ReservationDate) && (request.PrepaidAmount ?? 0) == 0)
                ? "PendingPayment"
                : "Active",
            CreatedAt = DateTime.UtcNow,
            ParkingLotName = request.ParkingLotName,
            VehicleType = request.VehicleType,
            ReservationDate = request.ReservationDate,
            ReservationStartTime = request.ReservationStartTime,
            ReservationEndTime = request.ReservationEndTime,
            ParkingSlot = request.ParkingSlot,
            IsCheckedIn = string.IsNullOrEmpty(request.ReservationDate)
        };

        await _sessionRepository.AddAsync(session);

        if (request.PrepaidAmount.HasValue && request.PrepaidAmount.Value > 0)
        {
            var payment = new Payment
            {
                SessionId = session.Id,
                UserId = userId,
                LicensePlate = session.LicensePlate,
                Amount = request.PrepaidAmount.Value,
                TransactionTime = DateTime.UtcNow,
                PaymentMethod = "Online",
                Status = "Completed",
                TransactionId = "TXN-" + Guid.NewGuid().ToString("N").Substring(0, 8).ToUpper()
            };
            await _paymentRepository.AddAsync(payment);
        }

        await _sessionRepository.SaveChangesAsync();

        User? user = null;
        if (userId.HasValue)
        {
            user = await _userRepository.GetByIdAsync(userId.Value);
        }

        if (user != null && !string.IsNullOrWhiteSpace(user.Email) && !string.IsNullOrEmpty(request.ReservationDate) && session.Status != "PendingPayment")
        {
            var userName = !string.IsNullOrWhiteSpace(user.FirstName) || !string.IsNullOrWhiteSpace(user.LastName)
                ? $"{user.FirstName} {user.LastName}".Trim()
                : (user.Username ?? "Khách hàng");

            string mapsLink = "";
            var parkingLot = await _lotRepository.FirstOrDefaultAsync(l => l.Name == request.ParkingLotName);
            if (parkingLot != null && !string.IsNullOrWhiteSpace(parkingLot.Latitude) && !string.IsNullOrWhiteSpace(parkingLot.Longitude))
            {
                mapsLink = $"https://www.google.com/maps?q={parkingLot.Latitude},{parkingLot.Longitude}";
            }

            _ = _emailService.SendBookingConfirmationEmailAsync(
                user.Email,
                userName,
                qrCode,
                request.ParkingLotName ?? "PM System Central",
                request.ParkingSlot ?? "Tự động phân bổ",
                request.LicensePlate.ToUpper(),
                mapsLink,
                request.ReservationDate,
                request.ReservationStartTime,
                request.ReservationEndTime
            );
        }

        return ServiceResult<ParkingSession>.Ok(session);
    }

    public async Task<ServiceResult<ParkingSession>> CancelSessionAsync(Guid sessionId)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        if (session == null)
            return ServiceResult<ParkingSession>.NotFound("Không tìm thấy phiên đỗ xe.");

        if (session.Status != "Active")
            return ServiceResult<ParkingSession>.BadRequest("Chỉ có thể hủy các phiên đang hoạt động.");
            
        if (session.IsCheckedIn == true)
            return ServiceResult<ParkingSession>.BadRequest("Không thể hủy vì xe đã vào bãi.");

        session.Status = "Cancelled";
        session.UpdatedAt = DateTime.UtcNow;
        
        _sessionRepository.Update(session);
        await _sessionRepository.SaveChangesAsync();

        return ServiceResult<ParkingSession>.Ok(session);
    }

    public async Task<ServiceResult<ParkingSession>> ChangeSlotAsync(Guid sessionId, string newSlot)
    {
        if (string.IsNullOrWhiteSpace(newSlot))
            return ServiceResult<ParkingSession>.BadRequest("Vị trí mới không được để trống.");

        var session = await _sessionRepository.GetByIdAsync(sessionId);
        if (session == null)
            return ServiceResult<ParkingSession>.NotFound("Không tìm thấy phiên đỗ xe.");

        if (session.Status != "Active")
            return ServiceResult<ParkingSession>.BadRequest("Chỉ có thể đổi chỗ cho phiên đang hoạt động.");

        // Check if new slot is locked
        var parkingLot = await _lotRepository.FirstOrDefaultAsync(l => l.Name == session.ParkingLotName);
        if (parkingLot != null && parkingLot.LockedSlots != null && parkingLot.LockedSlots.Contains(newSlot))
        {
            return ServiceResult<ParkingSession>.BadRequest($"Vị trí {newSlot} đang được bảo trì.");
        }

        // Check if new slot is occupied/reserved
        var isSlotTaken = await _sessionRepository.IsSlotTakenAsync(session.ParkingLotName ?? "", newSlot);
        if (isSlotTaken)
        {
            return ServiceResult<ParkingSession>.BadRequest($"Vị trí {newSlot} đã có người đặt hoặc đang bận.");
        }

        var oldSlot = session.ParkingSlot ?? "Không xác định";
        session.ParkingSlot = newSlot;
        session.UpdatedAt = DateTime.UtcNow;
        
        _sessionRepository.Update(session);
        await _sessionRepository.SaveChangesAsync();

        if (session.UserId.HasValue)
        {
            var user = await _userRepository.GetByIdAsync(session.UserId.Value);
            if (user != null && !string.IsNullOrWhiteSpace(user.Email))
            {
                await _emailService.SendSlotChangeEmailAsync(
                    user.Email,
                    $"{user.FirstName} {user.LastName}".Trim(),
                    session.ParkingLotName ?? "Bãi đỗ",
                    oldSlot,
                    newSlot,
                    session.LicensePlate
                );
            }
        }

        return ServiceResult<ParkingSession>.Ok(session);
    }

    public async Task<ServiceResult<MySessionResponse>> GetMySessionAsync(Guid userId)
    {
        var session = await _sessionRepository.GetActiveByUserIdAsync(userId);
        if (session == null)
        {
            return ServiceResult<MySessionResponse>.Ok(new MySessionResponse { HasActiveSession = false, Session = null });
        }

        var now = DateTime.UtcNow;
        var fee = CalculateFee(session.EntryTime, now, session.VehicleType);
        var durationMinutes = (int)Math.Ceiling((now - session.EntryTime).TotalMinutes);

        return ServiceResult<MySessionResponse>.Ok(new MySessionResponse
        {
            HasActiveSession = true,
            Session = session,
            Fee = fee,
            DurationMinutes = durationMinutes
        });
    }

    public async Task<ServiceResult<List<ParkingSession>>> GetHistoryAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        var allSessions = await _sessionRepository.GetAllOrderByEntryTimeDescAsync();
        var filteredSessions = allSessions
            .Where(ps => ps.UserId == userId || (user != null && UserOwnsPlate(user.LicensePlate, ps.LicensePlate)))
            .ToList();

        return ServiceResult<List<ParkingSession>>.Ok(filteredSessions);
    }

    public async Task<ServiceResult<VerifySessionResponse>> VerifyAsync(string qrCode)
    {
        var session = await _sessionRepository.GetActiveByQrCodeAsync(qrCode);
        if (session == null)
            return ServiceResult<VerifySessionResponse>.NotFound("Không tìm thấy phiên gửi xe hoặc mã QR không hợp lệ/đã thanh toán.");

        User? user = null;
        if (session.UserId.HasValue)
        {
            user = await _userRepository.GetByIdAsync(session.UserId.Value);
        }

        // Fallback: If UserId is missing in session, try to match by License Plate robustly!
        if (user == null && !string.IsNullOrEmpty(session.LicensePlate))
        {
            var allUsers = await _userRepository.GetAllAsync();
            user = allUsers.FirstOrDefault(u => UserOwnsPlate(u.LicensePlate, session.LicensePlate));
        }

        var exitTime = DateTime.UtcNow;
        var fee = CalculateFee(session.EntryTime, exitTime, session.VehicleType);
        var durationMinutes = (int)Math.Ceiling((exitTime - session.EntryTime).TotalMinutes);

        var payments = await _paymentRepository.FindAsync(p => p.SessionId == session.Id && p.Status == "Completed");
        var prepaidAmount = payments.Sum(p => p.Amount);

        var userDto = user != null ? new VerifyUserDTO
        {
            Id = user.Id,
            Email = user.Email,
            FirstName = user.FirstName,
            LastName = user.LastName,
            PhoneNumber = user.PhoneNumber,
            Address = user.Address,
            LicensePlate = user.LicensePlate,
            VehicleType = user.VehicleType,
            AvatarUrl = user.AvatarUrl
        } : null;

        return ServiceResult<VerifySessionResponse>.Ok(new VerifySessionResponse
        {
            Session = session,
            Fee = fee,
            DurationMinutes = durationMinutes,
            PrepaidAmount = prepaidAmount,
            User = userDto
        });
    }

    public async Task<ServiceResult<CheckOutResponse>> CheckOutAsync(CheckOutRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.QrCode))
            return ServiceResult<CheckOutResponse>.BadRequest("Mã QR không được trống.");

        var session = await _sessionRepository.GetActiveByQrCodeAsync(request.QrCode);
        if (session == null)
            return ServiceResult<CheckOutResponse>.NotFound("Phiên gửi xe không hoạt động hoặc không tìm thấy mã QR.");

        string entryPlateNormalized = session.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
        string exitPlateNormalized = request.ExitLicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();

        session.ExitLicensePlate = request.ExitLicensePlate.Trim().ToUpper();
        session.ExitPhoto = request.ExitPhoto;
        session.ExitTime = DateTime.UtcNow;
        session.Status = "Completed";
        session.IsPlateMatched = entryPlateNormalized == exitPlateNormalized;
        session.UpdatedAt = DateTime.UtcNow;

        decimal totalSurcharge = 0;
        if (request.ExtraFees != null && request.ExtraFees.Any())
        {
            session.SurchargesJson = System.Text.Json.JsonSerializer.Serialize(request.ExtraFees);
            totalSurcharge = request.ExtraFees.Sum(f => f.Amount);
        }

        var completedPaymentsList = await _paymentRepository.FindAsync(p => p.SessionId == session.Id && p.Status == "Completed");
        decimal prepaidAmount = completedPaymentsList.Sum(p => p.Amount);

        var baseFee = CalculateFee(session.EntryTime, session.ExitTime.Value, session.VehicleType);
        var fee = baseFee + totalSurcharge;

        // Option 1: Prepaid amount is non-refundable. Remaining check-out fee = Max(0, fee - prepaidAmount)
        decimal checkoutAmount = Math.Max(0, fee - prepaidAmount);

        var payment = new Payment
        {
            SessionId = session.Id,
            UserId = session.UserId,
            LicensePlate = session.LicensePlate,
            Amount = checkoutAmount,
            TransactionTime = DateTime.UtcNow,
            PaymentMethod = "Online",
            Status = "Completed",
            TransactionId = "TXN-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper()
        };

        await _paymentRepository.AddAsync(payment);
        _sessionRepository.Update(session);
        await _sessionRepository.SaveChangesAsync();

        // Calculate early checkout messages & Send Email
        string plannedEndTimeStr = "";
        string refundMessage = "";
        if (!string.IsNullOrEmpty(session.ReservationEndTime) && !string.IsNullOrEmpty(session.ReservationDate))
        {
            plannedEndTimeStr = $"{session.ReservationDate} {session.ReservationEndTime}";
            if (DateTime.TryParse(plannedEndTimeStr, out var plannedEndDateTime))
            {
                var localExitTime = session.ExitTime.Value.AddHours(7);
                if (plannedEndDateTime - localExitTime > TimeSpan.FromMinutes(15))
                {
                    if (prepaidAmount > 0 && fee < prepaidAmount)
                    {
                        refundMessage = "Bạn đã trả xe sớm hơn dự kiến. Theo chính sách của hệ thống, số tiền đặt chỗ trước không được hoàn lại.";
                    }
                }
            }
        }

        User? user = null;
        if (session.UserId.HasValue)
        {
            user = await _userRepository.GetByIdAsync(session.UserId.Value);
        }

        if (user != null && !string.IsNullOrWhiteSpace(user.Email))
        {
            var userName = !string.IsNullOrWhiteSpace(user.FirstName) || !string.IsNullOrWhiteSpace(user.LastName)
                ? $"{user.FirstName} {user.LastName}".Trim()
                : (user.Username ?? "Khách hàng");

            var entryTimeStr = session.EntryTime.AddHours(7).ToString("dd-MM-yyyy HH:mm");
            var exitTimeStr = session.ExitTime.Value.AddHours(7).ToString("dd-MM-yyyy HH:mm");

            await _emailService.SendCheckoutInvoiceEmailAsync(
                user.Email,
                userName,
                session.ParkingLotName ?? "PM System Central",
                session.ParkingSlot ?? "Tự động phân bổ",
                session.LicensePlate.ToUpper(),
                entryTimeStr,
                exitTimeStr,
                !string.IsNullOrEmpty(session.ReservationEndTime) ? $"{session.ReservationDate} {session.ReservationEndTime}" : "N/A",
                baseFee,
                totalSurcharge,
                fee,
                prepaidAmount,
                checkoutAmount,
                refundMessage
            );
        }

        return ServiceResult<CheckOutResponse>.Ok(new CheckOutResponse
        {
            Session = session,
            Fee = checkoutAmount,
            IsPlateMatched = session.IsPlateMatched ?? false,
            Message = session.IsPlateMatched == true
                ? "Xác thực thành công. Cho phép xe ra."
                : "Cảnh báo: Biển số xe ra không trùng khớp với biển số xe vào!"
        });
    }

    public async Task<ServiceResult<List<ActivePlateDTO>>> GetActivePlatesAsync()
    {
        var sessions = await _sessionRepository.GetActiveSessionsAsync();
        var result = sessions.Select(ps => new ActivePlateDTO
        {
            LicensePlate = ps.LicensePlate,
            ParkingLotName = ps.ParkingLotName
        }).ToList();

        return ServiceResult<List<ActivePlateDTO>>.Ok(result);
    }

    public async Task<ServiceResult<List<string>>> GetActiveSlotsAsync()
    {
        var slots = await _sessionRepository.GetActiveSlotsAsync();
        return ServiceResult<List<string>>.Ok(slots);
    }

    public async Task<ServiceResult<List<ParkingSession>>> GetActiveByPlatesAsync(List<string> plates)
    {
        if (plates == null || plates.Count == 0)
            return ServiceResult<List<ParkingSession>>.Ok(new List<ParkingSession>());

        var normalized = plates
            .Select(p => p.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper())
            .ToList();

        var activeSessions = await _sessionRepository.GetActiveSessionsAsync();
        var matched = activeSessions
            .Where(ps =>
            {
                var norm = ps.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
                return normalized.Contains(norm);
            })
            .ToList();

        return ServiceResult<List<ParkingSession>>.Ok(matched);
    }

    public async Task<ServiceResult<Dictionary<string, string>>> GetSlotsStatusAsync(string parkingLotName)
    {
        if (string.IsNullOrEmpty(parkingLotName))
            return ServiceResult<Dictionary<string, string>>.BadRequest("Tên bãi đỗ không được để trống.");

        var activeSessions = await _sessionRepository.FindAsync(ps => 
            (ps.Status == "Active" || ps.Status == "PendingPayment") && 
            ps.ParkingLotName == parkingLotName && 
            !string.IsNullOrEmpty(ps.ParkingSlot));

        var slotStatusMap = activeSessions
            .GroupBy(ps => ps.ParkingSlot!)
            .ToDictionary(
                g => g.Key,
                g => g.First().IsCheckedIn == true ? "occupied" : "reserved"
            );

        return ServiceResult<Dictionary<string, string>>.Ok(slotStatusMap);
    }

    public async Task<ServiceResult<ParkingSession>> GateScanAsync(GateScanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.QrCode))
            return ServiceResult<ParkingSession>.BadRequest("Mã QR không được trống.");

        var session = await _sessionRepository.GetActiveByQrCodeAsync(request.QrCode);
        if (session == null)
            return ServiceResult<ParkingSession>.NotFound("Không tìm thấy phiên gửi xe hoặc mã QR không hợp lệ/đã thanh toán.");

        session.IsCheckedIn = true;
        session.EntryTime = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(request.EntryPhoto))
        {
            session.EntryPhoto = request.EntryPhoto;
        }

        _sessionRepository.Update(session);
        await _sessionRepository.SaveChangesAsync();

        return ServiceResult<ParkingSession>.Ok(session);
    }

    public async Task<ServiceResult<List<GetAllSessionsResponse>>> GetAllAsync()
    {
        var sessions = await _sessionRepository.GetAllOrderByCreatedAtDescAsync();
        var userIds = sessions.Where(ps => ps.UserId.HasValue).Select(ps => ps.UserId!.Value).Distinct().ToList();
        var users = (await _userRepository.FindAsync(u => userIds.Contains(u.Id))).ToDictionary(u => u.Id);

        var result = sessions.Select(ps => new GetAllSessionsResponse
        {
            Id = ps.Id,
            UserId = ps.UserId,
            LicensePlate = ps.LicensePlate,
            EntryTime = ps.EntryTime,
            ExitTime = ps.ExitTime,
            Status = ps.Status,
            QrCode = ps.QrCode,
            TotalFee = ps.ExitTime.HasValue ? CalculateFee(ps.EntryTime, ps.ExitTime.Value, ps.VehicleType) : (decimal?)null,
            IsCheckedIn = ps.IsCheckedIn,
            EntryPhoto = ps.EntryPhoto,
            ExitPhoto = ps.ExitPhoto,
            CreatedAt = ps.CreatedAt,
            ParkingLotName = ps.ParkingLotName,
            ParkingSlot = ps.ParkingSlot,
            VehicleType = ps.VehicleType,
            ReservationDate = ps.ReservationDate,
            ReservationStartTime = ps.ReservationStartTime,
            ReservationEndTime = ps.ReservationEndTime,
            User = ps.UserId.HasValue && users.TryGetValue(ps.UserId.Value, out var u) ? new GetAllUserDTO
            {
                FirstName = u.FirstName,
                LastName = u.LastName,
                Email = u.Email,
                PhoneNumber = u.PhoneNumber,
                AvatarUrl = u.AvatarUrl
            } : null
        }).ToList();

        return ServiceResult<List<GetAllSessionsResponse>>.Ok(result);
    }

    public async Task<ServiceResult<string>> GetPricingAsync()
    {
        var path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing.json");
        if (!System.IO.File.Exists(path))
        {
            var defaultPricing = new List<object>
            {
                new { type = "Xe máy", price = "10.000", sub = "VNĐ / Lượt" },
                new { type = "Ô tô 4-7 chỗ", price = "20.000", sub = "VNĐ / Giờ" },
                new { type = "SUV / Bán tải", price = "30.000", sub = "VNĐ / Giờ" }
            };
            var defaultJson = System.Text.Json.JsonSerializer.Serialize(defaultPricing);
            return ServiceResult<string>.Ok(defaultJson);
        }
        var json = await System.IO.File.ReadAllTextAsync(path);
        return ServiceResult<string>.Ok(json);
    }

    public async Task<ServiceResult<bool>> SavePricingAsync(System.Text.Json.JsonElement pricing)
    {
        var path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing.json");
        var json = pricing.ToString();
        await System.IO.File.WriteAllTextAsync(path, json);
        return ServiceResult<bool>.Ok(true);
    }

    public decimal CalculateFee(DateTime entryTime, DateTime exitTime, string? vehicleType)
    {
        var elapsed = exitTime - entryTime;
        var elapsedMinutes = (int)Math.Ceiling(elapsed.TotalMinutes);

        decimal baseRate = 10000;
        bool isHourly = true;

        try
        {
            var path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing.json");
            if (System.IO.File.Exists(path))
            {
                var json = System.IO.File.ReadAllText(path);
                var doc = System.Text.Json.JsonDocument.Parse(json);
                var root = doc.RootElement;
                if (root.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    string targetType = (vehicleType ?? "car").ToLower();
                    System.Text.Json.JsonElement matchedElement = default;
                    bool found = false;

                    foreach (var elem in root.EnumerateArray())
                    {
                        var typeProp = elem.GetProperty("type").GetString() ?? "";
                        var typeLower = typeProp.ToLower();
                        if (targetType == "bike" && (typeLower.Contains("xe máy") || typeLower.Contains("bike")))
                        {
                            matchedElement = elem;
                            found = true;
                            break;
                        }
                        else if (targetType == "car" && (typeLower.Contains("ô tô") || typeLower.Contains("car") || typeLower.Contains("4-7")))
                        {
                            matchedElement = elem;
                            found = true;
                            break;
                        }
                        else if (targetType == "suv" && (typeLower.Contains("suv") || typeLower.Contains("bán tải")))
                        {
                            matchedElement = elem;
                            found = true;
                            break;
                        }
                    }

                    if (found)
                    {
                        var priceStr = matchedElement.GetProperty("price").GetString() ?? "10000";
                        var subStr = matchedElement.GetProperty("sub").GetString() ?? "Giờ";

                        var cleanPrice = priceStr.Replace(".", "").Replace(",", "").Trim();
                        if (decimal.TryParse(cleanPrice, out var parsedPrice))
                        {
                            baseRate = parsedPrice;
                        }
                        isHourly = subStr.ToLower().Contains("giờ") || subStr.ToLower().Contains("hour");
                    }
                }
            }
            else
            {
                string targetType = (vehicleType ?? "car").ToLower();
                if (targetType == "bike")
                {
                    baseRate = 10000;
                    isHourly = false;
                }
                else if (targetType == "car")
                {
                    baseRate = 20000;
                    isHourly = true;
                }
                else if (targetType == "suv")
                {
                    baseRate = 30000;
                    isHourly = true;
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error calculating dynamic fee: " + ex.Message);
        }

        if (isHourly)
        {
            var hours = (int)Math.Max(1, Math.Ceiling(elapsedMinutes / 60.0));
            return baseRate * hours;
        }
        else
        {
            return baseRate;
        }
    }

    public bool UserOwnsPlate(string? userLicensePlateField, string? sessionPlate)
    {
        if (string.IsNullOrWhiteSpace(userLicensePlateField) || string.IsNullOrWhiteSpace(sessionPlate))
            return false;

        var cleanSessionPlate = sessionPlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();

        var rawLp = userLicensePlateField.Trim();
        if (rawLp.StartsWith("[") && rawLp.EndsWith("]"))
        {
            try
            {
                using var doc = System.Text.Json.JsonDocument.Parse(rawLp);
                if (doc.RootElement.ValueKind == System.Text.Json.JsonValueKind.Array)
                {
                    foreach (var item in doc.RootElement.EnumerateArray())
                    {
                        if (item.TryGetProperty("plate", out var plateProp) || 
                            item.TryGetProperty("Plate", out plateProp) || 
                            item.TryGetProperty("PLATE", out plateProp))
                        {
                            var val = plateProp.GetString();
                            if (!string.IsNullOrEmpty(val))
                            {
                                var cleanVal = val.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
                                if (cleanVal == cleanSessionPlate) return true;
                            }
                        }
                    }
                }
            }
            catch {}
        }
        else
        {
            var cleanVal = rawLp.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
            if (cleanVal == cleanSessionPlate) return true;
        }

        return false;
    }

    public async Task ProcessReservationsAsync()
    {
        var localNow = DateTime.UtcNow.AddHours(7);

        var pendingSessions = await _sessionRepository.FindAsync(ps => 
            (ps.Status == "Active" || ps.Status == "Pending" || ps.Status == "PendingPayment")
            && ps.IsCheckedIn == false
            && ps.ReservationDate != null
            && ps.ReservationStartTime != null);

        foreach (var session in pendingSessions)
        {
            if (session.Status == "PendingPayment")
            {
                if (DateTime.UtcNow - session.CreatedAt > TimeSpan.FromMinutes(15))
                {
                    session.Status = "Cancelled";
                    session.UpdatedAt = DateTime.UtcNow;
                    _sessionRepository.Update(session);
                    await _sessionRepository.SaveChangesAsync();
                }
                continue;
            }

            if (!DateTime.TryParse($"{session.ReservationDate} {session.ReservationStartTime}", out var reservationTime))
            {
                continue; 
            }

            var timeDiff = reservationTime - localNow;

            if (timeDiff.TotalMinutes > 0 && timeDiff.TotalMinutes <= 15 && session.IsReminderSent != true)
            {
                session.IsReminderSent = true;
                _sessionRepository.Update(session);

                User? user = null;
                if (session.UserId.HasValue)
                {
                    user = await _userRepository.GetByIdAsync(session.UserId.Value);
                }

                var userName = user != null && (!string.IsNullOrWhiteSpace(user.FirstName) || !string.IsNullOrWhiteSpace(user.LastName))
                    ? $"{user.FirstName} {user.LastName}".Trim()
                    : (user?.Username ?? "Khách hàng");

                var roleStr = user != null ? user.Role.ToString().ToLower() : "user";

                if (session.UserId.HasValue)
                {
                    var notif = new AppNotification
                    {
                        Id = Guid.NewGuid(),
                        UserId = session.UserId,
                        IsBroadcast = false,
                        Role = roleStr,
                        Title = "Sắp đến giờ đặt chỗ",
                        Message = $"Bạn còn khoảng {Math.Ceiling(timeDiff.TotalMinutes)} phút nữa đến giờ hẹn gửi xe tại {session.ParkingLotName} (Vị trí {session.ParkingSlot}). Vui lòng đến đúng giờ.",
                        Type = "info",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _notificationRepository.AddAsync(notif);
                }

                if (user != null && !string.IsNullOrWhiteSpace(user.Email))
                {
                    _ = _emailService.SendReservationReminderEmailAsync(
                        user.Email,
                        userName,
                        session.ParkingLotName ?? "Bãi xe",
                        session.ParkingSlot ?? "Tự động phân bổ",
                        session.LicensePlate
                    );
                }
                
                await _sessionRepository.SaveChangesAsync();
            }

            if (timeDiff.TotalMinutes <= -10)
            {
                session.Status = "Cancelled";
                session.UpdatedAt = DateTime.UtcNow;
                _sessionRepository.Update(session);

                User? user = null;
                if (session.UserId.HasValue)
                {
                    user = await _userRepository.GetByIdAsync(session.UserId.Value);
                }

                var userName = user != null && (!string.IsNullOrWhiteSpace(user.FirstName) || !string.IsNullOrWhiteSpace(user.LastName))
                    ? $"{user.FirstName} {user.LastName}".Trim()
                    : (user?.Username ?? "Khách hàng");

                var roleStr = user != null ? user.Role.ToString().ToLower() : "user";

                if (session.UserId.HasValue)
                {
                    var notif = new AppNotification
                    {
                        Id = Guid.NewGuid(),
                        UserId = session.UserId,
                        IsBroadcast = false,
                        Role = roleStr,
                        Title = "Hủy chỗ đặt xe tự động",
                        Message = $"Lượt đặt chỗ của bạn tại {session.ParkingLotName} đã bị hủy do bạn đến trễ quá 10 phút. Nếu có nhu cầu, bạn vui lòng đặt lại chỗ khác nhé.",
                        Type = "alert",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _notificationRepository.AddAsync(notif);
                }

                if (user != null && !string.IsNullOrWhiteSpace(user.Email))
                {
                    _ = _emailService.SendReservationCancellationEmailAsync(
                        user.Email,
                        userName,
                        session.ParkingLotName ?? "Bãi xe",
                        session.ParkingSlot ?? "Tự động phân bổ",
                        session.LicensePlate
                    );
                }

                await _sessionRepository.SaveChangesAsync();
            }
        }
    }

    public async Task ProcessCheckedInExtensionsAsync()
    {
        var localNow = DateTime.UtcNow.AddHours(7);

        var activeCheckedInSessions = await _sessionRepository.FindAsync(ps => 
            ps.Status == "Active"
            && ps.IsCheckedIn == true
            && ps.ReservationDate != null
            && ps.ReservationEndTime != null);

        foreach (var session in activeCheckedInSessions)
        {
            var endTimeStr = $"{session.ReservationDate} {session.ReservationEndTime}";
            if (!DateTime.TryParse(endTimeStr, out var currentEndTime))
            {
                continue;
            }

            if (localNow >= currentEndTime)
            {
                var originalEndTimeStr = session.ReservationEndTime ?? string.Empty;
                var newEndTime = currentEndTime.AddHours(1);

                session.ReservationDate = newEndTime.ToString("yyyy-MM-dd");
                session.ReservationEndTime = newEndTime.ToString("HH:mm");
                session.UpdatedAt = DateTime.UtcNow;

                _sessionRepository.Update(session);

                User? user = null;
                if (session.UserId.HasValue)
                {
                    user = await _userRepository.GetByIdAsync(session.UserId.Value);
                }

                var userName = user != null && (!string.IsNullOrWhiteSpace(user.FirstName) || !string.IsNullOrWhiteSpace(user.LastName))
                    ? $"{user.FirstName} {user.LastName}".Trim()
                    : (user?.Username ?? "Khách hàng");

                var roleStr = user != null ? user.Role.ToString().ToLower() : "user";

                if (session.UserId.HasValue)
                {
                    var notif = new AppNotification
                    {
                        Id = Guid.NewGuid(),
                        UserId = session.UserId,
                        IsBroadcast = false,
                        Role = roleStr,
                        Title = "Thời gian đỗ xe được gia hạn",
                        Message = $"Phiên đỗ xe của bạn tại {session.ParkingLotName} (Vị trí {session.ParkingSlot}) đã được tự động gia hạn thêm 1 tiếng đến {session.ReservationEndTime} do quá giờ đăng ký.",
                        Type = "info",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    await _notificationRepository.AddAsync(notif);
                }

                if (user != null && !string.IsNullOrWhiteSpace(user.Email))
                {
                    _ = _emailService.SendReservationExtensionEmailAsync(
                        user.Email,
                        userName,
                        session.ParkingLotName ?? "Bãi xe",
                        session.ParkingSlot ?? "Tự động phân bổ",
                        session.LicensePlate,
                        originalEndTimeStr,
                        session.ReservationEndTime
                    );
                }

                await _sessionRepository.SaveChangesAsync();
            }
        }
    }

    public async Task<ServiceResult<ParkingSession>> ExtendSessionAsync(Guid sessionId, string newEndTime)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        if (session == null)
            return ServiceResult<ParkingSession>.NotFound("Không tìm thấy phiên đỗ xe.");

        if (session.Status != "Active" && session.Status != "PendingPayment")
            return ServiceResult<ParkingSession>.BadRequest("Phiên đỗ xe hiện tại không hoạt động hoặc không thể gia hạn.");

        if (string.IsNullOrEmpty(session.ReservationDate))
            return ServiceResult<ParkingSession>.BadRequest("Phiên đỗ xe này không phải là lượt đặt chỗ trước nên không thể gia hạn theo khung giờ.");

        if (!DateTime.TryParse($"{session.ReservationDate} {newEndTime}", out var newEndTimeObj))
            return ServiceResult<ParkingSession>.BadRequest("Định dạng giờ gia hạn không hợp lệ.");

        if (!DateTime.TryParse($"{session.ReservationDate} {session.ReservationEndTime}", out var currentEndTimeObj))
            return ServiceResult<ParkingSession>.BadRequest("Múi giờ của phiên hiện tại không hợp lệ.");

        if (newEndTimeObj <= currentEndTimeObj)
            return ServiceResult<ParkingSession>.BadRequest("Giờ gia hạn mới phải sau giờ kết thúc hiện tại.");

        // Check if there is any overlapping reservation for the same slot on the same day after currentEndTime
        var existingSessions = await _sessionRepository.FindAsync(ps =>
            ps.Id != sessionId &&
            (ps.Status == "Active" || ps.Status == "PendingPayment") &&
            ps.ParkingLotName == session.ParkingLotName &&
            ps.ParkingSlot == session.ParkingSlot &&
            ps.ReservationDate == session.ReservationDate);

        foreach (var ps in existingSessions)
        {
            if (DateTime.TryParse($"{ps.ReservationDate} {ps.ReservationStartTime}", out var existStart) &&
                DateTime.TryParse($"{ps.ReservationDate} {ps.ReservationEndTime}", out var existEnd))
            {
                if (newEndTimeObj > existStart && currentEndTimeObj <= existStart)
                {
                    return ServiceResult<ParkingSession>.BadRequest(
                        $"Không thể gia hạn. Vị trí đỗ {session.ParkingSlot} tại {session.ParkingLotName} đã được đặt trước từ {ps.ReservationStartTime} đến {ps.ReservationEndTime} cùng ngày.");
                }
            }
        }

        session.ReservationEndTime = newEndTime;
        session.UpdatedAt = DateTime.UtcNow;
        await _sessionRepository.SaveChangesAsync();

        return ServiceResult<ParkingSession>.Ok(session);
    }
}
