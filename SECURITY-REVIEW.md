# BudgetBook Security Review

## Findings Addressed

1. Transaction, income, to-do, recurring and category update operations now use explicit field allowlists.
2. Recurring transactions validate account and category ownership before creation/update.
3. CSV text fields neutralize leading `=`, `+`, `-`, and `@` spreadsheet formula characters.

## Security Controls

- bcrypt password hashing
- SHA-256-hashed HTTP-only session cookies
- Session expiry and revocation
- Password reset expiry and session revocation
- Server-side role guards
- User data ownership boundaries
- CORS allowlist
- Helmet security headers
- HSTS in production
- Structured redacted logging
- Prisma parameterized database access
- Explicit validation and unknown-field rejection

## Remaining Production Work

- CSRF verification for cookie-authenticated state-changing browser requests
- Managed SMTP/provider for password reset
- MFA
- Centralized error and security monitoring
- HTTPS certificates and DNS for the production domains
- Automated dependency and container image scanning
