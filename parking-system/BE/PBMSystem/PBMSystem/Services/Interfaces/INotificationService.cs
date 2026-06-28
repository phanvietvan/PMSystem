using Repositories.DTOs;

namespace Services.Interfaces;

public interface INotificationService
{
    Task<IEnumerable<object>> GetMyNotificationsAsync(string role);

    Task<ServiceResult<bool>> PushNotificationAsync(PushNotifDto dto);

    Task<ServiceResult<bool>> MarkAllAsReadAsync(string role);
}