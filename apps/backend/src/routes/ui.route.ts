import { lstat, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

import { serveStatic } from '@hono/node-server/serve-static';
import { type Hono } from 'hono';

export default function (router: Hono) {
  const dir = join(
    relative(process.cwd(), import.meta.dirname),
    '../',
    '../',
    'pulse',
    'dist',
  );
  router.use('*', serveStatic({ root: dir }));
  router.get('*', async (c) => {
    const exists = await lstat(`${dir}/index.html`)
      .then(() => true)
      .catch(() => false);
    if (!exists) {
      if (process.env.NODE_ENV === 'development') {
        console.error(
          `Build the frontend app first. run "nx run frontend:build"`,
        );
        return c.json({ error: 'Build the frontend app first' }, 404);
      }
      return c.json({ error: 'Not found. Talk to the website admin.' }, 404);
    }

    return c.html(await readFile(`${dir}/index.html`, 'utf-8'));
  });
}
