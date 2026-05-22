using PBMSystem.API.Extensions;
using Repositories.DTOs;
using Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin,Staff")]
[Produces("application/json")]
public class UsersController : ControllerBase
{
    private readonly IAuthService _authService;

    public UsersController(IAuthService authService)
    {
        _authService = authService;
    }

    /// <summary>List all users (Admin, Staff). Excludes pending verification rows.</summary>
    [HttpGet]
    [ProducesResponseType(typeof(ApiResponse<IEnumerable<UserResponse>>), StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result = await _authService.GetAllUsersAsync();
        return Ok(result);
    }

    /// <summary>Update a user (Admin, Staff). Staff cannot assign Admin role.</summary>
    [HttpPut("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<UserResponse>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<UserResponse>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Update(Guid id, [FromBody] AdminUpdateUserRequest request)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var actorId = User.GetUserId();
        var actorRole = User.GetUserRole();
        var result = await _authService.UpdateUserAsAdminAsync(actorId, actorRole, id, request);
        return result.Success ? Ok(result) : BadRequest(result);
    }

    /// <summary>Delete a user (Admin, Staff). Soft-delete.</summary>
    [HttpDelete("{id:guid}")]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status200OK)]
    [ProducesResponseType(typeof(ApiResponse<bool>), StatusCodes.Status400BadRequest)]
    public async Task<IActionResult> Delete(Guid id)
    {
        var actorId = User.GetUserId();
        var actorRole = User.GetUserRole();
        var result = await _authService.DeleteUserAsync(actorId, actorRole, id);
        return result.Success ? Ok(result) : BadRequest(result);
    }
}
