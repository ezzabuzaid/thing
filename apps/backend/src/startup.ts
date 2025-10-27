import { prisma } from '@thing/db';
import z from 'zod';

import { parse } from './middlewares/validator.ts';

const env = z.object({
  NODE_ENV: z.enum(['development', 'production']),
  PORT: z.string().default('3000'),
  ALLOWED_ORIGINS: z.string().default(''),
  CONNECTION_STRING: z.string(),
  GROQ_API_KEY: z.string(),
  QSTASH_TOKEN: z.string(),
});

try {
  const data = await parse(env, process.env);
  process.env = Object.assign({}, process.env, data);
} catch (error) {
  console.error(
    'Please check that all required environment variables are correctly set.',
  );
  console.dir(error, { depth: null });
  process.exit(1);
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // Extend the ProcessEnv interface with the parsed environment variables
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type, @typescript-eslint/no-empty-interface
    interface ProcessEnv extends z.infer<typeof env> {}
  }
}

await prisma.$connect();
