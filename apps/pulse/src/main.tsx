import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { createBrowserRouter, redirect } from 'react-router';
import { RouterProvider } from 'react-router/dom';

import { authClient } from './app/auth-client.ts';
import Layout from './app/routes/Layout.tsx';
import LegalPrivacyPolicy from './app/routes/LegalPrivacyPolicy.tsx';
import LegalTermsServices from './app/routes/LegalTermsServices.tsx';
import Login from './app/routes/login.tsx';
import Marketplace from './app/routes/marketplace.tsx';
import Schedules from './app/routes/schedules/Schedules.tsx';

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
    Component: Layout,
    loader: requiresAuth,
    children: [
      {
        path: '/',
        Component: Schedules,
      },
      {
        path: '/marketplace',
        Component: Marketplace,
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
