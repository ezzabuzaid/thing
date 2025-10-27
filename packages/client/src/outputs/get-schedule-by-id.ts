import type * as models from '../index.ts';

export type GetScheduleById = {
  runs: {
    result: string;
    id: string;
    title: string;
    scheduleId: string;
    runAt: string;
    completedAt: string;
  }[];
  id: string;
  userId: string;
  title: string;
  updatedAt: string;
  instructions: string;
  cron: string;
  runnerId: string;
  enabled: boolean;
};

export type GetScheduleById400 = models.ValidationError;
