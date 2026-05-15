using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Interfaces;

namespace Repositories.Implementations;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public async Task<User?> GetByEmailAsync(string email) =>
        await _dbSet.FirstOrDefaultAsync(u => u.Email == email.ToLower());

    public async Task<User?> GetByUsernameAsync(string username) =>
        await _dbSet.FirstOrDefaultAsync(u => u.Username == username.ToLower());

    public async Task<User?> GetByEmailOrUsernameAsync(string identifier)
    {
        var normalized = identifier.ToLower().Trim();
        return await _dbSet
            .FirstOrDefaultAsync(u => u.Email == normalized || u.Username == normalized);
    }

    public async Task<bool> EmailExistsAsync(string email) =>
        await _dbSet.AnyAsync(u => u.Email == email.ToLower());

    public async Task<bool> UsernameExistsAsync(string username) =>
        await _dbSet.AnyAsync(u => u.Username == username.ToLower());

    public async Task<User?> GetWithRefreshTokensAsync(Guid userId) =>
        await _dbSet
            .Include(u => u.RefreshTokens)
            .FirstOrDefaultAsync(u => u.Id == userId);
}
