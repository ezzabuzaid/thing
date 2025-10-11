import type { InferSession, InferUser } from 'better-auth';
import type { MiddlewareHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';

import { auth } from './auth.ts';

export function authenticate(): MiddlewareHandler<{
  Variables: {
    session: InferSession<typeof auth>;
    subject: InferUser<typeof auth>;
  };
}> {
  return async (c, next) => {
    const session = await auth.api.getSession({
      headers: c.req.raw.headers,
    });
    if (!session) {
      throw new HTTPException(401, {
        message: 'Authentication required',
        cause: {
          code: 'api/unauthenticated',
          detail: 'Authentication required to access this resource',
        },
      });
    }

    c.set('session', session.session);
    c.set('subject', session.user);

    return next();
  };
}
