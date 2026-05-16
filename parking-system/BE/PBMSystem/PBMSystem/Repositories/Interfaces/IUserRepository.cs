using Repositories.Entities;

namespace Repositories.Interfaces;

/// <summary>
/// User-specific query methods that go beyond generic CRUD.
/// Add domain-specific queries here — keeps Services layer free of raw LINQ.
/// </summary>
public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByUsernameAsync(string username);
    Task<User?> GetByEmailOrUsernameAsync(string identifier);
    Task<bool> EmailExistsAsync(string email);
    Task<bool> UsernameExistsAsync(string username);
    Task<User?> GetWithRefreshTokensAsync(Guid userId);

    /// <summary>
    /// Returns a PendingVerification user by email (ignores the soft-delete
    /// global filter so it can find records before they are fully active).
    /// </summary>
    Task<User?> GetPendingByEmailAsync(string email);
}
