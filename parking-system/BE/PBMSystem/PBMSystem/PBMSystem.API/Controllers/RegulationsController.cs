using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RegulationsController : ControllerBase
{
    private readonly AppDbContext _db;
    public RegulationsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var regs = await _db.Regulations
            .Where(r => r.IsActive)
            .OrderBy(r => r.OrderIndex)
            .ToListAsync();
        return Ok(regs);
    }

    [HttpPost]
    public async Task<IActionResult> SaveAll([FromBody] List<string> items)
    {
        // Soft-delete all existing regulations
        var existing = await _db.Regulations.ToListAsync();
        foreach (var e in existing)
        {
            e.IsDeleted = true;
        }
        await _db.SaveChangesAsync();

        // Insert new regulations
        for (int i = 0; i < items.Count; i++)
        {
            var reg = new Regulation
            {
                Content = items[i],
                OrderIndex = i,
                IsActive = true
            };
            await _db.Regulations.AddAsync(reg);
        }
        await _db.SaveChangesAsync();

        var updated = await _db.Regulations
            .Where(r => r.IsActive)
            .OrderBy(r => r.OrderIndex)
            .ToListAsync();
        return Ok(updated);
    }
}
