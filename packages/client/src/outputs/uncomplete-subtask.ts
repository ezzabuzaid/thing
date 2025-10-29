import type * as models from '../index.ts';

export type UncompleteSubtask = {
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

export type UncompleteSubtask400 = models.ValidationError;
