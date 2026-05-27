using Microsoft.Extensions.DependencyInjection;
using Repositories.Implementations;
using Repositories.Interfaces;

namespace Repositories;

/// <summary>
/// Registers all repositories into the DI container.
/// Call services.AddRepositories() in Program.cs.
/// Add new repository registrations here as new entities are introduced.
/// </summary>
public static class RepositoryCollectionExtensions
{
    public static IServiceCollection AddRepositories(this IServiceCollection services)
    {
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IRefreshTokenRepository, RefreshTokenRepository>();

        // ── Add new repositories here ────────────────────────────────────────
        // services.AddScoped<IProductRepository, ProductRepository>();
        // services.AddScoped<IOrderRepository, OrderRepository>();

        return services;
    }
}
