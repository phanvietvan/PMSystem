using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;
using Repositories.Interfaces;
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
                    await ProcessCheckedInExtensionsAsync(stoppingToken);
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
            var sessionRepo = scope.ServiceProvider.GetRequiredService<IParkingSessionRepository>();
            var userRepo = scope.ServiceProvider.GetRequiredService<IUserRepository>();
            var notifRepo = scope.ServiceProvider.GetRequiredService<IRepository<AppNotification>>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            // Hệ thống lấy giờ địa phương VN (UTC+7)
            var localNow = DateTime.UtcNow.AddHours(7);

            // Lấy các phiên đặt chỗ chưa check-in hoặc đang chờ thanh toán
            var pendingSessions = await sessionRepo.FindAsync(ps => 
                (ps.Status == "Active" || ps.Status == "Pending" || ps.Status == "PendingPayment")
                && ps.IsCheckedIn == false
                && ps.ReservationDate != null
                && ps.ReservationStartTime != null);

            foreach (var session in pendingSessions)
            {
                if (session.Status == "PendingPayment")
                {
                    if (DateTime.UtcNow - session.CreatedAt > TimeSpan.FromMinutes(15))
                    {
                        session.Status = "Cancelled";
                        session.UpdatedAt = DateTime.UtcNow;
                        sessionRepo.Update(session);
                        await sessionRepo.SaveChangesAsync();
                        _logger.LogInformation($"Automatically cancelled pending payment session {session.Id} due to payment timeout.");
                    }
                    continue;
                }
                if (!DateTime.TryParse($"{session.ReservationDate} {session.ReservationStartTime}", out var reservationTime))
                {
                    continue; 
                }

                var timeDiff = reservationTime - localNow;

                // 1. Nhắc nhở: Còn <= 15 phút (và lớn hơn 0 phút)
                if (timeDiff.TotalMinutes > 0 && timeDiff.TotalMinutes <= 15 && session.IsReminderSent != true)
                {
                    session.IsReminderSent = true;
                    sessionRepo.Update(session);

                    User? user = null;
                    if (session.UserId.HasValue)
                    {
                        user = await userRepo.GetByIdAsync(session.UserId.Value);
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
                    await notifRepo.AddAsync(notif);

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
                    
                    await sessionRepo.SaveChangesAsync();
                    _logger.LogInformation($"Sent reminder to user for reservation {session.Id}");
                }

                // 2. Hủy tự động: Nếu đã quá 10 phút so với giờ hẹn (timeDiff.TotalMinutes <= -10)
                if (timeDiff.TotalMinutes <= -10)
                {
                    session.Status = "Cancelled";
                    session.UpdatedAt = DateTime.UtcNow;
                    sessionRepo.Update(session);

                    User? user = null;
                    if (session.UserId.HasValue)
                    {
                        user = await userRepo.GetByIdAsync(session.UserId.Value);
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
                    await notifRepo.AddAsync(notif);

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

                    await sessionRepo.SaveChangesAsync();
                    _logger.LogInformation($"Automatically cancelled reservation {session.Id} due to no-show.");
                }
            }
        }

        private async Task ProcessCheckedInExtensionsAsync(CancellationToken stoppingToken)
        {
            using var scope = _serviceProvider.CreateScope();
            var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

            // Hệ thống lấy giờ địa phương VN (UTC+7)
            var localNow = DateTime.UtcNow.AddHours(7);

            // Lấy các phiên đỗ xe đã check-in đang hoạt động cần kiểm tra giờ kết thúc
            var activeCheckedInSessions = await dbContext.ParkingSessions
                .Where(ps => ps.Status == "Active"
                             && ps.IsCheckedIn == true
                             && ps.ReservationDate != null
                             && ps.ReservationEndTime != null)
                .ToListAsync(stoppingToken);

            foreach (var session in activeCheckedInSessions)
            {
                var endTimeStr = $"{session.ReservationDate} {session.ReservationEndTime}";
                if (!DateTime.TryParse(endTimeStr, out var currentEndTime))
                {
                    continue;
                }

                // Nếu đã quá giờ kết thúc đỗ xe (localNow >= currentEndTime)
                if (localNow >= currentEndTime)
                {
                    var originalEndTimeStr = session.ReservationEndTime;
                    var newEndTime = currentEndTime.AddHours(1);

                    // Cập nhật giờ kết thúc mới và ngày kết thúc mới (phòng trường hợp qua ngày mới)
                    session.ReservationDate = newEndTime.ToString("yyyy-MM-dd");
                    session.ReservationEndTime = newEndTime.ToString("HH:mm");
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

                    // Gửi thông báo trong app
                    var notif = new AppNotification
                    {
                        Id = Guid.NewGuid(),
                        Role = roleStr,
                        Title = "Thời gian đỗ xe được gia hạn",
                        Message = $"Phiên đỗ xe của bạn tại {session.ParkingLotName} (Vị trí {session.ParkingSlot}) đã được tự động gia hạn thêm 1 tiếng đến {session.ReservationEndTime} do quá giờ đăng ký.",
                        Type = "info",
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow
                    };
                    dbContext.AppNotifications.Add(notif);

                    if (user != null && !string.IsNullOrWhiteSpace(user.Email))
                    {
                        _ = emailService.SendReservationExtensionEmailAsync(
                            user.Email,
                            userName,
                            session.ParkingLotName ?? "Bãi xe",
                            session.ParkingSlot ?? "Tự động phân bổ",
                            session.LicensePlate,
                            originalEndTimeStr,
                            session.ReservationEndTime
                        );
                    }

                    await dbContext.SaveChangesAsync(stoppingToken);
                    _logger.LogInformation($"Automatically extended session {session.Id} by 1 hour (New end time: {session.ReservationEndTime}).");
                }
            }
        }
    }
}
