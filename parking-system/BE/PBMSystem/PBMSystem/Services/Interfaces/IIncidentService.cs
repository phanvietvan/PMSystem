using Repositories.DTOs;
using Repositories.Entities;

namespace Services.Interfaces;

public interface IIncidentService
{
    Task<ServiceResult<List<Incident>>> GetAllAsync();

    Task<ServiceResult<Incident>> CreateAsync(Incident incident);

    Task<ServiceResult<Incident>> ResolveAsync(Guid id);

    Task<ServiceResult<bool>> DeleteAsync(Guid id);
}