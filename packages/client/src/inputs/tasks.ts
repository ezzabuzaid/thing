import { z } from 'zod';

export const tasksListSchema = z.object({}).catchall(z.unknown());
export const createTaskListSchema = z.object({ title: z.string() });
export const getAllTasksInListSchema = z.object({ taskListId: z.string() });
export const createTaskSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  due: z.string().datetime().optional(),
  taskListId: z.string(),
});
export const tasksTreeSchema = z.object({}).catchall(z.unknown());
export const createSubtaskSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  due: z.string().datetime().optional(),
  taskId: z.string(),
});
export const completeTaskSchema = z.object({ taskId: z.string() });
export const completeSubtaskSchema = z.object({ subtaskId: z.string() });
export const uncompleteTaskSchema = z.object({ taskId: z.string() });
export const uncompleteSubtaskSchema = z.object({ subtaskId: z.string() });
export const updateTaskSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  taskId: z.string(),
});
export const updateSubtaskSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  subtaskId: z.string(),
});
export const syncTasksSchema = z.object({}).catchall(z.unknown());
