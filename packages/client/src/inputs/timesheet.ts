import { z } from 'zod';

export const timesheetTreeSchema = z.object({
  since: z.string().datetime().optional(),
  until: z.string().datetime().optional(),
});
