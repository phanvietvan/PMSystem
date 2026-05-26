using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Repositories.Entities;

public class BlacklistEntry : BaseEntity
{
    public string PlateNumber { get; set; } = null!;
    public string Reason { get; set; } = null!;
    public string? AddedBy { get; set; } // UserName of Admin who added
}
