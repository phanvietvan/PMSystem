# PBMSystem

.NET 8 Web API solution with JWT authentication, Email OTP, code-first EF Core database, and Repository pattern.
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

### Session 3 — Bug fixes
- Added missing `Repositories/Configuration/JwtSettings.cs` (dropped during rename)
- Added missing NuGet packages to `Repositories.csproj`:
  `Microsoft.Extensions.Configuration`, `Microsoft.Extensions.Configuration.FileExtensions`,
  `Microsoft.Extensions.Configuration.Json`, `Microsoft.Extensions.Configuration.EnvironmentVariables`
  (required by `DesignTimeDbContextFactory` — `SetBasePath` lives in FileExtensions)

### Session 4 — Email OTP (Registration + Forgot Password)
Added a full 2-step OTP email flow for both registration and password reset using Mailtrap for local SMTP testing.

**Repositories changes:**
- `Entities/User.cs` — added `OtpCode` (string?) and `OtpExpiry` (DateTime?)
- `DTOs/AuthDTOs.cs` — added `SendRegisterOtpRequest`, `VerifyRegisterOtpRequest`, `ForgotPasswordRequest`, `ResetPasswordRequest`
- `Configuration/SmtpSettings.cs` — new strongly-typed SMTP config model
- `Interfaces/IUserRepository.cs` — added `GetPendingByEmailAsync`
- `Implementations/UserRepository.cs` — implemented `GetPendingByEmailAsync` using `IgnoreQueryFilters()` to find pre-active rows
- `AppDbContext.cs` — added `OtpCode` (max 6 chars) and `OtpExpiry` column config

**Services changes:**
- `Services.csproj` — added `MailKit 4.4.0` and `MimeKit 4.4.0`
- `Interfaces/IEmailService.cs` — new contract with `SendOtpEmailAsync` and `EmailOtpPurpose` enum
- `Implementations/EmailService.cs` — MailKit SMTP implementation; StartTls; HTML email templates per purpose
- `Interfaces/IAuthService.cs` — added 4 new OTP methods; removed old direct `RegisterAsync`
- `Implementations/AuthService.cs` — added all 4 OTP flows; `LoginAsync` now blocks `PendingVerification` accounts; `GenerateOtp()` uses `RandomNumberGenerator` for cryptographically safe 6-digit codes; OTP cleared from DB after successful use
- `ServiceCollectionExtensions.cs` — registered `IEmailService → EmailService`

**PBMSystem.API changes:**
- `Program.cs` — added `SmtpSettings` binding
- `appsettings.Development.json` — added `SmtpSettings` block (Mailtrap sandbox)
- `Controllers/AuthController.cs` — added 4 new endpoints; now 10 endpoints total

**Migration required after pulling this session:**
```bash
dotnet ef migrations add AddOtpFields --project ../Repositories
dotnet ef database update --project ../Repositories
```

---

## Solution Structure

```
PBMSystem/
├── PBMSystem.sln
│
├── PBMSystem.API/                          ← ASP.NET Core Web API (entry point)
│   ├── Controllers/
│   │   └── AuthController.cs               ← 10 auth endpoints
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
│   │   ├── User.cs                         ← includes OtpCode, OtpExpiry
│   │   └── RefreshToken.cs
│   ├── Enums/UserStatus.cs                 ← Active, Inactive, Banned, PendingVerification
│   ├── DTOs/AuthDTOs.cs                    ← all request/response types + ApiResponse<T>
│   ├── Configuration/
│   │   ├── JwtSettings.cs
│   │   └── SmtpSettings.cs                 ← Host, Port, Username, Password, FromAddress, FromName
│   ├── Interfaces/
│   │   ├── IRepository.cs                  ← generic CRUD + soft-delete contract
│   │   ├── IUserRepository.cs              ← includes GetPendingByEmailAsync
│   │   └── IRefreshTokenRepository.cs
│   ├── Implementations/
│   │   ├── Repository.cs                   ← generic base; all new repos inherit this
│   │   ├── UserRepository.cs
│   │   └── RefreshTokenRepository.cs
│   ├── AppDbContext.cs                     ← fluent config, unique indexes, soft-delete filter, auto-UpdatedAt
│   ├── DesignTimeDbContextFactory.cs       ← allows EF CLI to run migrations without starting the API
│   └── RepositoryCollectionExtensions.cs  ← services.AddRepositories()
│
└── Services/                               ← Business logic layer
    ├── Interfaces/
    │   ├── IAuthService.cs                 ← 9 method contracts
    │   ├── ITokenService.cs
    │   └── IEmailService.cs                ← SendOtpEmailAsync + EmailOtpPurpose enum
    ├── Implementations/
    │   ├── AuthService.cs                  ← all auth + OTP flows
    │   ├── TokenService.cs                 ← JWT generation (HMAC-SHA256), cryptographic refresh token
    │   └── EmailService.cs                 ← MailKit SMTP; StartTls; HTML templates
    └── ServiceCollectionExtensions.cs      ← services.AddPBMServices()
```

