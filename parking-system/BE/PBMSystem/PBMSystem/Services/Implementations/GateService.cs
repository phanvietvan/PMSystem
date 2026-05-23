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
    public class GateService : IGateService
    {
        private readonly AppDbContext _context;

        public GateService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<object> ScanAsync(
            GateScanRequest request)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.QrCode == request.QrCode &&
                    x.Status == ParkingSessionStatus.Active);

            if (session == null)
            {
                return new
                {
                    success = false,
                    message = "QR không hợp lệ."
                };
            }

            session.IsCheckedIn = true;

            session.EntryTime = DateTime.UtcNow;

            session.UpdatedAt = DateTime.UtcNow;

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                message = "Quét cổng thành công.",
                session
            };
        }

        public async Task<object> GetStatusAsync()
        {
            return await _context.Gates
                .ToListAsync();
        }
    }
}
