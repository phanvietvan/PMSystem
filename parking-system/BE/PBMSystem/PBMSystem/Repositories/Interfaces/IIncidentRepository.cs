using Repositories.Entities;

namespace Repositories.Interfaces;

/// <summary>
/// Specialized repository interface for Incident database queries.
/// </summary>
public interface IIncidentRepository : IRepository<Incident>
{
    Task<List<Incident>> GetAllOrderByCreatedAtDescAsync();
}