---

## First-time Setup

### Prerequisites
- .NET 8 SDK
- SQL Server or LocalDB
- A Mailtrap account (free) for local email testing — https://mailtrap.io

### 1. Configure connection string
Edit `PBMSystem.API/appsettings.Development.json` and update `DefaultConnection`.

Never commit secrets. Use user-secrets locally:
```bash
cd PBMSystem.API
dotnet user-secrets set "JwtSettings:SecretKey" "your-strong-32+-char-secret"
dotnet user-secrets set "SmtpSettings:Username" "your-mailtrap-smtp-username"
dotnet user-secrets set "SmtpSettings:Password" "your-mailtrap-smtp-password"
```

### 2. Configure Mailtrap
1. Log in to https://mailtrap.io → Email Testing → Inboxes → your inbox → SMTP Settings
2. Select **.NET** from the integration dropdown to get your credentials
3. Copy the Username and Password into user-secrets as shown above
   (Host is `sandbox.smtp.mailtrap.io`, Port is `587` — already set in appsettings.Development.json)

### 3. Create initial migration + database
```bash
# Run from the PBMSystem.API directory
dotnet ef migrations add InitialCreate --project ../Repositories
dotnet ef database update --project ../Repositories
```

### 4. Run
```bash
dotnet run --project PBMSystem.API
```

Swagger UI — `https://localhost:{port}/swagger` — has a JWT Authorize button for manual testing.

### 5. Seed local dev database (optional)

`pbmsystem_dev.db` is gitignored. After clone, create schema + test users:

**PowerShell** (from `PBMSystem/` solution folder):

```powershell
.\scripts\seed-dev-db.ps1          # migrate + seed
.\scripts\seed-dev-db.ps1 -Fresh   # delete db, migrate, seed
```

**Bash:**

```bash
chmod +x scripts/seed-dev-db.sh
./scripts/seed-dev-db.sh           # migrate + seed
./scripts/seed-dev-db.sh --fresh   # delete db, migrate, seed
```

**Manual equivalent:**

```bash
cd PBMSystem.API
export ASPNETCORE_ENVIRONMENT=Development   # Windows: $env:ASPNETCORE_ENVIRONMENT="Development"
dotnet ef database update --project ../Repositories
dotnet run --project ../tools/SeedDevUsers -- ../PBMSystem.API/pbmsystem_dev.db
```

Seeded accounts (password for all: `DevPass123!`):

| Email | Username | Role |
|-------|----------|------|
| `user@pbm.dev` | `user_dev` | User |
| `staff@pbm.dev` | `staff_dev` | Staff |
| `admin@pbm.dev` | `admin_dev` | Admin |

No refresh tokens are created. Login via `POST /api/auth/login` to obtain JWTs.

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

| Method | Route | Controller | Auth | Description |
|--------|-------|------------|------|-------------|
| POST | `/api/auth/login` | AuthController | Public | Login, receive access + refresh token |
| POST | `/api/auth/refresh` | AuthController | Public | Rotate refresh token |
| POST | `/api/auth/revoke` | AuthController | Bearer | Logout (revoke one refresh token) |
| GET | `/api/auth/me` | AuthController | Bearer | Get authenticated user profile |
| POST | `/api/auth/register/send-otp` | RegistrationController | Public | Step 1: email OTP to begin registration |
| POST | `/api/auth/register/verify` | RegistrationController | Public | Step 2: verify OTP + create account, returns tokens |
| POST | `/api/auth/password/forgot` | PasswordController | Public | Step 1: email OTP to begin password reset |
| POST | `/api/auth/password/reset` | PasswordController | Public | Step 2: verify OTP + set new password |
| POST | `/api/auth/password/change` | PasswordController | Bearer | Change password + revoke all sessions |
| POST | `/api/auth/google` | AuthController | Public | Google ID token or access token login |
| PUT | `/api/auth/profile` | AuthController | Bearer | Update own profile (phone, address) |
| GET | `/api/users` | UsersController | Admin, Staff | List users (excludes pending verification) |
| PUT | `/api/users/{id}` | UsersController | Admin, Staff | Admin update user (role, status, profile) |

