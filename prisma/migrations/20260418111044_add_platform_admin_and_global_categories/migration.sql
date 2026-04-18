-- AlterTable
ALTER TABLE "Category" ALTER COLUMN "workspaceId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "isPlatformAdmin" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Category_parentCategoryId_isArchived_idx" ON "Category"("parentCategoryId", "isArchived");
