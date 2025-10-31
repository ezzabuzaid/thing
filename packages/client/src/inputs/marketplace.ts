import { z } from 'zod';

export const listMarketplaceTemplatesSchema = z.object({
  creator: z.string().optional(),
  search: z.string().optional(),
  sort: z
    .enum(['featured', 'trending', 'installs', 'newest'])
    .optional()
    .default('featured'),
  page: z.number().gt(0).optional().default(1),
  pageSize: z.number().min(1).max(100).optional().default(20),
});
export const getMarketplaceTemplateByIdSchema = z.object({
  id: z.string().uuid(),
});
export const updateMarketplaceTemplateSchema = z.object({
  title: z.string().optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  suggestedCron: z.string().optional(),
  connectors: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  id: z.string().uuid(),
});
export const deleteMarketplaceTemplateSchema = z.object({
  id: z.string().uuid(),
});
export const publishScheduleToMarketplaceSchema = z.object({
  description: z.string().optional(),
  tags: z.array(z.string()),
  title: z.string().optional(),
  instructions: z.string().optional(),
  suggestedCron: z.string().optional(),
  connectors: z.array(z.string()).optional(),
  scheduleId: z.string().uuid(),
});