See `API_CONTRACT.txt` for full request/response field details for every endpoint.

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
// Services/Interfaces/IAIService.cs            ← team codes against this
// PBMSystem.Infrastructure.AI/OpenAIService.cs ← swappable implementation

// Program.cs
builder.Services.AddScoped<IAIService, OpenAIService>();
```

Rule of thumb — calls an external API you don't own → Infrastructure project. Pure business logic touching only your own database → stays in Services.

### Session 5 — SQLite for FE-BE integration testing
Switched from SQL Server to SQLite so the project runs without a database server during development.
Also updated the OTP email flow so FE-BE testing works without SMTP credentials.

**Why SQLite:**
- File-based — no server to install or configure
- Survives restarts, no concurrency issues (EF Core handles it)
- `.db` file is gitignored — each developer gets their own local copy
- Swap back to SQL Server later with one line in `Program.cs` and one package reference

**Changes made:**
- `Repositories.csproj` — swapped `Microsoft.EntityFrameworkCore.SqlServer` → `Microsoft.EntityFrameworkCore.Sqlite`
- `PBMSystem.API.csproj` — same package swap
- `Repositories/DesignTimeDbContextFactory.cs` — `UseSqlServer` → `UseSqlite`
- `Program.cs` — `UseSqlServer` → `UseSqlite`; auto-migrate now runs in all environments (not just Development), so the `.db` file is created automatically on first run with no manual commands
- `appsettings.json` — connection string changed to `Data Source=pbmsystem.db`
- `appsettings.Development.json` — connection string changed to `Data Source=pbmsystem_dev.db`
- `.gitignore` — updated comment to explicitly mention SQLite

**OTP dev-mode bypass:**
- `Repositories/DTOs/AuthDTOs.cs` — added `OtpSendResponse` DTO with an `otpCode` field (null in production)
- `Services/Interfaces/IEmailService.cs` — `SendOtpEmailAsync` now returns `string?` (the OTP in dev, null in production)
- `Services/Implementations/EmailService.cs` — in Development: skips SMTP entirely, logs the OTP to console, and returns it to the caller. In Production: sends real email and returns null
- `Services/Interfaces/IAuthService.cs` — OTP send methods now return `ApiResponse<OtpSendResponse>`
- `Services/Implementations/AuthService.cs` — updated to pass OTP value through to response
- `PBMSystem.API/Controllers/AuthController.cs` — updated return types; dev-mode behaviour documented in XML comments

**To switch to SQL Server when the database is ready:**
1. In `Repositories.csproj` — replace `Microsoft.EntityFrameworkCore.Sqlite` with `Microsoft.EntityFrameworkCore.SqlServer`
2. In `PBMSystem.API.csproj` — same package swap
3. In `Program.cs` — replace `UseSqlite(...)` with `UseSqlServer(...)`
4. In `DesignTimeDbContextFactory.cs` — replace `UseSqlite(...)` with `UseSqlServer(...)`
5. Update the connection string in `appsettings.json` / `appsettings.Development.json`
6. Run `dotnet ef migrations add SqlServerMigration --project ../Repositories` if the schema has changed

### Session 6 — SRP Controller split
Split the single `AuthController` into three focused controllers following the Single Responsibility Principle.
No changes to the Services layer, DTOs, or business logic — purely a routing restructure.

- `AuthController` — base route `api/auth` — session management (login, refresh, revoke, me)
- `RegistrationController` — base route `api/auth/register` — onboarding flow (send-otp, verify)
- `PasswordController` — base route `api/auth/password` — all password operations (forgot, reset, change)

Also fixed: `register/verify-otp` renamed to `register/verify` — the context of the route already implies OTP.

### Session 7 — Email OTP sender implementation + Mailtrap toggle
Fully implemented the email sending logic with three clearly separated modes.

**Changes made:**
- `Repositories/Configuration/SmtpSettings.cs` — added `EnableMailtrap` boolean toggle
- `Services/Implementations/EmailService.cs` — split into three distinct modes (see below)
- `PBMSystem.API/appsettings.Development.json` — added `EnableMailtrap: false` to SmtpSettings block

**Three modes:**

| Mode | When | Behaviour |
|------|------|-----------|
| Dev default | Development + `EnableMailtrap: false` | Skips SMTP entirely. OTP printed to console and returned in API response. No credentials needed. |
| Dev + Mailtrap | Development + `EnableMailtrap: true` | Sends real email to Mailtrap sandbox inbox. OTP still returned in API response for convenience. Falls back to console-only if credentials are wrong. |
| Production | Any non-Development environment | Sends real email via configured SMTP. OTP never exposed in response. |

**To enable Mailtrap testing:**
1. Log in to https://mailtrap.io → Email Testing → Inboxes → your inbox → SMTP Settings
2. Select `.NET` from the integration dropdown to get credentials
3. Set `Username` and `Password` in `appsettings.Development.json` (or via user-secrets)
4. Set `EnableMailtrap: true` in `appsettings.Development.json`
5. Run the API — OTPs will appear in your Mailtrap inbox AND in the API response

**To go back to response-only mode:** set `EnableMailtrap: false`. No other changes needed.

### Session 8 — OTP send cooldown (60-second rate limit per email)
Added a 60-second cooldown on both OTP send endpoints to prevent email spam/abuse.

**Changes made:**
- `Repositories/Entities/User.cs` — added `OtpLastSentAt` (DateTime?) field
- `Repositories/AppDbContext.cs` — registered `OtpLastSentAt` column config
- `Services/Implementations/AuthService.cs` — added shared `CheckOtpCooldown<T>()` private helper; wired into both `SendRegisterOtpAsync` and `SendForgotPasswordOtpAsync`

**How it works:**
- `OtpLastSentAt` is stamped on the user record every time an OTP is sent
- On the next send request, the elapsed time since `OtpLastSentAt` is checked
- If less than 60 seconds have passed, the request is rejected with the exact seconds remaining
- On successful verification (register or reset), `OtpLastSentAt` is cleared along with `OtpCode` and `OtpExpiry`

**Migration required:**
```bash
dotnet ef migrations add AddOtpLastSentAt --project ../Repositories
dotnet ef database update --project ../Repositories
```

### Session 9 — Google login, roles, and profile
Merged features from a parallel auth branch into the OTP/SQLite base. Vehicle-related fields (license plate, vehicle type) were intentionally excluded.

**Repositories changes:**
- `Enums/UserRole.cs` — `User`, `Staff`, `Admin`
- `Entities/User.cs` — added `PhoneNumber`, `Address`, `Role` (default `User`)
- `DTOs/AuthDTOs.cs` — `GoogleLoginRequest`, `UpdateProfileRequest`, `AdminUpdateUserRequest`; extended `UserResponse` with profile, role, status, `LastLoginAt`
- `AppDbContext.cs` — fluent config for new columns
- Migration `AddRoleAndProfile`

**Services changes:**
- `Services.csproj` — `Google.Apis.Auth`
- `Interfaces/IAuthService.cs` — Google login, profile update, list users, admin update
- `Implementations/AuthService.cs` — Google login (ID token or access token via userinfo); completes `PendingVerification` accounts via Google; admin/Staff rules (Staff cannot assign Admin)
- `Implementations/TokenService.cs` — `ClaimTypes.Role` in JWT

**PBMSystem.API changes:**
- `Extensions/ClaimsPrincipalExtensions.cs` — `GetUserRole()`
- `Controllers/AuthController.cs` — `POST google`, `PUT profile`
- `Controllers/UsersController.cs` — `GET /api/users`, `PUT /api/users/{id}` (`Admin`, `Staff`)

**Migration required after pulling:**
```bash
dotnet ef database update --project ../Repositories
```
(Or delete local `pbmsystem_dev.db` and restart — auto-migrate applies on startup.)

**Dev users:** use `scripts/seed-dev-db.ps1` (includes an Admin account). See **First-time Setup → Seed local dev database**.

See `API_CONTRACT.txt` — **After-merge (Session 9)** section for new endpoint details.
