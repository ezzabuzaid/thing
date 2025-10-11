import { anonymousClient } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/react';

import { getOrigin } from '@agent/ui';

const resolveBaseURL = () => {
  const envUrl =
    import.meta.env.VITE_AGENT_BASE_URL ?? import.meta.env.VITE_API_URL;
  if (!envUrl || envUrl === '/') {
    return getOrigin();
  }
  return envUrl;
};

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL,
  fetchOptions: {
    credentials: 'include',
    throw: true,
  },
});
