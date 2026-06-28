using Repositories.DTOs;
using Repositories.Entities;
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

    public async Task<IEnumerable<object>> GetMyNotificationsAsync(string role)
    {
        var notifications = await _notificationRepository.FindAsync(n =>
            n.Role == "all" || n.Role == role);

        return notifications
            .OrderByDescending(n => n.CreatedAt)
            .Take(20)
            .Select(n => new
            {
                n.Id,
                type = n.Type,
                title = n.Title,
                desc = n.Message,
                time = GetTimeAgo(n.CreatedAt),
                read = n.IsRead
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
            Role = dto.Role.ToLower(),
            Title = dto.Title,
            Message = dto.Message,
            Type = "info",
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> MarkAllAsReadAsync(string role)
    {
        var notifications = await _notificationRepository.FindAsync(n =>
            !n.IsRead &&
            (n.Role == "all" || n.Role == role));

        foreach (var item in notifications)
        {
            item.IsRead = true;
            item.UpdatedAt = DateTime.UtcNow;

            _notificationRepository.Update(item);
        }

        await _notificationRepository.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    private string GetTimeAgo(DateTime dt)
    {
        var span = DateTime.UtcNow - dt;

        if (span.TotalMinutes < 1)
            return "Vừa xong";

        if (span.TotalMinutes < 60)
            return $"{(int)span.TotalMinutes} phút trước";

        if (span.TotalHours < 24)
            return $"{(int)span.TotalHours} giờ trước";

        return $"{(int)span.TotalDays} ngày trước";
    }
}