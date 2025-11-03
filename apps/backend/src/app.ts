import { execute } from '@deepagents/agent';
import { Prisma, prisma } from '@thing/db';
import {
  InvalidToolInputError,
  NoSuchToolError,
  ToolCallRepairError,
  type UIDataTypes,
  type UIMessage,
  type UITools,
  generateId,
  isToolUIPart,
} from 'ai';
import { Hono } from 'hono';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { HTTPException } from 'hono/http-exception';
import { logger } from 'hono/logger';
import { requestId } from 'hono/request-id';
import { timing } from 'hono/timing';

import { faye } from './faye/faye.ts';
import { auth } from './middlewares/auth.ts';
import { authenticate } from './middlewares/middleware.ts';

const app = new Hono().use(
  logger(),
  timing(),
  cors({
    origin: (it) =>
      process.env.NODE_ENV === 'development' ? it : process.env.ALLOWED_ORIGINS,
    credentials: true,
  }),
  requestId(),
  contextStorage(),
);

app.on(['POST', 'GET'], '/api/auth/*', (c) => {
  return auth.handler(c.req.raw);
});

app.get('/api/health', async (c) => {
  await prisma.$queryRaw`SELECT 1`;
  return c.json({ status: 'ok' });
});

export interface Metadata {
  type: string;
  finishReason: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
  };
  model: string;
  id: string;
  totalTokens: {
    inputTokens?: number;
    outputTokens?: number;
    totalTokens?: number;
    reasoningTokens?: number;
    cachedInputTokens?: number;
  };
}

async function storeMessages(
  chatId: string,
  messages: UIMessage<unknown, UIDataTypes, UITools>[],
) {
  {
    const newMessages: UIMessage<unknown, UIDataTypes, UITools>[] = [];
    for (let i = messages.length - 1; i >= 0; i--) {
      const exists = await prisma.message.findFirst({
        select: { id: true },
        where: { id: messages[i].id, chatId },
      });
      if (exists) {
        break;
      }
      newMessages.unshift(messages[i]);
    }
    for (const message of newMessages) {
      await prisma.$transaction(async (tx) => {
        const metadata = message.metadata as Metadata;
        const messageId = message.id;
        await tx.message.create({
          data: {
            id: message.id,
            chatId,
            role: message.role,
            finishReason: metadata?.finishReason,
            ...metadata?.totalTokens,
          },
        });
        const parts = message.parts.map((part) => {
          switch (part.type) {
            case 'text':
              return {
                messageId,
                // order: index,
                type: part.type,
                text_text: part.text,
              };
            case 'reasoning':
              return {
                messageId,
                // order: index,
                type: part.type,
                reasoning_text: part.text,
                // TODO: store providermetadata
                // https://github.com/vercel/ai/issues/7099#issuecomment-3217160152
                providerMetadata: part.providerMetadata,
              };
            case 'file':
              return {
                messageId,
                // order: index,
                type: part.type,
                file_mediaType: part.mediaType,
                file_filename: part.filename,
                file_url: part.url,
              };
            case 'source-document':
              return {
                messageId,
                // order: index,
                type: part.type,
                source_document_sourceId: part.sourceId,
                source_document_mediaType: part.mediaType,
                source_document_title: part.title,
                source_document_filename: part.filename,
                providerMetadata: part.providerMetadata,
              };
            case 'source-url':
              return {
                messageId,
                // order: index,
                type: part.type,
                source_url_sourceId: part.sourceId,
                source_url_url: part.url,
                source_url_title: part.title,
                providerMetadata: part.providerMetadata,
              };
            case 'step-start':
              return {
                messageId,
                // order: index,
                type: part.type,
              };

            case 'dynamic-tool': {
              return {
                messageId,
                type: part.type,
                tool_toolName: part.toolName,
                tool_toolCallId: part.toolCallId,
                tool_state: part.state,
                tool_input: part.input
                  ? JSON.stringify(part.input)
                  : JSON.stringify(''),
                tool_output: part.output
                  ? JSON.stringify(part.output)
                  : JSON.stringify(''),
              } as const;
            }

            default: {
              if (isToolUIPart(part)) {
                return {
                  messageId,
                  // order: index,
                  type: part.type,
                  tool_toolCallId: part.toolCallId,
                  tool_state: part.state,
                  tool_errorText: part.errorText,
                  tool_input: part.input
                    ? JSON.stringify(part.input)
                    : JSON.stringify(''),
                  tool_output: part.output
                    ? JSON.stringify(part.output)
                    : JSON.stringify(''),
                };
              }
              throw new Error(`Unsupported part type: ${JSON.stringify(part)}`);
            }
          }
        });
        await tx.part.createMany({
          data: parts,
        });
      });
    }
  }
}

