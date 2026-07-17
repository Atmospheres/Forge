type LoginWithRedirect = () => Promise<void>;

let currentLoginWithRedirect: LoginWithRedirect | null = null;

export function setLoginWithRedirect(fn: LoginWithRedirect | null) {
  currentLoginWithRedirect = fn;
}

/**
 * Auth0's SDK throws errors with an `error` code (e.g. 'login_required',
 * 'consent_required', 'missing_refresh_token') when a silent token refresh
 * fails. This checks for that shape without importing Auth0 types directly,
 * since this module needs to stay usable from the QueryClient's error
 * handlers, which run outside any Auth0 context.
 */
const AUTH_ERROR_CODES = new Set([
  'login_required',
  'consent_required',
  'interaction_required',
  'missing_refresh_token',
  'invalid_grant',
]);

export function isAuthTokenError(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { error?: unknown }).error;
  return typeof code === 'string' && AUTH_ERROR_CODES.has(code);
}

/**
 * Call from a QueryCache/MutationCache onError handler. Redirects to Auth0
 * login if the error looks like a failed silent token refresh; otherwise
 * does nothing, leaving normal error handling (isError, error boundaries,
 * etc.) to proceed as usual.
 */
export function redirectToLoginIfAuthError(error: unknown) {
  if (isAuthTokenError(error) && currentLoginWithRedirect) {
    void currentLoginWithRedirect();
  }
}
