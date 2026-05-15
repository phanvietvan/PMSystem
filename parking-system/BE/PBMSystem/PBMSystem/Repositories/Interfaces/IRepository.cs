using Repositories.Entities;
using System.Linq.Expressions;

namespace Repositories.Interfaces;

/// <summary>
/// Generic repository contract covering standard CRUD + query operations.
/// Every entity-specific repository extends this, so team members never
/// write boilerplate persistence code from scratch.
/// </summary>
public interface IRepository<TEntity> where TEntity : BaseEntity
{
    // ── Query ─────────────────────────────────────────────────────────────────
    Task<TEntity?> GetByIdAsync(Guid id);
    Task<IEnumerable<TEntity>> GetAllAsync();
    Task<IEnumerable<TEntity>> FindAsync(Expression<Func<TEntity, bool>> predicate);
    Task<TEntity?> FirstOrDefaultAsync(Expression<Func<TEntity, bool>> predicate);
    Task<bool> ExistsAsync(Expression<Func<TEntity, bool>> predicate);
    Task<int> CountAsync(Expression<Func<TEntity, bool>>? predicate = null);

    // ── Mutation ──────────────────────────────────────────────────────────────
    Task<TEntity> AddAsync(TEntity entity);
    Task AddRangeAsync(IEnumerable<TEntity> entities);
    void Update(TEntity entity);
    void Remove(TEntity entity);           // hard delete
    void SoftDelete(TEntity entity);       // sets IsDeleted = true

    // ── Persistence ───────────────────────────────────────────────────────────
    Task<int> SaveChangesAsync();
}
