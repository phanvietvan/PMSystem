# Creates / updates pbmsystem_dev.db and seeds 3 dev users (User, Staff, Admin).
# Requires: .NET 8 SDK, run from anywhere.
#
# Usage:
#   .\scripts\seed-dev-db.ps1           # migrate + seed (keeps existing file)
#   .\scripts\seed-dev-db.ps1 -Fresh    # delete dev db, migrate, seed

param(
    [switch]$Fresh
)

$ErrorActionPreference = "Stop"
$Root = Split-Path $PSScriptRoot -Parent
$ApiDir = Join-Path $Root "PBMSystem.API"
$DbPath = Join-Path $ApiDir "pbmsystem_dev.db"
$SeedProject = Join-Path $Root "tools\SeedDevUsers\SeedDevUsers.csproj"

$env:ASPNETCORE_ENVIRONMENT = "Development"

if ($Fresh -and (Test-Path $DbPath)) {
    Remove-Item $DbPath -Force
    Write-Host "Removed existing database: $DbPath"
}

Push-Location $ApiDir
try {
    Write-Host "Applying EF migrations..."
    dotnet ef database update --project ..\Repositories

    Write-Host "Seeding dev users..."
    dotnet run --project $SeedProject -- $DbPath
}
finally {
    Pop-Location
}

Write-Host ""
Write-Host "Done. Start API with: dotnet run --project PBMSystem.API"
Write-Host "Set JwtSettings:SecretKey via user-secrets if you need a non-placeholder key for local JWT testing."
