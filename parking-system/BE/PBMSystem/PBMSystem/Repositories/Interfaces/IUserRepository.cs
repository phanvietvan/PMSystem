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
}
