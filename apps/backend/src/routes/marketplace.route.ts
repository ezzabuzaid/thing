import { type Prisma, prisma } from '@thing/db';
import { Hono } from 'hono';
import * as uuid from 'uuid';
import { z } from 'zod';

import { authenticate } from '../middlewares/middleware.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi listMarketplaceTemplates
   * @tags marketplace
   * @description List marketplace templates with filtering and search.
   */
  router.get(
    '/marketplace/templates',
    authenticate(),
    validate((payload) => ({
      creator: {
        select: payload.query.creator,
        against: z.string().optional(),
      },
      search: {
        select: payload.query.search,
        against: z.string().optional(),
      },
      sort: {
        select: payload.query.sort,
        against: z
          .enum(['featured', 'trending', 'installs', 'newest'])
          .optional()
          .default('featured'),
      },
      page: {
        select: payload.query.page,
        against: z.coerce.number().int().positive().optional().default(1),
      },
      pageSize: {
        select: payload.query.pageSize,
        against: z.coerce.number().int().min(1).max(100).optional().default(20),
      },
    })),
    async (c) => {
      const { creator, search, sort, page, pageSize } = c.var.input;

      // Build where clause
      const where: any = {
        published: true,
        deletedAt: null,
      };

      if (creator) {
        where.authorId = creator;
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { hasSome: [search] } },
        ];
      }

      // Determine order
      let orderBy: any = {};
      switch (sort) {
        case 'featured':
          orderBy = [{ isOfficial: 'desc' }, { installCount: 'desc' }];
          break;
        case 'trending':
          // For trending, we'd ideally track installs by date
          // For now, use installCount as proxy
          orderBy = { installCount: 'desc' };
          break;
        case 'installs':
          orderBy = { installCount: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
      }

      const totalCount = await prisma.scheduleTemplates.count({ where });
      const templates = await prisma.scheduleTemplates.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return c.json({
        records: templates,
        pagination: {
          total: totalCount,
          page,
          pageSize,
          totalPages: Math.ceil(totalCount / pageSize),
          hasNext: page < Math.ceil(totalCount / pageSize),
          hasPrev: page > 1,
        },
      });
    },
  );

  /**
   * @openapi getMarketplaceTemplateById
   * @tags marketplace
   * @description Get a single marketplace template by ID and increment view count.
   */
  router.get(
    '/marketplace/templates/:id',
    authenticate(),
    validate((payload) => ({
      id: { select: payload.params.id, against: z.string().uuid() },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Increment view count and fetch template
      const template = await prisma.$transaction(async (tx) => {
        await tx.scheduleTemplates.update({
          where: { id, published: true, deletedAt: null },
          data: {
            viewCount: { increment: 1 },
          },
        });

        return await tx.scheduleTemplates.findUniqueOrThrow({
          where: { id },
          include: {
            author: {
              select: {
                id: true,
                name: true,
                image: true,
              },
            },
          },
        });
      });

      return c.json(template);
    },
  );

  /**
   * @openapi publishScheduleToMarketplace
   * @tags marketplace
   * @description Publish an existing schedule as a marketplace template.
   */
  router.post(
    '/schedules/:scheduleId/publish-to-marketplace',
    authenticate(),
    validate('application/json', (payload) => ({
      scheduleId: {
        select: payload.params.scheduleId,
        against: z.string().uuid(),
      },
      description: {
        select: payload.body.description,
        against: z.string().min(1),
      },
      tags: {
        select: payload.body.tags,
        against: z.array(z.string()).min(1).max(3),
      },
      // Allow overriding schedule fields
      title: {
        select: payload.body.title,
        against: z.string().min(1).optional(),
      },
      instructions: {
        select: payload.body.instructions,
        against: z.string().min(1).optional(),
      },
      suggestedCron: {
        select: payload.body.suggestedCron,
        against: z.string().min(1).optional(),
      },
      connectors: {
        select: payload.body.connectors,
        against: z.array(z.string()).optional(),
      },
    })),
    async (c) => {
      const {
        scheduleId,
        description,
        tags,
        title,
        instructions,
        suggestedCron,
        connectors,
      } = c.var.input;

      // Fetch the schedule owned by the user
      const schedule = await prisma.schedules.findFirstOrThrow({
        where: {
          id: scheduleId,
          userId: c.var.subject.id,
          deletedAt: null,
        },
      });

      // Create marketplace template from schedule
      const template = await prisma.scheduleTemplates.create({
        data: {
          id: uuid.v7(),
          authorId: c.var.subject.id,
          title: title ?? schedule.title,
          description,
          instructions: instructions ?? schedule.instructions,
          suggestedCron: suggestedCron ?? schedule.cron,
          connectors: connectors
            ? Array.from(new Set(connectors))
            : schedule.connectors,
          tags: Array.from(new Set(tags)),
          published: true,
          isOfficial: false,
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return c.json(template, 201);
    },
  );

  /**
   * @openapi updateMarketplaceTemplate
   * @tags marketplace
   * @description Update a marketplace template (only by author).
   */
  router.patch(
    '/marketplace/templates/:id',
    authenticate(),
    validate('application/json', (payload) => ({
      id: { select: payload.params.id, against: z.string().uuid() },
      title: {
        select: payload.body.title,
        against: z.string().min(1).optional(),
      },
      description: {
        select: payload.body.description,
        against: z.string().min(1).optional(),
      },
      instructions: {
        select: payload.body.instructions,
        against: z.string().min(1).optional(),
      },
      suggestedCron: {
        select: payload.body.suggestedCron,
        against: z.string().min(1).optional(),
      },
      connectors: {
        select: payload.body.connectors,
        against: z.array(z.string()).optional(),
      },
      tags: {
        select: payload.body.tags,
        against: z.array(z.string()).min(1).max(3).optional(),
      },
    })),
    async (c) => {
      const {
        id,
        title,
        description,
        instructions,
        suggestedCron,
        connectors,
        tags,
      } = c.var.input;

      // Ensure user owns the template
      const existing = await prisma.scheduleTemplates.findFirstOrThrow({
        where: { id, authorId: c.var.subject.id },
      });

      const updated = await prisma.scheduleTemplates.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(instructions !== undefined && { instructions }),
          ...(suggestedCron !== undefined && { suggestedCron }),
          ...(connectors !== undefined && {
            connectors: Array.from(new Set(connectors)),
          }),
          ...(tags !== undefined && { tags: Array.from(new Set(tags)) }),
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              image: true,
            },
          },
        },
      });

      return c.json(updated);
    },
  );

  /**
   * @openapi deleteMarketplaceTemplate
   * @tags marketplace
   * @description Delete a marketplace template (only by author).
   */
  router.delete(
    '/marketplace/templates/:id',
    authenticate(),
    validate((payload) => ({
      id: { select: payload.params.id, against: z.string().uuid() },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Ensure user owns the template
      await prisma.scheduleTemplates.findFirstOrThrow({
        where: { id, authorId: c.var.subject.id },
      });

      // Soft delete
      await prisma.scheduleTemplates.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      return c.json({ success: true });
    },
  );
}
