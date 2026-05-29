using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Repositories;
using Repositories.Entities;
using Services.Interfaces;

namespace PBMSystem.API.BackgroundServices
{
    public class ReservationJobService : BackgroundService
    {
        private readonly IServiceProvider _serviceProvider;
        private readonly ILogger<ReservationJobService> _logger;

        public ReservationJobService(IServiceProvider serviceProvider, ILogger<ReservationJobService> logger)
        {
            _serviceProvider = serviceProvider;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Reservation Job Service is starting.");

            while (!stoppingToken.IsCancellationRequested)
            {
                try
                {
                    await ProcessReservationsAsync(stoppingToken);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error occurred executing Reservation Job.");
                }

                // Chờ 1 phút để kiểm tra lại
                await Task.Delay(TimeSpan.FromMinutes(1), stoppingToken);
            }

            _logger.LogInformation("Reservation Job Service is stopping.");
        }

        private async Task ProcessReservationsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            // Hệ thống lấy giờ địa phương VN (UTC+7)
            var localNow = DateTime.UtcNow.AddHours(7);

            // Lấy các phiên đặt chỗ chưa check-in
            var pendingSessions = await dbContext.ParkingSessions
                .Where(ps => (ps.Status == "Active" || ps.Status == "Pending")
                             && ps.IsCheckedIn == false
                             && ps.ReservationDate != null
                             && ps.ReservationStartTime != null)
                .ToListAsync(stoppingToken);

            foreach (var session in pendingSessions)
            {
                if (!DateTime.TryParse($"{session.ReservationDate} {session.ReservationStartTime}", out var reservationTime))
                {
                    continue; 
                }

                var timeDiff = reservationTime - localNow;

                // 1. Nhắc nhở: Còn <= 15 phút (và lớn hơn 0 phút)
                if (timeDiff.TotalMinutes > 0 && timeDiff.TotalMinutes <= 15 && session.IsReminderSent != true)
                {
                    session.IsReminderSent = true;
                    dbContext.Update(session);

                    User? user = null;
                    if (session.UserId.HasValue)
                    {
                        user = await dbContext.Users.FindAsync(session.UserId.Value);
                    }

                    var userName = user != null && (!string.IsNullOrWhiteSpace(user.FirstName) || !string.IsNullOrWhiteSpace(user.LastName))
                        ? $"{user.FirstName} {user.LastName}".Trim()
                        : (user?.Username ?? "Khách hàng");

                    var roleStr = user != null ? user.Role.ToString().ToLower() : "user";

                    // Gửi thông báo trong app (chọn user hoặc all để user đó có thể thấy)
                    var notif = new AppNotification
                    {
                        Id = Guid.NewGuid(),
                        Role = roleStr,
                        Title = "Sắp đến giờ đặt chỗ",
                        Message = $"Bạn còn khoảng {Math.Ceiling(timeDiff.TotalMinutes)} phút nữa đến giờ hẹn gửi xe tại {session.ParkingLotName} (Vị trí {session.ParkingSlot}). Vui lòng đến đúng giờ.",
                        Type = "info",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    dbContext.AppNotifications.Add(notif);

                    if (user != null && !string.IsNullOrWhiteSpace(user.Email))
                    {
                        _ = emailService.SendReservationReminderEmailAsync(
                            user.Email,
                            userName,
                            session.ParkingLotName ?? "Bãi xe",
                            session.ParkingSlot ?? "Tự động phân bổ",
                            session.LicensePlate
                        );
                    }
                    
                    await dbContext.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation($"Sent reminder to user for reservation {session.Id}");
                }

                // 2. Hủy tự động: Nếu đã quá 10 phút so với giờ hẹn (timeDiff.TotalMinutes <= -10)
                if (timeDiff.TotalMinutes <= -10)
                {
                    session.Status = "Cancelled";
                    session.UpdatedAt = DateTime.UtcNow;
                    dbContext.Update(session);

                    User? user = null;
                    if (session.UserId.HasValue)
                    {
                        user = await dbContext.Users.FindAsync(session.UserId.Value);
                    }

                    var userName = user != null && (!string.IsNullOrWhiteSpace(user.FirstName) || !string.IsNullOrWhiteSpace(user.LastName))
                        ? $"{user.FirstName} {user.LastName}".Trim()
                        : (user?.Username ?? "Khách hàng");

                    var roleStr = user != null ? user.Role.ToString().ToLower() : "user";

                    // Gửi thông báo
                    var notif = new AppNotification
                    {
                        Id = Guid.NewGuid(),
                        Role = roleStr,
                        Title = "Hủy chỗ đặt xe tự động",
                        Message = $"Lượt đặt chỗ của bạn tại {session.ParkingLotName} đã bị hủy do bạn đến trễ quá 10 phút. Nếu có nhu cầu, bạn vui lòng đặt lại chỗ khác nhé.",
                        Type = "alert",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    dbContext.AppNotifications.Add(notif);

                    if (user != null && !string.IsNullOrWhiteSpace(user.Email))
                    {
                        _ = emailService.SendReservationCancellationEmailAsync(
                            user.Email,
                            userName,
                            session.ParkingLotName ?? "Bãi xe",
                            session.ParkingSlot ?? "Tự động phân bổ",
                            session.LicensePlate
                        );
                    }

                    await dbContext.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation($"Automatically cancelled reservation {session.Id} due to no-show.");
                }
            }
        }
    }
}
