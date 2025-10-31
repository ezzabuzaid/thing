import type * as models from '../index.ts';

export type PostRemindersreminderIdcomplete = {
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

export type PostRemindersreminderIdcomplete400 = any | models.ValidationError;
