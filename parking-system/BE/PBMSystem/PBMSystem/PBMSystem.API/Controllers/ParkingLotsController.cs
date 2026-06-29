using Microsoft.AspNetCore.Mvc;
using Repositories.Entities;
using Repositories.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ParkingLotsController : ControllerBase
{
    private readonly IRepository<ParkingLot> _lotRepo;
    public ParkingLotsController(IRepository<ParkingLot> lotRepo) => _lotRepo = lotRepo;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var lots = await _lotRepo.GetAllAsync();
        return Ok(lots.OrderBy(l => l.CreatedAt));
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] ParkingLot request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
            return BadRequest(new { message = "Tên chi nhánh không được trống." });

        var lot = new ParkingLot
        {
            Name = request.Name.Trim(),
            Latitude = request.Latitude,
            Longitude = request.Longitude,
            Floor = request.Floor,
            Block = request.Block,
            Floors = request.Floors ?? new List<int> { 1, 2, 3 },
            Address = request.Address,
            Capacity = request.Capacity > 0 ? request.Capacity : 50,
            FloorCapacities = request.FloorCapacities ?? new Dictionary<string, int>()
        };

        await _lotRepo.AddAsync(lot);
        await _lotRepo.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = lot.Id }, lot);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ParkingLot request)
    {
        var lot = await _lotRepo.GetByIdAsync(id);
        if (lot == null) return NotFound();

        lot.Name = request.Name?.Trim() ?? lot.Name;
        lot.Latitude = request.Latitude ?? lot.Latitude;
        lot.Longitude = request.Longitude ?? lot.Longitude;
        lot.Floor = request.Floor ?? lot.Floor;
        lot.Block = request.Block ?? lot.Block;
        lot.Floors = request.Floors ?? lot.Floors;
        lot.Address = request.Address ?? lot.Address;
        if (request.Capacity > 0)
        {
            lot.Capacity = request.Capacity;
        }
        if (request.FloorCapacities != null)
        {
            lot.FloorCapacities = request.FloorCapacities;
        }

        _lotRepo.Update(lot);
        await _lotRepo.SaveChangesAsync();
        return Ok(lot);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var lot = await _lotRepo.GetByIdAsync(id);
        if (lot == null) return NotFound();

        lot.IsDeleted = true;
        _lotRepo.Update(lot);
        await _lotRepo.SaveChangesAsync();
        return Ok(new { message = "Đã xóa chi nhánh." });
    }

    [HttpPost("{id:guid}/lock-slot/{slot}")]
    public async Task<IActionResult> LockSlot(Guid id, string slot)
    {
        var lot = await _lotRepo.GetByIdAsync(id);
        if (lot == null) return NotFound();
        
        if (lot.LockedSlots == null) lot.LockedSlots = new List<string>();
        if (!lot.LockedSlots.Contains(slot))
        {
            lot.LockedSlots.Add(slot);
            _lotRepo.Update(lot);
            await _lotRepo.SaveChangesAsync();
        }
        return Ok(lot);
    }

    [HttpPost("{id:guid}/unlock-slot/{slot}")]
    public async Task<IActionResult> UnlockSlot(Guid id, string slot)
    {
        var lot = await _lotRepo.GetByIdAsync(id);
        if (lot == null) return NotFound();
        
        if (lot.LockedSlots != null && lot.LockedSlots.Contains(slot))
        {
            lot.LockedSlots.Remove(slot);
            _lotRepo.Update(lot);
            await _lotRepo.SaveChangesAsync();
        }
        return Ok(lot);
    }
}
