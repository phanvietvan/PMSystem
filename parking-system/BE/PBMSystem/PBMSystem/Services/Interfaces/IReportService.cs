namespace Services.Interfaces;

public interface IReportService
{
    Task<object> GetDashboardReportsAsync();
}