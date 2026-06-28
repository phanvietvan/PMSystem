using Repositories.Entities;

namespace Repositories.Interfaces;

/// <summary>
/// Specialized repository interface for AppNotification database queries.
/// </summary>
public interface IAppNotificationRepository : IRepository<AppNotification>
{
    Task<List<AppNotification>> GetMyNotificationsAsync(Guid userId);

    Task MarkAllAsReadAsync(Guid userId);
}