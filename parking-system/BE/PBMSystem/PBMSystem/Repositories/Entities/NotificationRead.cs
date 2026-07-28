using System;
using Repositories.Helpers;

namespace Repositories.Entities;

public class NotificationRead : BaseEntity
{
    public Guid NotificationId { get; set; }
    public AppNotification Notification { get; set; } = null!;

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    public DateTime ReadAt { get; set; } = VietnamTime.Now;
}
