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

    public async Task<List<Incident>> GetAllOrderByCreatedAtDescAsync()
    {
        return await _dbSet
            .Where(i => !i.IsDeleted)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }

    public async Task<List<Incident>> GetByStatusAsync(string status)
    {
        return await _dbSet
            .Where(i => !i.IsDeleted && i.Status == status)
            .OrderByDescending(i => i.CreatedAt)
            .ToListAsync();
    }
}