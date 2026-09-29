# Alygen CRM — arranque Docker no PC (Windows)
$ErrorActionPreference = "Stop"
$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $Root

if (-not (Test-Path ".env")) {
  Copy-Item ".env.docker.example" ".env"
  Write-Host "Criado .env a partir de .env.docker.example — edita PGPASSWORD, JWT_SECRET e ALYGEN_API_KEY antes de produção real."
}

if (-not (Test-Path "backend\.env")) {
  Copy-Item "backend\.env.example" "backend\.env"
  Write-Host "Criado backend\.env — adiciona GROQ_API_KEY."
}

Write-Host "A construir imagens (primeira vez pode demorar vários minutos)..."
docker compose -f docker-compose.prod.yml up -d --build

Write-Host ""
Write-Host "CRM disponível em: http://localhost:8080"
Write-Host "Logs: docker compose -f docker-compose.prod.yml logs -f backend"
