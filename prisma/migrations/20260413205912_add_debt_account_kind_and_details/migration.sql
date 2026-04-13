-- CreateEnum
CREATE TYPE "DebtAccountKind" AS ENUM ('bank_loan', 'personal_loan', 'leasing');

-- CreateEnum
CREATE TYPE "DebtDirection" AS ENUM ('i_owe', 'they_owe_me');

-- AlterTable
ALTER TABLE "DebtAccount" ADD COLUMN     "counterparty" TEXT,
ADD COLUMN     "direction" "DebtDirection" NOT NULL DEFAULT 'i_owe',
ADD COLUMN     "interestRateBps" INTEGER,
ADD COLUMN     "kind" "DebtAccountKind" NOT NULL DEFAULT 'bank_loan',
ADD COLUMN     "monthlyAmountMinor" INTEGER,
ADD COLUMN     "residualValueMinor" INTEGER,
ADD COLUMN     "termMonths" INTEGER;
