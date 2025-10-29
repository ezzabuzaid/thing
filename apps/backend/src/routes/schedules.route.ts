import { generate, user } from '@deepagents/agent';
import { type Schedules, prisma } from '@thing/db';
import { Client } from '@upstash/qstash';
import { Hono } from 'hono';
import { Resend } from 'resend';
import * as uuid from 'uuid';
import { z } from 'zod';

import { hackerNewsConnector } from '../faye/connectors/hackernews.ts';
import { titleGeneratorAgent } from '../faye/v2.ts';
import { authenticate } from '../middlewares/middleware.ts';
import { validate } from '../middlewares/validator.ts';

// if (process.env.NODE_ENV === 'development') {
//   process.env.QSTASH_URL = 'http://localhost:8080';
//   process.env.QSTASH_TOKEN =
//     'eyJVc2VySUQiOiJkZWZhdWx0VXNlciIsIlBhc3N3b3JkIjoiZGVmYXVsdFBhc3N3b3JkIn0=';
//   process.env.QSTASH_CURRENT_SIGNING_KEY = 'sig_7kYjw48mhY7kAjqNGcy6cr29RJ6r';
//   process.env.QSTASH_NEXT_SIGNING_KEY = 'sig_5ZB6DVzB1wjE8S6rZ7eenA8Pdnhs';
// }

