using System.Text.Json;
using Repositories.Entities;
using Microsoft.EntityFrameworkCore;

namespace Repositories;

/// <summary>
/// Main EF Core DbContext for SQL Server.
/// Run migrations from PBMSystem.API project:
///   dotnet ef migrations add <Name> --project ../Repositories --startup-project .
///   dotnet ef database update --project ../Repositories --startup-project .
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
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

        // Relational Table Names
        modelBuilder.Entity<User>().ToTable("Users");
        modelBuilder.Entity<RefreshToken>().ToTable("RefreshTokens");
        modelBuilder.Entity<ParkingSession>().ToTable("ParkingSessions");
        modelBuilder.Entity<Incident>().ToTable("Incidents");
        modelBuilder.Entity<Payment>().ToTable("Payments");
        modelBuilder.Entity<ParkingLot>().ToTable("ParkingLots");
        modelBuilder.Entity<PricingConfig>().ToTable("PricingConfigs");
        modelBuilder.Entity<Regulation>().ToTable("Regulations");
        modelBuilder.Entity<BlacklistEntry>().ToTable("BlacklistEntries");
        modelBuilder.Entity<AppNotification>().ToTable("AppNotifications");

        // Relationships & Foreign Keys
        modelBuilder.Entity<RefreshToken>()
            .HasOne(r => r.User)
            .WithMany(u => u.RefreshTokens)
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ParkingSession>()
            .HasOne(s => s.User)
            .WithMany()
            .HasForeignKey(s => s.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.User)
            .WithMany()
            .HasForeignKey(p => p.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Session)
            .WithMany()
            .HasForeignKey(p => p.SessionId)
            .OnDelete(DeleteBehavior.Restrict);

        modelBuilder.Entity<AppNotification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        // Property precision & complex/JSON conversions
        modelBuilder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<ParkingLot>()
            .Property(p => p.Floors)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<int>>(v, (JsonSerializerOptions?)null) ?? new List<int>());

        modelBuilder.Entity<ParkingLot>()
            .Property(p => p.FloorCapacities)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<Dictionary<string, int>>(v, (JsonSerializerOptions?)null) ?? new Dictionary<string, int>());

        modelBuilder.Entity<ParkingLot>()
            .Property(p => p.LockedSlots)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<string>>(v, (JsonSerializerOptions?)null) ?? new List<string>());

        modelBuilder.Entity<AppNotification>()
            .Property(n => n.ReadByUserIds)
            .HasConversion(
                v => JsonSerializer.Serialize(v, (JsonSerializerOptions?)null),
                v => JsonSerializer.Deserialize<List<Guid>>(v, (JsonSerializerOptions?)null) ?? new List<Guid>());

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
