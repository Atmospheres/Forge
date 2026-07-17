import { describe, it, expect } from 'vitest';
import { isRedirect } from '@tanstack/react-router';
import { Route } from '../workspaces.$workspaceId';

/**
 * beforeLoad isn't a React hook — it's a plain function the router calls
 * before rendering. That means it can be tested directly, without
 * rendering anything, by calling Route.options.beforeLoad the same way
 * the router would.
 */
describe('workspaces.$workspaceId beforeLoad guard', () => {
  it('redirects unauthenticated users to /', () => {
    const beforeLoad = Route.options.beforeLoad;
    if (!beforeLoad) throw new Error('beforeLoad is not defined on this route');

    let caught: unknown;
    try {
      // @ts-expect-error — only the fields beforeLoad actually reads are provided
      beforeLoad({ context: { auth: { isAuthenticated: false } } });
    } catch (err) {
      caught = err;
    }

    expect(isRedirect(caught)).toBe(true);
    expect((caught as { options: { to: string } }).options.to).toBe('/');
  });

  it('does not redirect authenticated users', () => {
    const beforeLoad = Route.options.beforeLoad;
    if (!beforeLoad) throw new Error('beforeLoad is not defined on this route');

    expect(() => {
      // @ts-expect-error — only the fields beforeLoad actually reads are provided
      beforeLoad({ context: { auth: { isAuthenticated: true } } });
    }).not.toThrow();
  });
});
