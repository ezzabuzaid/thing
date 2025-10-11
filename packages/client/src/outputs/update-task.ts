import type * as models from '../index.ts';

export type UpdateTask = {
  subtasks: {
    status: string;
    id: string;
    title: string;
    updatedAt: string;
    notes: string;
    due: string;
    deletedAt: string;
    taskId: string;
    mediaId: string;
  }[];
  status: string;
  id: string;
  title: string;
  updatedAt: string;
  notes: string;
  due: string;
  taskListId: string;
  deletedAt: string;
};

export type UpdateTask400 = models.ValidationError;
