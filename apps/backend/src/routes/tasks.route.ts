import { prisma } from '@thing/db';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Hono } from 'hono';
import { z } from 'zod';

import { getTaskLists, getTasks } from '../faye/subagents/gtasks.ts';
import { auth } from '../middlewares/auth.ts';
import { authenticate } from '../middlewares/middleware.ts';
import { validate } from '../middlewares/validator.ts';

export default async function (router: Hono) {
  /**
   * @openapi tasksList
   * @tags tasks
   */
  router.get(
    '/taskslists',
    authenticate(),
    validate((payload) => ({})),
    async (c) => {
      const lists = await prisma.tasksList.findMany({
        where: { userId: c.var.subject.id },
        select: { id: true, title: true },
      });

      return c.json(lists.map((list) => ({ id: list.id, title: list.title })));
    },
  );

  /**
   * @openapi createTaskList
   * @tags tasks
   * @description Create a new task list for the authenticated user.
   */
  router.post(
    '/taskslists',
    authenticate(),
    validate((payload) => ({
      title: {
        select: payload.body.title,
        against: z.string().min(1),
      },
    })),
    async (c) => {
      const { title } = c.var.input;

      const created = await prisma.tasksList.create({
        data: {
          userId: c.var.subject.id,
          title,
        },
      });

      return c.json(created, 201);
    },
  );

  /**
   * @openapi getAllTasksInList
   * @tags tasks
   */
  router.get(
    '/taskslists/:taskListId/tasks',
    authenticate(),
    validate((payload) => ({
      taskListId: {
        select: payload.params.taskListId,
        against: z.string(),
      },
    })),
    async (c) => {
      const list = await prisma.tasksList.findUniqueOrThrow({
        where: { id: c.var.input.taskListId, userId: c.var.subject.id },
        select: { id: true },
      });

      const tasks = await prisma.task.findMany({
        where: {
          taskListId: list.id,
          deletedAt: null,
          status: { not: 'completed' },
        },
        include: {
          subtasks: {
            where: { deletedAt: null, status: { not: 'completed' } },
          },
        },
      });

      return c.json(tasks);
    },
  );

  /**
   * @openapi tasksTree
   * @tags tasks
   * @description Return all task lists with their active tasks and subtasks for the authenticated user.
   */
  router.get(
    '/tasks/tree',
    authenticate(),
    validate((payload) => ({})),
    async (c) => {
      const lists = await prisma.tasksList.findMany({
        where: { userId: c.var.subject.id },
        include: {
          tasks: {
            where: {
              deletedAt: null,
            },
            include: {
              subtasks: {
                where: {
                  deletedAt: null,
                },
              },
            },
          },
        },
      });

      return c.json(lists);
    },
  );

  /**
   * @openapi createTask
   * @tags tasks
   * @description Create a new task within a given task list owned by the authenticated user.
   */
  router.post(
    '/taskslists/:taskListId/tasks',
    authenticate(),
    validate((payload) => ({
      taskListId: {
        select: payload.params.taskListId,
        against: z.string(),
      },
      title: {
        select: payload.body.title,
        against: z.string().min(1),
      },
      notes: {
        select: payload.body.notes,
        against: z.string().optional(),
      },
      due: {
        select: payload.body.due,
        against: z.coerce.date().optional(),
      },
    })),
    async (c) => {
      const { taskListId, title, notes, due } = c.var.input;

      const list = await prisma.tasksList.findUniqueOrThrow({
        where: { id: taskListId, userId: c.var.subject.id },
        select: { id: true },
      });

      const created = await prisma.task.create({
        data: {
          taskListId: list.id,
          title,
          notes: notes,
          due: due,
        },
        include: { subtasks: true },
      });

      return c.json(created, 201);
    },
  );

  /**
   * @openapi createSubtask
   * @tags tasks
   * @description Create a new subtask under a task owned by the authenticated user.
   */
  router.post(
    '/tasks/:taskId/subtasks',
    authenticate(),
    validate((payload) => ({
      taskId: {
        select: payload.params.taskId,
        against: z.string(),
      },
      title: {
        select: payload.body.title,
        against: z.string().min(1),
      },
      notes: {
        select: payload.body.notes,
        against: z.string().optional(),
      },
      due: {
        select: payload.body.due,
        against: z.coerce.date().optional(),
      },
    })),
    async (c) => {
      const { taskId, title, notes, due } = c.var.input;

      // Ensure the parent task belongs to the user through its task list
      const task = await prisma.task.findUniqueOrThrow({
        where: { id: taskId, taskList: { userId: c.var.subject.id } },
        select: { id: true },
      });

      const created = await prisma.subtask.create({
        data: {
          taskId: task.id,
          title,
          notes: notes,
          due: due,
        },
      });

      return c.json(created, 201);
    },
  );

  /**
   * @openapi completeTask
   * @tags tasks
   * @description Mark a task as completed. Requires the task to belong to the authenticated user.
   */
  router.post(
    '/tasks/:taskId/complete',
    authenticate(),
    validate((payload) => ({
      taskId: {
        select: payload.params.taskId,
        against: z.string(),
      },
    })),
    async (c) => {
      const { taskId } = c.var.input;

      // Authorize ownership via the list
      const task = await prisma.task.findUniqueOrThrow({
        where: { id: taskId, taskList: { userId: c.var.subject.id } },
        select: { id: true },
      });

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'completed' },
        include: { subtasks: true },
      });

      return c.json(updated);
    },
  );

  /**
   * @openapi completeSubtask
   * @tags tasks
   * @description Mark a subtask as completed. Requires the subtask to belong to the authenticated user.
   */
  router.post(
    '/subtasks/:subtaskId/complete',
    authenticate(),
    validate((payload) => ({
      subtaskId: {
        select: payload.params.subtaskId,
        against: z.string(),
      },
    })),
    async (c) => {
      const { subtaskId } = c.var.input;

      // Authorize ownership via the parent task -> list
      const subtask = await prisma.subtask.findUniqueOrThrow({
        where: {
          id: subtaskId,
          task: { taskList: { userId: c.var.subject.id } },
        },
        select: { id: true },
      });

      const updated = await prisma.subtask.update({
        where: { id: subtask.id },
        data: { status: 'completed' },
      });

      return c.json(updated);
    },
  );

  /**
   * @openapi uncompleteTask
   * @tags tasks
   * @description Mark a task as needsAction (uncomplete). Requires the task to belong to the authenticated user.
   */
  router.post(
    '/tasks/:taskId/uncomplete',
    authenticate(),
    validate((payload) => ({
      taskId: {
        select: payload.params.taskId,
        against: z.string(),
      },
    })),
    async (c) => {
      const { taskId } = c.var.input;

      const task = await prisma.task.findUniqueOrThrow({
        where: { id: taskId, taskList: { userId: c.var.subject.id } },
        select: { id: true },
      });

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: { status: 'needsAction' },
        include: { subtasks: true },
      });

      return c.json(updated);
    },
  );

  /**
   * @openapi uncompleteSubtask
   * @tags tasks
   * @description Mark a subtask as needsAction (uncomplete). Requires the subtask to belong to the authenticated user.
   */
  router.post(
    '/subtasks/:subtaskId/uncomplete',
    authenticate(),
    validate((payload) => ({
      subtaskId: {
        select: payload.params.subtaskId,
        against: z.string(),
      },
    })),
    async (c) => {
      const { subtaskId } = c.var.input;

      const subtask = await prisma.subtask.findUniqueOrThrow({
        where: {
          id: subtaskId,
          task: { taskList: { userId: c.var.subject.id } },
        },
        select: { id: true },
      });

      const updated = await prisma.subtask.update({
        where: { id: subtask.id },
        data: { status: 'needsAction' },
      });

      return c.json(updated);
    },
  );

  /**
   * @openapi updateTask
   * @tags tasks
   * @description Update a task's title and/or notes. Requires the task to belong to the authenticated user.
   */
  router.patch(
    '/tasks/:taskId',
    authenticate(),
    validate((payload) => ({
      taskId: {
        select: payload.params.taskId,
        against: z.string(),
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
      const { taskId, title, notes } = c.var.input;

      const task = await prisma.task.findUniqueOrThrow({
        where: { id: taskId, taskList: { userId: c.var.subject.id } },
        select: { id: true },
      });

      const updated = await prisma.task.update({
        where: { id: task.id },
        data: {
          ...(title !== undefined && { title }),
          ...(notes !== undefined && { notes }),
        },
        include: { subtasks: true },
      });

      return c.json(updated);
    },
  );

  /**
   * @openapi updateSubtask
   * @tags tasks
   * @description Update a subtask's title and/or notes. Requires the subtask to belong to the authenticated user.
   */
  router.patch(
    '/subtasks/:subtaskId',
    authenticate(),
    validate((payload) => ({
      subtaskId: {
        select: payload.params.subtaskId,
        against: z.string(),
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
      const { subtaskId, title, notes } = c.var.input;

      const subtask = await prisma.subtask.findUniqueOrThrow({
        where: {
          id: subtaskId,
          task: { taskList: { userId: c.var.subject.id } },
        },
        select: { id: true },
      });

      const updated = await prisma.subtask.update({
        where: { id: subtask.id },
        data: {
          ...(title !== undefined && { title }),
          ...(notes !== undefined && { notes }),
        },
      });

      return c.json(updated);
    },
  );

  /**
   * @openapi syncTasks
   * @tags tasks
   * @description Sync Google Tasks into our TasksList/Task/Subtask models for the authenticated user.
   */
  router.post(
    '/tasks/sync',
    authenticate(),
    validate(() => ({})),
    async (c) => {
      const session = await auth.api.getAccessToken({
        body: { userId: c.var.subject.id, providerId: 'google' },
        headers: c.req.raw.headers,
      });

      const oauth2Client = new OAuth2Client({
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      });
      oauth2Client.setCredentials({
        access_token: session.accessToken,
        id_token: session.idToken,
      });
      const api = google.tasks({ version: 'v1', auth: oauth2Client });

      const lists = await getTaskLists(api);

      let insertedTasks = 0;
      let insertedSubtasks = 0;

      for (const gList of lists.reverse()) {
        const title = gList.title ?? 'Untitled';

        const tasksList = await prisma.tasksList.upsert({
          where: { userId: c.var.subject.id, title },
          update: {},
          create: { userId: c.var.subject.id, title },
        });

        // Clear existing tasks for this list (cascades to subtasks)
        await prisma.task.deleteMany({
          where: { taskListId: tasksList.id },
        });

        // Fetch tasks from Google and split into parents/subtasks
        const gTasks = await getTasks(api, gList.id!, {
          showCompleted: true,
          showHidden: true,
          showDeleted: true,
        }).then((res) => res.reverse()); // process oldest first
        const visible = gTasks.filter((t) => !t.hidden);
        const parents = visible.filter((t) => !t.parent);
        const children = visible.filter((t) => !!t.parent);

        // Map Google parent task id -> created Task id in our DB
        const parentIdMap = new Map<string, string>();

        // Insert parent tasks sequentially to collect ids
        for (const pt of parents) {
          console.log('Inserting parent task:', pt);
          const created = await prisma.task.create({
            data: {
              taskListId: tasksList.id,
              title: pt.title ?? 'Untitled',
              notes: pt.notes,
              status: pt.completed
                ? 'completed'
                : ((pt.status as string) ?? 'needsAction'),
              due: pt.due ? new Date(pt.due) : undefined,
              deletedAt: pt.deleted
                ? new Date(pt.updated ?? Date.now())
                : undefined,
            },
          });
          if (pt.id) parentIdMap.set(pt.id, created.id);
          insertedTasks += 1;
        }

        // Insert subtasks referencing mapped parent ids
        for (const ct of children) {
          const parentGoogleId = ct.parent as string | undefined;
          if (!parentGoogleId) continue;
          const parentDbId = parentIdMap.get(parentGoogleId);
          if (!parentDbId) continue; // parent filtered out or missing

          await prisma.subtask.create({
            data: {
              taskId: parentDbId,
              title: ct.title ?? 'Untitled',
              notes: ct.notes,
              status: ct.completed
                ? 'completed'
                : ((ct.status as string) ?? 'needsAction'),
              due: ct.due ? new Date(ct.due) : undefined,
              deletedAt: ct.deleted
                ? new Date(ct.updated ?? Date.now())
                : undefined,
            },
          });
          insertedSubtasks += 1;
        }
      }

      return c.json({
        status: 'ok',
        taskListsProcessed: lists.length,
        tasksInserted: insertedTasks,
        subtasksInserted: insertedSubtasks,
      });
    },
  );
}
