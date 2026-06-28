using Repositories.DTOs;
using Repositories.Entities;

namespace Services.Interfaces;

public interface IRegulationService
{
    Task<IEnumerable<Regulation>> GetAllAsync();

    Task<ServiceResult<bool>> SaveAllAsync(List<string> items);
}