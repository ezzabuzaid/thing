import type * as models from '../index.ts';

export type CompleteTask = {
  subtasks: {
    status: string;
    id: string;
    title: string;
    updatedAt: string;
    deletedAt: string;
    notes: string;
    due: string;
    taskId: string;
    mediaId: string;
  }[];
  status: string;
  id: string;
  title: string;
  updatedAt: string;
  deletedAt: string;
  notes: string;
  due: string;
  taskListId: string;
};

export type CompleteTask400 = models.ValidationError;
