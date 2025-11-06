import type * as models from '../index.ts';

export type ListSchedules = {
  records: {
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
    connectors: string[];
    channels: string[];
    instructions: string;
    cron: string;
    runnerId: string;
    enabled: boolean;
    deletedAt: string;
  }[];
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
};

export type ListSchedules400 = models.ValidationError;
