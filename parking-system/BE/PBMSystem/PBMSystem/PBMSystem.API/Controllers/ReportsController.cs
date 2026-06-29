using Microsoft.AspNetCore.Mvc;
using Services.Interfaces;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ReportsController : ControllerBase
{
    private readonly IReportService _reportService;

    public ReportsController(IReportService reportService)
    {
        _reportService = reportService;
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboardReports()
    {
        var result = await _reportService.GetDashboardReportsAsync();
        return Ok(result);
    }
}