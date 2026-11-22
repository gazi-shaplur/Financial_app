# BudgetBook Super Admin Guide

## Access

Sign in with a Super Admin account and open `/admin`. Administrative routes are protected by server-side authentication and role checks.

## User management

- Search users by name or email.
- Filter by account status.
- Suspend, restore or soft-delete accounts.
- Review the individual account and activity where available.
- Soft deletion revokes active sessions and prevents normal login.

## Categories

Create income or expense categories, configure icons and colors, set display order, and enable or disable system categories.

## Application settings

Manage application name, logo, currencies, date format, default preferences, registration availability and maintenance mode. Public settings are readable by authorized application endpoints; sensitive settings remain admin-only.

## Roles and permissions

Review available roles and assign role permissions. Super Admin is restricted to privileged operators. Role changes are audit logged.

## Announcements

Create and publish announcements for maintenance, warnings or general information. Deleting an announcement soft-removes it.

## Audit logs

Review administrator login, status changes, role changes, settings, category and announcement activity. Audit entries include timestamps and administrator IDs.
