import type * as models from '../index.ts';

export type GetReminders = {
  count: number;
  reminders: {
    status: string;
    id: string;
    userId: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    deletedAt: string;
    completedAt: string;
    source: string;
    notes: string;
    remindAt: string;
    cancelledAt: string;
  }[];
};

export type GetReminders400 = models.ValidationError;
