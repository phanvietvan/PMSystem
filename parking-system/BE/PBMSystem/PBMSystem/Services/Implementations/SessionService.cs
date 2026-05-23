using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Enums;
using Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Implementations
{
    public class SessionService : ISessionService
    {
        private readonly AppDbContext _context;

        public SessionService(AppDbContext context)
        {
            _context = context;
        }
        public async Task<object> GetActiveAsync(
            Guid userId)
        {
            var session = await _context.ParkingSessions
                .Where(x =>
                    x.UserId == userId &&
                    x.Status == ParkingSessionStatus.Active)
                .OrderByDescending(x => x.EntryTime)
                .FirstOrDefaultAsync();

            if (session == null)
            {
                return new
                {
                    hasActiveSession = false
                };
            }

            var fee = CalculateFee(
                session.EntryTime,
                DateTime.UtcNow);

            return new
            {
                hasActiveSession = true,
                session,
                currentFee = fee
            };
        }
        public async Task<object> EndAsync(Guid id)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == id);

            if (session == null)
            {
                return new
                {
                    success = false,
                    message = "Không tìm thấy phiên gửi xe."
                };
            }

            session.ExitTime = DateTime.UtcNow;

            session.Status =
                ParkingSessionStatus.Completed;

            session.UpdatedAt = DateTime.UtcNow;

            var slot = await _context.ParkingSlots
                .FirstOrDefaultAsync(x =>
                    x.SlotCode == session.ParkingSlot);

            if (slot != null)
            {
                slot.Status =
                    ParkingSlotStatus.AVAILABLE;
            }

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                message = "Kết thúc phiên gửi xe thành công."
            };
        }

        public async Task<object> GetFeeAsync(Guid id)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == id);

            if (session == null)
            {
                return new
                {
                    success = false,
                    message = "Không tìm thấy phiên gửi xe."
                };
            }

            var fee = CalculateFee(
                session.EntryTime,
                session.ExitTime ?? DateTime.UtcNow);

            return new
            {
                sessionId = session.Id,
                fee
            };
        }
        private decimal CalculateFee(
            DateTime entryTime,
            DateTime exitTime)
        {
            var elapsed =
                exitTime - entryTime;

            var minutes =
                (int)Math.Ceiling(
                    elapsed.TotalMinutes);

            decimal fee = 10000;

            if (minutes > 60)
            {
                fee +=
                    (minutes - 60) * 500;
            }

            return fee;
        }
    }
}
