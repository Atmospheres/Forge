import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';

/**
 * Pure layout route: just the auth guard, shared by the project-list index
 * route and the project-board route below it. Rendering nothing of its own
 * (besides Outlet) means the board view doesn't also show the project list
 * stacked above it.
 */
export const Route = createFileRoute('/workspaces/$workspaceId')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      // eslint-disable-next-line @typescript-eslint/only-throw-error -- TanStack Router's redirect() is a control-flow object by design, not a real Error
      throw redirect({ to: '/' });
    }
  },
  component: () => <Outlet />,
});
