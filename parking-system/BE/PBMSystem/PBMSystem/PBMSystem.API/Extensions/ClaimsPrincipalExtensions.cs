using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace PBMSystem.API.Extensions;

public static class ClaimsPrincipalExtensions
{
    /// <summary>
    /// Extracts the authenticated user's ID from JWT claims.
    /// Throws if the claim is missing (indicates mis-configured auth pipeline).
    /// </summary>
    public static Guid GetUserId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(JwtRegisteredClaimNames.Sub)
                 ?? principal.FindFirstValue(ClaimTypes.NameIdentifier);

        if (Guid.TryParse(value, out var id))
            return id;

        throw new UnauthorizedAccessException("User ID claim is missing or malformed.");
    }
}
