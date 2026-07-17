import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';
import { useAuth0 } from '@auth0/auth0-react';
import type { RegisteredRouter } from '@tanstack/react-router';
import type { QueryClient } from '@tanstack/react-query';
import { setLoginWithRedirect } from './auth/authRedirect';

export function App({
  router,
  queryClient,
}: {
  router: RegisteredRouter;
  queryClient: QueryClient;
}) {
  const auth = useAuth0();
  const { loginWithRedirect } = auth;
  router.update({ context: { auth } });

  useEffect(() => {
    setLoginWithRedirect(() => loginWithRedirect());
    return () => {
      setLoginWithRedirect(null);
    };
  }, [loginWithRedirect]);

  if (auth.isLoading) return <p>Loading...</p>;

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
