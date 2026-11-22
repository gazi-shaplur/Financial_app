# BudgetBook Production Deployment Guide

## 1. Prerequisites

- Linux server or Docker host with Docker Engine and Compose
- PostgreSQL 17 recommended
- DNS records for `app.example.com` and `api.example.com`
- TLS certificate for each domain
- Node.js 22 only for non-container deployments

## 2. Environment

Copy the examples and replace every secret:

```bash
cp .env.example .env
cp apps/api/.env.production.example apps/api/.env
cp apps/web/.env.production.example apps/web/.env.local
```

Required production values:

- `POSTGRES_PASSWORD`: strong random database password
- `DATABASE_URL`: managed PostgreSQL connection string
- `CORS_ORIGIN`: exact frontend origin
- `NEXT_PUBLIC_API_URL`: public API origin
- `NODE_ENV=production`
- `LOG_LEVEL=info`

Never commit `.env`, database passwords or certificates.

## 3. Database

Create the database and user, then deploy migrations:

```bash
cd apps/api
npx prisma migrate deploy
npx prisma generate
```

For Docker deployment, the API container runs `prisma migrate deploy` before startup.

## 4. HTTPS and domains

Place `fullchain.pem` and `privkey.pem` under `certs/`.

Update `nginx.conf` hostnames and deploy:

```bash
docker compose up -d --build
docker compose ps
```

The proxy terminates HTTPS and forwards the frontend to port 3000 and API to port 3001.

## 5. Super Admin bootstrap

Set environment variables before executing:

```bash
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD='strong-random-password'
SUPER_ADMIN_NAME='Super Administrator'
npm run create-super-admin -w apps/api
```

Use the database or secret-manager environment for this command. Rotate the password after first login.

## 6. Migration strategy

1. Back up the database.
2. Deploy read-compatible migrations.
3. Run `prisma migrate deploy`.
4. Deploy the API.
5. Deploy the frontend.
6. Run smoke tests.
7. Keep the previous release available for rollback.

## 7. Monitoring

- API logs are structured with Pino and redact cookies and authorization headers.
- Configure log shipping or a managed logging provider.
- Configure uptime checks for `/api/health`.
- Configure database, disk and memory alerts.
- Configure error monitoring and alert routing.

## 8. Release checklist

- HTTPS certificate valid
- Database migration applied
- Backup completed
- Environment secrets configured
- CORS origin matches the production frontend
- Registration and maintenance settings verified
- Super Admin login verified
- User login and finance operations verified
- Admin operations verified
- CSV export tested
- Mobile and desktop UI tested
