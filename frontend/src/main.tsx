import React from 'react';
import ReactDOM from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { Auth0ProviderWithNavigate } from './auth/Auth0ProviderWithNavigate';
import { App } from './app';
import { routeTree } from './routeTree.gen';
import type { RouterContext } from './routes/__root';
import './index.css';
import { redirectToLoginIfAuthError } from './auth/authRedirect';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
  queryCache: new QueryCache({
    onError: redirectToLoginIfAuthError,
  }),
  mutationCache: new MutationCache({
    onError: redirectToLoginIfAuthError,
  }),
});

const router = createRouter({
  routeTree,
  context: {} as RouterContext,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found — check index.html');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Auth0ProviderWithNavigate router={router}>
      <App router={router} queryClient={queryClient} />
    </Auth0ProviderWithNavigate>
  </React.StrictMode>
);
