import { type ReactNode } from 'react';
import { Auth0Provider, type AppState } from '@auth0/auth0-react';
import type { RegisteredRouter } from '@tanstack/react-router';

const domain = import.meta.env.VITE_AUTH0_DOMAIN;
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID;
const audience = import.meta.env.VITE_AUTH0_AUDIENCE;

/**
 * Wraps the Auth0 SDK's provider so that, after the redirect callback,
 * the user is sent back to wherever they were headed (not always "/").
 * Requesting `audience` here is what makes Auth0 issue an access token
 * valid for our Spring Boot API, rather than just an opaque/ID token.
 *
 * The router instance is passed in as a prop (built once in main.tsx)
 * rather than pulled via useRouter(), since this component sits above
 * <RouterProvider> and is therefore outside the router's own context.
 */
export function Auth0ProviderWithNavigate({
  router,
  children,
}: {
  router: RegisteredRouter;
  children: ReactNode;
}) {
  const onRedirectCallback = (appState?: AppState) => {
    void router.navigate({ to: appState?.returnTo ?? '/' });
  };

  if (!domain || !clientId || !audience) {
    throw new Error('Missing Auth0 env vars — check frontend/.env against .env.example');
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience,
      }}
      onRedirectCallback={onRedirectCallback}
      useRefreshTokens
      cacheLocation="localstorage"
    >
      {children}
    </Auth0Provider>
  );
}
