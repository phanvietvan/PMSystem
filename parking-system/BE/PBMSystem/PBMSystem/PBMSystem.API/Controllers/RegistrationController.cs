using Repositories.DTOs;
using Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace PBMSystem.API.Controllers;

/// <summary>
/// Onboarding domain — handles the full flow of getting a new user into the system.
/// Base route: /api/auth/register
/// </summary>
[ApiController]
[Route("api/auth/register")]
[Produces("application/json")]
public class RegistrationController : ControllerBase
{
    private readonly IAuthService _authService;

    public RegistrationController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>
    /// Check if the email is already registered.
    /// </summary>
    [HttpGet("check-email")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> CheckEmail([FromQuery] string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return BadRequest(ApiResponse<bool>.Fail("Email không được để trống."));

        var result = await _authService.CheckEmailRegisteredAsync(email);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Step 1: Send a 6-digit OTP to the provided email to begin registration.
    /// DEV MODE: the OTP is also returned in the response (otpCode field) so
    /// FE-BE testing works without checking an inbox.
    /// </summary>
    [HttpPost("send-otp")]
    [ProducesResponseType(typeof(ApiResponse<OtpSendResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<OtpSendResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> SendOtp([FromBody] SendRegisterOtpRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.SendRegisterOtpAsync(request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>
    /// Step 2: Verify the OTP and complete registration.
    /// Returns a token pair on success — user is logged in immediately.
    /// </summary>
    [HttpPost("verify")]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<AuthResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Verify([FromBody] VerifyRegisterOtpRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _authService.VerifyRegisterOtpAsync(request, GetClientIp());
        return result.Success ? Ok(result) : BadRequest(result);
    }

    // ── Private ───────────────────────────────────────────────────────────────

    private string? GetClientIp() =>
        HttpContext.Connection.RemoteIpAddress?.ToString();
}
