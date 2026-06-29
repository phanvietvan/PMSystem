using Microsoft.EntityFrameworkCore;
using Repositories.Entities;
using Repositories.Interfaces;

namespace Repositories.Implementations;

public class RegulationRepository : IRegulationRepository
{
    private readonly AppDbContext _context;

    public RegulationRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<IEnumerable<Regulation>> GetActiveAsync()
    {
        return await _context.Regulations
            .Where(r => !r.IsDeleted)
            .OrderBy(r => r.OrderIndex)
            .ToListAsync();
    }

    public async Task<IEnumerable<Regulation>> GetAllActiveAsync()
    {
        return await _context.Regulations
            .Where(r => !r.IsDeleted)
            .ToListAsync();
    }

    public async Task AddRangeAsync(IEnumerable<Regulation> regulations)
    {
        await _context.Regulations.AddRangeAsync(regulations);
    }

    public void Update(Regulation regulation)
    {
        _context.Regulations.Update(regulation);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}