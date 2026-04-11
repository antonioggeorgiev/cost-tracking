# ADR 001: Stack Selection

## Status

Accepted

## Context

The project needs a stack that is fast to ship, works well for a dashboard-heavy CRUD application, supports auth and multi-workspace permissions cleanly, and remains easy to deploy.

## Decision

Use:

- `Next.js` App Router
- `TypeScript`
- `Clerk`
- `PostgreSQL` on `Neon`
- `Prisma`
- `Tailwind CSS` + `shadcn/ui`
- `Zod`
- `React Hook Form`
- `TanStack Query`
- `TanStack Table`
- `Recharts`

## Rationale

- `Next.js` keeps the app full-stack in one codebase.
- App Router is a good fit for authenticated app layouts and mixed server/client rendering.
- `Clerk` reduces auth implementation time.
- `PostgreSQL` is well-suited for relational multi-tenant business data.
- `Neon` is a strong hosted Postgres option for a new app.
- `Prisma` provides a mature DX and clear schema/migration workflow.
- `Tailwind CSS` and `shadcn/ui` provide fast UI composition without locking the project into a large component framework.

## Alternatives Considered

### `Vite + TanStack Router`

Rejected because the project would need more custom backend plumbing and the current priority is fast end-to-end delivery.

### `Laravel + Vue`

Viable, but rejected in favor of staying in a single TypeScript-first stack.

## Consequences

- Faster MVP development
- Fewer architecture seams early on
- Strong convention support for auth, routing, and full-stack delivery
