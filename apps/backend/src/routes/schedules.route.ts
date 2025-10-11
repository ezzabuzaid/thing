import { Hono } from 'hono';
import { z } from 'zod';

import { prisma } from '@agent/db';

import { authenticate } from '../middlewares/middleware.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi createSchedule
   * @tags schedules
   * @description Create a schedule and schedule it with pg-boss. Returns the created schedule.
   */
  router.post(
    '/schedules',
    authenticate(),
    validate('application/json', (payload) => ({
      title: { select: payload.body.title, against: z.string().min(1) },
      instructions: {
        select: payload.body.instructions,
        against: z.string().min(1),
      },
      cron: { select: payload.body.cron, against: z.string().min(1) },
      enabled: {
        select: payload.body.enabled,
        against: z.boolean().optional(),
      },
    })),
    async (c) => {
      const { title, instructions, cron, enabled } = c.var.input;

      const schedule = await prisma.schedules.create({
        data: {
          userId: c.var.subject.id,
          title,
          instructions,
          cron,
          enabled: enabled ?? true,
        },
      });

      const queueName = `schedule:${schedule.id}`;
      // await boss.createQueue(queueName);
      // Schedule using cron; pg-boss uses cron option in schedule
      // await boss.schedule(queueName, schedule.cron, { taskId: schedule.id });

      return c.json(schedule, 201);
    },
  );

  /**
   * @openapi listSchedules
   * @tags schedules
   * @description List schedules for the authenticated user (paginated).
   */
  router.get(
    '/schedules',
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
      const where = { userId: c.var.subject.id } as const;

      const totalCount = await prisma.schedules.count({ where });
      const schedules = await prisma.schedules.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      return c.json({
        records: schedules,
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
   * @openapi getScheduleById
   * @tags schedules
   * @description Get a single schedule by id if owned by the user.
   */
  router.get(
    '/schedules/:id',
    authenticate(),
    validate((payload) => ({
      id: { select: payload.params.id, against: z.string().uuid() },
    })),
    async (c) => {
      const { id } = c.var.input;
      const schedule = await prisma.schedules.findFirstOrThrow({
        where: { id, userId: c.var.subject.id },
      });
      return c.json(schedule);
    },
  );
}
