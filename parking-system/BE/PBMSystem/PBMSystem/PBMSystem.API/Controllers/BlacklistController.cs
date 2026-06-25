using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Repositories.DTOs;
using Services.Interfaces;
using System;
using System.Threading.Tasks;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin, Staff")] // Allow staff to view too
public class BlacklistController : ControllerBase
{
    private readonly IBlacklistService _blacklistService;

    public BlacklistController(IBlacklistService blacklistService)
    {
        _blacklistService = blacklistService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var result = await _blacklistService.GetAllAsync();
        return result.Success ? Ok(result.Data) : BadRequest(result);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Add([FromBody] AddBlacklistDto dto)
    {
        var adminName = User.Identity?.Name ?? "Admin";
        var result = await _blacklistService.AddAsync(dto, adminName);
        return result.Success ? Ok(result.Data) : BadRequest(result);
    }

    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _blacklistService.DeleteAsync(id);
        return result.Success 
            ? Ok(new { Message = result.Message }) 
            : NotFound(new { Message = result.Message });
    }
}
