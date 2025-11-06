import type * as models from '../index.ts';

export type ArchiveSchedule = {
  id: string;
  userId: string;
  title: string;
  updatedAt: string;
  connectors: string[];
  channels: string[];
  instructions: string;
  cron: string;
  runnerId: string;
  enabled: boolean;
  deletedAt: string;
};

export type ArchiveSchedule400 = models.ValidationError;
