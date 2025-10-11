import type * as models from '../index.ts';

export type CompleteSubtask = {
  status: string;
  id: string;
  title: string;
  updatedAt: string;
  notes: string;
  due: string;
  deletedAt: string;
  taskId: string;
  mediaId: string;
};

export type CompleteSubtask400 = models.ValidationError;
