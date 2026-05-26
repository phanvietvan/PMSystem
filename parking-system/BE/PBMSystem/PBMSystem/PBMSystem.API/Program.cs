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
            "https://localhost:5173", 
            "https://localhost:5174", 
            "https://localhost:5175", 
            "http://localhost:3000", 
            "https://localhost:3000", 
            "https://staff.pmsystem.local",
            "http://admin.pmsystem.local",
            "https://admin.pmsystem.local",
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

    // Ensure vietvanphan04@gmail.com and vietvanphan430@gmail.com are Admins
    var adminEmails = new[] { "vietvanphan04@gmail.com", "vietvanphan430@gmail.com" };
    foreach (var email in adminEmails)
    {
        var adminUser = await db.Users.FirstOrDefaultAsync(u => u.Email == email);
        if (adminUser != null)
        {
            if (adminUser.Role != Repositories.Enums.UserRole.Admin)
            {
                adminUser.Role = Repositories.Enums.UserRole.Admin;
                await db.SaveChangesAsync();
                Console.WriteLine($"Updated {email} to Admin.");
            }
        }
        else
        {
            var passwordHash = BCrypt.Net.BCrypt.HashPassword("DevPass123!");
            var newAdmin = new Repositories.Entities.User
            {
                Id = Guid.NewGuid(),
                Email = email,
                Username = email.Split('@')[0],
                PasswordHash = passwordHash,
                FirstName = "Viet Van",
                LastName = "Phan",
                PhoneNumber = "+84900000000",
                Address = "Dev Street",
                Role = Repositories.Enums.UserRole.Admin,
                Status = Repositories.Enums.UserStatus.Active,
                CreatedAt = DateTime.UtcNow
            };
            await db.Users.AddAsync(newAdmin);
            await db.SaveChangesAsync();
            Console.WriteLine($"Created and seeded {email} as Admin.");
        }
    }

    // Seed default parking lots (branches) if none exist
    if (!await db.ParkingLots.AnyAsync())
    {
        var lots = new List<Repositories.Entities.ParkingLot>
        {
            new Repositories.Entities.ParkingLot { Name = "Landmark 81 - Bãi đỗ A1", Latitude = "10.7949", Longitude = "106.7218", Floor = "Tầng 1", Block = "Block A", Floors = new List<int>{1,2,3}, Address = "208 Nguyễn Hữu Cảnh, Bình Thạnh, TP.HCM" },
            new Repositories.Entities.ParkingLot { Name = "Bitexco Financial - Bãi đỗ B2", Latitude = "10.7717", Longitude = "106.7044", Floor = "Tầng 2", Block = "Block B", Floors = new List<int>{1,2,3}, Address = "2 Hải Triều, Quận 1, TP.HCM" },
            new Repositories.Entities.ParkingLot { Name = "Vincom Center - Bãi đỗ V3", Latitude = "10.7781", Longitude = "106.7020", Floor = "Hầm B3", Block = "Block V", Floors = new List<int>{1,2,3}, Address = "72 Lê Thánh Tôn, Quận 1, TP.HCM" },
            new Repositories.Entities.ParkingLot { Name = "Saigon Centre - Bãi đỗ S1", Latitude = "10.7736", Longitude = "106.7013", Floor = "Tầng 4", Block = "Block S", Floors = new List<int>{1,2,3}, Address = "65 Lê Lợi, Quận 1, TP.HCM" },
            new Repositories.Entities.ParkingLot { Name = "Lotte Mart Q7 - Bãi đỗ L1", Latitude = "10.7482", Longitude = "106.7023", Floor = "Hầm B1", Block = "Block L", Floors = new List<int>{1,2,3}, Address = "469 Nguyễn Hữu Thọ, Quận 7, TP.HCM" },
            new Repositories.Entities.ParkingLot { Name = "Crescent Mall Q7 - Bãi đỗ C1", Latitude = "10.7287", Longitude = "106.7169", Floor = "Tầng G", Block = "Block C", Floors = new List<int>{1,2,3}, Address = "101 Tôn Dật Tiên, Quận 7, TP.HCM" },
            new Repositories.Entities.ParkingLot { Name = "Sân bay Tân Sơn Nhất - Block A", Latitude = "10.8160", Longitude = "106.6630", Floor = "Ga quốc tế", Block = "Khu vực A", Floors = new List<int>{1,2,3}, Address = "Trường Sơn, Tân Bình, TP.HCM" }
        };
        await db.ParkingLots.AddRangeAsync(lots);
        await db.SaveChangesAsync();
        Console.WriteLine("Seeded 7 default parking lot branches.");
    }

    // Seed default pricing configs if none exist
    if (!await db.PricingConfigs.AnyAsync())
    {
        var configs = new List<Repositories.Entities.PricingConfig>
        {
            new Repositories.Entities.PricingConfig { Type = "Xe máy", Price = "5.000", Sub = "VNĐ / Lượt" },
            new Repositories.Entities.PricingConfig { Type = "Ô tô 4-7 chỗ", Price = "30.000", Sub = "VNĐ / Giờ" },
            new Repositories.Entities.PricingConfig { Type = "SUV / Bán tải", Price = "50.000", Sub = "VNĐ / Giờ" }
        };
        await db.PricingConfigs.AddRangeAsync(configs);
        await db.SaveChangesAsync();
        Console.WriteLine("Seeded 3 default pricing configs.");
    }

    // Seed default regulations if none exist
    if (!await db.Regulations.AnyAsync())
    {
        var regs = new List<Repositories.Entities.Regulation>
        {
            new Repositories.Entities.Regulation { Content = "Vui lòng đỗ xe đúng vị trí ô đỗ đã đặt trước hoặc quét mã tại chỗ.", OrderIndex = 0 },
            new Repositories.Entities.Regulation { Content = "Tốc độ di chuyển tối đa trong toàn bộ khuôn viên bãi đỗ xe là 10km/h.", OrderIndex = 1 },
            new Repositories.Entities.Regulation { Content = "Tuân thủ tuyệt đối chỉ dẫn của nhân viên và biển báo thông minh.", OrderIndex = 2 },
            new Repositories.Entities.Regulation { Content = "Thực hiện thanh toán trực tuyến qua ứng dụng trước khi ra cổng chắn.", OrderIndex = 3 },
            new Repositories.Entities.Regulation { Content = "Không chứa các chất dễ cháy nổ, vũ khí hoặc hàng cấm trong phương tiện.", OrderIndex = 4 },
            new Repositories.Entities.Regulation { Content = "Tự bảo quản tài sản cá nhân có giá trị. Ban quản lý không chịu trách nhiệm mất mát trong xe.", OrderIndex = 5 }
        };
        await db.Regulations.AddRangeAsync(regs);
        await db.SaveChangesAsync();
        Console.WriteLine("Seeded 6 default parking regulations.");
    }

    // Seed default parking sessions if none exist in the database
    if (!await db.ParkingSessions.AnyAsync())
    {
        var firstAdmin = await db.Users.FirstOrDefaultAsync(u => u.Email == "vietvanphan04@gmail.com" || u.Email == "vietvanphan430@gmail.com");
        var devUser = await db.Users.FirstOrDefaultAsync(u => u.Email == "user@pbm.dev");
        var adminId = firstAdmin?.Id;
        var devUserId = devUser?.Id;

        var sessions = new List<Repositories.Entities.ParkingSession>
        {
            // Completed Session 1
            new Repositories.Entities.ParkingSession
            {
                UserId = devUserId,
                LicensePlate = "51G-888.88",
                QrCode = "QR-51G88888-COMPLETED",
                EntryPhoto = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400",
                ExitPhoto = "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=400",
                EntryTime = DateTime.UtcNow.AddHours(-6),
                ExitTime = DateTime.UtcNow.AddHours(-1),
                Status = "Completed",
                ExitLicensePlate = "51G-888.88",
                IsPlateMatched = true,
                IsCheckedIn = true,
                ParkingLotName = "Landmark 81 - Bãi đỗ A1",
                VehicleType = "Car",
                ParkingSlot = "105"
            },
            // Active Reservation for vietvanphan
            new Repositories.Entities.ParkingSession
            {
                UserId = adminId,
                LicensePlate = "30A-999.99",
                QrCode = "QR-30A99999-RESERVED",
                EntryPhoto = null,
                ExitPhoto = null,
                EntryTime = DateTime.UtcNow,
                ExitTime = null,
                Status = "Pending",
                IsCheckedIn = false,
                ParkingLotName = "Landmark 81 - Bãi đỗ A1",
                VehicleType = "Car",
                ParkingSlot = "102",
                ReservationDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),
                ReservationStartTime = "15:00"
            },
            // Another active reservation for devUser
            new Repositories.Entities.ParkingSession
            {
                UserId = devUserId,
                LicensePlate = "51F-111.11",
                QrCode = "QR-51F11111-RESERVED",
                EntryPhoto = null,
                ExitPhoto = null,
                EntryTime = DateTime.UtcNow,
                ExitTime = null,
                Status = "Pending",
                IsCheckedIn = false,
                ParkingLotName = "Bitexco Financial - Bãi đỗ B2",
                VehicleType = "Car",
                ParkingSlot = "B102",
                ReservationDate = DateTime.UtcNow.AddDays(1).ToString("yyyy-MM-dd"),
                ReservationStartTime = "09:00"
            },
            // Active parked car
            new Repositories.Entities.ParkingSession
            {
                UserId = devUserId,
                LicensePlate = "29D-111.22",
                QrCode = "QR-29D11122-ACTIVE",
                EntryPhoto = "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&q=80&w=400",
                ExitPhoto = null,
                EntryTime = DateTime.UtcNow.AddHours(-2),
                ExitTime = null,
                Status = "Active",
                IsCheckedIn = true,
                ParkingLotName = "Landmark 81 - Bãi đỗ A1",
                VehicleType = "Car",
                ParkingSlot = "104"
            }
        };
        await db.ParkingSessions.AddRangeAsync(sessions);
        await db.SaveChangesAsync();
        Console.WriteLine("Seeded default parking sessions and active reservations linked to users.");
    }

    // Seed default payments if none exist in the database
    if (!await db.Payments.AnyAsync())
    {
        var completedSession = await db.ParkingSessions.FirstOrDefaultAsync(s => s.LicensePlate == "51G-888.88" && s.Status == "Completed");
        var activeRes = await db.ParkingSessions.FirstOrDefaultAsync(s => s.LicensePlate == "30A-999.99" && s.Status == "Pending");
        
        var payments = new List<Repositories.Entities.Payment>();

        if (completedSession != null)
        {
            payments.Add(new Repositories.Entities.Payment
            {
                SessionId = completedSession.Id,
                UserId = completedSession.UserId,
                LicensePlate = completedSession.LicensePlate,
                Amount = 45000,
                PaymentMethod = "MoMo",
                Status = "Success",
                TransactionId = "TXN-MOMO-88888",
                TransactionTime = completedSession.ExitTime ?? DateTime.UtcNow
            });
        }

        if (activeRes != null)
        {
            payments.Add(new Repositories.Entities.Payment
            {
                SessionId = activeRes.Id,
                UserId = activeRes.UserId,
                LicensePlate = activeRes.LicensePlate,
                Amount = 50000,
                PaymentMethod = "Visa",
                Status = "Success",
                TransactionId = "TXN-VISA-99999",
                TransactionTime = activeRes.EntryTime
            });
        }

        if (payments.Count > 0)
        {
            await db.Payments.AddRangeAsync(payments);
            await db.SaveChangesAsync();
            Console.WriteLine("Seeded default payment records linked to parking sessions.");
        }
    }

    // Seed default incidents if none exist in the database
    if (!await db.Incidents.AnyAsync())
    {
        var defaultIncidents = new List<Repositories.Entities.Incident>
        {
            new Repositories.Entities.Incident
            {
                Type = "Thiết bị hỏng",
                Title = "Camera AI nhận diện biển số ở cổng vào bị mất kết nối",
                Description = "Hệ thống camera quét biển số xe ô tô tại cổng vào chính Landmark 81 không hoạt động, cần reset lại server hoặc phần cứng camera.",
                Branch = "Landmark 81 - Bãi đỗ A1",
                Floor = "Tầng 1",
                Urgency = "Khẩn cấp",
                Reporter = "Lê Minh Quốc (Staff)",
                Role = "Nhân viên",
                Status = "Chờ xử lý"
            },
            new Repositories.Entities.Incident
            {
                Type = "Lỗi thanh toán",
                Title = "Khách hàng gặp lỗi trừ tiền nhưng không nhận được QR vé",
                Description = "Khách hàng dùng Momo thanh toán đặt chỗ hết 45,000đ, tài khoản Momo đã trừ nhưng hệ thống không trả mã QR kích hoạt cửa vào.",
                Branch = "Bitexco Financial - Bãi đỗ B2",
                Floor = "Tầng 2",
                Urgency = "Cao",
                Reporter = "Trần Thị Mỹ Linh (Customer)",
                Role = "Khách hàng",
                Status = "Chờ xử lý"
            },
            new Repositories.Entities.Incident
            {
                Type = "Xe đỗ sai vị trí",
                Title = "Xe máy đỗ chắn lối rẽ xe ô tô xuống hầm",
                Description = "Xe máy mang biển kiểm soát 59X3-123.45 đỗ chắn tại lối rẽ xuống hầm B3 làm ùn tắc xe ô tô ra vào.",
                Branch = "Vincom Center - Bãi đỗ V3",
                Floor = "Hầm B3",
                Urgency = "Bình thường",
                Reporter = "Nguyễn Văn Hùng (Staff)",
                Role = "Nhân viên",
                Status = "Chờ xử lý"
            }
        };
        await db.Incidents.AddRangeAsync(defaultIncidents);
        await db.SaveChangesAsync();
        Console.WriteLine("Seeded default incidents.");
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
