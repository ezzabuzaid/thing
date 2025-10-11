import { z } from 'zod';

export const listThoughtsSchema = z.object({
  page: z.number().gt(0).default(1),
  pageSize: z.number().min(1).max(100).default(20),
});
