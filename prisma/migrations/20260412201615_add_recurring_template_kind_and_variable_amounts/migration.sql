/*
  Warnings:

  - A unique constraint covering the columns `[recurringTemplateId,expenseDate]` on the table `Expense` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "RecurringTemplateKind" AS ENUM ('fixed_amount', 'variable_amount');

-- AlterTable
ALTER TABLE "RecurringExpenseTemplate" ADD COLUMN     "kind" "RecurringTemplateKind" NOT NULL DEFAULT 'fixed_amount',
ADD COLUMN     "paymentUrl" TEXT,
ALTER COLUMN "originalAmountMinor" DROP NOT NULL,
ALTER COLUMN "workspaceAmountMinor" DROP NOT NULL,
ALTER COLUMN "exchangeRate" DROP NOT NULL,
ALTER COLUMN "exchangeRateDate" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Expense_recurringTemplateId_expenseDate_key" ON "Expense"("recurringTemplateId", "expenseDate");
