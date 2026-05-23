using Microsoft.AspNetCore.Mvc;
using Repositories.DTOs;
using Services.Interfaces;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace PBMSystem.API.Controllers
{
    [ApiController]
    [Route("api/payments")]
    public class PaymentsController : ControllerBase
    {
        private readonly IPaymentService _paymentService;

        public PaymentsController(
            IPaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost]
        public async Task<IActionResult> Create(
            [FromBody] CreatePaymentRequest request)
        {
            var result =
                await _paymentService.CreateAsync(request);

            return Ok(result);
        }

        [HttpGet("{id}/status")]
        public async Task<IActionResult> Status(Guid id)
        {
            var result =
                await _paymentService.GetStatusAsync(id);

            return Ok(result);
        }
    }
}
