namespace Repositories.Entities;

public class AppNotification : BaseEntity
{
    /// <summary>
    /// Target user for personal notifications. Null = role/broadcast notification.
    /// </summary>
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    /// <summary>
    /// Role audience for broadcasts: all, user, admin, staff.
    /// Personal notifications still store the recipient's role for legacy tooling.
    /// </summary>
    public string Role { get; set; } = "all";

    /// <summary>
    /// True for admin/system broadcasts to a role. False for per-user alerts.
    /// Legacy personal rows (UserId null, IsBroadcast false) are hidden from inboxes.
    /// </summary>
    public bool IsBroadcast { get; set; }

    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = "info"; // info, warning, alert, success

    /// <summary>Legacy global flag — prefer <see cref="ReadByUserIds"/>.</summary>
    public bool IsRead { get; set; }

    /// <summary>User IDs who have marked this notification as read.</summary>
    public List<Guid> ReadByUserIds { get; set; } = new();
}
