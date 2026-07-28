using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Helpers;
using Repositories.Interfaces;
using Services.Interfaces;

namespace Services.Implementations;

public class NotificationService : INotificationService
{
    private readonly IAppNotificationRepository _notificationRepository;

    public NotificationService(IAppNotificationRepository notificationRepository)
    {
        _notificationRepository = notificationRepository;
    }

    public async Task<IEnumerable<object>> GetMyNotificationsAsync(Guid userId, string role)
    {
        var notifications = await _notificationRepository.GetMyNotificationsAsync(userId, role);

        return notifications
            .Select(n =>
            {
                var isRead = n.Reads.Any(r => r.UserId == userId);

                return new
                {
                    id = n.Id,
                    type = n.Type,
                    title = n.Title,
                    message = n.Message,
                    desc = n.Message,
                    time = GetTimeAgo(n.CreatedAt),
                    createdAt = n.CreatedAt,
                    read = isRead
                };
            });
    }

    public async Task<ServiceResult<bool>> PushNotificationAsync(PushNotifDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) ||
            string.IsNullOrWhiteSpace(dto.Message))
        {
            return ServiceResult<bool>.BadRequest("Title and message are required.");
        }

        var notification = new AppNotification
        {
            Id = Guid.NewGuid(),
            UserId = null,
            IsBroadcast = true,
            Role = (dto.Role ?? "all").ToLowerInvariant(),
            Title = dto.Title.Trim(),
            Message = dto.Message.Trim(),
            Type = "info",
            CreatedAt = VietnamTime.Now,
            UpdatedAt = VietnamTime.Now
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> MarkAllAsReadAsync(Guid userId, string role)
    {
        await _notificationRepository.MarkAllAsReadAsync(userId, role);
        await _notificationRepository.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    private static string GetTimeAgo(DateTime dt)
    {
        var span = VietnamTime.Now - dt;

        if (span.TotalMinutes < 1)
            return "Vừa xong";

        if (span.TotalMinutes < 60)
            return $"{(int)span.TotalMinutes} phút trước";

        if (span.TotalHours < 24)
            return $"{(int)span.TotalHours} giờ trước";

        return $"{(int)span.TotalDays} ngày trước";
    }
}
