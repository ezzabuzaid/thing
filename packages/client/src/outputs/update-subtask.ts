import type * as models from '../index.ts';

export type UpdateSubtask = {
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

export type UpdateSubtask400 = models.ValidationError;
