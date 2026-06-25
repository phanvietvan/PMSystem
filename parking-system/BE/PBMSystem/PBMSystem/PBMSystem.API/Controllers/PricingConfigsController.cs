using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.DTOs;
using Repositories.Entities;
using Services.Interfaces;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PricingConfigsController : ControllerBase
{
    private readonly IPricingConfigService _pricingConfigService;

    public PricingConfigsController(
        IPricingConfigService pricingConfigService)
    {
        _pricingConfigService = pricingConfigService;
    }

    [HttpGet]
    [ProducesResponseType(
        typeof(ApiResponse<IEnumerable<PricingConfig>>),
        StatusCodes.Status200OK)]
    public async Task<IActionResult> GetAll()
    {
        var result =
            await _pricingConfigService.GetAllAsync();

        return Ok(result);
    }

    [HttpPost]
    [ProducesResponseType(
        typeof(ApiResponse<IEnumerable<PricingConfig>>),
        StatusCodes.Status200OK)]
    public async Task<IActionResult> SaveAll(
        [FromBody] List<PricingConfigDto> items)
    {
        var result =
            await _pricingConfigService.SaveAllAsync(items);

        return result.Success
            ? Ok(result)
            : BadRequest(result);
    }
}

