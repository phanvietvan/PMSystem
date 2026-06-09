namespace Repositories.Configuration;

/// <summary>
/// Strongly-typed binding for the "JwtSettings" section in appsettings.json.
/// Injected via IOptions&lt;JwtSettings&gt; in TokenService and AuthService.
/// </summary>
public class JwtSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string Issuer { get; set; } = string.Empty;
    public string Audience { get; set; } = string.Empty;
    public int AccessTokenExpiryMinutes { get; set; } = 15;
    public int RefreshTokenExpiryDays { get; set; } = 7;
}
