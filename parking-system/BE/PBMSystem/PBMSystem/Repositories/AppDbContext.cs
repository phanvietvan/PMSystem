using Repositories.Entities;
using Microsoft.EntityFrameworkCore;
using MongoDB.EntityFrameworkCore.Extensions;

namespace Repositories;

/// <summary>
/// Main EF Core DbContext.
/// Run migrations from PBMSystem.API project:
///   dotnet ef migrations add &lt;Name&gt; --project ../Repositories --startup-project .
///   dotnet ef database update --project ../Repositories --startup-project .
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
        Database.AutoTransactionBehavior = AutoTransactionBehavior.Never;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ParkingSession> ParkingSessions => Set<ParkingSession>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ParkingLot> ParkingLots => Set<ParkingLot>();
    public DbSet<PricingConfig> PricingConfigs => Set<PricingConfig>();
    public DbSet<Regulation> Regulations => Set<Regulation>();
    public DbSet<BlacklistEntry> BlacklistEntries => Set<BlacklistEntry>();
    public DbSet<AppNotification> AppNotifications => Set<AppNotification>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().ToCollection("Users");
        modelBuilder.Entity<RefreshToken>().ToCollection("RefreshTokens");
        modelBuilder.Entity<ParkingSession>().ToCollection("ParkingSessions");
        modelBuilder.Entity<Incident>().ToCollection("Incidents");
        modelBuilder.Entity<Payment>().ToCollection("Payments");
        modelBuilder.Entity<ParkingLot>().ToCollection("ParkingLots");
        modelBuilder.Entity<PricingConfig>().ToCollection("PricingConfigs");
        modelBuilder.Entity<Regulation>().ToCollection("Regulations");
        modelBuilder.Entity<BlacklistEntry>().ToCollection("BlacklistEntries");
        modelBuilder.Entity<AppNotification>().ToCollection("AppNotifications");

        // Global query filters for soft-delete
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<ParkingSession>().HasQueryFilter(ps => !ps.IsDeleted);
        modelBuilder.Entity<Incident>().HasQueryFilter(i => !i.IsDeleted);
        modelBuilder.Entity<Payment>().HasQueryFilter(p => !p.IsDeleted);
        modelBuilder.Entity<ParkingLot>().HasQueryFilter(pl => !pl.IsDeleted);
        modelBuilder.Entity<PricingConfig>().HasQueryFilter(pc => !pc.IsDeleted);
        modelBuilder.Entity<Regulation>().HasQueryFilter(r => !r.IsDeleted);
        modelBuilder.Entity<BlacklistEntry>().HasQueryFilter(b => !b.IsDeleted);
        modelBuilder.Entity<AppNotification>().HasQueryFilter(n => !n.IsDeleted);
    }

    /// <summary>
    /// Override SaveChanges to auto-populate audit fields on all BaseEntity types.
    /// </summary>
    public override Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
    {
        foreach (var entry in ChangeTracker.Entries<BaseEntity>())
        {
            if (entry.State == EntityState.Modified)
                entry.Entity.UpdatedAt = DateTime.UtcNow;
        }
        return base.SaveChangesAsync(cancellationToken);
    }
}
