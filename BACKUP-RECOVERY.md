# BudgetBook Backup and Recovery

## Native PostgreSQL backup

Set environment variables and run:

```powershell
$env:BUDGETBOOK_DB_HOST="localhost"
$env:BUDGETBOOK_DB_USER="postgres"
$env:BUDGETBOOK_DB_NAME="budgetbook"
$env:BUDGETBOOK_DB_PASSWORD="database-password"
.\scripts\backup.ps1
```

The script creates a timestamped custom PostgreSQL dump under `backups/`.

## Restore

Stop application write traffic, verify the target database, then restore:

```powershell
$env:BUDGETBOOK_DB_HOST="localhost"
$env:BUDGETBOOK_DB_USER="postgres"
$env:BUDGETBOOK_DB_NAME="budgetbook"
$env:BUDGETBOOK_DB_PASSWORD="database-password"
.\scripts\restore.ps1 -BackupFile ".\backups\budgetbook-YYYYMMDD-HHmmss.dump"
```

Restore is destructive and replaces existing objects from the dump.

## Schedule

- Automated daily backup
- Automated 15-minute WAL/PITR backup if supported
- Retention: 7 daily, 4 weekly and 12 monthly backups initially
- Store an encrypted copy outside the application server

## Recovery test

1. Restore the latest dump into a separate database.
2. Run migrations.
3. Start the application against the restored database.
4. Verify login, dashboard, transactions and admin operations.
5. Record the restore time and verify data consistency.
