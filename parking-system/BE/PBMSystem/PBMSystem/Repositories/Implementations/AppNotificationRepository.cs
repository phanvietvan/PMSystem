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
            .Where(x => x.UserId == userId || (x.IsBroadcast && x.Role == "all"))
            .OrderByDescending(x => x.CreatedAt)
            .Take(30)
            .ToListAsync();
    }

    public async Task MarkAllAsReadAsync(Guid userId)
    {
        var notifications = await _dbSet
            .Where(x => x.UserId == userId || x.IsBroadcast || (x.UserId == null && x.Role == "all"))
            .ToListAsync();

        foreach (var item in notifications)
        {
            item.ReadByUserIds ??= new List<Guid>();
            if (!item.ReadByUserIds.Contains(userId))
                item.ReadByUserIds.Add(userId);

            if (item.UserId == userId)
                item.IsRead = true;

            item.UpdatedAt = DateTime.UtcNow;
        }
    }
}
