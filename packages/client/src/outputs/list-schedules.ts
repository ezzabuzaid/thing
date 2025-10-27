import type * as models from '../index.ts';

export type ListSchedules = {
  records: {
    id: string;
    userId: string;
    title: string;
    updatedAt: string;
    instructions: string;
    cron: string;
    runnerId: string;
    enabled: boolean;
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
