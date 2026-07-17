const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

/**
 * Thin fetch wrapper that attaches a bearer token and throws on non-2xx
 * responses so TanStack Query's error handling picks it up naturally.
 *
 * `getAccessToken` is injected rather than imported directly, since the
 * Auth0 SDK's getAccessTokenSilently is only available from inside a
 * React hook (useAuth0) — see lib/queryClient.ts for how it's wired up.
 */
export async function apiFetch<T>(
  path: string,
  getAccessToken: () => Promise<string>,
  init?: RequestInit
): Promise<T> {
  const token = await getAccessToken();

  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new ApiError(response.status, body || response.statusText);
  }

  // 204 No Content etc.
  if (response.status === 204) return undefined as T;

  return response.json() as Promise<T>;
}
