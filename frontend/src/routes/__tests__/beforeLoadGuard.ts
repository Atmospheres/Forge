import { describe, it, expect } from 'vitest';
import { isRedirect } from '@tanstack/react-router';

export type BeforeLoad = (opts: { context: { auth: { isAuthenticated: boolean } } }) => unknown;

/**
 * beforeLoad isn't a React hook — it's a plain function the router calls
 * before rendering. That means it can be tested directly, without rendering
 * anything, by calling Route.options.beforeLoad the same way the router
 * would. Shared by every route whose only guard logic is "redirect to / if
 * not authenticated" (cast the route's beforeLoad to BeforeLoad at the call
 * site — its real type requires the full router context, which callers here
 * only partially supply).
 */
export function describeBeforeLoadGuard(routeName: string, getBeforeLoad: () => BeforeLoad | undefined) {
  describe(`${routeName} beforeLoad guard`, () => {
    it('redirects unauthenticated users to /', () => {
      const beforeLoad = getBeforeLoad();
      if (!beforeLoad) throw new Error('beforeLoad is not defined on this route');

      let caught: unknown;
      try {
        beforeLoad({ context: { auth: { isAuthenticated: false } } });
      } catch (err) {
        caught = err;
      }

      expect(isRedirect(caught)).toBe(true);
      expect((caught as { options: { to: string } }).options.to).toBe('/');
    });

    it('does not redirect authenticated users', () => {
      const beforeLoad = getBeforeLoad();
      if (!beforeLoad) throw new Error('beforeLoad is not defined on this route');

      expect(() => {
        beforeLoad({ context: { auth: { isAuthenticated: true } } });
      }).not.toThrow();
    });
  });
}
