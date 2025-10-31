import { z } from 'zod';

export const listScheduleConnectorsSchema = z.object({}).catchall(z.unknown());
export const createScheduleSchema = z.object({
  title: z.string(),
  instructions: z.string(),
  cron: z.string(),
  enabled: z.boolean().optional(),
  connectors: z.array(z.string()).optional().default([]),
});
export const listSchedulesSchema = z.object({
  page: z.number().gt(0).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
});
export const getScheduleByIdSchema = z.object({ id: z.string().uuid() });
export const updateScheduleSchema = z.object({
  title: z.string().optional(),
  instructions: z.string().optional(),
  cron: z.string().optional(),
  connectors: z.array(z.string()).optional().default([]),
  id: z.string().uuid(),
});
export const archiveScheduleSchema = z.object({ id: z.string().uuid() });
export const toggleScheduleSchema = z.object({ id: z.string().uuid() });
export const testRunSchema = z.object({
  source: z.enum(['user', 'system']).optional().default('system'),
  id: z.string().uuid(),
});
export const resumeScheduleSchema = z.object({ id: z.string().uuid() });
