using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Enums;
using Repositories.Interfaces;

namespace Repositories.Implementations;

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext context) : base(context) { }

    public override async Task<User?> GetByIdAsync(Guid id) =>
        await _dbSet.Include(u => u.Vehicles).FirstOrDefaultAsync(u => u.Id == id);

    public async Task<User?> GetByEmailAsync(string email) =>
        await _dbSet.Include(u => u.Vehicles).FirstOrDefaultAsync(u => u.Email == email.ToLower());

    public async Task<User?> GetByUsernameAsync(string username) =>
        await _dbSet.Include(u => u.Vehicles).FirstOrDefaultAsync(u => u.Username == username.ToLower());

    public async Task<User?> GetByEmailOrUsernameAsync(string identifier)
    {
        var normalized = identifier.ToLower().Trim();
        return await _dbSet
            .Include(u => u.Vehicles)
            .FirstOrDefaultAsync(u => u.Email == normalized || u.Username == normalized);
    }

    public async Task<bool> EmailExistsAsync(string email) =>
        await _dbSet.AnyAsync(u => u.Email == email.ToLower());

    public async Task<bool> UsernameExistsAsync(string username) =>
        await _dbSet.AnyAsync(u => u.Username == username.ToLower());

    public async Task<User?> GetWithRefreshTokensAsync(Guid userId) =>
        await _dbSet
            .Include(u => u.RefreshTokens)
            .Include(u => u.Vehicles)
            .FirstOrDefaultAsync(u => u.Id == userId);

    /// <summary>
    /// Bypasses the global soft-delete filter to find a PendingVerification
    /// record by email — used during OTP registration to reuse existing rows.
    /// </summary>
    public async Task<User?> GetPendingByEmailAsync(string email) =>
        await _context.Users
            .IgnoreQueryFilters()   // bypass IsDeleted global filter
            .FirstOrDefaultAsync(u =>
                u.Email == email.ToLower() &&
                u.Status == UserStatus.PendingVerification);

    public async Task ReplaceVehiclesAsync(Guid userId, IReadOnlyList<UserVehicle> vehicles)
    {
        foreach (var entry in _context.ChangeTracker.Entries<UserVehicle>()
                     .Where(e => e.Entity.UserId == userId)
                     .ToList())
        {
            entry.State = EntityState.Detached;
        }

        var trackedUser = _context.ChangeTracker.Entries<User>()
            .FirstOrDefault(e => e.Entity.Id == userId)?.Entity;
        if (trackedUser != null)
            trackedUser.Vehicles = new List<UserVehicle>();

        await _context.UserVehicles
            .IgnoreQueryFilters()
            .Where(v => v.UserId == userId)
            .ExecuteDeleteAsync();

        if (vehicles.Count == 0)
            return;

        foreach (var vehicle in vehicles)
        {
            vehicle.UserId = userId;
            vehicle.IsDeleted = false;
            vehicle.UpdatedAt = null;
        }

        await _context.UserVehicles.AddRangeAsync(vehicles);
    }
}
