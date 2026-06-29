using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Interfaces;

namespace Services.Implementations;

public class RegulationService : IRegulationService
{
    private readonly IRegulationRepository _regulationRepository;

    public RegulationService(IRegulationRepository regulationRepository)
    {
        _regulationRepository = regulationRepository;
    }

    public async Task<IEnumerable<Regulation>> GetAllAsync()
    {
        return await _regulationRepository.GetActiveAsync();
    }

    public async Task<ServiceResult<bool>> SaveAllAsync(List<string> items)
    {
        var currentRegulations = await _regulationRepository.GetAllActiveAsync();

        foreach (var item in currentRegulations)
        {
            item.IsDeleted = true;
            item.UpdatedAt = DateTime.UtcNow;
            _regulationRepository.Update(item);
        }

        var newRegulations = items
     .Where(item => !string.IsNullOrWhiteSpace(item))
     .Select((item, index) => new Regulation
     {
         Id = Guid.NewGuid(),
         Content = item,
         OrderIndex = index,
         IsActive = true,
         IsDeleted = false,
         CreatedAt = DateTime.UtcNow,
         UpdatedAt = DateTime.UtcNow
     })
     .ToList();

        await _regulationRepository.AddRangeAsync(newRegulations);
        await _regulationRepository.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }
}