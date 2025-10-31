-- DropIndex
DROP INDEX "ScheduleTemplates_category_idx";

-- AlterTable
ALTER TABLE "ScheduleTemplates" DROP COLUMN "category";
