@echo off
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File .\run_all.ps1
pause
