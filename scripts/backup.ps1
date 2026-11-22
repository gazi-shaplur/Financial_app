$ErrorActionPreference = "Stop"
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$backupDir = "D:\KHATA_FINANCIAL\backups"
New-Item -ItemType Directory -Force -Path $backupDir | Out-Null
$file = Join-Path $backupDir "budgetbook-$timestamp.dump"
$env:PGPASSWORD = $env:BUDGETBOOK_DB_PASSWORD
& "C:\Program Files\PostgreSQL\17\bin\pg_dump.exe" `
  -h $env:BUDGETBOOK_DB_HOST `
  -U $env:BUDGETBOOK_DB_USER `
  -d $env:BUDGETBOOK_DB_NAME `
  -Fc `
  -f $file
Write-Output $file
