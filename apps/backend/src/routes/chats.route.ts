import { type Prisma, prisma } from '@thing/db';
import { Hono } from 'hono';
import { z } from 'zod';

import { authenticate } from '../middlewares/middleware.ts';
import { validate } from '../middlewares/validator';

export default async function (router: Hono) {
  /**
   * @openapi getChats
   * @tags chats
   * @description Get a paginated list of chat conversations for the authenticated user. Returns chats ordered by creation date with basic metadata.
   */
  router.get(
    '/chats',
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

      const where: Prisma.ChatWhereInput = {
        userId: c.var.subject.id,
      };

      const totalCount = await prisma.chat.count({ where });

      const chats = await prisma.chat.findMany({
        where,
        orderBy: { id: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          _count: {
            select: { messages: true },
          },
        },
      });

      return c.json({
        records: chats,
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
   * @openapi getChatById
   * @tags chats
   * @description Get a specific chat conversation by ID. Returns the chat details along with message count.
   */
  router.get(
    '/chats/:id',
    authenticate(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      const chat = await prisma.chat.findUniqueOrThrow({
        where: {
          id,
          userId: c.var.subject.id,
        },
        include: {
          messages: {
            include: {
              parts: true,
            },
          },
        },
      });

      return c.json(chat);
    },
  );

  /**
   * @openapi updateChat
   * @tags chats
   * @description Update a chat conversation's title or other metadata.
   */
  router.put(
    '/chats/:id',
    authenticate(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string(),
      },
      title: {
        select: payload.body.title,
        against: z.string().min(1).max(255),
      },
    })),
    async (c) => {
      const { id, title } = c.var.input;

      const chat = await prisma.chat.update({
        where: {
          id,
          userId: c.var.subject.id,
        },
        data: {
          title,
        },
      });

      return c.json(chat);
    },
  );

  /**
   * @openapi deleteChat
   * @tags chats
   * @description Delete a chat conversation and all its associated messages.
   */
  router.delete(
    '/chats/:id',
    authenticate(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      // Delete chat and all associated messages (cascade delete)
      await prisma.chat.delete({
        where: {
          id,
          userId: c.var.subject.id,
        },
      });

      return c.body(null, 204);
    },
  );

  /**
   * @openapi deleteMessage
   * @tags chats
   * @description Delete a specific message from a chat conversation.
   */
  router.delete(
    '/messages/:id',
    authenticate(),
    validate((payload) => ({
      id: {
        select: payload.params.id,
        against: z.string(),
      },
    })),
    async (c) => {
      const { id } = c.var.input;

      // First get the message to verify ownership
      const existingMessage = await prisma.message.findUniqueOrThrow({
        where: { id },
        include: {
          chat: {
            select: {
              userId: true,
            },
          },
        },
      });

      // Verify user owns the chat containing this message
      if (existingMessage.chat.userId !== c.var.subject.id) {
        throw new Error('Unauthorized access to message');
      }

      await prisma.message.delete({
        where: { id },
      });

      return c.body(null, 204);
    },
  );
}
