import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import {
  useWorkspaces,
  useCreateWorkspace,
  useUpdateWorkspace,
  useDeleteWorkspace,
} from '../workspaces';
import { createQueryWrapper } from '../../test/queryWrapper';
import * as api from '../api';

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    getAccessTokenSilently: vi.fn().mockResolvedValue('fake-token'),
  }),
}));

describe('useWorkspaces', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('returns the list of workspaces from the API', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue([
      { id: '1', name: 'Personal', ownerSub: 'auth0|abc', createdAt: '2026-01-01T00:00:00Z' },
    ]);

    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useWorkspaces(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual([
      { id: '1', name: 'Personal', ownerSub: 'auth0|abc', createdAt: '2026-01-01T00:00:00Z' },
    ]);
    expect(api.apiFetch).toHaveBeenCalledWith('/api/workspaces', expect.any(Function));
  });

  it('exposes an error state if the request fails', async () => {
    vi.spyOn(api, 'apiFetch').mockRejectedValue(new Error('network error'));

    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useWorkspaces(), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useCreateWorkspace', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('posts the new workspace name and invalidates the workspaces list', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue({
      id: '2',
      name: 'New Workspace',
      ownerSub: 'auth0|abc',
      createdAt: '2026-01-01T00:00:00Z',
    });

    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateWorkspace(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync('New Workspace');
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/api/workspaces',
      expect.any(Function),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New Workspace' }),
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['workspaces'] });
  });
});

describe('useUpdateWorkspace', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a PATCH with the new name and invalidates the workspaces list', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue({
      id: '1',
      name: 'Renamed',
      ownerSub: 'auth0|abc',
      createdAt: '2026-01-01T00:00:00Z',
    });

    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateWorkspace(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ workspaceId: '1', name: 'Renamed' });
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/api/workspaces/1',
      expect.any(Function),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Renamed' }),
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['workspaces'] });
  });
});

describe('useDeleteWorkspace', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('sends a DELETE for the given workspace and invalidates the workspaces list', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue(undefined);

    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteWorkspace(), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync('1');
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      '/api/workspaces/1',
      expect.any(Function),
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['workspaces'] });
  });
});
