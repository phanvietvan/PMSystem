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

        Guid? userId = null;
        try
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                userId = User.GetUserId();

                // Prevent duplicate active sessions for the same registered user
                var existingActive = await _context.ParkingSessions
                    .FirstOrDefaultAsync(ps => ps.UserId == userId && ps.Status == "Active");
                if (existingActive != null)
                    return BadRequest(new { message = "Bạn đang có phiên đỗ xe đang hoạt động. Vui lòng thanh toán phiên hiện tại trước khi đặt chỗ mới." });
            }
        }
        catch { }

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
            ParkingSlot = request.ParkingSlot
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

        var exitTime = DateTime.UtcNow;
        var fee = CalculateFee(session.EntryTime, exitTime);
        var durationMinutes = (int)Math.Ceiling((exitTime - session.EntryTime).TotalMinutes);

        return Ok(new { session, fee, durationMinutes });
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
            .Select(ps => ps.LicensePlate)
            .Distinct()
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

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var sessions = await _context.ParkingSessions
            .OrderByDescending(ps => ps.CreatedAt)
            .Take(50)
            .ToListAsync();
        return Ok(sessions);
    }
}

