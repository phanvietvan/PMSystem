using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.DTOs;
using Repositories.Enums;
using Services.Interfaces;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace PBMSystem.API.Controllers
{
    [ApiController]
    [Route("api/gate")]
    public class GateController : ControllerBase
    {
        private readonly IGateService _gateService;

        public GateController(
            IGateService gateService)
        {
            _gateService = gateService;
        }

        [HttpPost("scan")]
        public async Task<IActionResult> Scan(
            [FromBody] GateScanRequest request)
        {
            var result =
                await _gateService.ScanAsync(request);

            return Ok(result);
        }

        [HttpGet("status")]
        public async Task<IActionResult> Status()
        {
            var result =
                await _gateService.GetStatusAsync();

            return Ok(result);
        }
    }
}
