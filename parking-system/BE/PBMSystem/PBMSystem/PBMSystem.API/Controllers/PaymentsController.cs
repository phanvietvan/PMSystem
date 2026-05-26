using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using Repositories;
using Repositories.Entities;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PaymentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public PaymentsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPayments()
    {
        var payments = await _context.Payments
            .OrderByDescending(p => p.TransactionTime)
            .ToListAsync();
        return Ok(payments);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPayment(Guid id)
    {
        var payment = await _context.Payments.FindAsync(id);
        if (payment == null) return NotFound();
        return Ok(payment);
    }
}
