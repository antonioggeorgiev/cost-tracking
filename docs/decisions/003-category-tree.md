# ADR 003: Category Tree

## Status

Accepted

## Context

The product needs more structure than a flat category list, especially for renovation and household grouping, but the MVP should avoid deep hierarchy complexity.

## Decision

- Use parent/child categories with an adjacency-list model.
- Limit category depth to 2 for MVP.
- Categories belong to a single workspace.
- Categories with historical references should be archived rather than deleted.

## Rationale

- Parent/child categories are enough for common use cases like `Renovation / Bathroom`.
- Limiting depth avoids recursive UI and reporting complexity.
- Archiving preserves historical reporting integrity.

## Reporting Behavior

- Parent category totals include child category totals.
- Filters should support both parent and child category selection.
- Archived categories remain visible where necessary for historical records.

## Consequences

- Category validation must enforce same-workspace parentage, max depth, and no cycles.
- UI should render category paths clearly.
