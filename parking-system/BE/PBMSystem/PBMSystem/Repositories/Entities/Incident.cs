using System;

namespace Repositories.Entities;

public class Incident : BaseEntity
{
    public string Type { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string Branch { get; set; } = string.Empty;
    public string Floor { get; set; } = string.Empty;
    public string Urgency { get; set; } = "Bình thường"; // "Bình thường", "Cao", "Khẩn cấp"
    public Guid? UserId { get; set; }
    public User? User { get; set; }

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string Reporter { get; set; } = string.Empty;

    [System.ComponentModel.DataAnnotations.Schema.NotMapped]
    public string Role { get; set; } = string.Empty;
    public string Status { get; set; } = "Chờ xử lý"; // "Chờ xử lý", "Đã xử lý"
}
