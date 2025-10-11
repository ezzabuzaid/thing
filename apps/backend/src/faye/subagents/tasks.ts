import { groq } from '@ai-sdk/groq';
import { type Agent, agent } from '@deepagents/agent';
import { tool } from 'ai';
import z from 'zod';

import { type Prisma, prisma } from '@agent/db';

import timeContext from '../time-context.ts';

export const tasksAgent: Agent = agent({
  name: 'Tasks Agent',
  handoffDescription: `A helpful agent that can assist with managing user tasks. I'm action oriented so when you want me use verbs like "create", "add", "list", "search", ...etc along with the object "task" or "tasks".`,
  // model: openai('gpt-4.1-mini'),
  model: groq('moonshotai/kimi-k2-instruct-0905'),
  prompt: [
    `You are an assistant that helps manage User Tasks. your response is not for the user, but for another agent called Faye, who is fronting for you. Be concise and clear in your responses.`,
    `### Task System Overview`,
    `- The task system is hierarchical, with lists containing tasks and subtasks.`,
    `- Each task can have a title, due date, notes, and can be marked as completed.`,
    `- Tasks can be moved between lists and can be organized as subtasks under other tasks.`,
    // `- IMPORTANT: Task lists are user-only operations. This agent must NOT create or modify task lists. To create a task, you MUST be provided a valid taskListId. To create a subtask, you MUST be provided a valid parent taskId.`,
    `### Creating Tasks and Subtasks`,
    `- To create a new task, you must provide a title and the ID of the task list it belongs to (taskListId). Notes and due date are optional.`,
    `- To create a subtask, you must provide a title and the ID of the parent task (taskId). Notes and due date are optional.`,
    '- You cannot create task lists. this is a user-only operation. and if user have asked you to do so respond with "I am unable to create task lists. Please provide an existing taskList name/title to create a task."',
    '- Make sure to search for task lists using "getTaskLists" tool before creating a task to to grab the correct taskListId. if you are confused about which task list to use, ask the user for clarification.',
    timeContext,
  ],
  tools: {
    getTaskLists: tool({
      description: 'List available task lists.',
      inputSchema: z.object({}),
      execute: async () => {
        return await prisma.tasksList.findMany({
          select: { id: true, title: true },
          orderBy: { updatedAt: 'desc' },
        });
      },
    }),
    getTasks: tool({
      description: 'List tasks (and subtasks) in a specific task list.',
      inputSchema: z.object({
        taskListId: z.string(),
      }),
      execute: async (input) => {
        return prisma.task.findMany({
          where: {
            taskListId: input.taskListId,
            deletedAt: null,
            status: { not: 'completed' },
          },
          orderBy: { updatedAt: 'desc' },
          select: {
            notes: true,
            updatedAt: true,
            title: true,
            subtasks: {
              where: { deletedAt: null, status: { not: 'completed' } },
              orderBy: { updatedAt: 'desc' },
            },
          },
        });
      },
    }),
    searchTasks: tool({
      description: 'Search across task lists, tasks, and subtasks.',
      inputSchema: z.object({
        keywords: z.array(z.string().min(1)).min(1, 'keywords is required'),
        taskListId: z.string().optional(),
        includeCompleted: z.boolean().default(false),
      }),
      execute: async (input) => {
        const matchTasks: Prisma.TaskWhereInput[] = input.keywords.flatMap(
          (k) => [
            { title: { contains: k, mode: 'insensitive' } },
            { notes: { contains: k, mode: 'insensitive' } },
          ],
        );
        const matchSubtasks: Prisma.SubtaskWhereInput[] =
          input.keywords.flatMap((k) => [
            { title: { contains: k, mode: 'insensitive' } },
            { notes: { contains: k, mode: 'insensitive' } },
          ]);

        const taskBaseWhere: Prisma.TaskWhereInput = {
          deletedAt: null,
          ...(input.taskListId ? { taskListId: input.taskListId } : {}),
          ...(!input.includeCompleted ? { status: { not: 'completed' } } : {}),
        };

        const tasksWhere: Prisma.TaskWhereInput = {
          ...taskBaseWhere,
          OR: [
            ...matchTasks,
            {
              subtasks: {
                some: {
                  deletedAt: null,
                  ...(!input.includeCompleted
                    ? { status: { not: 'completed' } }
                    : {}),
                  OR: matchSubtasks,
                },
              },
            },
          ],
        };

        const [taskLists, tasks] = await Promise.all([
          prisma.tasksList.findMany({
            where: {
              ...(input.taskListId ? { id: input.taskListId } : {}),
              OR: input.keywords.map((k) => ({
                title: { contains: k, mode: 'insensitive' },
              })),
            },
            select: { id: true, title: true },
            orderBy: { updatedAt: 'desc' },
          }),
          prisma.task.findMany({
            where: tasksWhere,
            orderBy: { updatedAt: 'desc' },
            select: {
              id: true,
              title: true,
              notes: true,
              updatedAt: true,
              subtasks: {
                where: {
                  deletedAt: null,
                  ...(!input.includeCompleted
                    ? { status: { not: 'completed' as const } }
                    : {}),
                  OR: matchSubtasks,
                },
                orderBy: { updatedAt: 'desc' },
                select: { id: true, title: true, notes: true, updatedAt: true },
              },
            },
          }),
        ]);

        return {
          taskLists,
          tasks: tasks,
        };
      },
    }),
    createTask: tool({
      description:
        'Create a new task in the specified task list (taskListId is required).',
      inputSchema: z.object({
        title: z.string().min(1),
        notes: z.string().optional(),
        due: z.string().datetime().optional().describe('ISO datetime string'),
        taskListId: z.string().min(1),
      }),
      execute: async (input) => {
        // Ensure the provided list exists
        const list = await prisma.tasksList.findUniqueOrThrow({
          where: { id: input.taskListId },
          select: { id: true },
        });

        return prisma.task.create({
          data: {
            taskListId: list.id,
            title: input.title,
            notes: input.notes ?? null,
            due: input.due ? new Date(input.due) : undefined,
          },
          include: {
            subtasks: {
              where: { deletedAt: null, status: { not: 'completed' } },
              orderBy: { updatedAt: 'desc' },
            },
          },
        });
      },
    }),
    createSubtask: tool({
      description: 'Create a subtask under an existing task.',
      inputSchema: z.object({
        taskId: z.string().min(1),
        title: z.string().min(1),
        notes: z.string().optional(),
        due: z.string().datetime().optional().describe('ISO datetime string'),
      }),
      execute: async (input) => {
        const parent = await prisma.task.findUniqueOrThrow({
          where: { id: input.taskId, deletedAt: null },
          select: { id: true },
        });

        const created = await prisma.subtask.create({
          data: {
            taskId: parent.id,
            title: input.title,
            notes: input.notes ?? null,
            due: input.due ? new Date(input.due) : undefined,
          },
        });
        return created;
      },
    }),
  },
});
