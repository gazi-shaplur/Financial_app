param(
  [Parameter(Mandatory=$true)]
  [string]$BackupFile
)
$ErrorActionPreference = "Stop"
if (-not (Test-Path -LiteralPath $BackupFile)) { throw "Backup file not found: $BackupFile" }
$env:PGPASSWORD = $env:BUDGETBOOK_DB_PASSWORD
& "C:\Program Files\PostgreSQL\17\bin\pg_restore.exe" `
  --clean --if-exists `
  -h $env:BUDGETBOOK_DB_HOST `
  -U $env:BUDGETBOOK_DB_USER `
  -d $env:BUDGETBOOK_DB_NAME `
  $BackupFile
