import type * as models from '../index.ts';

export type GetAllTasksInList = {
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
}[];

export type GetAllTasksInList400 = models.ValidationError;
