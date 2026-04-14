/*
  Warnings:

  - A unique constraint covering the columns `[debtAccountId,dueDate]` on the table `DebtPayment` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "DebtPayment" ADD COLUMN     "dueDate" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "DebtPayment_debtAccountId_dueDate_idx" ON "DebtPayment"("debtAccountId", "dueDate");

-- CreateIndex
CREATE UNIQUE INDEX "DebtPayment_debtAccountId_dueDate_key" ON "DebtPayment"("debtAccountId", "dueDate");
