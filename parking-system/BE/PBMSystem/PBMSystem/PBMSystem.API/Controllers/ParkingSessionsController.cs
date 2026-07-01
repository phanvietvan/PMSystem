using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PBMSystem.API.Extensions;
using Repositories.Entities;
using Repositories.DTOs;
using Services.Interfaces;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ParkingSessionsController : ControllerBase
{
    private readonly IParkingSessionService _sessionService;

    public ParkingSessionsController(IParkingSessionService sessionService)
    {
        _sessionService = sessionService;
    }

    /// <summary>
    /// Creates a new parking session.
    /// If a logged-in user is authenticated, the session is bound to their UserId.
    /// Otherwise (e.g. walk-in visitor from gate), UserId is left null.
    /// </summary>
    [HttpPost("checkin")]
    public async Task<IActionResult> CheckIn([FromBody] CheckInRequest request)
    {
        Guid? authenticatedUserId = null;
        try
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                authenticatedUserId = User.GetUserId();
            }
        }
        catch { }

        var result = await _sessionService.CheckInAsync(request, authenticatedUserId);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> CancelSession(Guid id)
    {
        var result = await _sessionService.CancelSessionAsync(id);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(new { message = "Hủy chỗ thành công.", session = result.Data });
    }

    [HttpPost("{id:guid}/change-slot")]
    public async Task<IActionResult> ChangeSlot(Guid id, [FromBody] ChangeSlotRequest request)
    {
        var result = await _sessionService.ChangeSlotAsync(id, request.NewSlot);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(new { message = "Đổi vị trí thành công.", session = result.Data });
    }

    /// <summary>
    /// Returns the currently active parking session for the logged-in user, if any.
    /// </summary>
    [Authorize]
    [HttpGet("my-session")]
    public async Task<IActionResult> GetMySession()
    {
        var userId = User.GetUserId();
        var result = await _sessionService.GetMySessionAsync(userId);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    [Authorize]
    [HttpGet("history")]
    public async Task<IActionResult> GetHistory()
    {
        var userId = User.GetUserId();
        var result = await _sessionService.GetHistoryAsync(userId);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    [HttpGet("verify/{qrCode}")]
    public async Task<IActionResult> Verify(string qrCode)
    {
        var result = await _sessionService.VerifyAsync(qrCode);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    [HttpPost("checkout")]
    public async Task<IActionResult> CheckOut([FromBody] CheckOutRequest request)
    {
        var result = await _sessionService.CheckOutAsync(request);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    /// <summary>
    /// Returns all license plates that currently have an active (not yet checked-out) session.
    /// </summary>
    [HttpGet("active-plates")]
    public async Task<IActionResult> GetActivePlates()
    {
        var result = await _sessionService.GetActivePlatesAsync();
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    /// <summary>
    /// Returns all parking slots that currently have an active session.
    /// </summary>
    [HttpGet("active-slots")]
    public async Task<IActionResult> GetActiveSlots()
    {
        var result = await _sessionService.GetActiveSlotsAsync();
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    /// <summary>
    /// Returns all active sessions whose license plate matches any in the given list.
    /// </summary>
    [HttpPost("active-by-plates")]
    public async Task<IActionResult> GetActiveByPlates([FromBody] List<string> plates)
    {
        var result = await _sessionService.GetActiveByPlatesAsync(plates);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    [HttpGet("slots-status")]
    public async Task<IActionResult> GetSlotsStatus([FromQuery] string parkingLotName)
    {
        var result = await _sessionService.GetSlotsStatusAsync(parkingLotName);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    [HttpPost("gate-scan")]
    public async Task<IActionResult> GateScan([FromBody] GateScanRequest request)
    {
        var result = await _sessionService.GateScanAsync(request);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(new { message = "Xác thực thành công. Cổng chắn đã mở và vị trí đỗ đã bị khóa.", session = result.Data });
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _sessionService.GetAllAsync();
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(result.Data);
    }

    [HttpGet("pricing")]
    public async Task<IActionResult> GetPricing()
    {
        var result = await _sessionService.GetPricingAsync();
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Content(result.Data!, "application/json");
    }

    [HttpPost("pricing")]
    public async Task<IActionResult> SavePricing([FromBody] System.Text.Json.JsonElement pricing)
    {
        var result = await _sessionService.SavePricingAsync(pricing);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });

        return Ok(new { message = "Pricing saved successfully." });
    }
}
