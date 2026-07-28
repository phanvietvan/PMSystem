using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Interfaces;

namespace Repositories.Implementations;

public class IncidentRepository : Repository<Incident>, IIncidentRepository
{
    public IncidentRepository(AppDbContext context)
        : base(context)
    {
    }

    public override async Task<Incident?> GetByIdAsync(Guid id)
    {
        return await _dbSet.Include(i => i.User).FirstOrDefaultAsync(i => i.Id == id);
    }

    public async Task<List<Incident>> GetAllOrderByCreatedAtDescAsync()
    {
        return await _dbSet
            .Include(i => i.User)
            .Where(i => !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Incident>> GetByStatusAsync(string status)
    {
        return await _dbSet
            .Include(i => i.User)
            .Where(i => !i.IsDeleted && i.Status == status)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }
}