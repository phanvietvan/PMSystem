using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.LicensePlate))
        {
            return BadRequest(new { message = "Biển số xe không được trống." });
        }

        var qrCode = $"QR_{Guid.NewGuid().ToString("N").Substring(0, 12).ToUpper()}";

        var session = new ParkingSession
        {
            Id = Guid.NewGuid(),
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
        
        // Base fee: 10,000 VNĐ for the first hour (60 minutes)
        decimal fee = 10000;
        
        if (elapsedMinutes > 60)
        {
            // Extra fee: 500 VNĐ per additional minute
            fee += (elapsedMinutes - 60) * 500;
        }
        
        return fee;
    }

    [HttpGet("verify/{qrCode}")]
    public async Task<IActionResult> Verify(string qrCode)
    {
        var session = await _context.ParkingSessions
            .FirstOrDefaultAsync(ps => ps.QrCode == qrCode && ps.Status == "Active");

        if (session == null)
        {
            return NotFound(new { message = "Không tìm thấy phiên gửi xe hoặc mã QR không hợp lệ/đã thanh toán." });
        }

        var exitTime = DateTime.UtcNow;
        var fee = CalculateFee(session.EntryTime, exitTime);
        var durationMinutes = (int)Math.Ceiling((exitTime - session.EntryTime).TotalMinutes);

        return Ok(new
        {
            session,
            fee,
            durationMinutes
        });
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.QrCode))
        {
            return BadRequest(new { message = "Mã QR không được trống." });
        }

        var session = await _context.ParkingSessions
            .FirstOrDefaultAsync(ps => ps.QrCode == request.QrCode && ps.Status == "Active");

        if (session == null)
        {
            return NotFound(new { message = "Phiên gửi xe không hoạt động hoặc không tìm thấy mã QR." });
        }

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
            message = session.IsPlateMatched == true ? "Xác thực thành công. Cho phép xe ra." : "Cảnh báo: Biển số xe ra không trùng khớp với biển số xe vào!"
        });
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
