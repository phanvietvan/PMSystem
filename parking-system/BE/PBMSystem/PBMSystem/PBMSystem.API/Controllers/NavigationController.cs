using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.DTOs;
using Repositories.Enums;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace PBMSystem.API.Controllers
{
    [ApiController]
    [Route("api/navigation")]
    public class NavigationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public NavigationController(AppDbContext context)
        {
            _context = context;
        }
        // POST: api/navigation/route
        [HttpPost("route")]
        public async Task<IActionResult> Route(
            [FromBody] NavigationRouteRequest request)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == request.SessionId);

            if (session == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy phiên gửi xe."
                });
            }

            return Ok(new
            {
                parkingLot = session.ParkingLotName,

                slot = session.ParkingSlot,

                directions = new[]
                {
                "Đi thẳng 20m",
                "Rẽ phải",
                "Xuống tầng B1",
                $"Ô {session.ParkingSlot} nằm bên trái"
            }
            });
        }
        // POST: api/navigation/verify-slot
        [HttpPost("verify-slot")]
        public async Task<IActionResult> VerifySlot(
            [FromBody] VerifySlotRequest request)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == request.SessionId);

            if (session == null)
            {
                return NotFound(new
                {
                    message = "Không tìm thấy phiên gửi xe."
                });
            }

            if (session.ParkingSlot != request.SlotQrCode)
            {
                return BadRequest(new
                {
                    success = false,
                    message = "Sai vị trí đỗ xe."
                });
            }

            var slot = await _context.ParkingSlots
                .FirstOrDefaultAsync(x =>
                    x.SlotCode == request.SlotQrCode);

            if (slot != null)
            {
                slot.Status =
                    ParkingSlotStatus.OCCUPIED;
            }

            session.IsCheckedIn = true;

            session.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Xác thực vị trí đỗ thành công."
            });
        }
    }
}
