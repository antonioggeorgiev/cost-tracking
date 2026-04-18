-- Step 1: Add columns as nullable
ALTER TABLE "DebtAccount"
  ADD COLUMN "workspaceAmountMinor" INTEGER,
  ADD COLUMN "workspaceCurrencyCode" TEXT,
  ADD COLUMN "workspaceBalanceMinor" INTEGER,
  ADD COLUMN "exchangeRate" DECIMAL(18, 8),
  ADD COLUMN "exchangeRateDate" TIMESTAMP(3),
  ADD COLUMN "workspaceMonthlyAmountMinor" INTEGER,
  ADD COLUMN "workspaceResidualValueMinor" INTEGER;

-- Step 2: Backfill existing rows using workspace baseCurrencyCode
-- Sets rate = 1.0 and copies original amounts as workspace amounts.
-- For debts in a different currency than the workspace, the amounts will be
-- approximate (same value, rate=1) — these can be corrected manually if needed.
UPDATE "DebtAccount" da
SET
  "workspaceAmountMinor" = da."originalAmountMinor",
  "workspaceCurrencyCode" = w."baseCurrencyCode",
  "workspaceBalanceMinor" = da."currentBalanceMinor",
  "exchangeRate" = 1.00000000,
  "exchangeRateDate" = da."openedAt",
  "workspaceMonthlyAmountMinor" = da."monthlyAmountMinor",
  "workspaceResidualValueMinor" = da."residualValueMinor"
FROM "Workspace" w
WHERE da."workspaceId" = w."id";

-- Step 3: Make required columns NOT NULL
ALTER TABLE "DebtAccount"
  ALTER COLUMN "workspaceAmountMinor" SET NOT NULL,
  ALTER COLUMN "workspaceCurrencyCode" SET NOT NULL,
  ALTER COLUMN "workspaceBalanceMinor" SET NOT NULL,
  ALTER COLUMN "exchangeRate" SET NOT NULL,
  ALTER COLUMN "exchangeRateDate" SET NOT NULL;
