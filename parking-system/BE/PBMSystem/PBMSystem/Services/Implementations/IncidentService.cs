using Repositories.DTOs;
using Repositories.Entities;
using Repositories.Interfaces;
using Services.Interfaces;

namespace Services.Implementations;

/// <summary>
/// Business logic for Incident management.
/// </summary>
public class IncidentService : IIncidentService
{
    private readonly IIncidentRepository _incidentRepository;

    public IncidentService(IIncidentRepository incidentRepository)
    {
        _incidentRepository = incidentRepository;
    }

    private void PopulateLegacyFields(Incident incident)
    {
        if (incident == null) return;
        if (incident.User != null)
        {
            incident.Reporter = $"{incident.User.FirstName} {incident.User.LastName}".Trim();
            if (string.IsNullOrEmpty(incident.Reporter)) incident.Reporter = incident.User.Username;
            incident.Role = incident.User.Role.ToString();
        }
        else
        {
            incident.Reporter = "Khách vãng lai";
            incident.Role = "Khách hàng";
        }
    }

    public async Task<ServiceResult<List<Incident>>> GetAllAsync()
    {
        var incidents = await _incidentRepository.GetAllOrderByCreatedAtDescAsync();
        foreach (var inc in incidents)
        {
            PopulateLegacyFields(inc);
        }

        return ServiceResult<List<Incident>>.Ok(incidents);
    }

    public async Task<ServiceResult<Incident>> CreateAsync(Incident request)
    {
        if (string.IsNullOrWhiteSpace(request.Title) ||
            string.IsNullOrWhiteSpace(request.Description))
        {
            return ServiceResult<Incident>.BadRequest(
                "Vui lòng nhập đầy đủ tiêu đề và mô tả sự cố.");
        }

        var incident = new Incident
        {
            Type = request.Type,
            Title = request.Title.Trim(),
            Description = request.Description.Trim(),
            Branch = request.Branch,
            Floor = request.Floor,
            Urgency = request.Urgency,
            UserId = request.UserId,
            Status = "Chờ xử lý"
        };

        await _incidentRepository.AddAsync(incident);
        await _incidentRepository.SaveChangesAsync();

        var loaded = await _incidentRepository.GetByIdAsync(incident.Id);
        if (loaded != null) PopulateLegacyFields(loaded);

        return ServiceResult<Incident>.Ok(loaded ?? incident);
    }

    public async Task<ServiceResult<Incident>> ResolveAsync(Guid id)
    {
        var incident = await _incidentRepository.GetByIdAsync(id);

        if (incident == null)
        {
            return ServiceResult<Incident>.NotFound(
                "Không tìm thấy báo cáo sự cố.");
        }

        incident.Status = "Đã xử lý";

        _incidentRepository.Update(incident);
        await _incidentRepository.SaveChangesAsync();

        PopulateLegacyFields(incident);

        return ServiceResult<Incident>.Ok(incident);
    }

    public async Task<ServiceResult<bool>> DeleteAsync(Guid id)
    {
        var incident = await _incidentRepository.GetByIdAsync(id);

        if (incident == null)
        {
            return ServiceResult<bool>.NotFound(
                "Không tìm thấy báo cáo sự cố.");
        }

        _incidentRepository.SoftDelete(incident);
        await _incidentRepository.SaveChangesAsync();

        return ServiceResult<bool>.Ok(true);
    }
}