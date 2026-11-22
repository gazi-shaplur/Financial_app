# BudgetBook

BudgetBook is a full-stack personal finance management application.

## Stack

- Frontend: Next.js 16, React 19, Tailwind CSS
- Backend: NestJS 12, TypeScript
- Database: PostgreSQL 17 with Prisma
- API documentation: Swagger/OpenAPI

## Prerequisites

- Node.js 22 or newer
- npm 10 or newer
- PostgreSQL 17

## Setup

1. Copy the environment examples:
   - `copy .env.example .env`
   - `copy apps\api\.env.example apps\api\.env`
   - `copy apps\web\.env.example apps\web\.env.local`
2. Create the PostgreSQL database:
   - Database: `budgetbook`
   - User: `postgres`
   - Password: `budgetbook_dev`
3. Install dependencies:
   - `npm install`
4. Generate Prisma and apply migrations:
   - `npm run db:generate`
   - `npm run db:migrate`
5. Start both applications:
   - `npm run dev`

Frontend: `http://localhost:3000`

API: `http://localhost:3001`

Swagger: `http://localhost:3001/api/docs`

Health check: `http://localhost:3001/api/health`

## Project Structure

```text
apps/
  web/       Next.js user interface
  api/       NestJS API
      src/
        common/
        database/
        modules/
      prisma/
```

Planned API modules:

- authentication
- users
- dashboard
- transactions
- categories
- budgets
- savings
- todos
- reports
- admin
- settings

## Database

Prisma migrations are stored in `apps/api/prisma/migrations`.

Financial amounts use `NUMERIC(20,4)` to avoid floating-point arithmetic issues.
User-visible financial records are scope-controlled by the authenticated user.

## Implemented Finance Routes

- `/` — database-backed dashboard
- `/income` — income CRUD and monthly history
- `/expenses` — expense CRUD, search and monthly history
- `/budgets` — monthly budget and category allocation
- `/savings` — savings goals and transaction balances
- `/todos` — pending/completed tasks with optional amounts

## Implemented Super Admin Routes

- `/admin` — application overview and registration trend
- `/admin/users` — user search, status controls and safeguards
- `/admin/categories` — system category CRUD and configuration
- `/admin/roles` — role and permission visibility/configuration
- `/admin/settings` — database-backed application settings
- `/admin/announcements` — active content management
- `/admin/audit` — administrative audit records

## Implemented Advanced Features

- `/reports` — monthly analytics, category analysis, savings trends, range summaries and exports
- `/recurring` — recurring schedule creation, pause, resume and cancellation
- `/notifications` — budget, expense, savings, recurring and system notifications
- CSV export endpoint: `GET /api/reports/transactions.csv`
- Printable reports: use the Print Report action on `/reports`
- Scheduled recurring processing: hourly plus startup reconciliation

## Local Hosting

Prerequisites:

- PostgreSQL running on `localhost:5432`
- `budgetbook` database available
- API environment configured in `apps/api/.env`
- Frontend environment configured in `apps/web/.env.local`

Start both applications:

```powershell
npm run dev
```

Use production builds locally:

```powershell
npm run build
npm run start:local
```

Local URLs:

- Frontend: `http://localhost:3000`
- API: `http://localhost:3001`
- API health: `http://localhost:3001/api/health`
- Swagger: `http://localhost:3001/api/docs`

## Google Sign-In Setup

1. Create a Google OAuth 2.0 Web application in Google Cloud Console.
2. Add the authorized redirect URI:
   - Local: `http://localhost:3001/api/auth/google/callback`
   - Production: `https://api.example.com/api/auth/google/callback`
3. Set these variables in `apps/api/.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
   - `GOOGLE_CALLBACK_URL`
   - `FRONTEND_URL`
4. Restart the API and use **Continue with Google** on the login or registration page.

## Production Documentation

- [Deployment guide](DEPLOYMENT.md)
- [Backup and recovery guide](BACKUP-RECOVERY.md)
- [Super Admin guide](ADMIN-GUIDE.md)
- [Troubleshooting guide](TROUBLESHOOTING.md)
- [Security review](SECURITY-REVIEW.md)

Before public deployment, replace example domains and secrets, install TLS certificates, configure DNS and use a managed PostgreSQL service.
