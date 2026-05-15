using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Repositories;

/// <summary>
/// Allows EF Core CLI tools to instantiate AppDbContext at design time
/// (when running `dotnet ef migrations add ...` from the PBMSystem.API project).
///
/// Usage from PBMSystem.API directory:
///   dotnet ef migrations add InitialCreate --project ../Repositories
///   dotnet ef database update --project ../Repositories
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        // Walk up to solution root and read PBMSystem.API's appsettings
        var basePath = Path.Combine(Directory.GetCurrentDirectory(), "..", "PBMSystem.API");

        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: false)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>();
        optionsBuilder.UseSqlServer(
            config.GetConnectionString("DefaultConnection"),
            sql => sql.MigrationsAssembly("Repositories"));

        return new AppDbContext(optionsBuilder.Options);
    }
}