app.post('/api/chat', authenticate(), async (c) => {
  const { id: chatId, messages } = await c.req.json();
  const result = execute(
    faye,
    messages,
    { userId: c.var.subject.id },
    {
      abortSignal: c.req.raw.signal,
    },
  );
  result.consumeStream();
  await prisma.chat.upsert({
    where: { id: chatId },
    create: { id: chatId, userId: '' },
    update: {},
  });

  return result.toUIMessageStreamResponse({
    onError: (error) => {
      if (NoSuchToolError.isInstance(error)) {
        return 'The model tried to call a unknown tool.';
      } else if (InvalidToolInputError.isInstance(error)) {
        return 'The model called a tool with invalid arguments.';
      } else if (ToolCallRepairError.isInstance(error)) {
        return 'The model tried to call a tool with invalid arguments, but it was repaired.';
      } else {
        return JSON.stringify(error);
      }
    },
    messageMetadata: ({ part }) => {
      if (part.type === 'finish-step') {
        return {
          type: part.type,
          finishReason: part.finishReason,
          usage: part.usage,
          model: part.response.modelId,
          id: part.response.id,
        };
      }
      if (part.type === 'finish') {
        return {
          type: part.type,
          finishReason: part.finishReason,
          totalTokens: part.totalUsage,
        };
      }
      return {};
    },
    generateMessageId: generateId,
    onFinish: async ({ messages }) => storeMessages(chatId, messages),
    sendSources: true,
    originalMessages: messages,
  });
});

for await (const route of [
  import('./routes/chats.route.ts'),
  import('./routes/thoughts.route.ts'),
  import('./routes/schedules.route.ts'),
  import('./routes/marketplace.route.ts'),
  import('./routes/reminders.route.ts'),
  import('./routes/tasks.route.ts'),
  import('./routes/timesheet.route.ts'),
]) {
  route.default(app.basePath('/api'));
}

(await import('./routes/ui.route.ts')).default(app);

app.notFound((c) => {
  throw new HTTPException(404, {
    message: 'Not Found',
    cause: {
      code: 'api/not-found',
      detail: 'The requested resource was not found',
      instance: c.req.url,
    },
  });
});

app.onError((error, context) => {
  if (process.env.NODE_ENV === 'development') {
    console.dir(error, { depth: Infinity });
    console.error(error);
  }
  if (error instanceof HTTPException) {
    return context.json(
      {
        error: error.message,
        cause: error.cause,
      },
      error.status,
    );
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case 'P2002': {
        const model = error.meta?.modelName;
        const fields = error.meta?.target;
        return context.json(
          {
            error: `Duplicate entry in ${model} table found.`,
            cause: {
              code: 'api/unique-constraint-failed',
              detail: `Unique constraint failed on the ${model} table for the ${fields} field`,
            },
          },
          409,
        );
      }
      case 'P2003': {
        const model = error.meta?.modelName;
        const [, field] = ((error.meta?.constraint as string) || '').split('_');
        return context.json(
          {
            error: `Foreign key constraint failed on ${model} table.`,
            cause: {
              code: 'api/foreign-key-constraint-failed',
              detail: `Foreign key constraint failed on the ${model} table for the '${field}' field`,
            },
          },
          400,
        );
      }
      case 'P2025': {
        return context.json(
          {
            error: error.message || `Record not found`,
            cause: {
              code: 'api/record-not-found',
              detail: `Record not found`,
            },
          },
          404,
        );
      }
    }
  }

  return context.json(
    {
      error: 'Internal Server Error',
      // cause: process.env.NODE_ENV === 'development' ? error : undefined,
      cause: error,
    },
    500,
  );
});

export default app;
