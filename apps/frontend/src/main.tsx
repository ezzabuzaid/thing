import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, redirect } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { authClient } from './app/auth-client.ts';
import ChatBot from './app/routes/ChatBot.tsx';
import Layout from './app/routes/Layout.tsx';
import LegalPrivacyPolicy from './app/routes/legal-privacy-policy.tsx';
import LegalTermsServices from './app/routes/legal-terms-services.tsx';
import Login from './app/routes/login.tsx';
import Marketplace from './app/routes/marketplace.tsx';
import SchedulesV2 from './app/routes/schedules/SchedulesV2.tsx';
import Schedules from './app/routes/schedules/schedules.tsx';
import Tasks from './app/routes/tasks.tsx';
import Thought from './app/routes/thought.tsx';
import ThoughtsTimeline from './app/routes/thoughtstimeline.tsx';
import Timesheet from './app/routes/timesheet.tsx';

async function requiresAuth() {
  const session = await authClient.getSession();
  console.log('Session:', session);
  if (!session) {
    throw redirect('/login');
  }
  return null;
}

const router = createBrowserRouter([
  {
    path: '/schedules-v2',
    loader: requiresAuth,
    Component: SchedulesV2,
    children: [
      {
        path: 'marketplace',
        Component: Marketplace,
      },
    ],
  },
  {
    Component: Layout,
    loader: requiresAuth,
    children: [
      {
        path: '/',
        Component: ChatBot,
      },
      {
        path: '/thought',
        Component: Thought,
      },
      {
        path: '/thoughtstimeline',
        Component: ThoughtsTimeline,
      },
      {
        path: '/tasks',
        Component: Tasks,
      },
      {
        path: '/schedules',
        Component: Schedules,
      },
      {
        path: '/marketplace',
        Component: Marketplace,
      },
      {
        path: '/timesheet',
        Component: Timesheet,
      },
    ],
  },
  {
    path: '/login',
    Component: Login,
  },
  {
    path: '/legal/privacy-policy',
    Component: LegalPrivacyPolicy,
  },
  {
    path: '/legal/terms-services',
    Component: LegalTermsServices,
  },
]);
const root = createRoot(document.getElementById('root') as HTMLElement);

const queryClient = new QueryClient({});

root.render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>,
);
