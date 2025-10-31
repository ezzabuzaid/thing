import { z } from 'zod';

export const listThoughtsSchema = z.object({
  page: z.number().gt(0).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
});
