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
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<ParkingSlot> ParkingSlots => Set<ParkingSlot>();
    public DbSet<Gate> Gates => Set<Gate>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<User>().ToCollection("Users");
        modelBuilder.Entity<RefreshToken>().ToCollection("RefreshTokens");
        modelBuilder.Entity<ParkingSession>().ToCollection("ParkingSessions");
        modelBuilder.Entity<Payment>().ToCollection("Payments");
        modelBuilder.Entity<ParkingSlot>().ToCollection("ParkingSlots");
        modelBuilder.Entity<Gate>().ToCollection("Gates");
        // Global query filters for soft-delete
        modelBuilder.Entity<User>().HasQueryFilter(u => !u.IsDeleted);
        modelBuilder.Entity<ParkingSession>().HasQueryFilter(ps => !ps.IsDeleted);
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
