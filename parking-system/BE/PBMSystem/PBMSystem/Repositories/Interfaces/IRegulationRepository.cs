using Repositories.Entities;

namespace Repositories.Interfaces;

public interface IRegulationRepository
{
    Task<IEnumerable<Regulation>> GetActiveAsync();
    Task<IEnumerable<Regulation>> GetAllActiveAsync();
    Task AddRangeAsync(IEnumerable<Regulation> regulations);
    void Update(Regulation regulation);
    Task SaveChangesAsync();
}