import { groq } from '@ai-sdk/groq';
import { agent, toState } from '@deepagents/agent';
import { type Prisma, prisma } from '@thing/db';
import { tool } from 'ai';
import { isBefore, isValid, parseISO, subMinutes } from 'date-fns';
import z from 'zod';

import timeContext from '../time-context.ts';

const REMINDER_STATUSES = ['scheduled', 'completed', 'cancelled'] as const;
type ReminderStatus = (typeof REMINDER_STATUSES)[number];

function parseRemindAt(raw: string) {
  const parsed = parseISO(raw);
  if (!isValid(parsed)) {
    throw new Error('Invalid datetime. Provide an ISO-8601 string in UTC.');
  }
  return parsed;
}

function ensureFutureDate(date: Date, toleranceMinutes = 1) {
  const threshold = subMinutes(new Date(), toleranceMinutes);
  if (isBefore(date, threshold)) {
    throw new Error('The reminder time must be in the future.');
  }
}

export const remindersAgent = agent({
  name: 'Reminder Agent',
  handoffDescription:
    'A focused agent that schedules, reviews, completes, and cancels time-based reminders.',
  model: groq('moonshotai/kimi-k2-instruct-0905'),
  prompt: [
    `You manage personal reminders for a single user.`,
    `### Responsibilities`,
    `- Create reminders with a clear title and precise trigger time.`,
    `- Confirm ambiguous times before creating reminders; convert to UTC always.`,
    `- Keep responses brief, structured, and action oriented for the orchestrator.`,
    `- Reminders are immutable except for updating title or notes via the dedicated tool. To change timing or other details, cancel the existing reminder and schedule a replacement. Report the new reminder ID after rescheduling.`,
    `- Use the dedicated tools when users complete or cancel reminders.`,
    `- Never fabricate reminder data; rely on the database.`,
    timeContext,
  ],
  tools: {
    listReminders: tool({
      description:
        'List reminders with optional filtering by datetime window and completion state.',
      inputSchema: z.object({
        from: z
          .string()
          .datetime()
          .optional()
          .describe('Inclusive ISO datetime lower bound.'),
        to: z
          .string()
          .datetime()
          .optional()
          .describe('Inclusive ISO datetime upper bound.'),
        includeCompleted: z.boolean().optional().default(false),
        includeCancelled: z.boolean().optional().default(false),
        limit: z.number().int().min(1).max(100).optional().default(20),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        const includeCompleted = input.includeCompleted ?? false;
        const includeCancelled = input.includeCancelled ?? false;

        const statuses: ReminderStatus[] = ['scheduled'];
        if (includeCompleted) statuses.push('completed');
        if (includeCancelled) statuses.push('cancelled');

        const where: Prisma.ReminderWhereInput = {
          userId: state.userId,
          status: { in: statuses },
          ...(includeCancelled ? {} : { deletedAt: null }),
        };

        if (input.from || input.to) {
          const remindAt: Prisma.DateTimeFilter = {};
          if (input.from) {
            remindAt.gte = parseRemindAt(input.from);
          }
          if (input.to) {
            remindAt.lte = parseRemindAt(input.to);
          }
          where.remindAt = remindAt;
        }

        const reminders = await prisma.reminder.findMany({
          where,
          orderBy: [{ remindAt: 'asc' }, { updatedAt: 'desc' }],
          take: input.limit,
        });

        return {
          count: reminders.length,
          reminders,
        };
      },
    }),
    scheduleAReminder: tool({
      description:
        'Schedule a reminder. Requires title and remindAt (ISO datetime).',
      inputSchema: z.object({
        title: z.string().min(1),
        remindAt: z
          .string()
          .datetime()
          .describe('ISO 8601 string (UTC). Always include time.'),
        notes: z.string().optional(),
        source: z.string().optional(),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        const remindAt = parseRemindAt(input.remindAt);
        ensureFutureDate(remindAt);

        const reminder = await prisma.reminder.create({
          data: {
            title: input.title,
            remindAt,
            notes: input.notes?.trim() ? input.notes : null,
            source: input.source ?? null,
            userId: state.userId,
          },
        });

        return reminder;
      },
    }),
    completeReminder: tool({
      description: 'Mark a reminder as completed.',
      inputSchema: z.object({
        reminderId: z.string().uuid(),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        const reminder = await prisma.reminder.findFirstOrThrow({
          where: { id: input.reminderId, userId: state.userId },
        });

        if (reminder.deletedAt) {
          throw new Error(
            'Cannot complete a cancelled reminder. Schedule a new reminder instead.',
          );
        }

        if (reminder.status === 'completed') {
          return reminder;
        }

        const completed = await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'completed',
            completedAt: new Date(),
            cancelledAt: null,
            deletedAt: null,
          },
        });

        return completed;
      },
    }),
    cancelReminder: tool({
      description:
        'Cancel (soft delete) a reminder so it will no longer trigger.',
      inputSchema: z.object({
        reminderId: z.string().uuid(),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        const reminder = await prisma.reminder.findFirstOrThrow({
          where: { id: input.reminderId, userId: state.userId },
        });

        if (reminder.deletedAt && reminder.status === 'cancelled') {
          return reminder;
        }

        const cancelled = await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            status: 'cancelled',
            cancelledAt: new Date(),
            completedAt: null,
            deletedAt: new Date(),
          },
        });

        return cancelled;
      },
    }),
    updateReminderDetails: tool({
      description: 'Update the title and/or notes of a reminder.',
      inputSchema: z
        .object({
          reminderId: z.string().uuid(),
          title: z.string().trim().min(1).optional(),
          notes: z.string().trim().optional(),
        })
        .refine(
          ({ title, notes }) =>
            typeof title !== 'undefined' || typeof notes !== 'undefined',
          { message: 'Provide a title or notes to update.' },
        ),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        const reminder = await prisma.reminder.findFirstOrThrow({
          where: { id: input.reminderId, userId: state.userId },
        });

        if (reminder.deletedAt || reminder.status === 'cancelled') {
          throw new Error(
            'Cannot update a cancelled reminder. Schedule a new reminder instead.',
          );
        }

        if (reminder.status === 'completed') {
          throw new Error('Cannot update a completed reminder.');
        }

        const updated = await prisma.reminder.update({
          where: { id: reminder.id },
          data: {
            ...(input.title && { title: input.title }),
            ...(input.notes && { notes: input.notes }),
          },
        });

        return updated;
      },
    }),
  },
});
