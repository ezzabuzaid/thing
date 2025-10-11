import type * as models from '../index.ts';

export type GetScheduleById = {
  id: string;
  userId: string;
  title: string;
  updatedAt: string;
  instructions: string;
  cron: string;
  enabled: boolean;
};

export type GetScheduleById400 = models.ValidationError;
