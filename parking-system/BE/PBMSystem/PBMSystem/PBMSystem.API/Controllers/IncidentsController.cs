using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class IncidentsController : ControllerBase
{
    private readonly AppDbContext _db;

    public IncidentsController(AppDbContext db)
    {
        _db = db;
    }

    /// <summary>Get all incidents (non-deleted).</summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Incident>>> GetAll()
    {
        var incidents = await _db.Incidents
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
        return Ok(incidents);
    }

    /// <summary>Create a new incident report.</summary>
    [HttpPost]
    public async Task<ActionResult<Incident>> Create([FromBody] Incident request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) || string.IsNullOrWhiteSpace(request.Description))
        {
            return BadRequest(new { success = false, message = "Vui lòng nhập đầy đủ tiêu đề và mô tả sự cố." });
        }

        var incident = new Incident
        {
            Type = request.Type,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Branch = request.Branch,
            Floor = request.Floor,
            Urgency = request.Urgency,
            Reporter = request.Reporter,
            Role = request.Role,
            Status = "Chờ xử lý"
        };

        await _db.Incidents.AddAsync(incident);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetAll), new { id = incident.Id }, incident);
    }

    /// <summary>Resolve an incident by marking its status as resolved.</summary>
    [HttpPut("{id:guid}/resolve")]
    public async Task<IActionResult> Resolve(Guid id)
    {
        var incident = await _db.Incidents.FindAsync(id);
        if (incident == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy báo cáo sự cố." });
        }

        incident.Status = "Đã xử lý";
        _db.Incidents.Update(incident);
        await _db.SaveChangesAsync();

        return Ok(new { success = true, message = "Đã đánh dấu sự cố là Đã giải quyết!", data = incident });
    }

    /// <summary>Soft-delete an incident report.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var incident = await _db.Incidents.FindAsync(id);
        if (incident == null)
        {
            return NotFound(new { success = false, message = "Không tìm thấy báo cáo sự cố." });
        }

        incident.IsDeleted = true;
        _db.Incidents.Update(incident);
        await _db.SaveChangesAsync();

        return Ok(new { success = true, message = "Đã xóa báo cáo sự cố thành công!" });
    }
}
