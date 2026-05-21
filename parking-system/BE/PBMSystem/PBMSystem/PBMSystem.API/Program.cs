using System.Text;
using PBMSystem.API.Extensions;
using PBMSystem.API.Middleware;
using Repositories;
using Repositories.Configuration;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Services;

var builder = WebApplication.CreateBuilder(args);

// ── Configuration ─────────────────────────────────────────────────────────────
builder.Services.Configure<JwtSettings>(
    builder.Configuration.GetSection("JwtSettings"));

builder.Services.Configure<SmtpSettings>(
    builder.Configuration.GetSection("SmtpSettings"));

// ── Database (MongoDB) ────────────────────────────────────────────────────────
var mongoUri = builder.Configuration.GetConnectionString("MongoConnection") ?? "mongodb://localhost:27017";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseMongoDB(mongoUri, "pbmsystem_dev"));


// ── Repository + Services Layers ─────────────────────────────────────────────
builder.Services.AddRepositories();
builder.Services.AddPBMServices();

// ── JWT Authentication ────────────────────────────────────────────────────────
var jwtSettings = builder.Configuration
    .GetSection("JwtSettings")
    .Get<JwtSettings>()!;

builder.Services
    .AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SecretKey)),
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// ── Controllers & Swagger ─────────────────────────────────────────────────────
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerWithJwt();

// ── CORS ──────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddPolicy("DefaultPolicy", policy =>
    {
        var origins = new List<string> { 
            "http://localhost:5173", 
            "http://localhost:5174", 
            "http://localhost:5175", 
            "http://localhost:3000", 
            "https://parking-building-management-system.vercel.app" 
        };
        var configuredOrigins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>();
        if (configuredOrigins != null)
        {
            origins.AddRange(configuredOrigins);
        }

        policy.WithOrigins(origins.Distinct().ToArray())
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// ── Build ─────────────────────────────────────────────────────────────────────
var app = builder.Build();

// ── Auto-apply seeding on startup ─────────────────────────────────────────────
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    // For MongoDB: ensure the database and collections are created
    await db.Database.EnsureCreatedAsync();

    // Seed default users if none exist in the database
    if (!await db.Users.AnyAsync())
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("DevPass123!");
        var users = new List<Repositories.Entities.User>
        {
            new Repositories.Entities.User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111101"),
                Email = "user@pbm.dev",
                Username = "user_dev",
                PasswordHash = passwordHash,
                FirstName = "Dev",
                LastName = "User",
                PhoneNumber = "+84900000001",
                Address = "1 Dev Seed Street",
                Role = Repositories.Enums.UserRole.User,
                Status = Repositories.Enums.UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            },
            new Repositories.Entities.User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111102"),
                Email = "staff@pbm.dev",
                Username = "staff_dev",
                PasswordHash = passwordHash,
                FirstName = "Dev",
                LastName = "Staff",
                PhoneNumber = "+84900000001",
                Address = "1 Dev Seed Street",
                Role = Repositories.Enums.UserRole.Staff,
                Status = Repositories.Enums.UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            },
            new Repositories.Entities.User
            {
                Id = Guid.Parse("11111111-1111-1111-1111-111111111103"),
                Email = "admin@pbm.dev",
                Username = "admin_dev",
                PasswordHash = passwordHash,
                FirstName = "Dev",
                LastName = "Admin",
                PhoneNumber = "+84900000001",
                Address = "1 Dev Seed Street",
                Role = Repositories.Enums.UserRole.Admin,
                Status = Repositories.Enums.UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            }
        };

        await db.Users.AddRangeAsync(users);
        await db.SaveChangesAsync();
        Console.WriteLine("Seeded 3 default dev users into database.");
    }

    // Ensure vietvanphan04@gmail.com is Admin
    var vietvanUser = await db.Users.FirstOrDefaultAsync(u => u.Email == "vietvanphan04@gmail.com");
    if (vietvanUser != null)
    {
        if (vietvanUser.Role != Repositories.Enums.UserRole.Admin)
        {
            vietvanUser.Role = Repositories.Enums.UserRole.Admin;
            await db.SaveChangesAsync();
            Console.WriteLine("Updated vietvanphan04@gmail.com to Admin.");
        }
    }
    else
    {
        var passwordHash = BCrypt.Net.BCrypt.HashPassword("DevPass123!");
        var adminUser = new Repositories.Entities.User
        {
            Id = Guid.NewGuid(),
            Email = "vietvanphan04@gmail.com",
            Username = "vietvanphan04",
            PasswordHash = passwordHash,
            FirstName = "Viet Van",
            LastName = "Phan",
            PhoneNumber = "+84900000000",
            Address = "Dev Street",
            Role = Repositories.Enums.UserRole.Admin,
            Status = Repositories.Enums.UserStatus.Active,
            CreatedAt = DateTime.UtcNow
        };
        await db.Users.AddAsync(adminUser);
        await db.SaveChangesAsync();
        Console.WriteLine("Created and seeded vietvanphan04@gmail.com as Admin.");
    }
}

// ── Middleware Pipeline ───────────────────────────────────────────────────────
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors("DefaultPolicy");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
