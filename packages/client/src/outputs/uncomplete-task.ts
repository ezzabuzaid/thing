import type * as models from '../index.ts';

export type UncompleteTask = {
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

export type UncompleteTask400 = models.ValidationError;
