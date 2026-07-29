using Microsoft.EntityFrameworkCore;
using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Helpers;
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
    private readonly IPricingConfigRepository _pricingConfigRepository;

    public ParkingSessionService(
        IParkingSessionRepository sessionRepository,
        IRepository<ParkingLot> lotRepository,
        IRepository<Payment> paymentRepository,
        IUserRepository userRepository,
        IEmailService emailService,
        IRepository<AppNotification> notificationRepository,
        IPricingConfigRepository pricingConfigRepository)
    {
        _sessionRepository = sessionRepository;
        _lotRepository = lotRepository;
        _paymentRepository = paymentRepository;
        _userRepository = userRepository;
        _emailService = emailService;
        _notificationRepository = notificationRepository;
        _pricingConfigRepository = pricingConfigRepository;
    }

    public async Task<ServiceResult<ParkingSession>> CheckInAsync(CheckInRequest request, Guid? authenticatedUserId)
    {
        if (string.IsNullOrWhiteSpace(request.LicensePlate))
            return ServiceResult<ParkingSession>.BadRequest("Biển số xe không được trống.");

        var lot = await ResolveParkingLotAsync(request.ParkingLotId, request.ParkingLotName);
        if (lot == null)
        {
            return ServiceResult<ParkingSession>.BadRequest(
                "Không xác định được bãi xe. Vui lòng chọn lại chi nhánh từ danh sách hệ thống (cần ParkingLotId hợp lệ).");
        }

        // Canonical values — never trust client name alone after resolve.
        var lotName = lot.Name;
        var lotId = lot.Id;

        if (!lot.IsAcceptingEntries)
        {
            return ServiceResult<ParkingSession>.BadRequest(
                $"Bãi \"{lotName}\" đang đóng nhận xe — chỉ cho xe RA, không nhận xe VÀO.");
        }

        if (!string.IsNullOrWhiteSpace(request.ParkingSlot))
        {
            var isSlotTaken = await _sessionRepository.IsSlotTakenAsync(lotId, lotName, request.ParkingSlot);
            if (isSlotTaken)
            {
                return ServiceResult<ParkingSession>.BadRequest(
                    $"Vị trí đỗ {request.ParkingSlot} tại {lotName} hiện đã bị khóa hoặc đang bận. Vui lòng chọn vị trí khác!");
            }
        }

        if (!string.IsNullOrEmpty(request.ReservationDate))
        {
            if (string.IsNullOrEmpty(request.ReservationStartTime) || string.IsNullOrEmpty(request.ReservationEndTime))
            {
                return ServiceResult<ParkingSession>.BadRequest("Thời gian bắt đầu và kết thúc đặt chỗ không được để trống.");
            }

            var endDate = string.IsNullOrWhiteSpace(request.ReservationEndDate)
                ? request.ReservationDate
                : request.ReservationEndDate;

            if (DateTime.TryParse($"{request.ReservationDate} {request.ReservationStartTime}", out var startTimeObj) &&
                DateTime.TryParse($"{endDate} {request.ReservationEndTime}", out var endTimeObj))
            {
                if (endTimeObj <= startTimeObj)
                {
                    return ServiceResult<ParkingSession>.BadRequest("Thời điểm kết thúc phải sau thời điểm bắt đầu.");
                }

                var existingSessions = await _sessionRepository.FindAsync(ps =>
                    (ps.Status == "Active" || ps.Status == "PendingPayment" || ps.Status == "Pending") &&
                    (ps.ParkingLotId == lotId || (ps.ParkingLotId == null && ps.ParkingLotName == lotName)) &&
                    ps.ParkingSlot == request.ParkingSlot &&
                    !string.IsNullOrEmpty(ps.ReservationDate));

                foreach (var ps in existingSessions)
                {
                    var existEndDate = string.IsNullOrWhiteSpace(ps.ReservationEndDate)
                        ? ps.ReservationDate
                        : ps.ReservationEndDate;
                    if (DateTime.TryParse($"{ps.ReservationDate} {ps.ReservationStartTime}", out var existStart) &&
                        DateTime.TryParse($"{existEndDate} {ps.ReservationEndTime}", out var existEnd))
                    {
                        if (startTimeObj < existEnd && endTimeObj > existStart)
                        {
                            return ServiceResult<ParkingSession>.BadRequest(
                                $"Vị trí đỗ {request.ParkingSlot} tại {lotName} đã được đặt từ {ps.ReservationDate} {ps.ReservationStartTime} đến {existEndDate} {ps.ReservationEndTime}. Vui lòng chọn khung giờ hoặc vị trí khác!");
                        }
                    }
                }
            }
            else
            {
                return ServiceResult<ParkingSession>.BadRequest("Định dạng ngày hoặc giờ đặt chỗ không hợp lệ.");
            }
        }

        // Only bind a customer UserId for app reservations.
        // Staff walk-in (vé vãng lai) must stay anonymous — never attach the staff JWT identity.
        Guid? userId = request.UserId;
        var isReservation = !string.IsNullOrWhiteSpace(request.ReservationDate);
        if (!userId.HasValue && authenticatedUserId.HasValue && isReservation)
        {
            userId = authenticatedUserId;
        }

        var cleanLicensePlate = request.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
        var allSessions = await _sessionRepository.GetActiveSessionsAsync();
        var existingActive = allSessions.FirstOrDefault(ps =>
            ps.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanLicensePlate);

        if (existingActive != null)
        {
            return ServiceResult<ParkingSession>.BadRequest(
                $"Xe với biển số {request.LicensePlate} đang có phiên đỗ xe hoạt động tại {existingActive.ParkingLotName}. Vui lòng thanh toán/hoàn tất phiên hiện tại trước khi đặt chỗ mới.");
        }

        var qrCode = $"QR_{Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper()}";

        var session = new ParkingSession
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            LicensePlate = request.LicensePlate.Trim().ToUpper(),
            QrCode = qrCode,
            EntryPhoto = request.EntryPhoto,
            EntryTime = VietnamTime.Now,
            Status = (!string.IsNullOrEmpty(request.ReservationDate) && (request.PrepaidAmount ?? 0) == 0)
                ? "PendingPayment"
                : "Active",
            CreatedAt = VietnamTime.Now,
            ParkingLotId = lotId,
            ParkingLotName = lotName,
            VehicleType = PricingFeeCalculator.NormalizeCategory(request.VehicleType),
            ReservationDate = request.ReservationDate,
            ReservationStartTime = request.ReservationStartTime,
            ReservationEndTime = request.ReservationEndTime,
            ReservationEndDate = string.IsNullOrWhiteSpace(request.ReservationEndDate)
                ? request.ReservationDate
                : request.ReservationEndDate,
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
                Amount = request.PrepaidAmount.Value,
                TransactionTime = VietnamTime.Now,
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

    public async Task<ServiceResult<CancelRefundInfo>> GetCancelPreviewAsync(
        Guid sessionId,
        Guid? requesterUserId = null,
        bool isStaffOrAdmin = false)
    {
        var access = await ValidateCancelAccessAsync(sessionId, requesterUserId, isStaffOrAdmin);
        if (!access.Success)
            return ServiceResult<CancelRefundInfo>.Fail(access.ErrorMessage!, access.StatusCode);

        var refund = await BuildCancelRefundInfoAsync(access.Data!, isStaffOrAdmin);
        return ServiceResult<CancelRefundInfo>.Ok(refund);
    }

    public async Task<ServiceResult<CancelSessionResponse>> CancelSessionAsync(
        Guid sessionId,
        Guid? requesterUserId = null,
        bool isStaffOrAdmin = false)
    {
        var access = await ValidateCancelAccessAsync(sessionId, requesterUserId, isStaffOrAdmin);
        if (!access.Success)
            return ServiceResult<CancelSessionResponse>.Fail(access.ErrorMessage!, access.StatusCode);

        var session = access.Data!;
        var refund = await BuildCancelRefundInfoAsync(session, isStaffOrAdmin);

        session.Status = "Cancelled";
        session.UpdatedAt = VietnamTime.Now;
        _sessionRepository.Update(session);

        if (refund.IsEligibleForRefund && refund.RefundAmount > 0)
        {
            var payments = await _paymentRepository.FindAsync(
                p => p.SessionId == session.Id && (p.Status == "Completed" || p.Status == "Success"));
            foreach (var payment in payments)
            {
                payment.Status = "Refunded";
                payment.UpdatedAt = VietnamTime.Now;
                _paymentRepository.Update(payment);
            }
        }

        await _sessionRepository.SaveChangesAsync();
        await _paymentRepository.SaveChangesAsync();

        var message = refund.IsEligibleForRefund && refund.RefundAmount > 0
            ? $"Hủy chỗ thành công. Số tiền hoàn: {refund.RefundAmount:N0} VNĐ (dự kiến 3–7 ngày làm việc)."
            : "Hủy chỗ thành công. Theo chính sách, số tiền đã thanh toán không được hoàn.";

        if (session.UserId.HasValue)
        {
            User? user = await _userRepository.GetByIdAsync(session.UserId.Value);
            var roleStr = user != null ? user.Role.ToString().ToLower() : "user";

            string notifTitle;
            string notifMessage;
            string notifType;

            if (refund.IsEligibleForRefund && refund.RefundAmount > 0)
            {
                notifTitle = "Đã hủy đặt chỗ — hoàn tiền";
                notifMessage =
                    $"Bạn đã hủy đặt chỗ tại {session.ParkingLotName ?? "bãi xe"} (ô {session.ParkingSlot}). " +
                    $"Số tiền hoàn: {refund.RefundAmount:N0} VNĐ (100%). " +
                    "Tiền sẽ được hoàn về phương thức thanh toán ban đầu trong khoảng 3–7 ngày làm việc.";
                notifType = "success";
            }
            else if (refund.PaidAmount > 0)
            {
                notifTitle = "Đã hủy đặt chỗ — không hoàn tiền";
                notifMessage =
                    $"Bạn đã hủy đặt chỗ tại {session.ParkingLotName ?? "bãi xe"} (ô {session.ParkingSlot}). " +
                    "Theo chính sách (≥24 giờ trước giờ nhận chỗ mới được hoàn), số tiền đã thanh toán không được hoàn và được xem là phí giữ chỗ.";
                notifType = "warning";
            }
            else
            {
                notifTitle = "Đã hủy đặt chỗ";
                notifMessage =
                    $"Bạn đã hủy đặt chỗ tại {session.ParkingLotName ?? "bãi xe"} (ô {session.ParkingSlot}). Vé QR không còn hiệu lực.";
                notifType = "info";
            }

            await _notificationRepository.AddAsync(new AppNotification
            {
                Id = Guid.NewGuid(),
                UserId = session.UserId,
                IsBroadcast = false,
                Role = roleStr,
                Title = notifTitle,
                Message = notifMessage,
                Type = notifType,
                CreatedAt = VietnamTime.Now,
                UpdatedAt = VietnamTime.Now
            });
            await _notificationRepository.SaveChangesAsync();
        }

        return ServiceResult<CancelSessionResponse>.Ok(new CancelSessionResponse
        {
            Session = session,
            Refund = refund,
            Message = message
        });
    }

    private async Task<ServiceResult<ParkingSession>> ValidateCancelAccessAsync(
        Guid sessionId,
        Guid? requesterUserId,
        bool isStaffOrAdmin)
    {
        var session = await _sessionRepository.GetByIdAsync(sessionId);
        if (session == null)
            return ServiceResult<ParkingSession>.NotFound("Không tìm thấy phiên đỗ xe.");

        if (!isStaffOrAdmin && requesterUserId.HasValue)
        {
            if (session.UserId == null || session.UserId != requesterUserId.Value)
                return ServiceResult<ParkingSession>.Forbidden("Bạn không có quyền hủy đặt chỗ này.");
        }

        if (session.Status != "Active" && session.Status != "PendingPayment")
            return ServiceResult<ParkingSession>.BadRequest("Chỉ có thể hủy các phiên đang chờ vào bãi hoặc chờ thanh toán.");

        if (session.IsCheckedIn == true)
            return ServiceResult<ParkingSession>.BadRequest("Không thể hủy vì xe đã vào bãi.");

        return ServiceResult<ParkingSession>.Ok(session);
    }

    private async Task<CancelRefundInfo> BuildCancelRefundInfoAsync(ParkingSession session, bool isStaffOrAdmin)
    {
        var payments = await _paymentRepository.FindAsync(
            p => p.SessionId == session.Id && (p.Status == "Completed" || p.Status == "Success"));
        var paidAmount = payments.Sum(p => p.Amount);

        var localNow = VietnamTime.Now;
        double hoursUntilStart = 0;
        string? reservationStartAt = null;
        var hasStart = TryGetReservationStart(session, out var reservationStart);

        if (hasStart)
        {
            hoursUntilStart = (reservationStart - localNow).TotalHours;
            reservationStartAt = reservationStart.ToString("dd/MM/yyyy HH:mm");
        }

        // Operator-initiated cancel → full refund. Customer: ≥24h before start → 100%, else 0%.
        var refundPercent = 0;
        if (paidAmount > 0)
        {
            if (isStaffOrAdmin)
                refundPercent = 100;
            else if (hasStart && hoursUntilStart >= 24)
                refundPercent = 100;
        }

        var refundAmount = Math.Round(paidAmount * refundPercent / 100m, 0);
        var nonRefundable = paidAmount - refundAmount;
        var eligible = refundAmount > 0;

        string policyMessage;
        if (paidAmount <= 0)
            policyMessage = "Chưa có khoản thanh toán nào — không phát sinh hoàn tiền.";
        else if (isStaffOrAdmin)
            policyMessage = "Hủy từ phía bãi xe/quản trị — hoàn 100% số tiền đã thanh toán.";
        else if (!hasStart)
            policyMessage = "Không xác định được giờ bắt đầu đặt chỗ — không hoàn tiền.";
        else if (hoursUntilStart >= 24)
            policyMessage = "Hủy trước giờ nhận chỗ từ 24 giờ trở lên — hoàn 100% số tiền đã thanh toán.";
        else
            policyMessage = "Hủy trong vòng dưới 24 giờ trước giờ nhận chỗ — không được hoàn tiền (phí giữ chỗ).";

        return new CancelRefundInfo
        {
            SessionId = session.Id,
            PaidAmount = paidAmount,
            RefundAmount = refundAmount,
            NonRefundableAmount = nonRefundable,
            RefundPercent = refundPercent,
            IsEligibleForRefund = eligible,
            HoursUntilStart = Math.Round(hoursUntilStart, 2),
            ReservationStartAt = reservationStartAt,
            PolicyMessage = policyMessage,
            TimeRemainingLabel = FormatTimeRemaining(hoursUntilStart, hasStart)
        };
    }

    private static bool TryGetReservationStart(ParkingSession session, out DateTime reservationStart)
    {
        reservationStart = default;
        if (string.IsNullOrWhiteSpace(session.ReservationDate) || string.IsNullOrWhiteSpace(session.ReservationStartTime))
            return false;
        return DateTime.TryParse($"{session.ReservationDate} {session.ReservationStartTime}", out reservationStart);
    }

    private static string FormatTimeRemaining(double hoursUntilStart, bool hasStart)
    {
        if (!hasStart) return "Không xác định";
        if (hoursUntilStart <= 0) return "Đã đến hoặc qua giờ nhận chỗ";
        var totalMinutes = (int)Math.Floor(hoursUntilStart * 60);
        var days = totalMinutes / (24 * 60);
        var hours = (totalMinutes % (24 * 60)) / 60;
        var mins = totalMinutes % 60;
        if (days > 0) return $"{days} ngày {hours} giờ {mins} phút";
        if (hours > 0) return $"{hours} giờ {mins} phút";
        return $"{mins} phút";
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

        var isSlotTaken = await _sessionRepository.IsSlotTakenAsync(session.ParkingLotId, session.ParkingLotName, newSlot);
        if (isSlotTaken)
        {
            return ServiceResult<ParkingSession>.BadRequest($"Vị trí {newSlot} đã có người đặt hoặc đang bận.");
        }

        var oldSlot = session.ParkingSlot ?? "Không xác định";
        session.ParkingSlot = newSlot;
        session.UpdatedAt = VietnamTime.Now;
        
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

        var now = VietnamTime.Now;
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
            .Where(ps => ps.UserId == userId || (user != null && UserOwnsPlate(user, ps.LicensePlate)))
            .ToList();

        return ServiceResult<List<ParkingSession>>.Ok(filteredSessions);
    }

    public async Task<ServiceResult<VerifySessionResponse>> VerifyAsync(string qrCode)
    {
        var session = await _sessionRepository.GetActiveByQrCodeAsync(qrCode);
        if (session == null)
        {
            var any = await _sessionRepository.GetByQrCodeAsync(qrCode);
            if (any != null)
            {
                var statusLabel = any.Status switch
                {
                    "Cancelled" => "đã hủy",
                    "Completed" => "đã hoàn tất / đã thanh toán ra bãi",
                    _ => $"ở trạng thái {any.Status}"
                };
                return ServiceResult<VerifySessionResponse>.BadRequest(
                    $"Mã QR thuộc phiên {statusLabel} — không thể quét vào/ra. Cần vé Active hoặc PendingPayment.");
            }

            return ServiceResult<VerifySessionResponse>.NotFound(
                "Không tìm thấy phiên gửi xe hoặc mã QR không hợp lệ.");
        }

        User? user = null;
        // Chỉ trả thông tin chủ xe cho đặt trước. Vé vãng lai không gắn / không đoán user theo biển số.
        var isReservation = !string.IsNullOrWhiteSpace(session.ReservationDate);
        if (isReservation)
        {
            if (session.UserId.HasValue)
            {
                user = await _userRepository.GetByIdAsync(session.UserId.Value);
            }

            if (user == null && !string.IsNullOrEmpty(session.LicensePlate))
            {
                var allUsers = await _userRepository.GetAllAsync();
                user = allUsers.FirstOrDefault(u => UserOwnsPlate(u, session.LicensePlate));
            }
        }

        var exitTime = VietnamTime.Now;
        // Fee MUST use the reserved session vehicle (not profile default)
        User? feeUser = user;
        var vehicleForFee = PricingFeeCalculator.ResolveVehicleType(
            session.VehicleType,
            feeUser?.Vehicles,
            session.LicensePlate);
        if (string.IsNullOrWhiteSpace(session.VehicleType) ||
            PricingFeeCalculator.NormalizeCategory(session.VehicleType) != vehicleForFee)
        {
            session.VehicleType = vehicleForFee;
            session.UpdatedAt = VietnamTime.Now;
            _sessionRepository.Update(session);
            await _sessionRepository.SaveChangesAsync();
        }

        var fee = CalculateFee(session.EntryTime, exitTime, vehicleForFee);
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
            LicensePlate = user.Vehicles.Count == 1 
                ? user.Vehicles.First().LicensePlate 
                : System.Text.Json.JsonSerializer.Serialize(user.Vehicles.Select(v => new { plate = v.LicensePlate, type = v.VehicleType })),
            VehicleType = user.Vehicles.FirstOrDefault()?.VehicleType,
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
        session.ExitTime = VietnamTime.Now;
        session.Status = "Completed";
        session.IsPlateMatched = entryPlateNormalized == exitPlateNormalized;
        session.UpdatedAt = VietnamTime.Now;

        decimal totalSurcharge = 0;
        if (request.ExtraFees != null && request.ExtraFees.Any())
        {
            // Add via DbSet (Added), never assign + Update() — Update marks new rows Modified → no INSERT
            var surchargeEntities = request.ExtraFees.Select(f => new ParkingSessionSurcharge
            {
                Name = string.IsNullOrWhiteSpace(f.Name) ? "Phụ thu" : f.Name.Trim(),
                Amount = f.Amount
            }).ToList();
            await _sessionRepository.AddSurchargesAsync(session.Id, surchargeEntities);
            totalSurcharge = request.ExtraFees.Sum(f => f.Amount);
        }

        var completedPaymentsList = await _paymentRepository.FindAsync(p => p.SessionId == session.Id && p.Status == "Completed");
        decimal prepaidAmount = completedPaymentsList.Sum(p => p.Amount);

        User? checkoutUser = null;
        if (session.UserId.HasValue)
            checkoutUser = await _userRepository.GetByIdAsync(session.UserId.Value);

        var vehicleForFee = PricingFeeCalculator.ResolveVehicleType(
            session.VehicleType,
            checkoutUser?.Vehicles,
            session.LicensePlate);
        session.VehicleType = vehicleForFee;

        var baseFee = CalculateFee(session.EntryTime, session.ExitTime.Value, vehicleForFee);
        var fee = baseFee + totalSurcharge;

        // Remaining = Max(0, baseFee + surcharge - prepaid)
        decimal checkoutAmount = PricingFeeCalculator.NetPayable(baseFee, prepaidAmount, totalSurcharge);

        var payment = new Payment
        {
            SessionId = session.Id,
            UserId = session.UserId,
            Amount = checkoutAmount,
            TransactionTime = VietnamTime.Now,
            PaymentMethod = "Online",
            Status = "Completed",
            TransactionId = "TXN-" + Guid.NewGuid().ToString().Substring(0, 8).ToUpper()
        };

        await _paymentRepository.AddAsync(payment);
        // Session is already tracked from GetActiveByQrCodeAsync — do not call Update()
        session.UpdatedAt = VietnamTime.Now;
        await _sessionRepository.SaveChangesAsync();

        // Calculate early checkout messages & Send Email
        string plannedEndTimeStr = "";
        string refundMessage = "";
        if (!string.IsNullOrEmpty(session.ReservationEndTime) && !string.IsNullOrEmpty(session.ReservationDate))
        {
            var endDate = string.IsNullOrWhiteSpace(session.ReservationEndDate)
                ? session.ReservationDate
                : session.ReservationEndDate;
            plannedEndTimeStr = $"{endDate} {session.ReservationEndTime}";
            if (DateTime.TryParse(plannedEndTimeStr, out var plannedEndDateTime))
            {
                var localExitTime = session.ExitTime.Value;
                if (plannedEndDateTime - localExitTime > TimeSpan.FromMinutes(15))
                {
                    if (prepaidAmount > 0 && fee < prepaidAmount)
                    {
                        refundMessage = "Bạn đã trả xe sớm hơn dự kiến. Theo chính sách của hệ thống, số tiền đặt chỗ trước không được hoàn lại.";
                    }
                }
            }
        }

        User? user = checkoutUser;
        if (user == null && session.UserId.HasValue)
        {
            user = await _userRepository.GetByIdAsync(session.UserId.Value);
        }

        if (user != null && !string.IsNullOrWhiteSpace(user.Email))
        {
            var userName = !string.IsNullOrWhiteSpace(user.FirstName) || !string.IsNullOrWhiteSpace(user.LastName)
                ? $"{user.FirstName} {user.LastName}".Trim()
                : (user.Username ?? "Khách hàng");

            var entryTimeStr = session.EntryTime.ToString("dd-MM-yyyy HH:mm");
            var exitTimeStr = session.ExitTime.Value.ToString("dd-MM-yyyy HH:mm");

            await _emailService.SendCheckoutInvoiceEmailAsync(
                user.Email,
                userName,
                session.ParkingLotName ?? "PM System Central",
                session.ParkingSlot ?? "Tự động phân bổ",
                session.LicensePlate.ToUpper(),
                entryTimeStr,
                exitTimeStr,
                !string.IsNullOrEmpty(session.ReservationEndTime)
                    ? $"{(string.IsNullOrWhiteSpace(session.ReservationEndDate) ? session.ReservationDate : session.ReservationEndDate)} {session.ReservationEndTime}"
                    : "N/A",
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

        var lot = await ResolveParkingLotAsync(null, parkingLotName);
        var activeSessions = await _sessionRepository.FindAsync(ps =>
            (ps.Status == "Active" || ps.Status == "PendingPayment" || ps.Status == "Pending") &&
            !string.IsNullOrEmpty(ps.ParkingSlot) &&
            (
                (lot != null && ps.ParkingLotId == lot.Id)
                || ps.ParkingLotName == parkingLotName
                || (lot != null && ps.ParkingLotName == lot.Name)
            ));

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

        // Gate-scan = xe VÀO: block when lot is exit-only
        if (session.IsCheckedIn != true)
        {
            var lot = await ResolveParkingLotAsync(session.ParkingLotId, session.ParkingLotName);
            if (lot != null && !lot.IsAcceptingEntries)
            {
                return ServiceResult<ParkingSession>.BadRequest(
                    $"Bãi \"{lot.Name}\" đang đóng nhận xe — chỉ cho xe RA, không nhận xe VÀO.");
            }
        }

        session.IsCheckedIn = true;
        session.EntryTime = VietnamTime.Now;
        session.UpdatedAt = VietnamTime.Now;

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
            ReservationEndDate = ps.ReservationEndDate,
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
        try
        {
            var configs = await _pricingConfigRepository.GetAllAsync();
            if (configs != null && configs.Count > 0)
            {
                var payload = configs.Select(c => new { 
                    type = c.Type, 
                    price = c.Price.ToString("N0", new System.Globalization.CultureInfo("vi-VN")).Replace(",", "."), 
                    sub = c.Sub 
                });
                return ServiceResult<string>.Ok(System.Text.Json.JsonSerializer.Serialize(payload));
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("GetPricing from DB failed: " + ex.Message);
        }

        var path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing.json");
        if (System.IO.File.Exists(path))
        {
            var json = await System.IO.File.ReadAllTextAsync(path);
            return ServiceResult<string>.Ok(json);
        }

        var defaultPricing = new List<object>
        {
            new { type = "Xe máy", price = "5.000", sub = "VNĐ / Lượt" },
            new { type = "Ô tô 4-7 chỗ", price = "30.000", sub = "VNĐ / Giờ" },
            new { type = "SUV / Bán tải", price = "50.000", sub = "VNĐ / Giờ" }
        };
        return ServiceResult<string>.Ok(System.Text.Json.JsonSerializer.Serialize(defaultPricing));
    }

    public async Task<ServiceResult<bool>> SavePricingAsync(System.Text.Json.JsonElement pricing)
    {
        var path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing.json");
        var json = pricing.ToString();
        await System.IO.File.WriteAllTextAsync(path, json);

        // Keep PricingConfigs (Admin bảng giá) in sync so CalculateFee uses the same rates
        try
        {
            if (pricing.ValueKind == System.Text.Json.JsonValueKind.Array)
            {
                var items = new List<PricingConfig>();
                foreach (var elem in pricing.EnumerateArray())
                {
                    var type = elem.TryGetProperty("type", out var t) ? t.GetString() ?? "" : "";
                    var sub = elem.TryGetProperty("sub", out var s) ? s.GetString() ?? "VNĐ / Giờ" : "VNĐ / Giờ";
                    decimal priceVal = 0;
                    if (elem.TryGetProperty("price", out var p))
                    {
                        priceVal = p.ValueKind switch
                        {
                            System.Text.Json.JsonValueKind.Number => p.GetDecimal(),
                            System.Text.Json.JsonValueKind.String => PricingFeeCalculator.ParsePrice(p.GetString()),
                            _ => 0
                        };
                    }

                    items.Add(new PricingConfig
                    {
                        Type = type,
                        Price = priceVal,
                        Sub = sub
                    });
                }

                if (items.Count > 0)
                {
                    await _pricingConfigRepository.SoftDeleteAllAsync();
                    await _pricingConfigRepository.SaveChangesAsync();
                    await _pricingConfigRepository.AddRangeAsync(items);
                    await _pricingConfigRepository.SaveChangesAsync();
                }
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("Sync PricingConfigs failed: " + ex.Message);
        }

        return ServiceResult<bool>.Ok(true);
    }

    public decimal CalculateFee(DateTime entryTime, DateTime exitTime, string? vehicleType)
    {
        try
        {
            var configs = _pricingConfigRepository.GetAllAsync().GetAwaiter().GetResult();
            if (configs != null && configs.Count > 0)
                return PricingFeeCalculator.CalculateFromConfigs(entryTime, exitTime, vehicleType, configs);
        }
        catch (Exception ex)
        {
            Console.WriteLine("CalculateFee DB pricing failed: " + ex.Message);
        }

        try
        {
            var path = System.IO.Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "pricing.json");
            if (System.IO.File.Exists(path))
            {
                var json = System.IO.File.ReadAllText(path);
                return PricingFeeCalculator.CalculateFromJsonArray(entryTime, exitTime, vehicleType, json);
            }
        }
        catch (Exception ex)
        {
            Console.WriteLine("CalculateFee file pricing failed: " + ex.Message);
        }

        return PricingFeeCalculator.Calculate(entryTime, exitTime, vehicleType, Array.Empty<(string, decimal, string)>());
    }

    public bool UserOwnsPlate(User user, string? sessionPlate)
    {
        if (user == null || string.IsNullOrWhiteSpace(sessionPlate) || user.Vehicles == null)
            return false;

        var cleanSessionPlate = sessionPlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
        return user.Vehicles.Any(v => v.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanSessionPlate);
    }

    public async Task ProcessReservationsAsync()
    {
        var localNow = VietnamTime.Now;

        var pendingSessions = await _sessionRepository.FindAsync(ps => 
            (ps.Status == "Active" || ps.Status == "Pending" || ps.Status == "PendingPayment")
            && ps.IsCheckedIn == false
            && ps.ReservationDate != null
            && ps.ReservationStartTime != null);

        foreach (var session in pendingSessions)
        {
            if (session.Status == "PendingPayment")
            {
                if (VietnamTime.Now - session.CreatedAt > TimeSpan.FromMinutes(15))
                {
                    session.Status = "Cancelled";
                    session.UpdatedAt = VietnamTime.Now;
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
                        CreatedAt = VietnamTime.Now,
                        UpdatedAt = VietnamTime.Now
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
                // Skip "no-show" cancel when slot was already past at booking time
                // (FE used to send UTC date + local time → looks ~1 day late immediately).
                var createdVn = VietnamTime.AsVietnam(session.CreatedAt);
                if (reservationTime <= createdVn.AddMinutes(-2))
                    continue;

                session.Status = "Cancelled";
                session.UpdatedAt = VietnamTime.Now;
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
                        CreatedAt = VietnamTime.Now,
                        UpdatedAt = VietnamTime.Now
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
        var localNow = VietnamTime.Now;

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
                session.UpdatedAt = VietnamTime.Now;

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
                        CreatedAt = VietnamTime.Now,
                        UpdatedAt = VietnamTime.Now
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
        session.UpdatedAt = VietnamTime.Now;
        await _sessionRepository.SaveChangesAsync();

        return ServiceResult<ParkingSession>.Ok(session);
    }

    /// <summary>
    /// Resolve lot by Guid first, then exact name, then accent-insensitive name match.
    /// </summary>
    private async Task<ParkingLot?> ResolveParkingLotAsync(Guid? parkingLotId, string? parkingLotName)
    {
        if (parkingLotId.HasValue)
        {
            var byId = await _lotRepository.GetByIdAsync(parkingLotId.Value);
            if (byId != null) return byId;
        }

        if (string.IsNullOrWhiteSpace(parkingLotName))
            return null;

        var exact = await _lotRepository.FirstOrDefaultAsync(l => l.Name == parkingLotName);
        if (exact != null) return exact;

        var allLots = await _lotRepository.GetAllAsync();
        var needle = NormalizeLotKey(parkingLotName);
        return allLots.FirstOrDefault(l => NormalizeLotKey(l.Name) == needle)
            ?? allLots.FirstOrDefault(l => LotKeysLooselyMatch(NormalizeLotKey(l.Name), needle));
    }

    private static string NormalizeLotKey(string? name)
    {
        if (string.IsNullOrWhiteSpace(name)) return string.Empty;
        var formD = name.Trim().ToLowerInvariant().Normalize(System.Text.NormalizationForm.FormD);
        var sb = new System.Text.StringBuilder(formD.Length);
        foreach (var ch in formD)
        {
            var uc = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(ch);
            if (uc == System.Globalization.UnicodeCategory.NonSpacingMark) continue;
            if (char.IsLetterOrDigit(ch)) sb.Append(ch);
        }
        return sb.ToString().Normalize(System.Text.NormalizationForm.FormC)
            .Replace('đ', 'd').Replace('Đ', 'd');
    }

    private static bool LotKeysLooselyMatch(string a, string b)
    {
        if (string.IsNullOrEmpty(a) || string.IsNullOrEmpty(b)) return false;
        if (a.Contains(b) || b.Contains(a)) return true;
        const int prefix = 10;
        return a.Length >= prefix && b.Length >= prefix && a.Substring(0, prefix) == b.Substring(0, prefix);
    }
}
