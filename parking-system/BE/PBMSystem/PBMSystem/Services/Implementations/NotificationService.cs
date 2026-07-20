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

    public async Task<IEnumerable<object>> GetMyNotificationsAsync(Guid userId, string role)
    {
        var roleNorm = (role ?? "user").ToLowerInvariant();

        // Personal → only this user.
        // Broadcast → Role all / matching role (IsBroadcast), or legacy Role == "all".
        var notifications = await _notificationRepository.FindAsync(n =>
            n.UserId == userId
            || (n.IsBroadcast && (n.Role == "all" || n.Role == roleNorm))
            || (n.UserId == null && !n.IsBroadcast && n.Role == "all"));

        return notifications
            .OrderByDescending(n => n.CreatedAt)
            .Take(30)
            .Select(n =>
            {
                var isRead = n.ReadByUserIds != null && n.ReadByUserIds.Contains(userId)
                    || (n.UserId == userId && n.IsRead);

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
            IsRead = false,
            ReadByUserIds = new List<Guid>(),
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        await _notificationRepository.AddAsync(notification);
        await _notificationRepository.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    public async Task<ServiceResult<bool>> MarkAllAsReadAsync(Guid userId, string role)
    {
        var roleNorm = (role ?? "user").ToLowerInvariant();

        var notifications = await _notificationRepository.FindAsync(n =>
            n.UserId == userId
            || (n.IsBroadcast && (n.Role == "all" || n.Role == roleNorm))
            || (n.UserId == null && !n.IsBroadcast && n.Role == "all"));

        foreach (var item in notifications)
        {
            item.ReadByUserIds ??= new List<Guid>();
            if (!item.ReadByUserIds.Contains(userId))
                item.ReadByUserIds.Add(userId);

            // Personal inbox: also flip legacy IsRead for this user only
            if (item.UserId == userId)
                item.IsRead = true;

            item.UpdatedAt = DateTime.UtcNow;
            _notificationRepository.Update(item);
        }

        await _notificationRepository.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }

    private static string GetTimeAgo(DateTime dt)
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
