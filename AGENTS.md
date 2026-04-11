# AGENTS

## Repository

- GitHub repository: `antonioggeorgiev/cost-tracking`
- Local project type: `Next.js` + `TypeScript` + `Prisma` + `tRPC`

## Purpose

This repository contains a multi-workspace cost tracking app for renovation spending, day-to-day expenses, recurring costs, and shared debt tracking.

## Current Architecture

- App framework: `Next.js` App Router
- Auth: `Clerk`
- Database: `PostgreSQL`
- Local DB runtime: `Docker Compose`
- ORM: `Prisma 7`
- API boundary: `tRPC`
- Styling: `Tailwind CSS`

## Important Project Rules

- Workspaces are invite-only.
- Everything inside a workspace is visible to all workspace members.
- Roles control actions, not visibility.
- `tRPC` procedures are the permission boundary.
- Use:
  - `workspaceMemberProcedure` for read access
  - `workspaceEditorProcedure` for owner/editor writes
  - `workspaceOwnerProcedure` for owner-only actions
- Parent/child category depth is capped at 2.
- Expense totals are normalized into the workspace base currency using stored FX snapshots.

## Repository Layout

- `app/`: Next.js routes and server actions
- `components/`: UI components
- `lib/`: shared helpers
- `server/`: domain logic, `tRPC`, routers
- `prisma/`: Prisma config and multi-file schema
- `generated/prisma/`: generated Prisma client
- `docs/`: planning and architecture docs

## How To Use The CLI

### Clone the repository

```bash
gh repo clone antonioggeorgiev/cost-tracking
cd cost-tracking
```

### Install dependencies

```bash
npm install
```

### Configure environment

```bash
cp .env.example .env
```

Set real values in `.env` for:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `CLERK_SECRET_KEY`
- `RESEND_API_KEY`
- `OPEN_EXCHANGE_RATES_APP_ID`

The default local database URL should stay:

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/cost_tracking"
```

### Start the local database

```bash
npm run db:up
```

### Check database logs

```bash
npm run db:logs
```

### Reset the local database

```bash
npm run db:reset
```

### Stop the local database

```bash
npm run db:down
```

### Generate Prisma client

```bash
npm run prisma:generate
```

### Push the schema to the local database

```bash
npm run prisma:push
```

### Run the app

```bash
npm run dev
```

### Lint the code

```bash
npm run lint
```

### Build the app

```bash
npm run build
```

## Working Conventions

- Put new domain operations behind `tRPC` routers in `server/routers/`.
- Keep DB and validation logic in `server/` domain files.
- Prefer server-rendered pages calling the server caller from `server/trpc-caller.ts`.
- When adding workspace-scoped writes, enforce permissions through the appropriate `tRPC` procedure.
- Regenerate Prisma client after schema changes.

## Current Feature Areas

- workspace creation
- workspace membership and invites
- parent/child categories
- one-time expenses with FX snapshotting

## Next Recommended Areas

- recurring expense templates
- debt accounts and debt payments
- dashboard reporting
