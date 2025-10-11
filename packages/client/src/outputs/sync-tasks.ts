import type * as models from '../index.ts';

export type SyncTasks = {
  status: 'ok';
  taskListsProcessed: number;
  tasksInserted: number;
  subtasksInserted: number;
};

export type SyncTasks400 = models.ValidationError;
