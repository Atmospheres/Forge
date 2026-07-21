import React from 'react';
import ReactDOM from 'react-dom/client';
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { createRouter } from '@tanstack/react-router';
import { Auth0ProviderWithNavigate } from './auth/Auth0ProviderWithNavigate';
import { App } from './app';
import { routeTree } from './routeTree.gen';
import type { RouterContext } from './routes/__root';
import './index.css';
import { isAuthTokenError, redirectToLoginIfAuthError } from './auth/authRedirect';
import { notifyError } from './toast';

// A failed silent token refresh redirects to login instead of showing a
// toast -- the page is about to navigate away, so a toast would just flash
// and disappear.
function handleQueryError(error: unknown) {
  if (isAuthTokenError(error)) {
    redirectToLoginIfAuthError(error);
  } else {
    notifyError(error);
  }
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
  queryCache: new QueryCache({
    onError: handleQueryError,
  }),
  mutationCache: new MutationCache({
    onError: handleQueryError,
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
