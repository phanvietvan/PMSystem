using Repositories.DTOs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Services.Interfaces;
using System.Security.Claims;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class NotificationsController : ControllerBase
{
    private readonly INotificationService _notificationService;

    public NotificationsController(INotificationService notificationService)
    {
        _notificationService = notificationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyNotifications()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower() ?? "user";

        var notifications = await _notificationService.GetMyNotificationsAsync(role);

        return Ok(notifications);
    }

    [HttpPost("push")]
    [AllowAnonymous]
    public async Task<IActionResult> PushNotification([FromBody] PushNotifDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.Title) || string.IsNullOrWhiteSpace(dto.Message))
            return BadRequest(new { Message = "Title and message are required." });

        await _notificationService.PushNotificationAsync(dto);

        return Ok(new { Message = "Notification pushed successfully." });
    }

    [HttpPost("mark-read")]
    public async Task<IActionResult> MarkAllAsRead()
    {
        var role = User.FindFirst(ClaimTypes.Role)?.Value?.ToLower() ?? "user";

        await _notificationService.MarkAllAsReadAsync(role);

        return Ok(new { Message = "Marked as read." });
    }
}