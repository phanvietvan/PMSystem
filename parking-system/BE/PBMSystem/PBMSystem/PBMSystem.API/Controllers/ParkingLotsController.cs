using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Repositories;
using Repositories.Entities;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class ParkingLotsController : ControllerBase
{
    private readonly AppDbContext _db;
    public ParkingLotsController(AppDbContext db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var lots = await _db.ParkingLots.OrderBy(l => l.CreatedAt).ToListAsync();
        return Ok(lots);
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

        await _db.ParkingLots.AddAsync(lot);
        await _db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), new { id = lot.Id }, lot);
    }

    [HttpPut("{id:guid}")]
    public async Task<IActionResult> Update(Guid id, [FromBody] ParkingLot request)
    {
        var lot = await _db.ParkingLots.FindAsync(id);
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

        _db.ParkingLots.Update(lot);
        await _db.SaveChangesAsync();
        return Ok(lot);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var lot = await _db.ParkingLots.FindAsync(id);
        if (lot == null) return NotFound();

        lot.IsDeleted = true;
        _db.ParkingLots.Update(lot);
        await _db.SaveChangesAsync();
        return Ok(new { message = "Đã xóa chi nhánh." });
    }

    [HttpPost("{id:guid}/lock-slot/{slot}")]
    public async Task<IActionResult> LockSlot(Guid id, string slot)
    {
        var lot = await _db.ParkingLots.FindAsync(id);
        if (lot == null) return NotFound();
        
        if (lot.LockedSlots == null) lot.LockedSlots = new List<string>();
        if (!lot.LockedSlots.Contains(slot))
        {
            lot.LockedSlots.Add(slot);
            _db.ParkingLots.Update(lot);
            await _db.SaveChangesAsync();
        }
        return Ok(lot);
    }

    [HttpPost("{id:guid}/unlock-slot/{slot}")]
    public async Task<IActionResult> UnlockSlot(Guid id, string slot)
    {
        var lot = await _db.ParkingLots.FindAsync(id);
        if (lot == null) return NotFound();
        
        if (lot.LockedSlots != null && lot.LockedSlots.Contains(slot))
        {
            lot.LockedSlots.Remove(slot);
            _db.ParkingLots.Update(lot);
            await _db.SaveChangesAsync();
        }
        return Ok(lot);
    }
}
