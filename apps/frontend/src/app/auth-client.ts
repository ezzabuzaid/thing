import { client } from '@thing/ui';
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: client.options.baseUrl,
  fetchOptions: {
    credentials: 'include',
    throw: true,
  },
});
