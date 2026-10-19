# Alygen CRM — stack completo em Docker (dev)
# Uso: .\scripts\docker-dev-up.ps1

$ErrorActionPreference = "Stop"
Set-Location (Split-Path $Parent -Parent) -ErrorAction SilentlyContinue
if (-not (Test-Path "docker-compose.yml")) {
  Set-Location $PSScriptRoot\..
}

if (-not (Test-Path "backend\.env")) {
  Write-Host "Copia backend\.env.example -> backend\.env e define GROQ_API_KEY" -ForegroundColor Yellow
}

Write-Host "A arrancar: postgres, backend_python, backend, frontend..." -ForegroundColor Cyan
docker compose up -d --build

Write-Host ""
Write-Host "UI:      http://localhost:4000" -ForegroundColor Green
Write-Host "API:     http://localhost:${env:BACKEND_HOST_PORT:-3101} (ou porta em .env)" -ForegroundColor Green
Write-Host "Python:  http://localhost:3003" -ForegroundColor Green
Write-Host "Postgres: localhost:5432 (alygen_crm)" -ForegroundColor Green
Write-Host ""
Write-Host "Teste analise (dentro do backend):" -ForegroundColor Cyan
Write-Host "  docker exec alygencrm-backend-1 node scripts/e2e-docker-analyze.mjs https://zeniteclinic.com/"
