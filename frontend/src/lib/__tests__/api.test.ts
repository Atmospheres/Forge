import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiFetch } from '../api';

describe('apiFetch', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('attaches the bearer token and content-type header', async () => {
    const getAccessToken = vi.fn().mockResolvedValue('fake-token');
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

    await apiFetch('/api/workspaces', getAccessToken);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    const headers = init?.headers as Headers;
    expect(headers.get('Authorization')).toBe('Bearer fake-token');
    expect(headers.get('Content-Type')).toBe('application/json');
  });

  it('returns parsed JSON on a successful response', async () => {
    const getAccessToken = vi.fn().mockResolvedValue('fake-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ id: '123', name: 'Forge' }), { status: 200 })
    );

    const result = await apiFetch<{ id: string; name: string }>(
      '/api/workspaces/123',
      getAccessToken
    );

    expect(result).toEqual({ id: '123', name: 'Forge' });
  });

  it('returns undefined for a 204 No Content response', async () => {
    const getAccessToken = vi.fn().mockResolvedValue('fake-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }));

    const result = await apiFetch('/api/workspaces/123', getAccessToken, { method: 'DELETE' });

    expect(result).toBeUndefined();
  });

  it('throws an ApiError with the status code on a non-2xx response', async () => {
    const getAccessToken = vi.fn().mockResolvedValue('fake-token');
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response('Forbidden', { status: 403, statusText: 'Forbidden' })
    );

    await expect(apiFetch('/api/workspaces', getAccessToken)).rejects.toMatchObject({
      status: 403,
    });
  });

  it('throws if the access token cannot be retrieved', async () => {
    const getAccessToken = vi.fn().mockRejectedValue(new Error('login_required'));
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(apiFetch('/api/workspaces', getAccessToken)).rejects.toThrow('login_required');
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
