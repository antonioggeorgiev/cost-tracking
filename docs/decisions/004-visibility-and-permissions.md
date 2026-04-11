# ADR 004: Visibility And Permissions

## Status

Accepted

## Context

The app supports shared workspaces and must define whether visibility and editing permissions are separate.

## Decision

- Workspaces are invite-only by default.
- Once a user is a member of a workspace, they can view all data in that workspace.
- Roles control actions only, not visibility.

Roles:

- `owner`: full control, members, settings, invites, and all financial data
- `editor`: can manage financial data and categories
- `viewer`: read-only access to all workspace data

## Rationale

- Shared renovation and household tracking works best when all members see the same information.
- Per-record privacy would increase complexity without matching the intended product behavior.
- Separating visibility from editing permissions keeps collaboration simple.

## Consequences

- Viewer users must still be able to see debts, expenses, recurring items, categories, and reports.
- Server-side role checks remain critical because edit restrictions still matter.
