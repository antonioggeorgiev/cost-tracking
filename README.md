# Cost Tracking

A multi-workspace cost tracking app for renovation spending, daily expenses, recurring costs, and shared debt tracking.

## Purpose

This project exists to replace ad hoc tracking in Notion with a purpose-built web app that supports:

- fast expense entry
- dynamic parent/child categories
- recurring expenses
- manual debt tracking
- shared workspaces with roles
- multi-currency reporting using exchange-rate snapshots

## MVP Highlights

- invite-only workspaces
- shared visibility for all workspace members
- roles for `owner`, `editor`, and `viewer`
- one-time expenses
- recurring expense templates
- parent/child categories with max depth of 2
- multiple expense statuses
- multi-currency support with workspace base currency normalization
- manual debt accounts and debt payments
- dashboard and reporting in workspace base currency

## Chosen Stack

- App: `Next.js` App Router
- Language: `TypeScript`
- Auth: `Clerk`
- Database: `PostgreSQL`
- Database host: `Neon`
- ORM: `Prisma`
- UI: `Tailwind CSS` + `shadcn/ui`
- Validation: `Zod`
- Forms: `React Hook Form`
- Client data tools: `TanStack Query`, `TanStack Table`
- Charts: `Recharts`
- Email: `Resend`
- FX provider: `Open Exchange Rates`

## Product Rules

- Workspaces are invite-only by default.
- Everything inside a workspace is visible to every member of that workspace.
- Roles control actions, not visibility.
- Every business record is scoped by `workspaceId`.
- Parent/child category depth is capped at 2 for MVP.
- Mixed-currency totals are normalized to the workspace base currency.
- Historical totals use the snapshotted exchange rate stored on each record.
- Dashboard totals default to `posted` expenses only.
- Debts are tracked separately from normal expenses.

## Initial Docs

- `docs/product-requirements.md`
- `docs/architecture.md`
- `docs/data-model.md`
- `docs/roadmap.md`
- `docs/decisions/001-stack.md`
- `docs/decisions/002-currency-handling.md`
- `docs/decisions/003-category-tree.md`
- `docs/decisions/004-visibility-and-permissions.md`

## Local Setup

Copy `.env.example` to `.env` and set the environment variables:

- `DATABASE_URL`
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `RESEND_API_KEY`
- `OPEN_EXCHANGE_RATES_APP_ID`
- `APP_BASE_URL`

### Local Postgres With Docker

The repo includes `docker-compose.yml` for local PostgreSQL.

Start the database:

```bash
npm run db:up
```

Watch logs:

```bash
npm run db:logs
```

Stop the database:

```bash
npm run db:down
```

Reset the database volume:

```bash
npm run db:reset
```

The default local database URL is:

```bash
postgresql://postgres:postgres@localhost:5432/cost_tracking
```

After the container is up, apply the Prisma schema:

```bash
npm run prisma:generate
npm run prisma:push
```

## Delivery Plan

1. Write and lock docs.
2. Scaffold the app and infrastructure.
3. Implement workspaces and invitations.
4. Implement categories and expenses.
5. Implement recurring expenses.
6. Implement debts.
7. Implement reporting and release hardening.
