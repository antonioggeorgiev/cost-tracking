# ADR 002: Currency Handling

## Status

Accepted

## Context

The product must support multiple currencies while still producing understandable monthly totals and historical reports.

## Decision

- Each workspace has a `baseCurrencyCode`.
- Each financial record stores original amount and currency.
- For foreign-currency entries, the app fetches an exchange rate from `Open Exchange Rates`.
- The app snapshots the exchange rate and converted workspace amount onto the record at write time.
- Reports use the snapshotted workspace amount, not live rates.
- For backdated records, use the expense-date rate when available and fall back explicitly if necessary.

## Rationale

- Mixed-currency totals are otherwise meaningless.
- Historical numbers must remain stable over time.
- Snapshotting avoids report drift if external exchange rates change.
- A workspace base currency gives reporting a clear default.

## Provider Decision

- FX provider: `Open Exchange Rates`
- The provider should be wrapped behind a small app-level abstraction so it can be replaced later if needed.

## Consequences

- Every money-bearing record needs extra snapshot fields.
- Expense and debt creation flows must handle FX lookup failures clearly.
- Reporting logic becomes simpler and more reliable once snapshots are stored.
