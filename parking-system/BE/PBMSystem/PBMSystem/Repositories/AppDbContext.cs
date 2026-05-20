using Repositories.Entities;
using Microsoft.EntityFrameworkCore;

namespace Repositories;

/// <summary>
/// Main EF Core DbContext.
/// Run migrations from PBMSystem.API project:
///   dotnet ef migrations add &lt;Name&gt; --project ../Repositories --startup-project .
///   dotnet ef database update --project ../Repositories --startup-project .
/// </summary>
public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<ParkingSession> ParkingSessions => Set<ParkingSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // ── User ─────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(u => u.Id);
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.Username).IsUnique();

            entity.Property(u => u.Email).IsRequired().HasMaxLength(256);
            entity.Property(u => u.Username).IsRequired().HasMaxLength(50);
            entity.Property(u => u.PasswordHash).IsRequired();
            entity.Property(u => u.FirstName).HasMaxLength(100);
            entity.Property(u => u.LastName).HasMaxLength(100);
            entity.Property(u => u.PhoneNumber).HasMaxLength(20);
            entity.Property(u => u.Address).HasMaxLength(500);
            entity.Property(u => u.Status).HasConversion<int>();
            entity.Property(u => u.Role).HasConversion<int>();

            // OTP fields — nullable, cleared after successful verification
            entity.Property(u => u.OtpCode).HasMaxLength(6);
            entity.Property(u => u.OtpExpiry);

            // Cooldown — nullable, set on every OTP send
            entity.Property(u => u.OtpLastSentAt);

            // Soft-delete global filter — automatically excludes deleted rows
            entity.HasQueryFilter(u => !u.IsDeleted);
        });

        // ── RefreshToken ──────────────────────────────────────────────────────
        modelBuilder.Entity<RefreshToken>(entity =>
        {
            entity.HasKey(rt => rt.Id);
            entity.HasIndex(rt => rt.Token).IsUnique();

            entity.Property(rt => rt.Token).IsRequired().HasMaxLength(512);
            entity.Property(rt => rt.ReplacedByToken).HasMaxLength(512);
            entity.Property(rt => rt.CreatedByIp).HasMaxLength(45);

            entity.HasOne(rt => rt.User)
                  .WithMany(u => u.RefreshTokens)
                  .HasForeignKey(rt => rt.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // ── ParkingSession ───────────────────────────────────────────────────
        modelBuilder.Entity<ParkingSession>(entity =>
        {
            entity.HasKey(ps => ps.Id);
            entity.HasIndex(ps => ps.QrCode).IsUnique();
            entity.Property(ps => ps.LicensePlate).IsRequired();
            entity.Property(ps => ps.QrCode).IsRequired();
            entity.HasQueryFilter(ps => !ps.IsDeleted);
        });
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
