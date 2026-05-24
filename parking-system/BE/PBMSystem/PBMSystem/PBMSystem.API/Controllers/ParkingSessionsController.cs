using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PBMSystem.API.Extensions;
using Repositories;
using Repositories.Entities;
using Repositories.DTOs;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ParkingSessionsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ParkingSessionsController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Creates a new parking session.
    /// If a logged-in user is authenticated, the session is bound to their UserId.
    /// Otherwise (e.g. walk-in visitor from gate), UserId is left null.
    /// </summary>
    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.LicensePlate))
            return BadRequest(new { message = "Biển số xe không được trống." });

        // Verify if the parking slot is already locked/reserved in the selected building
        if (!string.IsNullOrWhiteSpace(request.ParkingLotName) && !string.IsNullOrWhiteSpace(request.ParkingSlot))
        {
            var isSlotTaken = await _context.ParkingSessions
                .AnyAsync(ps => ps.Status == "Active" 
                             && ps.ParkingLotName == request.ParkingLotName 
                             && ps.ParkingSlot == request.ParkingSlot);
            
            if (isSlotTaken)
            {
                return BadRequest(new { message = $"Vị trí đỗ {request.ParkingSlot} tại {request.ParkingLotName} hiện đã bị khóa hoặc đang bận. Vui lòng chọn vị trí khác!" });
            }
        }

        Guid? userId = request.UserId;
        try
        {
            if (!userId.HasValue && User.Identity?.IsAuthenticated == true)
            {
                userId = User.GetUserId();
            }
        }
        catch { }

        // Prevent duplicate active sessions for the same vehicle (license plate)
        var cleanLicensePlate = request.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
        var allSessions = await _context.ParkingSessions.Where(ps => ps.Status == "Active").ToListAsync();
        var existingActive = allSessions.FirstOrDefault(ps => 
            ps.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanLicensePlate &&
            ps.ParkingLotName == request.ParkingLotName);

        if (existingActive != null)
        {
            return BadRequest(new { message = $"Xe với biển số {request.LicensePlate} đang có phiên đỗ xe hoạt động tại {existingActive.ParkingLotName}. Vui lòng thanh toán phiên hiện tại trước khi đặt chỗ mới." });
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
            Status = "Active",
            CreatedAt = DateTime.UtcNow,
            ParkingLotName = request.ParkingLotName,
            VehicleType = request.VehicleType,
            ReservationDate = request.ReservationDate,
            ReservationStartTime = request.ReservationStartTime,
            ParkingSlot = request.ParkingSlot,
            IsCheckedIn = string.IsNullOrEmpty(request.ReservationDate)
        };

        _context.ParkingSessions.Add(session);
        await _context.SaveChangesAsync();

        return Ok(session);
    }

    private decimal CalculateFee(DateTime entryTime, DateTime exitTime)
    {
        var elapsed = exitTime - entryTime;
        var elapsedMinutes = (int)Math.Ceiling(elapsed.TotalMinutes);
        decimal fee = 10000;
        if (elapsedMinutes > 60)
            fee += (elapsedMinutes - 60) * 500;
        return fee;
    }

    /// <summary>
    /// Returns the currently active parking session for the logged-in user, if any.
    /// </summary>
    [Authorize]
    [HttpGet("my-session")]
    public async Task<IActionResult> GetMySession()
    {
        var userId = User.GetUserId();

        var session = await _context.ParkingSessions
            .Where(ps => ps.UserId == userId && ps.Status == "Active")
            .OrderByDescending(ps => ps.EntryTime)
            .FirstOrDefaultAsync();

        if (session == null)
            return Ok(new { hasActiveSession = false, session = (object?)null });

        var now = DateTime.UtcNow;
        var fee = CalculateFee(session.EntryTime, now);
        var durationMinutes = (int)Math.Ceiling((now - session.EntryTime).TotalMinutes);

        return Ok(new { hasActiveSession = true, session, fee, durationMinutes });
    }

    [HttpGet("verify/{qrCode}")]
    public async Task<IActionResult> Verify(string qrCode)
    {
        var session = await _context.ParkingSessions
            .FirstOrDefaultAsync(ps => ps.QrCode == qrCode && ps.Status == "Active");

        if (session == null)
            return NotFound(new { message = "Không tìm thấy phiên gửi xe hoặc mã QR không hợp lệ/đã thanh toán." });

        User? user = null;
        if (session.UserId.HasValue)
        {
            user = await _context.Users.FirstOrDefaultAsync(u => u.Id == session.UserId.Value);
        }

        // Fallback: If UserId is missing in session, try to match by License Plate robustly!
        if (user == null && !string.IsNullOrEmpty(session.LicensePlate))
        {
            var cleanPlate = session.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
            var allUsers = await _context.Users.ToListAsync();
            user = allUsers.FirstOrDefault(u => 
                !string.IsNullOrEmpty(u.LicensePlate) && 
                u.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper() == cleanPlate);
        }

        var exitTime = DateTime.UtcNow;
        var fee = CalculateFee(session.EntryTime, exitTime);
        var durationMinutes = (int)Math.Ceiling((exitTime - session.EntryTime).TotalMinutes);

        return Ok(new 
        { 
            session, 
            fee, 
            durationMinutes,
            user = user != null ? new 
            {
                user.Id,
                user.Email,
                user.FirstName,
                user.LastName,
                user.PhoneNumber,
                user.Address,
                user.LicensePlate,
                user.VehicleType
            } : null
        });
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.QrCode))
            return BadRequest(new { message = "Mã QR không được trống." });

        var session = await _context.ParkingSessions
            .FirstOrDefaultAsync(ps => ps.QrCode == request.QrCode && ps.Status == "Active");

        if (session == null)
            return NotFound(new { message = "Phiên gửi xe không hoạt động hoặc không tìm thấy mã QR." });

        string entryPlateNormalized = session.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
        string exitPlateNormalized = request.ExitLicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();

        session.ExitLicensePlate = request.ExitLicensePlate.Trim().ToUpper();
        session.ExitPhoto = request.ExitPhoto;
        session.ExitTime = DateTime.UtcNow;
        session.Status = "Completed";
        session.IsPlateMatched = entryPlateNormalized == exitPlateNormalized;
        session.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync();

        var fee = CalculateFee(session.EntryTime, session.ExitTime.Value);

        return Ok(new
        {
            session,
            fee,
            isPlateMatched = session.IsPlateMatched,
            message = session.IsPlateMatched == true
                ? "Xác thực thành công. Cho phép xe ra."
                : "Cảnh báo: Biển số xe ra không trùng khớp với biển số xe vào!"
        });
    }

    /// <summary>
    /// Returns all license plates that currently have an active (not yet checked-out) session.
    /// </summary>
    [HttpGet("active-plates")]
    public async Task<IActionResult> GetActivePlates()
    {
        var plates = await _context.ParkingSessions
            .Where(ps => ps.Status == "Active")
            .Select(ps => new { ps.LicensePlate, ps.ParkingLotName })
            .ToListAsync();
        return Ok(plates);
    }

    /// <summary>
    /// Returns all parking slots that currently have an active session.
    /// </summary>
    [HttpGet("active-slots")]
    public async Task<IActionResult> GetActiveSlots()
    {
        var slots = await _context.ParkingSessions
            .Where(ps => ps.Status == "Active" && !string.IsNullOrEmpty(ps.ParkingSlot))
            .Select(ps => ps.ParkingSlot)
            .Distinct()
            .ToListAsync();
        return Ok(slots);
    }

    /// <summary>
    /// Returns all active sessions whose license plate matches any in the given list.
    /// </summary>
    [HttpPost("active-by-plates")]
    public async Task<IActionResult> GetActiveByPlates([FromBody] List<string> plates)
    {
        if (plates == null || plates.Count == 0)
            return Ok(Array.Empty<object>());

        var normalized = plates
            .Select(p => p.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper())
            .ToList();

        var activeSessions = await _context.ParkingSessions
            .Where(ps => ps.Status == "Active")
            .ToListAsync();

        var matched = activeSessions
            .Where(ps =>
            {
                var norm = ps.LicensePlate.Replace("-", "").Replace(".", "").Replace(" ", "").ToUpper();
                return normalized.Contains(norm);
            })
            .ToList();

        return Ok(matched);
    }

    [HttpGet("slots-status")]
    public async Task<IActionResult> GetSlotsStatus([FromQuery] string parkingLotName)
    {
        if (string.IsNullOrEmpty(parkingLotName))
            return BadRequest(new { message = "Tên bãi đỗ không được để trống." });

        // Get all active sessions for this parking lot
        var activeSessions = await _context.ParkingSessions
            .Where(ps => ps.Status == "Active" && ps.ParkingLotName == parkingLotName && !string.IsNullOrEmpty(ps.ParkingSlot))
            .ToListAsync();

        // Map active slot status: Key is Slot ID, Value is "occupied" or "reserved"
        var slotStatusMap = activeSessions
            .GroupBy(ps => ps.ParkingSlot!)
            .ToDictionary(
                g => g.Key,
                g => g.First().IsCheckedIn == true ? "occupied" : "reserved"
            );

        return Ok(slotStatusMap);
    }

    [HttpPost("gate-scan")]
    public async Task<IActionResult> GateScan([FromBody] GateScanRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.QrCode))
            return BadRequest(new { message = "Mã QR không được trống." });

        var session = await _context.ParkingSessions
            .FirstOrDefaultAsync(ps => ps.QrCode == request.QrCode && ps.Status == "Active");

        if (session == null)
            return NotFound(new { message = "Không tìm thấy phiên gửi xe hoặc mã QR không hợp lệ/đã thanh toán." });

        // Physically enter the slot
        session.IsCheckedIn = true;
        session.EntryTime = DateTime.UtcNow;
        session.UpdatedAt = DateTime.UtcNow;

        if (!string.IsNullOrEmpty(request.EntryPhoto))
        {
            session.EntryPhoto = request.EntryPhoto;
        }

        await _context.SaveChangesAsync();

        return Ok(new { message = "Xác thực thành công. Cổng chắn đã mở và vị trí đỗ đã bị khóa.", session });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sessions = await _context.ParkingSessions
            .OrderByDescending(ps => ps.CreatedAt)
            .Take(50)
            .ToListAsync();

        var userIds = sessions.Where(ps => ps.UserId.HasValue).Select(ps => ps.UserId.Value).Distinct().ToList();
        var users = await _context.Users.Where(u => userIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id);

        var result = sessions.Select(ps => new {
            ps.Id,
            ps.UserId,
            ps.LicensePlate,
            ps.EntryTime,
            ps.ExitTime,
            ps.Status,
            ps.QrCode,
            TotalFee = ps.ExitTime.HasValue ? CalculateFee(ps.EntryTime, ps.ExitTime.Value) : (decimal?)null,
            ps.IsCheckedIn,
            ps.EntryPhoto,
            ps.ExitPhoto,
            ps.CreatedAt,
            ps.ParkingLotName,
            ps.ParkingSlot,
            User = ps.UserId.HasValue && users.TryGetValue(ps.UserId.Value, out var u) ? new {
                u.FirstName,
                u.LastName,
                u.Email,
                u.PhoneNumber
            } : null
        });

        return Ok(result);
    }
}

