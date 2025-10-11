import { z } from 'zod';

export const createScheduleSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  cron: z.string(),
  enabled: z.boolean().optional(),
});
export const listSchedulesSchema = z.object({
  page: z.number().gt(0).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});
export const getScheduleByIdSchema = z.object({ id: z.string().uuid() });
