using PBMSystem.API.Extensions;
using Repositories.DTOs;
using Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PBMSystem.API.Controllers;

/// <summary>
/// Password recovery domain — handles all password modifications.
/// Base route: /api/auth/password
/// </summary>
[ApiController]
[Route("api/auth/password")]
[Produces("application/json")]
public class PasswordController : ControllerBase
{
    private readonly IAuthService _authService;

    public PasswordController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Step 1: Send a 6-digit OTP to the registered email to begin password reset.
    /// DEV MODE: the OTP is also returned in the response (otpCode field).
    /// Always returns 200 — never reveals whether the email is registered.
    /// </summary>
    [HttpPost("forgot")]
    [ProducesResponseType(typeof(ApiResponse<OtpSendResponse>), StatusCodes.Status200OK)]
    public async Task<IActionResult> Forgot([FromBody] ForgotPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        // Always 200 regardless of whether the email exists — security by design
        var result = await _authService.SendForgotPasswordOtpAsync(request);
        return Ok(result);
    }

    /// <summary>
    /// Step 2: Verify the OTP and set a new password.
    /// Revokes all active sessions across all devices.
    /// </summary>
    [HttpPost("reset")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Reset([FromBody] ResetPasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.ResetPasswordAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Change password for an already authenticated user.
    /// Requires the current password. Revokes all active sessions.
    /// </summary>
    [HttpPost("change")]
    [Authorize]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status401Unauthorized)]
    public async Task<IActionResult> Change([FromBody] ChangePasswordRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var userId = User.GetUserId();
        var result = await _authService.ChangePasswordAsync(userId, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private string? GetClientIp() =>
        HttpContext.Connection.RemoteIpAddress?.ToString();
}
