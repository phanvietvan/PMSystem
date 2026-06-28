namespace Repositories.DTOs;

public class PushNotifDto
{
    public string Role { get; set; } = "all";

    public string Title { get; set; } = string.Empty;

    public string Message { get; set; } = string.Empty;
}