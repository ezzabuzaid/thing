import type * as models from '../index.ts';

export type UpdateSchedule = {
  id: string;
  userId: string;
  title: string;
  updatedAt: string;
  instructions: string;
  cron: string;
  runnerId: string;
  connectors: string[];
  enabled: boolean;
  deletedAt: string;
};

export type UpdateSchedule400 = models.ValidationError;
