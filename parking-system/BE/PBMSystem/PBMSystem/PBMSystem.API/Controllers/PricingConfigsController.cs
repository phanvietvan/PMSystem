using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PricingConfigsController : ControllerBase
{
    private readonly AppDbContext _db;
    public PricingConfigsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var configs = await _db.PricingConfigs.OrderBy(c => c.CreatedAt).ToListAsync();
        return Ok(configs);
    }

    [HttpPost]
    public async Task<IActionResult> SaveAll([FromBody] List<PricingConfigDto> items)
    {
        // Replace all existing configs with the new set
        var existing = await _db.PricingConfigs.ToListAsync();
        foreach (var e in existing)
        {
            e.IsDeleted = true;
        }
        await _db.SaveChangesAsync();

        foreach (var item in items)
        {
            var config = new PricingConfig
            {
                Type = item.Type,
                Price = item.Price,
                Sub = item.Sub
            };
            await _db.PricingConfigs.AddAsync(config);
        }
        await _db.SaveChangesAsync();

        var updated = await _db.PricingConfigs.OrderBy(c => c.CreatedAt).ToListAsync();
        return Ok(updated);
    }
}

public class PricingConfigDto
{
    public string Type { get; set; } = string.Empty;
    public string Price { get; set; } = "0";
    public string Sub { get; set; } = "VNĐ / Giờ";
}
