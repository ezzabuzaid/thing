-- AlterTable
ALTER TABLE "Schedules" ADD COLUMN     "channels" TEXT[] DEFAULT ARRAY['email']::TEXT[];
