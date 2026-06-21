using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Repositories.Entities;

public class AppNotification : BaseEntity
{
    public string Role { get; set; } = "all"; // all, user, admin, staff
    public string Title { get; set; } = null!;
    public string Message { get; set; } = null!;
    public string Type { get; set; } = "info"; // info, warning, alert, success
    public bool IsRead { get; set; } = false; // Note: for simplicity. Ideally a list of ReadBy UserIds
}
 