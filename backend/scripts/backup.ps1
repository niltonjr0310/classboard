# Backup do banco do ClassBoard (Neon) em arquivo .dump, com a data no nome.
# Uso (PowerShell):  powershell -ExecutionPolicy Bypass -File backend\scripts\backup.ps1
# Requer o pg_dump 18 (PostgreSQL 18 - Command Line Tools).

$pgDump = "C:\Program Files\PostgreSQL\18\bin\pg_dump.exe"
if (-not (Test-Path $pgDump)) {
  Write-Host "pg_dump 18 nao encontrado em: $pgDump" -ForegroundColor Red
  exit 1
}

$url = $env:DATABASE_URL
if (-not $url) {
  $url = Read-Host "Cole a URL DIRETA do Neon (sem -pooler)"
}

$pasta = Join-Path $HOME "Documents\backups-classboard"
New-Item -ItemType Directory -Force -Path $pasta | Out-Null
$arquivo = Join-Path $pasta ("classboard-" + (Get-Date -Format "yyyy-MM-dd") + ".dump")

& $pgDump $url -Fc -f $arquivo
if ($LASTEXITCODE -ne 0) {
  Write-Host "Falhou. Veja a mensagem acima." -ForegroundColor Red
  exit 1
}

$kb = [math]::Round((Get-Item $arquivo).Length / 1KB)
Write-Host "Backup pronto: $arquivo ($kb KB)" -ForegroundColor Green
Write-Host "Agora copie esse arquivo para o Google Drive (ou outro lugar fora deste computador)."
