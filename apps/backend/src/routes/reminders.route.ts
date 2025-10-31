import { Prisma, prisma } from '@thing/db';
import { isBefore, isValid, parseISO, subMinutes } from 'date-fns';
import { Hono } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { z } from 'zod';

import { authenticate } from '../middlewares/middleware.ts';
import { validate } from '../middlewares/validator.ts';

const REMINDER_STATUSES = ['scheduled', 'completed', 'cancelled'] as const;

const parseRemindAt = (raw: string) => {
  const parsed = parseISO(raw);
  if (!isValid(parsed)) {
    throw new HTTPException(400, {
      message: 'Invalid datetime. Provide an ISO-8601 string in UTC.',
      cause: {
        code: 'reminders/invalid-datetime',
        detail: 'The provided remindAt value is not a valid ISO-8601 datetime.',
      },
    });
  }
  return parsed;
};

const ensureFutureDate = (date: Date, toleranceMinutes = 1) => {
  const threshold = subMinutes(new Date(), toleranceMinutes);
  if (isBefore(date, threshold)) {
    throw new HTTPException(400, {
      message: 'The reminder time must be in the future.',
      cause: {
        code: 'reminders/past-remind-at',
        detail: 'The provided remindAt value occurs in the past.',
      },
    });
  }
};

