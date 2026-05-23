using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PBMSystem.API.Extensions;
using Services.Interfaces;

// For more information on enabling Web API for empty projects, visit https://go.microsoft.com/fwlink/?LinkID=397860

namespace PBMSystem.API.Controllers
{
    [ApiController]
    [Route("api/sessions")]
    public class SessionsController : ControllerBase
    {
        private readonly ISessionService _sessionService;

        public SessionsController(
            ISessionService sessionService)
        {
            _sessionService = sessionService;
        }
        [Authorize]
        [HttpGet("active")]
        public async Task<IActionResult> GetActive()
        {
            var userId = User.GetUserId();

            var result =
                await _sessionService.GetActiveAsync(userId);

            return Ok(result);
        }
        [HttpPost("{id}/end")]
        public async Task<IActionResult> End(Guid id)
        {
            var result =
                await _sessionService.EndAsync(id);

            return Ok(result);
        }
        [HttpGet("{id}/fee")]
        public async Task<IActionResult> GetFee(Guid id)
        {
            var result =
                await _sessionService.GetFeeAsync(id);

            return Ok(result);
        }
    }
}
