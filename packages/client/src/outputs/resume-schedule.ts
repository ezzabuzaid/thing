import type * as models from '../index.ts';

export type ResumeSchedule = {
  id: string;
  userId: string;
  title: string;
  updatedAt: string;
  instructions: string;
  cron: string;
  runnerId: string;
  enabled: boolean;
};

export type ResumeSchedule400 = models.ValidationError;
