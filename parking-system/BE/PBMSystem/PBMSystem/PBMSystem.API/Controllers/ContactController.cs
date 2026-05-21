using Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace PBMSystem.API.Controllers;

[ApiController]
[Route("api/contact")]
[Produces("application/json")]
public class ContactController : ControllerBase
{
    private readonly IEmailService _emailService;

    public ContactController(IEmailService emailService)
    {
        _emailService = emailService;
    }

    [HttpPost]
    public async Task<IActionResult> SubmitContact([FromBody] ContactSubmissionRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name) || 
            string.IsNullOrWhiteSpace(request.Email) || 
            string.IsNullOrWhiteSpace(request.Message))
        {
            return BadRequest(new { success = false, message = "Vui lòng điền đầy đủ thông tin bắt buộc." });
        }

        try
        {
            await _emailService.SendContactEmailAsync(
                request.Name,
                request.Email,
                request.Phone,
                request.Subject,
                request.Message
            );
            return Ok(new { success = true, message = "Gửi liên hệ thành công!" });
        }
        catch (System.Exception ex)
        {
            return StatusCode(500, new { success = false, message = "Lỗi hệ thống khi gửi email.", error = ex.Message });
        }
    }
}

public class ContactSubmissionRequest
{
    public string Name { get; set; } = null!;
    public string Email { get; set; } = null!;
    public string? Phone { get; set; }
    public string Subject { get; set; } = null!;
    public string Message { get; set; } = null!;
}
