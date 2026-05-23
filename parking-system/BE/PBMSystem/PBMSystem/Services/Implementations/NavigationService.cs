using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.DTOs;
using Repositories.Enums;
using Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Implementations
{
    public class NavigationService : INavigationService
    {
        private readonly AppDbContext _context;

        public NavigationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> RouteAsync(
            NavigationRouteRequest request)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == request.SessionId);

            if (session == null)
            {
                return new
                {
                    success = false,
                    message = "Không tìm thấy session."
                };
            }

            return new
            {
                slot = session.ParkingSlot,
                directions = new[]
                {
                "Đi thẳng 20m",
                "Rẽ phải",
                $"Đến ô {session.ParkingSlot}"
            }
            };
        }

        public async Task<object> VerifySlotAsync(
            VerifySlotRequest request)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == request.SessionId);

            if (session == null)
            {
                return new
                {
                    success = false
                };
            }

            if (session.ParkingSlot != request.SlotQrCode)
            {
                return new
                {
                    success = false,
                    message = "Sai slot."
                };
            }

            var slot = await _context.ParkingSlots
                .FirstOrDefaultAsync(x =>
                    x.SlotCode == request.SlotQrCode);

            if (slot != null)
            {
                slot.Status =
                    ParkingSlotStatus.OCCUPIED;
            }

            await _context.SaveChangesAsync();

            return new
            {
                success = true
            };
        }
    }
}
