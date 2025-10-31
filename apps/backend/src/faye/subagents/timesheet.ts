import { groq } from '@ai-sdk/groq';
import { type Agent, agent, toState } from '@deepagents/agent';
import { type Prisma, prisma } from '@thing/db';
import { tool } from 'ai';
import z from 'zod';

import timeContext from '../time-context.ts';

const iso = z.string().describe('Date of work (ISO 8601 format)');
export const timesheetAgent: Agent = agent({
  model: groq('openai/gpt-oss-120b'),
  name: 'Timesheet Agent',
  handoffDescription:
    'A helpful agent specialized in tracking work hours, managing clients and projects, recording time entries, and generating billing reports.',
  prompt: [
    'You manage timesheet data including clients, projects, and hour entries. Handle time tracking, billing calculations, and provide insights on work hours.',

    `## Output Format`,
    'Provide clear summaries of hours worked, billable amounts, and project utilization.',
    'You work hand in hand with the user, ask questions if needed, and use the tools below to get things done.',

    `## Routine`,
    'When creating time entries, always capture date, hours, and project.',
    'Support both hourly billing and retainer arrangements (fixed monthly hours/payment).',
    'Handle currency consistently, defaulting to USD if not specified.',

    timeContext,
  ],
  tools: {
    createClient: tool({
      description: 'Create a new client.',
      inputSchema: z.object({
        name: z.string().max(160).describe('Client name'),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        const client = await prisma.client.create({
          data: {
            name: input.name,
            userId: state.userId,
          },
        });
        return {
          success: true,
          client,
        };
      },
    }),
    listClients: tool({
      description:
        'List all clients with optional keyword filtering (array of strings).',
      inputSchema: z.object({
        keywords: z
          .array(z.string().min(1))
          .optional()
          .transform((arr) => (arr ?? []).map((s) => s.trim()).filter(Boolean))
          .describe('Keywords to match in client name; all must match (AND).'),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        const where: Prisma.ClientWhereInput =
          input.keywords.length > 0
            ? {
                userId: state.userId,
                OR: input.keywords.map((it) => ({
                  name: {
                    contains: it,
                    mode: 'insensitive',
                  },
                })),
              }
            : { userId: state.userId };

        const clients = await prisma.client.findMany({
          where,
          include: {
            projects: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });

        return {
          clients,
          total: clients.length,
        };
      },
    }),
    createProject: tool({
      description: 'Create a new project for a client.',
      inputSchema: z.object({
        clientId: z.string().uuid().describe('Client ID'),
        name: z.string().max(160).describe('Project name'),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        // Ensure client belongs to user
        await prisma.client.findFirstOrThrow({
          where: { id: input.clientId, userId: state.userId },
          select: { id: true },
        });
        const project = await prisma.project.create({
          data: {
            clientId: input.clientId,
            name: input.name,
            userId: state.userId,
          },
          include: {
            client: true,
          },
        });
        return {
          success: true,
          project,
        };
      },
    }),
    listProjects: tool({
      description:
        'List projects, optionally filtered by client and keyword(s) in project name.',
      inputSchema: z.object({
        clientId: z.string().uuid().optional().describe('Filter by client ID'),
        keywords: z
          .array(z.string().min(1))
          .optional()
          .transform((arr) => (arr ?? []).map((s) => s.trim()).filter(Boolean))
          .describe('Keywords to match in project name; all must match (AND).'),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        const where: Prisma.ProjectWhereInput = {
          userId: state.userId,
          ...(input.clientId ? { clientId: input.clientId } : {}),
          ...(input.keywords.length > 0
            ? {
                OR: input.keywords.map((it) => ({
                  name: {
                    contains: it,
                    mode: 'insensitive',
                  },
                })),
              }
            : {}),
        };

        const projects = await prisma.project.findMany({
          where,
          select: {
            clientId: false,
            client: true,
          },
          orderBy: {
            updatedAt: 'desc',
          },
        });

        return {
          projects,
          total: projects.length,
        };
      },
    }),
    logHours: tool({
      description:
        'Log hours worked on a project. For retainer billing, use this at month-end with calculated rate (payment / agreed_hours).',
      inputSchema: z.object({
        projectId: z.string().uuid().describe('Project ID'),
        date: iso,
        hours: z.coerce
          .number()
          .positive()
          .transform(String)
          .describe('Hours worked (e.g., 1.5 for 1h 30m)'),
        hourlyRate: z.coerce
          .number()
          .positive()
          .optional()
          .transform((val) => val || 0)
          .describe('Hourly rate for billing'),
        currency: z
          .string()
          .max(8)
          .optional()
          .optional()
          .default('USD')
          .describe('Currency code (e.g., USD, EUR)'),
        billable: z
          .boolean()
          .optional()
          .optional()
          .default(true)
          .describe('Whether this entry is billable'),
        note: z.string().optional().describe('Optional note about the work'),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        // Ensure project belongs to user
        await prisma.project.findFirstOrThrow({
          where: { id: input.projectId, userId: state.userId },
          select: { id: true },
        });
        const entry = await prisma.hourEntry.create({
          data: {
            projectId: input.projectId,
            date: new Date(input.date),
            hours: input.hours,
            hourlyRate: String(input.hourlyRate),
            currency: input.currency,
            billable: input.billable,
            note: input.note,
            userId: state.userId,
          },
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
        });

        const totalAmount =
          input.hourlyRate && input.billable
            ? Number(entry.hours) * input.hourlyRate
            : null;

        return {
          success: true,
          entry,
          billing: totalAmount
            ? {
                amount: totalAmount,
                currency: entry.currency,
              }
            : null,
        };
      },
    }),
    deleteHourEntry: tool({
      description: 'Delete an hour entry.',
      inputSchema: z.object({
        entryId: z.string().uuid().describe('Hour entry ID to delete'),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        // Ensure ownership
        await prisma.hourEntry.findFirstOrThrow({
          where: { id: input.entryId, userId: state.userId },
          select: { id: true },
        });
        await prisma.hourEntry.delete({ where: { id: input.entryId } });

        return {
          success: true,
          message: 'Hour entry deleted successfully',
        };
      },
    }),
    listHourEntries: tool({
      description:
        'List hour entries with optional filters for date range and project.',
      inputSchema: z.object({
        projectId: z.string().uuid().describe('Filter by project ID'),
        startDate: iso.optional(),
        endDate: iso.optional(),
        billableOnly: z
          .boolean()
          .optional()
          .describe('Show only billable entries'),
      }),
      execute: async (input, options) => {
        const state = toState<{ userId: string }>(options);
        const where: Prisma.HourEntryWhereInput = {
          userId: state.userId,
          ...{ projectId: input.projectId },
          ...(input.startDate || input.endDate
            ? {
                date: {
                  ...(input.startDate
                    ? { gte: new Date(input.startDate) }
                    : {}),
                  ...(input.endDate ? { lte: new Date(input.endDate) } : {}),
                },
              }
            : {}),
          ...(input.billableOnly ? { billable: true } : {}),
        };

        const entries = await prisma.hourEntry.findMany({
          where,
          include: {
            project: {
              include: {
                client: true,
              },
            },
          },
          orderBy: {
            date: 'desc',
          },
        });

        // Calculate totals
        const totalHours = entries.reduce(
          (sum, entry) => sum + Number(entry.hours),
          0,
        );

        const totalBillable = entries
          .filter((e) => e.billable && e.hourlyRate)
          .reduce(
            (sum, entry) =>
              sum + Number(entry.hours) * Number(entry.hourlyRate!),
            0,
          );

        return {
          entries,
          summary: {
            totalEntries: entries.length,
            totalHours: totalHours,
            billableEntries: entries.filter((e) => e.billable).length,
            totalBillable: totalBillable,
          },
        };
      },
    }),
  },
});
