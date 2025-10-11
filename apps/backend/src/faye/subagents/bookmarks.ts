import { groq } from '@ai-sdk/groq';
import { type Agent, agent, instructions } from '@deepagents/agent';
import { extract } from '@extractus/article-extractor';
import { tool } from 'ai';
import z from 'zod';

import { type Prisma, prisma } from '@agent/db';

import timeContext from '../time-context.ts';

async function extractMetadata(url: string) {
  const data = await extract(url);
  if (!data) {
    throw new Error(`Failed to extract article from the provided URL: ${url}`);
  }
  const { content, ...rest } = data;
  return rest;
}

/**
 * Ensure a folder exists by creating a default "Others" folder if needed.
 * This is necessary because folderId is NOT NULL in the schema.
 */
async function ensureDefaultFolder() {
  const existing = await prisma.bookmarkFolder.findFirst({
    where: { name: 'Others' },
  });

  if (existing) return existing;

  return await prisma.bookmarkFolder.create({
    data: {
      name: 'Others',
      description: 'Default folder for unorganized bookmarks',
      color: '#94a3b8',
    },
  });
}

export const bookmarksAgent: Agent = agent({
  name: 'Bookmarks Manager',
  handoffDescription:
    'A helpful agent that manages bookmarks with auto metadata extraction and search. Handles saving, searching, and organizing bookmarks.',
  model: groq('moonshotai/kimi-k2-instruct-0905'),
  prompt: instructions.swarm({
    purpose: [
      'You are a bookmark manager for organizing and retrieving saved web content.',
      timeContext,
    ],
    routine: [
      'Auto-extract metadata when saving.',
      'Use userContext for user notes.',
      'Search across all fields.',
      'Be concise.',
    ],
  }),
  tools: {
    saveBookmarks: tool({
      description: 'Save bookmarks with auto metadata extraction. Returns IDs.',
      inputSchema: z.object({
        bookmarks: z.array(
          z.object({
            url: z.string().url(),
            folderId: z
              .string()
              .optional()
              .describe('Folder ID (default: Others)'),
            customTitle: z.string().optional(),
            customDescription: z.string().optional(),
            userContext: z.string().optional().describe('User notes'),
          }),
        ),
      }),
      execute: async (input) => {
        const results = [];
        const defaultFolder = await ensureDefaultFolder();

        for (const bookmark of input.bookmarks) {
          // Extract metadata
          const metadata = await extractMetadata(bookmark.url);

          // Create thought and bookmark
          const thought = await prisma.thought.create({ data: {} });

          const created = await prisma.bookmark.create({
            data: {
              id: thought.id,
              url: bookmark.url,
              title: bookmark.customTitle || metadata?.title || 'Untitled',
              description:
                bookmark.customDescription || metadata?.description || '',
              image: metadata?.image || '',
              favicon: metadata?.favicon || '',
              publishedAt: metadata?.published || '',
              userContext: bookmark.userContext || null,
              folderId: bookmark.folderId || defaultFolder.id,
            },
          });

          results.push({
            id: created.id,
            url: created.url,
            title: created.title,
          });
        }

        return { saved: results };
      },
    }),
    searchBookmarks: tool({
      description:
        'Search bookmarks with filters. Searches title, description, URL, userContext.',
      inputSchema: z.object({
        query: z.string().optional().describe('Search query'),
        folderId: z.string().optional().describe('Filter by folder'),
        dateFrom: z.string().optional().describe('Updated after (ISO)'),
        dateTo: z.string().optional().describe('Updated before (ISO)'),
        page: z.number().int().positive().default(1),
        pageSize: z.number().int().min(1).max(100).default(20),
        sortBy: z
          .enum(['recent', 'oldest', 'title'])
          .default('recent')
          .describe('Sort order'),
      }),
      execute: async (input) => {
        const where: Prisma.BookmarkWhereInput = {
          ...(input.folderId && { folderId: input.folderId }),
          ...(input.query && {
            OR: [
              { title: { contains: input.query, mode: 'insensitive' } },
              { description: { contains: input.query, mode: 'insensitive' } },
              { url: { contains: input.query, mode: 'insensitive' } },
              { userContext: { contains: input.query, mode: 'insensitive' } },
            ],
          }),
          ...(input.dateFrom && {
            thought: {
              updatedAt: { gte: new Date(input.dateFrom) },
            },
          }),
          ...(input.dateTo && {
            thought: {
              updatedAt: { lte: new Date(input.dateTo) },
            },
          }),
        };

        const orderBy: Prisma.BookmarkOrderByWithRelationInput =
          input.sortBy === 'title'
            ? { title: 'asc' as const }
            : {
                thought: {
                  updatedAt: input.sortBy === 'recent' ? 'desc' : 'asc',
                },
              };

        const [total, bookmarks] = await Promise.all([
          prisma.bookmark.count({ where }),
          prisma.bookmark.findMany({
            where,
            orderBy,
            skip: (input.page - 1) * input.pageSize,
            take: input.pageSize,
            include: { folder: true, thought: true },
          }),
        ]);

        return {
          results: bookmarks.map((b) => ({
            ...b,
            folder: b.folder.name,
            updatedAt: b.thought.updatedAt,
          })),
          pagination: {
            total,
            page: input.page,
            pageSize: input.pageSize,
            totalPages: Math.ceil(total / input.pageSize),
            hasNext: input.page < Math.ceil(total / input.pageSize),
            hasPrevious: input.page > 1,
          },
        };
      },
    }),
    removeBookmarks: tool({
      description: 'Delete bookmarks.',
      inputSchema: z.object({
        bookmarkIds: z.array(z.string()).min(1),
      }),
      execute: async (input) => {
        await prisma.$transaction([
          prisma.bookmark.deleteMany({
            where: { id: { in: input.bookmarkIds } },
          }),
          prisma.thought.deleteMany({
            where: { id: { in: input.bookmarkIds } },
          }),
        ]);
        return { deleted: input.bookmarkIds.length };
      },
    }),
    getBookmarkDetails: tool({
      description: 'Get bookmark details with metadata and folder.',
      inputSchema: z.object({ id: z.string() }),
      execute: async ({ id }) => {
        const bookmark = await prisma.bookmark.findUniqueOrThrow({
          where: { id },
          include: { folder: true, thought: true },
        });
        return bookmark;
      },
    }),
    updateBookmark: tool({
      description: 'Update bookmark fields.',
      inputSchema: z.object({
        id: z.string(),
        userContext: z.string().nullish(),
        title: z.string().optional(),
        description: z.string().optional(),
        folderId: z.string().optional(),
      }),
      execute: async ({ id, ...updates }) => {
        const bookmark = await prisma.bookmark.update({
          where: { id },
          data: updates,
        });
        return bookmark;
      },
    }),
    manageFolder: tool({
      description: 'Manage folders: create, update, list.',
      inputSchema: z.object({
        operation: z.enum(['create', 'update', 'list']),
        folderId: z.string().optional().describe('For update'),
        name: z.string().optional().describe('For create/update'),
        description: z.string().nullish(),
        color: z.string().nullish(),
      }),
      execute: async (input) => {
        switch (input.operation) {
          case 'create': {
            if (!input.name) return { error: 'name required for create' };
            return await prisma.bookmarkFolder.create({
              data: {
                name: input.name,
                description: input.description,
                color: input.color,
              },
            });
          }

          case 'update': {
            if (!input.folderId)
              return { error: 'folderId required for update' };
            return await prisma.bookmarkFolder.update({
              where: { id: input.folderId },
              data: {
                ...(input.name && { name: input.name }),
                ...(input.description !== undefined && {
                  description: input.description,
                }),
                ...(input.color !== undefined && { color: input.color }),
              },
            });
          }

          case 'list': {
            const folders = await prisma.bookmarkFolder.findMany({
              orderBy: { name: 'asc' },
            });
            return folders;
          }
        }
      },
    }),
  },
});
