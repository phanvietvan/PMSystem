using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;
using System.Security.Claims;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly AppDbContext _context;

    public NotificationsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower() ?? "user";

        // Fetch notifications targeting 'all' or specific role
        var notifications = await _context.AppNotifications
            .Where(n => n.Role == "all" || n.Role == role)
            .OrderByDescending(n => n.CreatedAt)
            .Take(20) // Only get latest 20
            .ToListAsync();

        return Ok(notifications.Select(n => new
        {
            n.Id,
            type = n.Type,
            title = n.Title,
            desc = n.Message,
            time = GetTimeAgo(n.CreatedAt),
            read = n.IsRead
        }));
    }

    [HttpPost("push")]
    [AllowAnonymous] // Cho phép Staff hoặc hệ thống tự push
    public async Task<IActionResult> PushNotification([FromBody] PushNotifDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { Message = "Title and message are required." });

        var notif = new AppNotification
        {
            Id = Guid.NewGuid(),
            Role = dto.Role.ToLower(), // all, user, admin, staff
            Title = dto.Title,
            Message = dto.Message,
            Type = "info", // Default to info, can be expanded
            IsRead = false,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.AppNotifications.Add(notif);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Notification pushed successfully." });
    }

    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower() ?? "user";
        var notifications = await _context.AppNotifications
            .Where(n => !n.IsRead && (n.Role == "all" || n.Role == role))
            .ToListAsync();

        foreach (var n in notifications)
        {
            n.IsRead = true;
            n.UpdatedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { Message = "Marked as read." });
    }

    private string GetTimeAgo(DateTime dt)
    {
        var span = DateTime.UtcNow - dt;
        if (span.TotalMinutes < 1) return "Vừa xong";
        if (span.TotalMinutes < 60) return $"{(int)span.TotalMinutes} phút trước";
        if (span.TotalHours < 24) return $"{(int)span.TotalHours} giờ trước";
        return $"{(int)span.TotalDays} ngày trước";
    }
}

public class PushNotifDto
{
    public string Role { get; set; } = "all";
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
}
