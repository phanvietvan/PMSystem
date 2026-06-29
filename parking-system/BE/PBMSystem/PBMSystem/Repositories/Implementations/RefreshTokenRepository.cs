using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Interfaces;

namespace Repositories.Implementations;

public class RefreshTokenRepository : Repository<RefreshToken>, IRefreshTokenRepository
{
    public RefreshTokenRepository(AppDbContext context) : base(context) { }

    public async Task<RefreshToken?> GetActiveTokenAsync(string token)
    {
        var rt = await _dbSet.FirstOrDefaultAsync(t => t.Token == token && !t.IsRevoked);
        if (rt != null)
        {
            var user = await _context.Users.FindAsync(rt.UserId);
            if (user != null)
            {
                rt.User = user;
            }
        }
        return rt;
    }

    public async Task<IEnumerable<RefreshToken>> GetActiveTokensByUserAsync(Guid userId) =>
        await _dbSet
            .Where(rt => rt.UserId == userId && !rt.IsRevoked && rt.ExpiresAt > DateTime.UtcNow)
            .ToListAsync();

    public async Task RevokeAllUserTokensAsync(Guid userId, string reason)
    {
        var tokens = await _dbSet
            .Where(rt => rt.UserId == userId && !rt.IsRevoked)
            .ToListAsync();

        foreach (var token in tokens)
        {
            token.IsRevoked = true;
            token.RevokedAt = DateTime.UtcNow;
            token.RevokedReason = reason;
        }
    }
}
