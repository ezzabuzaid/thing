import { z } from 'zod';

export const getRemindersSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  includeCompleted: z.enum(['true', 'false']).optional(),
  includeCancelled: z.enum(['true', 'false']).optional(),
  limit: z.number().min(1).max(100).optional(),
});
export const postRemindersSchema = z.object({
  title: z.string(),
  remindAt: z.string().datetime(),
  notes: z.string().optional(),
  source: z.string().optional(),
});
export const patchRemindersreminderIdSchema = z.object({
  title: z.string().optional(),
  notes: z.string().optional(),
  reminderId: z.string().uuid(),
});
