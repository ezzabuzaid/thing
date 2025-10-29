import type * as models from '../index.ts';

export type TasksTree = {
  tasks: {
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
  }[];
  id: string;
  userId: string;
  title: string;
  updatedAt: string;
}[];

export type TasksTree400 = models.ValidationError;
