using Repositories.Entities;

namespace Repositories.Interfaces;

/// <summary>
/// Refresh token query methods.
/// </summary>
public interface IRefreshTokenRepository : IRepository<RefreshToken>
{
    Task<RefreshToken?> GetActiveTokenAsync(string token);
    Task<IEnumerable<RefreshToken>> GetActiveTokensByUserAsync(Guid userId);
    Task RevokeAllUserTokensAsync(Guid userId, string reason);
}