type WithSlash<T extends string> = `/${T}`;
const client = new Client();
function scheduleRun(
  url: WithSlash<string>,
  cron: string,
  body: Record<string, any>,
) {
  return client.schedules.create({
    cron,
    destination: `https://january.sh${url}`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
}
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
      connectors: {
        select: payload.body.connectors,
        against: z
          .array(z.enum(['reddit', 'web search', 'hackernews']))
          .max(3)
          .optional(),
      },
    })),
    async (c) => {
      const { title, instructions, cron, enabled, connectors } = c.var.input;

      const schedule = await prisma.$transaction(async (tx) => {
        const id = uuid.v7();

        const { scheduleId: runnerId } = await scheduleRun('/run', cron, {
          id: id,
        });
        const record = await tx.schedules.create({
          data: {
            id,
            userId: c.var.subject.id,
            title,
            instructions,
            cron,
            enabled: enabled ?? true,
            runnerId,
            connectors: connectors ? Array.from(new Set(connectors)) : [],
          },
        });
        return record;
      });

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
      const where = { userId: c.var.subject.id, deletedAt: null };

      const totalCount = await prisma.schedules.count({ where });
      const schedules = await prisma.schedules.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { updatedAt: 'desc' },
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
        where: { id, userId: c.var.subject.id, deletedAt: null },
        include: { runs: true },
      });
      return c.json(schedule);
    },
  );

  /**
   * @openapi updateSchedule
   * @tags schedules
   * @description Update an existing schedule (title, cron, instructions, enabled).
   */
  router.patch(
    '/schedules/:id',
    authenticate(),
    validate('application/json', (payload) => ({
      id: { select: payload.params.id, against: z.string().uuid() },
      title: {
        select: payload.body.title,
        against: z.string().min(1).optional(),
      },
      instructions: {
        select: payload.body.instructions,
        against: z.string().min(1).optional(),
      },
      cron: {
        select: payload.body.cron,
        against: z.string().min(1).optional(),
      },
      connectors: {
        select: payload.body.connectors,
        against: z
          .array(z.enum(['reddit', 'web search', 'hackernews']))
          .max(3)
          .optional()
          .default([]),
      },
    })),
    async (c) => {
      const { id, title, instructions, cron, connectors } = c.var.input;

      // Ensure user owns the schedule
      const existing = await prisma.schedules.findFirstOrThrow({
        where: { id, userId: c.var.subject.id },
      });

      // If cron is being updated, we need to delete old Upstash schedule and create new one
      if (cron !== undefined && cron !== existing.cron) {
        const updated = await prisma.$transaction(async (tx) => {
          // Delete old Upstash schedule
          await client.schedules.delete(existing.runnerId).catch(() => {
            // Ignore errors if schedule doesn't exist
          });

          // Create new Upstash schedule with new cron
          const { scheduleId: newRunnerId } = await scheduleRun('/run', cron, {
            id: existing.id,
          });

          // Update Prisma record with new data
          return await tx.schedules.update({
            where: { id },
            data: {
              ...(title !== undefined && { title }),
              ...(instructions !== undefined && { instructions }),
              ...(connectors !== undefined && {
                connectors: Array.from(new Set(connectors)),
              }),
              cron,
              runnerId: newRunnerId,
            },
          });
        });

        return c.json(updated);
      }

      // Only update DB fields; no side effects (no runner changes)
      const updated = await prisma.schedules.update({
        where: { id },
        data: {
          ...(title !== undefined && { title }),
          ...(instructions !== undefined && { instructions }),
          ...(connectors !== undefined && {
            connectors: Array.from(new Set(connectors)),
          }),
        },
      });

      return c.json(updated);
    },
  );

  /**
   * @openapi toggleSchedule
   * @tags schedules
   * @description Toggle a schedule's enabled status. When disabling, the remote runner is deleted. When enabling, a new runner is scheduled.
   */
  router.post(
    '/schedules/:id/pause',
    authenticate(),
    validate((payload) => ({
      id: { select: payload.params.id, against: z.string().uuid() },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Ensure schedule exists and belongs to the user
      const existing = await prisma.schedules.findFirstOrThrow({
        where: { id, userId: c.var.subject.id },
      });

      if (!existing.enabled) {
        return c.json(existing);
      }

      // Disabling: remove remote and persist flag
      await client.schedules.delete(existing.runnerId).catch(() => {
        //
      });

      const rec = await prisma.schedules.update({
        where: { id },
        data: { enabled: false },
      });
      return c.json(rec);
    },
  );

  /**
   * @openapi testRun
   * @tags schedules
   * @description Test run a schedule
   */
  router.post(
    '/schedules/:id/run',
    authenticate(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
      source: {
        select: payload.body.source,
        against: z.enum(['user', 'system']).default('system'),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const schedule = await prisma.schedules.findFirstOrThrow({
        where: { id, userId: c.var.subject.id },
        include: { user: true },
      });

      const record = await prisma.scheduleRuns.create({
        data: {
          scheduleId: schedule.id,
          runAt: new Date(),
        },
      });
      const { result, title } = await runSchedule(schedule);

      await prisma.scheduleRuns.update({
        where: { id: record.id },
        data: {
          completedAt: new Date(),
          result: result,
          title: title,
        },
      });

      if (c.var.input.source === 'system') {
        const resend = new Resend('re_KXkH8Wte_7nC3BFrXZiHsVFf68j7o8Vdi');
        await resend.emails.send({
          from: 'Acme <admin@schedules.january.sh>',
          to: [schedule.user.email],
          subject: `Prompt: ${schedule.title}`,
          html: '<p>it works!</p>',
        });
      }

      return c.json({ result, title });
    },
  );

  /**
   * @openapi resumeSchedule
   * @tags schedules
   * @description Resume a schedule: sets enabled=true and creates a new remote runner schedule.
   */
  router.post(
    '/schedules/:id/resume',
    authenticate(),
    validate((payload) => ({
      id: { select: payload.params.id, against: z.string().uuid() },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Ensure schedule exists and belongs to the user
      const existing = await prisma.schedules.findFirstOrThrow({
        where: { id, userId: c.var.subject.id },
      });

      if (existing.enabled) {
        return c.json(existing);
      }

      // Create new remote schedule and save new runnerId
      const { scheduleId: newRunnerId } = await scheduleRun(
        '/run',
        existing.cron,
        { id: existing.id },
      );
      const rec = await prisma.schedules.update({
        where: { id },
        data: { enabled: true, runnerId: newRunnerId },
      });
      return c.json(rec);
    },
  );

  /**
   * @openapi archiveSchedule
   * @tags schedules
   * @description Archive a schedule: disables it, removes remote runner, and soft deletes it.
   */
  router.delete(
    '/schedules/:id',
    authenticate(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Ensure schedule exists and belongs to the user
      const existing = await prisma.schedules.findFirstOrThrow({
        where: { id, userId: c.var.subject.id, deletedAt: null },
      });

      // Delete remote runner if schedule is enabled
      if (existing.enabled) {
        await client.schedules.delete(existing.runnerId).catch(() => {
          // Ignore errors if schedule doesn't exist
        });
      }

      // Archive: disable and soft delete
      const record = await prisma.schedules.update({
        where: { id },
        data: {
          enabled: false,
          deletedAt: new Date(),
        },
      });

      return c.json(record);
    },
  );
}

async function runSchedule(schedule: Schedules) {
  const { text: result } = await generate(
    hackerNewsConnector,
    [user(schedule.instructions)],
    {},
  );
  const { text: title } = await generate(
    titleGeneratorAgent,
    [
      user(
        `
        <ScheduleTitle>${schedule.title}</ScheduleTitle>
        <ScheduleInstructions>${schedule.instructions}</ScheduleInstructions>
        <RunResult>${result}</RunResult>
        <Goal>Based on the above, generate a concise and informative title for this schedule run result.</Goal>
        <Important>Your response will be used as is to be displayed in the UI.</Important>
        `,
      ),
    ],
    {},
  );
  return { result, title };
}
