# BudgetBook Troubleshooting

## API is unavailable

1. Check `/api/health`.
2. Review API container logs.
3. Verify `DATABASE_URL` and PostgreSQL health.
4. Confirm migrations completed successfully.
5. Verify port 3001 and reverse-proxy routing.

## Frontend cannot call the API

1. Verify `NEXT_PUBLIC_API_URL`.
2. Verify `CORS_ORIGIN` exactly matches the browser origin.
3. Use HTTPS for both domains in production.
4. Confirm session cookies use a valid HTTPS domain and `SameSite=Lax`.

## Database migration failed

1. Stop application deployments.
2. Inspect migration state with `npx prisma migrate status`.
3. Restore the latest known backup if the migration damaged data.
4. Apply migrations explicitly with `npx prisma migrate deploy`.
5. Do not use `migrate reset` in production.

## Login fails

1. Verify the account exists and status is `ACTIVE`.
2. Reset the password using the secure reset flow.
3. If account sessions are revoked, sign in again.
4. Check password-reset and SMTP configuration.

## Backup restore fails

1. Verify PostgreSQL credentials.
2. Confirm the dump format and file integrity.
3. Restore into a clean recovery database first.
4. Verify ownership and schema state after restore.
