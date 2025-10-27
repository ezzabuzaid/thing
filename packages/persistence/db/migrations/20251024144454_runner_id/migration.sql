/*
  Warnings:

  - Added the required column `runnerId` to the `Schedules` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Schedules" ADD COLUMN     "runnerId" TEXT NOT NULL;
