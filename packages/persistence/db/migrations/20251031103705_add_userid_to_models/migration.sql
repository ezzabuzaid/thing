/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `Client` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `BookmarkFolder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Client` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `HourEntry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Project` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userId` to the `Thought` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "public"."Client_name_key";

-- AlterTable
ALTER TABLE "BookmarkFolder" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "HourEntry" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "userId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Thought" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "BookmarkFolder_userId_idx" ON "BookmarkFolder"("userId");

-- CreateIndex
CREATE INDEX "Client_userId_idx" ON "Client"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Client_userId_name_key" ON "Client"("userId", "name");

-- CreateIndex
CREATE INDEX "HourEntry_userId_idx" ON "HourEntry"("userId");

-- CreateIndex
CREATE INDEX "Project_userId_idx" ON "Project"("userId");

-- CreateIndex
CREATE INDEX "Thought_userId_idx" ON "Thought"("userId");
