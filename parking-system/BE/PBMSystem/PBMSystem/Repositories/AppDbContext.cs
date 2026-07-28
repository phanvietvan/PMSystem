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
    public DbSet<UserVehicle> UserVehicles => Set<UserVehicle>();
    public DbSet<NotificationRead> NotificationReads => Set<NotificationRead>();
    public DbSet<ParkingLotFloor> ParkingLotFloors => Set<ParkingLotFloor>();
    public DbSet<ParkingSlot> ParkingSlots => Set<ParkingSlot>();
    public DbSet<ParkingSessionSurcharge> ParkingSessionSurcharges => Set<ParkingSessionSurcharge>();

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
        modelBuilder.Entity<UserVehicle>().ToTable("UserVehicles");
        modelBuilder.Entity<NotificationRead>().ToTable("NotificationReads");
        modelBuilder.Entity<ParkingLotFloor>().ToTable("ParkingLotFloors");
        modelBuilder.Entity<ParkingSlot>().ToTable("ParkingSlots");
        modelBuilder.Entity<ParkingSessionSurcharge>().ToTable("ParkingSessionSurcharges");

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

        modelBuilder.Entity<Incident>()
            .HasOne(i => i.User)
            .WithMany()
            .HasForeignKey(i => i.UserId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<UserVehicle>()
            .HasOne(v => v.User)
            .WithMany(u => u.Vehicles)
            .HasForeignKey(v => v.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<NotificationRead>()
            .HasOne(r => r.Notification)
            .WithMany(n => n.Reads)
            .HasForeignKey(r => r.NotificationId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<NotificationRead>()
            .HasOne(r => r.User)
            .WithMany()
            .HasForeignKey(r => r.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ParkingLotFloor>()
            .HasOne(f => f.ParkingLot)
            .WithMany(l => l.FloorsList)
            .HasForeignKey(f => f.ParkingLotId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ParkingSlot>()
            .HasOne(s => s.ParkingLot)
            .WithMany(l => l.Slots)
            .HasForeignKey(s => s.ParkingLotId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<ParkingSessionSurcharge>()
            .HasOne(s => s.Session)
            .WithMany(sn => sn.Surcharges)
            .HasForeignKey(s => s.SessionId)
            .OnDelete(DeleteBehavior.Cascade);

        // Property precision & configurations
        modelBuilder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<ParkingSessionSurcharge>()
            .Property(s => s.Amount)
            .HasColumnType("decimal(18,2)");

        modelBuilder.Entity<PricingConfig>()
            .Property(c => c.Price)
            .HasColumnType("decimal(18,2)");

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
        modelBuilder.Entity<UserVehicle>().HasQueryFilter(v => !v.IsDeleted);
        modelBuilder.Entity<NotificationRead>().HasQueryFilter(r => !r.IsDeleted);
        modelBuilder.Entity<ParkingLotFloor>().HasQueryFilter(f => !f.IsDeleted);
        modelBuilder.Entity<ParkingSlot>().HasQueryFilter(s => !s.IsDeleted);
        modelBuilder.Entity<ParkingSessionSurcharge>().HasQueryFilter(s => !s.IsDeleted);
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
