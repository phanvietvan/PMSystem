using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Enums;
using Services.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Services.Implementations
{
    public class ParkingService : IParkingService
    {
        private readonly AppDbContext _context;

        public ParkingService(AppDbContext context)
        {
            _context = context;
        }

        // ==================================================
        // POST: /gate/scan
        // ==================================================

        public async Task<object> ScanGateAsync(
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
                    message = "Invalid QR code"
                };
            }

            session.IsCheckedIn = true;

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                sessionId = session.Id,
                slot = session.ParkingSlot,
                vehicleType = session.VehicleType,
                entryTime = session.EntryTime
            };
        }

        // ==================================================
        // GET: /gate/status
        // ==================================================

        public async Task<object> GetGateStatusAsync()
        {
            var gates = await _context.Gates
                .Select(x => new
                {
                    x.Id,
                    x.GateCode,
                    x.Status,
                    x.GateType
                })
                .ToListAsync();

            return gates;
        }

        // ==================================================
        // POST: /navigation/route
        // ==================================================

        public async Task<object> GetRouteAsync(
            RouteRequest request)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == request.SessionId);

            if (session == null)
            {
                return new
                {
                    success = false,
                    message = "Session not found"
                };
            }

            return new
            {
                success = true,
                slot = session.ParkingSlot,
                directions = new[]
                {
                "Go straight 20m",
                "Turn right",
                "Go to B1",
                $"Slot {session.ParkingSlot} is ahead"
            }
            };
        }

        // ==================================================
        // POST: /parking/verify-slot
        // ==================================================

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
                    success = false,
                    message = "Session not found"
                };
            }

            var slot = await _context.ParkingSlots
                .FirstOrDefaultAsync(x =>
                    x.QrCode == request.SlotQrCode);

            if (slot == null)
            {
                return new
                {
                    success = false,
                    message = "Invalid slot QR"
                };
            }

            if (slot.SlotCode != session.ParkingSlot)
            {
                return new
                {
                    success = false,
                    message = "Wrong parking slot"
                };
            }

            slot.Status = ParkingSlotStatus.OCCUPIED;

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                message = "Parking slot verified"
            };
        }

        // ==================================================
        // GET: /sessions/active
        // ==================================================

        public async Task<object> GetActiveSessionAsync()
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Status == ParkingSessionStatus.Active);

            if (session == null)
            {
                return new
                {
                    success = false,
                    message = "No active session"
                };
            }

            var fee = CalculateFee(session.EntryTime);

            return new
            {
                session.Id,
                session.LicensePlate,
                session.ParkingSlot,
                session.VehicleType,
                session.EntryTime,
                CurrentFee = fee
            };
        }

        // ==================================================
        // POST: /sessions/{id}/end
        // ==================================================

        public async Task<object> EndSessionAsync(
            Guid sessionId)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == sessionId);

            if (session == null)
            {
                return new
                {
                    success = false,
                    message = "Session not found"
                };
            }

            session.ExitTime = DateTime.UtcNow;
            session.Status =
                ParkingSessionStatus.Completed;

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
                message = "Parking session ended"
            };
        }

        // ==================================================
        // GET: /sessions/{id}/fee
        // ==================================================

        public async Task<object> GetFeeAsync(
            Guid sessionId)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == sessionId);

            if (session == null)
            {
                return new
                {
                    success = false,
                    message = "Session not found"
                };
            }

            var fee = CalculateFee(session.EntryTime);

            return new
            {
                session.Id,
                Fee = fee
            };
        }

        // ==================================================
        // POST: /payments
        // ==================================================

        public async Task<object> CreatePaymentAsync(
            CreatePaymentRequest request)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == request.SessionId);

            if (session == null)
            {
                return new
                {
                    success = false,
                    message = "Session not found"
                };
            }

            var fee = CalculateFee(session.EntryTime);

            var payment = new Payment
            {
                SessionId = session.Id,
                Amount = fee,
                Method = request.Method,
                Status = PaymentStatus.SUCCESS
            };

            _context.Payments.Add(payment);

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                paymentId = payment.Id,
                amount = payment.Amount,
                status = payment.Status
            };
        }

        // ==================================================
        // GET: /payments/{id}/status
        // ==================================================

        public async Task<object> GetPaymentStatusAsync(
            Guid paymentId)
        {
            var payment = await _context.Payments
                .FirstOrDefaultAsync(x =>
                    x.Id == paymentId);

            if (payment == null)
            {
                return new
                {
                    success = false,
                    message = "Payment not found"
                };
            }

            return new
            {
                payment.Id,
                payment.Status,
                payment.Amount,
                payment.Method,
                payment.PaymentTime
            };
        }

        // ==================================================
        // PRIVATE
        // ==================================================

        private decimal CalculateFee(DateTime entryTime)
        {
            var totalHours =
                Math.Ceiling(
                    (DateTime.UtcNow - entryTime)
                    .TotalHours);

            return (decimal)totalHours * 10000;
        }
    }
}
