import type * as models from '../index.ts';

export type ToggleSchedule = {
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

export type ToggleSchedule400 = models.ValidationError;
