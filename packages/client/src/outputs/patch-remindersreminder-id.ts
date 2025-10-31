import type * as models from '../index.ts';

export type PatchRemindersreminderId = {
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
};

export type PatchRemindersreminderId400 = any | models.ValidationError;
