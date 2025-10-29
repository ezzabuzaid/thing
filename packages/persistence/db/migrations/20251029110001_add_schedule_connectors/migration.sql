-- AlterTable
ALTER TABLE "Schedules" ADD COLUMN     "connectors" TEXT[] DEFAULT ARRAY[]::TEXT[];
