using Microsoft.Extensions.DependencyInjection;
using Services.Implementations;
using Services.Interfaces;

namespace Services;

public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPBMServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITokenService, TokenService>();
        services.AddScoped<IEmailService, EmailService>();
        services.AddScoped<IParkingSessionService, ParkingSessionService>();
        services.AddScoped<IBlacklistService, BlacklistService>();

        // Incident Service
        services.AddScoped<IIncidentService, IncidentService>();

        // Notification Service
        services.AddScoped<INotificationService, NotificationService>();

        // Regulation Service
        services.AddScoped<IRegulationService, RegulationService>();

        // Report Service
        services.AddScoped<IReportService, ReportService>();

        return services;
    }
}