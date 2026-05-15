# PBMSystem

.NET 8 Web API solution with JWT authentication, code-first EF Core database, and Repository pattern.
Built as a clean base for parallel team development — each layer is a separate project with no cross-layer leakage.

---

## Session History

### Session 1 — Initial scaffold (AuthSolution)
Built a 3-project .NET 8 solution from scratch:
- `AuthApi` — ASP.NET Core Web API with JWT bearer authentication
- `AuthModels` — EF Core DbContext, entities (User, RefreshToken), DTOs, and JwtSettings config
- `AuthServices` — business logic layer with AuthService and TokenService

Implemented: register, login, refresh token rotation, revoke token, change password, get profile.
All responses use a consistent `ApiResponse<T>` wrapper. Global exception middleware prevents stack traces leaking to clients.

### Session 2 — Renamed + Repository pattern (PBMSystem)
Renamed the entire solution to `PBMSystem` and restructured:

- `AuthApi` → `PBMSystem.API`
- `AuthModels` → `Repositories` (converted from a plain models project into a proper Repository pattern project)
- `AuthServices` → `Services`

What the Repositories restructure added:
- `IRepository<TEntity>` — generic CRUD contract (Add, Find, SoftDelete, Count, etc.)
- `IUserRepository` / `IRefreshTokenRepository` — entity-specific query contracts
- `Repository<TEntity>` — generic EF Core base implementation; no boilerplate needed per-entity
- `UserRepository` / `RefreshTokenRepository` — only contain domain-specific queries
- `RepositoryCollectionExtensions` — `services.AddRepositories()` for one-line DI registration

`AuthService` in the Services layer was updated to inject `IUserRepository` and `IRefreshTokenRepository` instead of `AppDbContext` directly, enforcing the separation.

Also discussed and documented the Infrastructure project pattern for future AI/Payment services.

---

## Solution Structure

```
PBMSystem/
├── PBMSystem.sln
│
├── PBMSystem.API/                          ← ASP.NET Core Web API (entry point)
│   ├── Controllers/
│   │   └── AuthController.cs               ← 6 auth endpoints
│   ├── Middleware/
│   │   └── ExceptionMiddleware.cs          ← catches all unhandled exceptions
│   ├── Extensions/
│   │   ├── SwaggerExtensions.cs            ← Swagger with JWT Authorize button
│   │   └── ClaimsPrincipalExtensions.cs    ← User.GetUserId() helper
│   └── Program.cs                          ← composition root; calls AddRepositories() + AddPBMServices()
│
├── Repositories/                           ← Data layer
│   ├── Entities/
│   │   ├── BaseEntity.cs                   ← Id (Guid), CreatedAt, UpdatedAt, IsDeleted
│   │   ├── User.cs
│   │   └── RefreshToken.cs
│   ├── Enums/UserStatus.cs
│   ├── DTOs/AuthDTOs.cs                    ← RegisterRequest, LoginRequest, AuthResponse, ApiResponse<T>, etc.
│   ├── Configuration/JwtSettings.cs
│   ├── Interfaces/
│   │   ├── IRepository.cs                  ← generic CRUD + soft-delete contract
│   │   ├── IUserRepository.cs
│   │   └── IRefreshTokenRepository.cs
│   ├── Implementations/
│   │   ├── Repository.cs                   ← generic base; all new repos inherit this
│   │   ├── UserRepository.cs
│   │   └── RefreshTokenRepository.cs
│   ├── AppDbContext.cs                     ← fluent config, unique indexes, soft-delete global filter, auto-UpdatedAt
│   ├── DesignTimeDbContextFactory.cs       ← allows EF CLI to run migrations without starting the API
│   └── RepositoryCollectionExtensions.cs  ← services.AddRepositories()
│
└── Services/                               ← Business logic layer
    ├── Interfaces/
    │   ├── IAuthService.cs
    │   └── ITokenService.cs
    ├── Implementations/
    │   ├── AuthService.cs                  ← all auth flows; uses IUserRepository + IRefreshTokenRepository
    │   └── TokenService.cs                 ← JWT generation (HMAC-SHA256), cryptographic refresh token, expiry
    └── ServiceCollectionExtensions.cs      ← services.AddPBMServices()
```

