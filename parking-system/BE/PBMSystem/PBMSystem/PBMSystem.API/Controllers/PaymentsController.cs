using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Repositories.DTOs;
using Services.Interfaces;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Produces("application/json")]
public class PaymentsController : ControllerBase
{
    private readonly IPaymentService _paymentService;

    public PaymentsController(IPaymentService paymentService)
    {
        _paymentService = paymentService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAllPayments()
    {
        var result = await _paymentService.GetAllPaymentsAsync();
        return result.Success ? Ok(result.Data) : BadRequest(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetPayment(Guid id)
    {
        var result = await _paymentService.GetPaymentByIdAsync(id);
        return result.Success ? Ok(result.Data) : NotFound(new { message = result.Message });
    }

    [HttpPost("vnpay/create-payment-url")]
    public async Task<IActionResult> CreateVnPayPaymentUrl([FromBody] VnPayCreatePaymentRequest request)
    {
        var clientIp = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "127.0.0.1";
        if (clientIp == "::1") clientIp = "127.0.0.1";

        var result = await _paymentService.CreateVnPayPaymentUrlAsync(request, clientIp);
        if (!result.Success)
        {
            return BadRequest(new { message = result.Message });
        }

        dynamic? data = result.Data;
        return Ok(new
        {
            paymentUrl = data?.paymentUrl,
            txnRef = data?.txnRef,
            message = result.Message
        });
    }

    [HttpGet("vnpay/verify")]
    public async Task<IActionResult> VerifyVnPayPayment()
    {
        var requestParams = Request.Query
            .Select(q => new KeyValuePair<string, string>(q.Key, q.Value.ToString()))
            .ToList();

        var result = await _paymentService.VerifyVnPayPaymentAsync(requestParams);
        if (!result.Success)
        {
            return BadRequest(new
            {
                success = false,
                message = result.Message
            });
        }

        var data = result.Data;
        return Ok(new
        {
            success = data?.IsPaid ?? false,
            isPaid = data?.IsPaid ?? false,
            vnpResponseCode = data?.ResponseCode,
            vnpTransactionNo = data?.TransactionNo,
            amount = data?.Amount ?? 0m,
            txnRef = data?.TxnRef,
            message = data?.Message
        });
    }
}
