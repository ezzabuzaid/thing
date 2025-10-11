import { Hono } from 'hono';
import { z } from 'zod';

import { type Prisma, prisma } from '@agent/db';

import { authenticate } from '../middlewares/middleware.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi listThoughts
   * @tags thoughts
   * @description Get a paginated list of thoughts ordered by last update time. Includes bookmark relation when present.
   */
  router.get(
    '/thoughts',
    authenticate(),
    validate((payload) => ({
      page: {
        select: payload.query.page,
        against: z.coerce.number().int().positive().default(1),
      },
      pageSize: {
        select: payload.query.pageSize,
        against: z.coerce.number().int().min(1).max(100).default(20),
      },
    })),
    async (c) => {
      const { page, pageSize } = c.var.input;

      // No user filter available on Thought model currently
      const where: Prisma.ThoughtWhereInput = {};

      const total = await prisma.thought.count({ where });
      const thoughts = await prisma.thought.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          bookmark: true,
        },
      });

      return c.json({
        records: thoughts,
        pagination: {
          total,
          page,
          pageSize,
          totalPages: Math.ceil(total / pageSize),
          hasNext: page < Math.ceil(total / pageSize),
          hasPrev: page > 1,
        },
      });
    },
  );
}
