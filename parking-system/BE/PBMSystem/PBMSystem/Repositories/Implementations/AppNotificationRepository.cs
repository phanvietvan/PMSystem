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

    public async Task<List<AppNotification>> GetMyNotificationsAsync(Guid userId, string role)
    {
        var roleNorm = (role ?? "user").ToLowerInvariant();
        return await _dbSet
            .Include(x => x.Reads)
            .Where(x => x.UserId == userId 
                || (x.IsBroadcast && (x.Role == "all" || x.Role == roleNorm))
                || (x.UserId == null && !x.IsBroadcast && x.Role == "all"))
            .OrderByDescending(x => x.CreatedAt)
            .Take(30)
            .ToListAsync();
    }

    public async Task MarkAllAsReadAsync(Guid userId, string role)
    {
        var roleNorm = (role ?? "user").ToLowerInvariant();
        var notifications = await _dbSet
            .Include(x => x.Reads)
            .Where(x => x.UserId == userId 
                || (x.IsBroadcast && (x.Role == "all" || x.Role == roleNorm))
                || (x.UserId == null && !x.IsBroadcast && x.Role == "all"))
            .ToListAsync();

        foreach (var item in notifications)
        {
            if (!item.Reads.Any(r => r.UserId == userId))
            {
                item.Reads.Add(new NotificationRead
                {
                    NotificationId = item.Id,
                    UserId = userId,
                    ReadAt = DateTime.UtcNow
                });
                item.UpdatedAt = DateTime.UtcNow;
            }
        }
    }
}
