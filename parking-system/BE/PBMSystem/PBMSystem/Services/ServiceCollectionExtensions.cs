using Microsoft.Extensions.DependencyInjection;
using Services.Implementations;
using Services.Interfaces;

namespace Services;

/// <summary>
/// Registers all Services layer dependencies into the DI container.
/// Call services.AddPBMServices() in Program.cs.
/// Add new service registrations here as features grow.
/// </summary>
public static class ServiceCollectionExtensions
{
    public static IServiceCollection AddPBMServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<ITokenService, TokenService>();

        // ── Add new services here ────────────────────────────────────────────
        // services.AddScoped<IEmailService, EmailService>();
        // services.AddScoped<IUserProfileService, UserProfileService>();

        return services;
    }
}