---

## First-time Setup

### Prerequisites
- .NET 8 SDK
- SQL Server or LocalDB

### 1. Configure connection string
Edit `PBMSystem.API/appsettings.Development.json`:
```json
"ConnectionStrings": {
  "DefaultConnection": "Server=localhost;Database=PBMSystem_Dev;Trusted_Connection=True;TrustServerCertificate=True;"
}
```

Never commit the JWT secret. Use user-secrets locally:
```bash
cd PBMSystem.API
dotnet user-secrets set "JwtSettings:SecretKey" "your-strong-32+-char-secret"
```

### 2. Create initial migration + database
```bash
# Run from the PBMSystem.API directory
dotnet ef migrations add InitialCreate --project ../Repositories
dotnet ef database update --project ../Repositories
```

### 3. Run
```bash
dotnet run --project PBMSystem.API
```

Swagger UI — `https://localhost:{port}/swagger` — has a JWT Authorize button for manual testing.

---

## Ongoing Migration Workflow

Every time you add or change an entity:
```bash
# From PBMSystem.API directory
dotnet ef migrations add <DescriptiveName> --project ../Repositories
dotnet ef database update --project ../Repositories
```

Roll back one migration:
```bash
dotnet ef database update <PreviousMigrationName> --project ../Repositories
dotnet ef migrations remove --project ../Repositories
```

---

## API Endpoints (current)

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| POST | `/api/auth/register` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login, receive access + refresh token |
| POST | `/api/auth/refresh` | Public | Rotate refresh token |
| POST | `/api/auth/revoke` | Bearer | Logout (revoke one refresh token) |
| POST | `/api/auth/change-password` | Bearer | Change password + revoke all sessions |
| GET | `/api/auth/me` | Bearer | Get authenticated user profile |

---

## Team Extension Patterns

### Add a new Entity + Repository
1. Create `Repositories/Entities/MyEntity.cs` extending `BaseEntity`
2. Add `DbSet<MyEntity>` + fluent config in `AppDbContext.OnModelCreating()`
3. Create `Repositories/Interfaces/IMyEntityRepository.cs` extending `IRepository<MyEntity>`
4. Create `Repositories/Implementations/MyEntityRepository.cs` extending `Repository<MyEntity>`
5. Register in `RepositoryCollectionExtensions`: `services.AddScoped<IMyEntityRepository, MyEntityRepository>()`
6. Run migration

### Add a new Service
1. Create `Services/Interfaces/IMyService.cs`
2. Implement `Services/Implementations/MyService.cs` — inject repository interfaces via constructor
3. Register in `ServiceCollectionExtensions`

### Add a new Controller
1. Create `PBMSystem.API/Controllers/MyController.cs` extending `ControllerBase`
2. Inject your service interface — `Program.cs` does not need to change

---

## Future: AI, Payment, and External Integrations

When adding services that call external APIs (OpenAI, Stripe, VNPAY, SMS, S3), add a dedicated Infrastructure project rather than bloating the Services project.

Recommended growth path:
```
PBMSystem.sln
├── PBMSystem.API
├── Repositories
├── Services
├── PBMSystem.Infrastructure.AI        ← add when integrating AI
└── PBMSystem.Infrastructure.Payment   ← add when integrating payments
```

The rule: define the interface contract in `Services/Interfaces/`, implement it in the Infrastructure project, register the concrete class in `Program.cs`. The API and Services layers never reference Infrastructure directly.

```csharp
// Services/Interfaces/IAIService.cs       ← team codes against this
// PBMSystem.Infrastructure.AI/OpenAIService.cs  ← swappable implementation

// Program.cs
builder.Services.AddScoped<IAIService, OpenAIService>();
```

Rule of thumb — calls an external API you don't own → Infrastructure project. Pure business logic touching only your own database → stays in Services.
