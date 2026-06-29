using Microsoft.AspNetCore.Mvc;
using Services.Interfaces;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class RegulationsController : ControllerBase
{
    private readonly IRegulationService _regulationService;

    public RegulationsController(IRegulationService regulationService)
    {
        _regulationService = regulationService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var result = await _regulationService.GetAllAsync();
        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> SaveAll([FromBody] List<string> items)
    {
        var result = await _regulationService.SaveAllAsync(items);

        if (!result.Success)
            return BadRequest(result);

        return Ok(result.Data);
    }
}