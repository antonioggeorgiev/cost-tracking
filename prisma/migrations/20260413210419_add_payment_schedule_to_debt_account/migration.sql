-- AlterTable
ALTER TABLE "DebtAccount" ADD COLUMN     "anchorDays" INTEGER[],
ADD COLUMN     "frequency" "RecurringFrequency",
ADD COLUMN     "interval" INTEGER,
ADD COLUMN     "nextPaymentDate" TIMESTAMP(3);
