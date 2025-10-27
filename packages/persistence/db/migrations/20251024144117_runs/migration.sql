-- CreateTable
CREATE TABLE "ScheduleRuns" (
    "id" UUID NOT NULL DEFAULT uuidv7(),
    "result" TEXT,
    "scheduleId" UUID NOT NULL,
    "runAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "ScheduleRuns_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ScheduleRuns_scheduleId_idx" ON "ScheduleRuns"("scheduleId");

-- AddForeignKey
ALTER TABLE "Schedules" ADD CONSTRAINT "Schedules_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScheduleRuns" ADD CONSTRAINT "ScheduleRuns_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "Schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;
