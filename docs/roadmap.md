# Roadmap

## MVP Milestones

### Milestone 1: Foundation

- Scaffold `Next.js` app
- Configure `Clerk`, `Prisma`, `Neon`, `Tailwind`, and `shadcn/ui`
- Establish app shell and protected routes
- Sync Clerk users into app users

Acceptance:

- app boots locally
- auth works
- database connectivity works
- protected shell exists

### Milestone 2: Workspaces And Members

- Add workspaces, memberships, and invites
- Create invite-only workspace flow
- Add `owner`, `editor`, `viewer` roles
- Build members and invite management UI

Acceptance:

- user can create workspace
- owner can invite members by email
- invited users can join via token link
- role checks are enforced server-side

### Milestone 3: Categories And Currency Base

- Add parent/child categories
- Enforce max depth of 2
- Add workspace base currency
- Add FX provider abstraction and snapshot infrastructure

Acceptance:

- category tree works
- invalid category trees are blocked
- workspace base currency is visible and usable
- FX snapshot logic is ready for expense creation

### Milestone 4: Expenses

- Add one-time expense CRUD
- Support statuses and member attribution
- Support multi-currency entry with automatic conversion snapshot
- Build list view and filters

Acceptance:

- user can create and edit expenses
- foreign-currency expenses store snapshot values
- list filters work by date, member, status, category, and currency

### Milestone 5: Recurring

- Add recurring expense templates
- Generate due expense rows from templates
- Prevent duplicate generation
- Add recurring overview UI

Acceptance:

- recurring templates work
- generated rows appear in expense reporting
- generation is idempotent

### Milestone 6: Debts

- Add debt accounts
- Add manual debt payments
- Show balances and debt summaries

Acceptance:

- debt balances update correctly
- debt data is visible to all workspace members

### Milestone 7: Reporting

- Add dashboard metrics
- Add category rollups
- Add recurring and debt summary panels
- Add status and member-aware filtering

Acceptance:

- dashboard is useful for current month tracking
- normalized totals are trustworthy

### Milestone 8: Hardening

- Add tests
- Add seed data
- Add deployment configuration
- Add monitoring and error handling

Acceptance:

- production deployment succeeds
- critical flows are covered by tests

## Post-MVP

- Notifications/reminders
- Budgeting
- Receipt uploads
- Better analytics and forecasting
- Bank integrations
- More advanced debt math

## Main Risks

- recurring generation duplication bugs
- multi-currency reporting mistakes
- authorization gaps in shared workspaces
- category tree edge cases

## Risk Controls

- centralize permission checks
- snapshot all FX conversions on write
- enforce category depth on the server
- make recurring generation idempotent
