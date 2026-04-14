-- AlterTable
ALTER TABLE "RecurringExpenseTemplate" ADD COLUMN     "anchorDays" INTEGER[] DEFAULT ARRAY[]::INTEGER[];
