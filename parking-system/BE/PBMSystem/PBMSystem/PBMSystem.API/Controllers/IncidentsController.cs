using Microsoft.AspNetCore.Mvc;
using Repositories.Entities;
using Services.Interfaces;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class IncidentsController : ControllerBase
{
    private readonly IIncidentService _incidentService;

    public IncidentsController(IIncidentService incidentService)
    {
        _incidentService = incidentService;
    }

    /// <summary>Get all incidents (non-deleted).</summary>
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _incidentService.GetAllAsync();
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        return Ok(result.Data);
    }

    /// <summary>Create a new incident report.</summary>
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Incident request)
    {
        var result = await _incidentService.CreateAsync(request);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        return Ok(result.Data);
    }

    /// <summary>Resolve an incident by marking its status as resolved.</summary>
    [HttpPut("{id:guid}/resolve")]
    public async Task<IActionResult> Resolve(Guid id)
    {
        var result = await _incidentService.ResolveAsync(id);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        return Ok(result.Data);
    }

    /// <summary>Soft-delete an incident report.</summary>
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var result = await _incidentService.DeleteAsync(id);
        if (!result.Success)
            return StatusCode(result.StatusCode, new { message = result.ErrorMessage });
        return Ok(result.Data);
    }
}