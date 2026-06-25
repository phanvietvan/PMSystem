using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;
using Services.Interfaces;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ParkingLotsController : ControllerBase
{
    private readonly IParkingLotService _service;

    public ParkingLotsController(IParkingLotService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
        => Ok(await _service.GetAllAsync());

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ParkingLot request)
        => Ok(await _service.CreateAsync(request));

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ParkingLot request)
        => Ok(await _service.UpdateAsync(id, request));

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
        => Ok(await _service.DeleteAsync(id));

    [HttpPost("{id:guid}/lock-slot/{slot}")]
    public async Task<IActionResult> LockSlot(Guid id, string slot)
        => Ok(await _service.LockSlotAsync(id, slot));

    [HttpPost("{id:guid}/unlock-slot/{slot}")]
    public async Task<IActionResult> UnlockSlot(Guid id, string slot)
        => Ok(await _service.UnlockSlotAsync(id, slot));
}
