import type * as models from '../index.ts';

export type CreateSubtask201 = {
  status: string;
  id: string;
  title: string;
  updatedAt: string;
  deletedAt: string;
  notes: string;
  due: string;
  taskId: string;
  mediaId: string;
};

export type CreateSubtask400 = models.ValidationError;