const ensureOwnership = async (reminderId: string, userId: string) => {
  const reminder = await prisma.reminder.findUniqueOrThrow({
    where: { id: reminderId },
    select: {
      id: true,
      userId: true,
      title: true,
      notes: true,
      remindAt: true,
      source: true,
      status: true,
      completedAt: true,
      cancelledAt: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  if (reminder.userId !== userId) {
    throw new HTTPException(404, {
      message: 'Reminder not found',
      cause: {
        code: 'reminders/not-found',
        detail: 'Reminder not found.',
      },
    });
  }

  return reminder;
};

export default async function (router: Hono) {
  router.get(
    '/reminders',
    authenticate(),
    validate((payload) => ({
      from: {
        select: payload.query.from,
        against: z.string().datetime().optional(),
      },
      to: {
        select: payload.query.to,
        against: z.string().datetime().optional(),
      },
      includeCompleted: {
        select: payload.query.includeCompleted,
        against: z
          .enum(['true', 'false'])
          .transform((value) => value === 'true')
          .optional(),
      },
      includeCancelled: {
        select: payload.query.includeCancelled,
        against: z
          .enum(['true', 'false'])
          .transform((value) => value === 'true')
          .optional(),
      },
      limit: {
        select: payload.query.limit,
        against: z.coerce.number().int().min(1).max(100).optional(),
      },
    })),
    async (c) => {
      const { from, to, includeCancelled, includeCompleted, limit } =
        c.var.input;
      const take = limit ?? 20;
      const statuses: (typeof REMINDER_STATUSES)[number][] = ['scheduled'];

      if (includeCompleted) {
        statuses.push('completed');
      }
      if (includeCancelled) {
        statuses.push('cancelled');
      }

      const where: Prisma.ReminderWhereInput = {
        userId: c.var.subject.id,
        status: { in: statuses },
        ...(includeCancelled ? {} : { deletedAt: null }),
      };

      if (from || to) {
        where.remindAt = {};
        if (from) {
          where.remindAt.gte = parseRemindAt(from);
        }
        if (to) {
          where.remindAt.lte = parseRemindAt(to);
        }
      }

      const reminders = await prisma.reminder.findMany({
        where,
        orderBy: [{ remindAt: 'asc' }, { updatedAt: 'desc' }],
        take,
      });

      return c.json({
        count: reminders.length,
        reminders,
      });
    },
  );

  router.post(
    '/reminders',
    authenticate(),
    validate('application/json', (payload) => ({
      title: {
        select: payload.body.title,
        against: z.string().min(1),
      },
      remindAt: {
        select: payload.body.remindAt,
        against: z.string().datetime(),
      },
      notes: {
        select: payload.body.notes,
        against: z.string().optional(),
      },
      source: {
        select: payload.body.source,
        against: z.string().optional(),
      },
    })),
    async (c) => {
      const { title, remindAt, notes, source } = c.var.input;
      const parsed = parseRemindAt(remindAt);
      ensureFutureDate(parsed);

      const created = await prisma.reminder.create({
        data: {
          userId: c.var.subject.id,
          title: title.trim(),
          remindAt: parsed,
          notes: notes?.trim() ? notes.trim() : null,
          source: source?.trim() ? source.trim() : null,
        },
      });

      return c.json(created, 201);
    },
  );

  router.patch(
    '/reminders/:reminderId',
    authenticate(),
    validate('application/json', (payload) => ({
      reminderId: {
        select: payload.params.reminderId,
        against: z.string().uuid(),
      },
      title: {
        select: payload.body.title,
        against: z.string().min(1).optional(),
      },
      notes: {
        select: payload.body.notes,
        against: z.string().optional(),
      },
    })),
    async (c) => {
      const { reminderId, title, notes } = c.var.input;

      if (typeof title === 'undefined' && typeof notes === 'undefined') {
        throw new HTTPException(400, {
          message: 'Provide at least one field to update.',
          cause: {
            code: 'reminders/nothing-to-update',
            detail: 'Provide at least one field to update.',
          },
        });
      }

      const reminder = await ensureOwnership(reminderId, c.var.subject.id);

      if (reminder.deletedAt || reminder.status === 'cancelled') {
        throw new HTTPException(400, {
          message: 'Cannot update a cancelled reminder.',
          cause: {
            code: 'reminders/cancelled',
            detail: 'Cannot update a cancelled reminder.',
          },
        });
      }

      if (reminder.status === 'completed') {
        throw new HTTPException(400, {
          message: 'Cannot update a completed reminder.',
          cause: {
            code: 'reminders/completed',
            detail: 'Cannot update a completed reminder.',
          },
        });
      }

      const data: Parameters<typeof prisma.reminder.update>[0]['data'] = {};

      if (typeof title !== 'undefined') {
        const trimmedTitle = title.trim();
        if (!trimmedTitle) {
          throw new HTTPException(400, {
            message: 'Title cannot be empty.',
            cause: {
              code: 'reminders/invalid-title',
              detail: 'Title cannot be empty.',
            },
          });
        }
        data.title = trimmedTitle;
      }

      if (typeof notes !== 'undefined') {
        const trimmedNotes = notes.trim();
        data.notes = trimmedNotes ? trimmedNotes : null;
      }

      const updated = await prisma.reminder.update({
        where: { id: reminder.id },
        data,
      });

      return c.json(updated);
    },
  );

  router.post(
    '/reminders/:reminderId/complete',
    authenticate(),
    validate((payload) => ({
      reminderId: {
        select: payload.params.reminderId,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { reminderId } = c.var.input;
      const reminder = await ensureOwnership(reminderId, c.var.subject.id);

      if (reminder.deletedAt) {
        throw new HTTPException(400, {
          message:
            'Cannot complete a cancelled reminder. Schedule a new reminder instead.',
          cause: {
            code: 'reminders/cancelled',
            detail:
              'Cannot complete a cancelled reminder. Schedule a new reminder instead.',
          },
        });
      }

      if (reminder.status === 'completed') {
        return c.json(reminder);
      }

      const updated = await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'completed',
          completedAt: new Date(),
          cancelledAt: null,
          deletedAt: null,
        },
      });

      return c.json(updated);
    },
  );

  router.post(
    '/reminders/:reminderId/cancel',
    authenticate(),
    validate((payload) => ({
      reminderId: {
        select: payload.params.reminderId,
        against: z.string().uuid(),
      },
    })),
    async (c) => {
      const { reminderId } = c.var.input;
      const reminder = await ensureOwnership(reminderId, c.var.subject.id);

      if (reminder.deletedAt && reminder.status === 'cancelled') {
        return c.json(reminder);
      }

      const updated = await prisma.reminder.update({
        where: { id: reminder.id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          completedAt: null,
          deletedAt: new Date(),
        },
      });

      return c.json(updated);
    },
  );
}
