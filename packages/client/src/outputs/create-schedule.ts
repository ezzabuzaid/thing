import type * as models from '../index.ts';

export type CreateSchedule201 = {
  id: string;
  userId: string;
  title: string;
  updatedAt: string;
  instructions: string;
  cron: string;
  enabled: boolean;
};

export type CreateSchedule400 = models.ValidationError;
