import './startup.ts';

import { serve } from '@hono/node-server';
import { serveStatic } from '@hono/node-server/serve-static';
import { Scalar } from '@scalar/hono-api-reference';

import app from './app.ts';

const port = Number.parseInt(process.env.PORT ?? '3000', 10);

app.use(
  '/openapi.json',
  serveStatic({
    path:
      process.env.NODE_ENV === 'development'
        ? './openapi.json'
        : './apps/backend/dist/openapi.json',
  }),
);
app.get('/api-reference', Scalar({ url: '/openapi.json' }));

serve(
  {
    fetch: app.fetch,
    port: port,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
