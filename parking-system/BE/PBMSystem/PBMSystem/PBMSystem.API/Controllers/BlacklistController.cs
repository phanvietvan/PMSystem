using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin, Staff")] // Allow staff to view too
public class BlacklistController : ControllerBase
{
    private readonly AppDbContext _context;

    public BlacklistController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAll()
    {
        var list = await _context.BlacklistEntries
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync();

        return Ok(list.Select(x => new
        {
            x.Id,
            x.PlateNumber,
            x.Reason,
            Date = x.CreatedAt.ToString("yyyy-MM-dd"),
            x.AddedBy
        }));
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Add([FromBody] AddBlacklistDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PlateNumber) || string.IsNullOrWhiteSpace(dto.Reason))
            return BadRequest(new { Message = "Plate number and reason are required." });

        var adminName = User.Identity?.Name ?? "Admin";

        var entry = new BlacklistEntry
        {
            Id = Guid.NewGuid(),
            PlateNumber = dto.PlateNumber.Trim().ToUpper(),
            Reason = dto.Reason,
            AddedBy = adminName,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        _context.BlacklistEntries.Add(entry);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            entry.Id,
            entry.PlateNumber,
            entry.Reason,
            Date = entry.CreatedAt.ToString("yyyy-MM-dd"),
            entry.AddedBy
        });
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var entry = await _context.BlacklistEntries.FindAsync(id);
        if (entry == null) return NotFound(new { Message = "Entry not found." });

        _context.BlacklistEntries.Remove(entry);
        await _context.SaveChangesAsync();

        return Ok(new { Message = "Removed successfully." });
    }
}

public class AddBlacklistDto
{
    public string PlateNumber { get; set; } = string.Empty;
    public string Reason { get; set; } = string.Empty;
}
