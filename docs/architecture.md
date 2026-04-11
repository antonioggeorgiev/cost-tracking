# Architecture

## System Overview

The application is a full-stack `Next.js` app using App Router. Authentication is handled by `Clerk`. Business data is stored in `PostgreSQL` hosted on `Neon` and accessed through `Prisma`.

The system is multi-tenant at the workspace level. Every business record is scoped by `workspaceId`, and all reads and writes are authorized server-side against workspace membership.

## Stack

- `Next.js` App Router
- `TypeScript`
- `Clerk`
- `Prisma`
- `PostgreSQL` on `Neon`
- `Tailwind CSS`
- `shadcn/ui`
- `Zod`
- `React Hook Form`
- `TanStack Query`
- `TanStack Table`
- `Recharts`
- `Resend`
- `Open Exchange Rates`

## App Areas

Public routes:

- `/`
- `/sign-in`
- `/sign-up`
- `/accept-invite/[token]`

Authenticated routes:

- `/app`
- `/app/[workspaceSlug]`
- `/app/[workspaceSlug]/expenses`
- `/app/[workspaceSlug]/recurring`
- `/app/[workspaceSlug]/debts`
- `/app/[workspaceSlug]/categories`
- `/app/[workspaceSlug]/members`
- `/app/[workspaceSlug]/settings`

## Tenancy Model

- `Workspace` is the tenancy boundary.
- `WorkspaceMembership` defines who belongs to a workspace and what actions they can perform.
- All business records include `workspaceId`.
- Workspace access is invite-only.
- Everything in a workspace is visible to all members of that workspace.

## Permission Model

- `owner`: full read/write, member management, settings, invites
- `editor`: full read, can manage financial data and categories
- `viewer`: full read, no edits

Permission checks must be enforced on the server for every read/write path. The UI should reflect permissions, but the UI is not trusted.

## User Identity

- `Clerk` is the identity provider.
- The app maintains an internal `User` row synced from Clerk.
- All business actions resolve from Clerk session to app user to workspace membership.

## Currency Strategy

- Every workspace has a `baseCurrencyCode`.
- Expenses, recurring templates, debt accounts, and debt payments store original currency values.
- For foreign-currency records, the app fetches an exchange rate from `Open Exchange Rates` and stores a snapshot on the record.
- Reports use the snapshotted workspace-converted amount, not live FX rates.

## Recurring Expense Strategy

Recurring expenses are modeled as templates plus generated concrete expense records.

- Templates define recurrence rules.
- Generated expenses are real rows in the `Expense` table.
- Historical generated rows remain unchanged if the template changes later.
- Template changes apply to future generation only.

Initial MVP generation strategy:

- Lazy generation on relevant page access or server action
- Scheduled background generation can be added later

## Debt Tracking Strategy

Debts are modeled separately from normal expenses.

- `DebtAccount` tracks the debt itself
- `DebtPayment` tracks manual repayments
- Debt payments may optionally link to an expense row

This separation keeps debt reporting distinct from everyday spending.

## UI Architecture

- Server-first rendering for route data where practical
- Client components for highly interactive forms, filters, and data tables
- Shared UI primitives from `shadcn/ui`
- Reusable workspace-aware components for navigation, category selection, and money formatting

## Deployment Architecture

- App hosting: `Vercel`
- Database: `Neon`
- Auth: `Clerk`
- Transactional email: `Resend`
- FX provider: `Open Exchange Rates`

## Implementation Principles

- Keep the first implementation minimal and correct.
- Centralize permission checks.
- Centralize FX snapshot handling.
- Centralize category-tree validation.
- Avoid destructive delete behavior for referenced records.
- Default dashboard and reporting to `posted` expenses.
