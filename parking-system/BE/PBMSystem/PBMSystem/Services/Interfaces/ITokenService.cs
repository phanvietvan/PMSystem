using Repositories.Entities;
using System.Security.Claims;

namespace Services.Interfaces;

/// <summary>
/// Handles JWT access token and refresh token generation/validation.
/// Decoupled to allow swapping token strategies independently.
/// </summary>
public interface ITokenService
{
    string GenerateAccessToken(User user);
    string GenerateRefreshToken();
    ClaimsPrincipal? GetPrincipalFromExpiredToken(string token);
    DateTime GetAccessTokenExpiry();
}
