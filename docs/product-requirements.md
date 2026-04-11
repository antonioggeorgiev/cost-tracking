# Product Requirements

## Product Summary

Build a multi-workspace cost tracking app for renovation expenses, day-to-day spending, recurring bills, and simple manual debt tracking.

## Problem Statement

Generic note-taking tools are not good at structured finance tracking. The product should replace an unstructured Notion workflow with a focused app that supports fast entry, useful reporting, and shared collaboration.

## Target Users

- Primary: a single user tracking apartment renovation and household spending
- Secondary: shared household or workspace members collaborating in the same workspace
- Future: small groups who need a lightweight shared cost tracker

## Core Use Cases

- Track apartment renovation purchases by category.
- Track daily spending and household costs.
- Track recurring charges like rent, internet, subscriptions, and utilities.
- Track debts or loans manually and log payments against them.
- Collaborate with other users in a shared workspace.
- Review monthly totals and category breakdowns.

## MVP Goals

- Make expense entry fast and low-friction.
- Support multiple invite-only workspaces.
- Support parent/child categories created dynamically.
- Support recurring expense templates.
- Support manual debt accounts and debt payments.
- Support multiple currencies with normalized workspace reporting.
- Provide a useful monthly dashboard.

## Non-Goals For MVP

- Bank sync
- Receipt OCR
- Advanced loan amortization or interest schedules
- Tax/accounting workflows
- Notifications and reminders
- Budgeting engine
- Unlimited-depth category trees

## Core Product Rules

- Workspaces are invite-only by default.
- Everything in a workspace is visible to every member of that workspace.
- Roles affect editing and management permissions only.
- Every financial record belongs to one workspace.
- Workspace reporting uses a workspace base currency.
- All foreign-currency records store a snapshotted conversion rate.
- Parent/child category depth is limited to 2 for MVP.
- Dashboard totals default to `posted` expenses only.

## User Stories

- As a user, I can create a workspace for my apartment renovation finances.
- As a user, I can invite other members into that workspace.
- As a user, I can create parent and child categories like `Renovation / Bathroom`.
- As a user, I can add one-time expenses quickly.
- As a user, I can create recurring expense templates.
- As a user, I can log expenses in different currencies.
- As a user, I can see monthly totals converted into the workspace base currency.
- As a user, I can track debts and log manual payments.
- As a user, I can filter costs by category, member, status, date, and currency.

## Roles

- `owner`: full control over workspace, members, settings, and financial data
- `editor`: can manage financial data and categories but not workspace ownership/settings
- `viewer`: read-only access to all workspace data

## Expense Statuses

- `planned`
- `pending`
- `posted`
- `cancelled`

Default reporting behavior:

- Include `posted` by default
- Allow filters to include the other statuses when needed

## Success Criteria

- Expense entry can be completed in under 10 seconds for a common case.
- Shared workspace permissions behave safely and predictably.
- Mixed-currency reporting remains understandable and historically stable.
- Recurring expenses are easy to set up and do not generate duplicate records.
- The app is immediately more useful than the current Notion workflow.
