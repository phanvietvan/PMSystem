using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Interfaces;

namespace Repositories.Implementations;

/// <summary>
/// Implementation of IAppNotificationRepository.
/// </summary>
public class AppNotificationRepository : Repository<AppNotification>, IAppNotificationRepository
{
    public AppNotificationRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<AppNotification>> GetMyNotificationsAsync(Guid userId)
    {
        return await _dbSet
            .OrderByDescending(x => x.CreatedAt)
            .Take(20)
            .ToListAsync();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var notifications = await _dbSet
            .Where(x => !x.IsRead)
            .ToListAsync();

        foreach (var item in notifications)
        {
            item.IsRead = true;
            item.UpdatedAt = DateTime.UtcNow;
        }
    }
}