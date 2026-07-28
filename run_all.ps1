# Self-contained PowerShell script to run PMSystem BE, FE, and Staff Gate Simulator

Write-Host "=============================================" -ForegroundColor Green
Write-Host "Starting Parking Management System Services..." -ForegroundColor Green
Write-Host "=============================================" -ForegroundColor Green

# 1. Start C# Backend (Port 53569/53568)
Write-Host "Launching C# Backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\parking-system\BE\PBMSystem\PBMSystem\PBMSystem.API'; Write-Host 'Starting C# Backend API...'; dotnet run"


# 2. Start Main Frontend (Port 5173)
Write-Host "Launching Main Frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\parking-system\FE'; Write-Host 'Starting Main Frontend (Vite on port 5173)...'; npm run dev"

# 3. Start Staff Gate Simulator (Port 5174 HTTPS)
Write-Host "Launching Staff Gate Simulator..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\parking-staff'; Write-Host 'Starting Staff Gate Simulator (Vite on port 5174 HTTPS)...'; npm run dev"

Write-Host ""
Write-Host "All services launched in separate windows!" -ForegroundColor Green
Write-Host "- Backend API: http://localhost:53569 / https://localhost:53568" -ForegroundColor Gray
Write-Host "- Main App (FE): http://localhost:5173" -ForegroundColor Gray
Write-Host "- Staff Gate: https://localhost:5174" -ForegroundColor Gray
Write-Host "=============================================" -ForegroundColor Green
Write-Host "Press any key to close this launcher..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
