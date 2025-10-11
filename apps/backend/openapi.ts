import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cwd } from 'node:process';

import { defaultTypesMap } from '@sdk-it/core';
import { analyze } from '@sdk-it/generic';
import { responseAnalyzer } from '@sdk-it/hono';

const { paths, components, tags } = await analyze(
  'apps/backend/tsconfig.app.json',
  {
    responseAnalyzer,
    imports: [
      {
        import: 'Prisma',
        from: join(cwd(), 'packages/persistence/db/src/index.ts'),
      },
      {
        import: '$Enums',
        from: join(cwd(), 'packages/persistence/db/src/index.ts'),
      },
    ],
    typesMap: {
      ...defaultTypesMap,
      Decimal: 'string',
      JsonValue: '#/components/schemas/JsonValue',
    },
    onOperation: (sourceFile, method, path, operation) => {
      operation.responses ??= {};
      const existing400 = operation.responses[400];
      operation.responses[400] = {
        description: 'Bad Request',
        content: {
          'application/json': {
            schema: {
              oneOf: [
                existing400?.content?.['application/json'],
                { $ref: '#/components/schemas/ValidationError' },
              ].filter(Boolean),
            },
          },
        },
      };
      operation.responses[401] ??= {
        description: 'Unauthorized',
        content: {
          'application/json': {
            schema: { $ref: '#/components/schemas/UnauthorizedErr' },
          },
        },
      };
      return {};
    },
  },
);

const spec = {
  openapi: '3.1.0',
  info: { title: 'Agent API', version: '1.0.0' },
  tags: tags.map((tag) => ({ name: tag })),
  security: [{ bearer: [] }],
  paths,
  components: {
    ...components,
    schemas: {
      ...components.schemas,
      UnauthorizedErr: {
        type: 'object',
        required: ['type', 'title'],
        additionalProperties: false,
        properties: {
          error: {
            type: 'string',
            enum: ['Unauthorized'],
          },
        },
      } as const,
      ValidationError: {
        type: 'object',
        properties: {
          message: { type: 'string' },
        },
      } as const,
      JsonValue: {
        type: 'object',
        additionalProperties: {
          oneOf: [
            { type: 'string' },
            { type: 'number' },
            { type: 'boolean' },
            { type: 'null' },
            { type: 'object' },
            {
              type: 'array',
              items: {
                oneOf: [
                  { type: 'string' },
                  { type: 'number' },
                  { type: 'boolean' },
                  { type: 'null' },
                  { type: 'object' },
                ],
              },
            },
          ],
        },
      },
    },
    securitySchemes: {
      bearer: {
        type: 'http',
        scheme: 'bearer',
      } as const,
    },
  },
};

await writeFile('openapi.json', JSON.stringify(spec, null, 2));

console.log('OpenAPI spec generated successfully.');
