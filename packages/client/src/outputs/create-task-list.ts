import type * as models from '../index.ts';

export type CreateTaskList201 = {
  id: string;
  userId: string;
  title: string;
  updatedAt: string;
};

export type CreateTaskList400 = models.ValidationError;
