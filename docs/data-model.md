# Data Model

## Overview

This document defines the initial application entities, relationships, and core business rules.

## Core Entities

- `User`
- `Workspace`
- `WorkspaceMembership`
- `WorkspaceInvite`
- `Category`
- `Expense`
- `RecurringExpenseTemplate`
- `DebtAccount`
- `DebtPayment`

## Enums

### WorkspaceRole

- `owner`
- `editor`
- `viewer`

### ExpenseStatus

- `planned`
- `pending`
- `posted`
- `cancelled`

### ExpenseType

- `one_time`
- `recurring_generated`
- `debt_payment`
- `manual_adjustment`

### InviteStatus

- `pending`
- `accepted`
- `revoked`
- `expired`

### RecurringFrequency

- `weekly`
- `monthly`
- `yearly`

## Models

### User

- `id`
- `clerkUserId` unique
- `email`
- `name`
- `imageUrl`
- `createdAt`
- `updatedAt`

### Workspace

- `id`
- `name`
- `slug` unique
- `baseCurrencyCode`
- `createdByUserId`
- `createdAt`
- `updatedAt`

Rules:

- A workspace is private and invite-only by default.
- All business records in the app belong to a workspace.

### WorkspaceMembership

- `id`
- `workspaceId`
- `userId`
- `role`
- `createdAt`

Constraints:

- Unique on `workspaceId + userId`

### WorkspaceInvite

- `id`
- `workspaceId`
- `email`
- `role`
- `token`
- `status`
- `expiresAt`
- `invitedByUserId`
- `acceptedByUserId` nullable
- `acceptedAt` nullable
- `createdAt`
- `updatedAt`

Rules:

- Invite tokens must be single-use.
- Expired or revoked invites cannot be accepted.

### Category

- `id`
- `workspaceId`
- `name`
- `slug`
- `parentCategoryId` nullable
- `isArchived`
- `sortOrder`
- `color` nullable
- `createdAt`
- `updatedAt`

Rules:

- Parent and child categories must belong to the same workspace.
- Category depth is capped at 2 for MVP.
- Sibling category names should be unique within a workspace and parent.
- Referenced categories should be archived rather than deleted.

### Expense

- `id`
- `workspaceId`
- `categoryId`
- `createdByUserId`
- `title`
- `description` nullable
- `originalAmountMinor`
- `originalCurrencyCode`
- `workspaceAmountMinor`
- `workspaceCurrencyCode`
- `exchangeRate`
- `exchangeRateDate`
- `expenseDate`
- `type`
- `status`
- `recurringTemplateId` nullable
- `debtAccountId` nullable
- `notes` nullable
- `createdAt`
- `updatedAt`

Rules:

- Money is stored in minor units.
- Historical totals use `workspaceAmountMinor` and stored exchange-rate snapshots.
- Dashboard totals include `posted` rows by default.

### RecurringExpenseTemplate

- `id`
- `workspaceId`
- `categoryId`
- `createdByUserId`
- `title`
- `description` nullable
- `originalAmountMinor`
- `originalCurrencyCode`
- `workspaceAmountMinor`
- `workspaceCurrencyCode`
- `exchangeRate`
- `exchangeRateDate`
- `frequency`
- `interval`
- `startDate`
- `endDate` nullable
- `nextOccurrenceDate`
- `lastGeneratedAt` nullable
- `defaultStatus`
- `isActive`
- `notes` nullable
- `createdAt`
- `updatedAt`

Rules:

- Templates generate concrete `Expense` rows.
- Generated rows should not be duplicated for the same occurrence.
- Template edits affect future generation only.

### DebtAccount

- `id`
- `workspaceId`
- `name`
- `provider` nullable
- `originalAmountMinor`
- `currencyCode`
- `currentBalanceMinor`
- `openedAt`
- `isActive`
- `notes` nullable
- `createdAt`
- `updatedAt`

Rules:

- Debt accounts are visible to all workspace members.
- Debt accounts remain distinct from normal expenses.

### DebtPayment

- `id`
- `workspaceId`
- `debtAccountId`
- `expenseId` nullable
- `paidByUserId`
- `originalAmountMinor`
- `originalCurrencyCode`
- `workspaceAmountMinor`
- `workspaceCurrencyCode`
- `exchangeRate`
- `exchangeRateDate`
- `paymentDate`
- `notes` nullable
- `createdAt`
- `updatedAt`

Rules:

- Debt payments may optionally link to an expense record.
- Debt balances should be updated transactionally when payments are recorded.

## Relationships

- A `User` can belong to many workspaces through `WorkspaceMembership`.
- A `Workspace` has many members, invites, categories, expenses, recurring templates, debt accounts, and debt payments.
- A `Category` may have a parent category and many child categories.
- An `Expense` belongs to one workspace and one category.
- A generated expense may reference a `RecurringExpenseTemplate`.
- A debt-related expense may reference a `DebtAccount`.
- A `DebtPayment` belongs to a `DebtAccount` and may reference an `Expense`.

## Indexing Plan

Recommended indexes:

- `WorkspaceMembership(workspaceId, userId)` unique
- `WorkspaceInvite(workspaceId, email, status)`
- `WorkspaceInvite(token)` unique
- `Category(workspaceId, parentCategoryId, isArchived)`
- `Expense(workspaceId, expenseDate)`
- `Expense(workspaceId, status, expenseDate)`
- `Expense(workspaceId, categoryId, expenseDate)`
- `RecurringExpenseTemplate(workspaceId, nextOccurrenceDate, isActive)`
- `DebtAccount(workspaceId, isActive)`
- `DebtPayment(workspaceId, paymentDate)`

## Reporting Rules

- Workspace dashboards report totals in the workspace base currency.
- Expense rows display original currency values alongside normalized values where useful.
- Parent category totals include their child category totals.
- `cancelled` expenses are excluded from totals unless explicitly requested.
- `planned` and `pending` are excluded from default totals.
