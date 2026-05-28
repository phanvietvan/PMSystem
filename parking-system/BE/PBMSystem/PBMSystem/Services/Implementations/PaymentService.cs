using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;

using Net.payOS;
using Net.payOS.Types;

using Repositories;
using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Enums;

using Services.Interfaces;

namespace Services.Implementations
{
    public class PaymentService : IPaymentService
    {
        private readonly AppDbContext _context;
        private readonly PayOS _payOS;

        public PaymentService(
            AppDbContext context,
            IConfiguration configuration)
        {
            _context = context;

            _payOS = new PayOS(
                configuration["PayOS:ClientId"]!,
                configuration["PayOS:ApiKey"]!,
                configuration["PayOS:ChecksumKey"]!
            );
        }

        public async Task<object> CreateAsync(
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
                    message = "Không tìm thấy phiên gửi xe."
                };
            }

            var fee = CalculateFee(
                session.EntryTime,
                session.ExitTime ?? DateTime.UtcNow);

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                Amount = fee,
                Method = request.Method,
                Status = PaymentStatus.SUCCESS,
                PaymentTime = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                payment
            };
        }

        public async Task<object> CreatePayOSAsync(
            CreatePayOSPaymentRequest request)
        {
            var session = await _context.ParkingSessions
                .FirstOrDefaultAsync(x =>
                    x.Id == request.SessionId);

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

            long orderCode =
                DateTimeOffset.UtcNow
                    .ToUnixTimeMilliseconds();

            var items = new List<ItemData>
            {
                new ItemData(
                    "Parking Fee",
                    1,
                    (int)fee)
            };

            var paymentData = new PaymentData(
                orderCode,
                (int)fee,
                $"Parking {session.LicensePlate}",
                items,
                request.CancelUrl,
                request.ReturnUrl
            );

            var response =
                await _payOS.createPaymentLink(paymentData);

            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                SessionId = session.Id,
                Amount = fee,
                Method = "PAYOS",
                Status = PaymentStatus.PENDING,
                PaymentTime = DateTime.UtcNow,
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);

            await _context.SaveChangesAsync();

            return new
            {
                success = true,
                paymentId = payment.Id,
                checkoutUrl = response.checkoutUrl,
                qrCode = response.qrCode
            };
        }

        public async Task<object> GetStatusAsync(Guid id)
        {
            var payment = await _context.Payments
                .FirstOrDefaultAsync(x =>
                    x.Id == id);

            if (payment == null)
            {
                return new
                {
                    success = false,
                    message = "Không tìm thấy thanh toán."
                };
            }

            return new
            {
                success = true,
                payment.Id,
                payment.Amount,
                payment.Method,
                payment.Status,
                payment.PaymentTime
            };
        }

        private decimal CalculateFee(
            DateTime entryTime,
            DateTime exitTime)
        {
            var elapsed = exitTime - entryTime;

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