# Backup do banco do ClassBoard (Neon/Postgres) para um arquivo .sql local.
# Uso (PowerShell, na raiz do projeto):  .\scripts\backup-db.ps1
# Requer o cliente do PostgreSQL instalado (pg_dump). Veja docs/BACKUP.md.
$ErrorActionPreference = "Stop"

$envFile = Join-Path $PSScriptRoot "..\backend\.env"
if (-not (Test-Path $envFile)) { throw "Não achei backend\.env" }

$linha = Get-Content $envFile | Where-Object { $_ -match '^\s*DATABASE_URL\s*=' } | Select-Object -First 1
if (-not $linha) { throw "DATABASE_URL não encontrada em backend\.env" }

$url = ($linha -replace '^\s*DATABASE_URL\s*=', '').Trim().Trim('"').Trim("'")
# pg_dump precisa da conexão direta (sem -pooler)
$url = $url -replace '-pooler', ''

if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) {
  throw "pg_dump não encontrado. Instale o PostgreSQL (só 'Command Line Tools') e reabra o terminal."
}

$pasta = Join-Path $PSScriptRoot "..\backups"
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
$arquivo = Join-Path $pasta ("classboard-" + (Get-Date -Format "yyyyMMdd-HHmm") + ".sql")

pg_dump --no-owner --no-privileges --file $arquivo $url
if ($LASTEXITCODE -ne 0) { throw "pg_dump falhou (código $LASTEXITCODE)" }

# mantém só os 12 backups mais recentes
Get-ChildItem $pasta -Filter "classboard-*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -Skip 12 | Remove-Item

Write-Host "Backup salvo em $arquivo"
