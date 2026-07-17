import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useProjects, useCreateProject, useUpdateProject, useDeleteProject } from '../projects';
import { createQueryWrapper } from '../../test/queryWrapper';
import * as api from '../api';

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    getAccessTokenSilently: vi.fn().mockResolvedValue('fake-token'),
  }),
}));

const WORKSPACE_ID = 'workspace-1';

describe('useProjects', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches projects scoped to the given workspace', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue([
      { id: 'p1', workspaceId: WORKSPACE_ID, name: 'Forge', createdAt: '2026-01-01T00:00:00Z' },
    ]);

    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useProjects(WORKSPACE_ID), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      `/api/workspaces/${WORKSPACE_ID}/projects`,
      expect.any(Function)
    );
    expect(result.current.data).toHaveLength(1);
  });
});

describe('useCreateProject', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to the correct nested workspace URL and invalidates that workspace's projects", async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue({
      id: 'p2',
      workspaceId: WORKSPACE_ID,
      name: 'New Project',
      createdAt: '2026-01-01T00:00:00Z',
    });

    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateProject(WORKSPACE_ID), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync('New Project');
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      `/api/workspaces/${WORKSPACE_ID}/projects`,
      expect.any(Function),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'New Project' }),
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['workspaces', WORKSPACE_ID, 'projects'],
    });
  });
});

describe('useUpdateProject', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a PATCH to the nested project URL and invalidates that workspace's projects", async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue({
      id: 'p1',
      workspaceId: WORKSPACE_ID,
      name: 'Renamed Project',
      createdAt: '2026-01-01T00:00:00Z',
    });

    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateProject(WORKSPACE_ID), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync({ projectId: 'p1', name: 'Renamed Project' });
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      `/api/workspaces/${WORKSPACE_ID}/projects/p1`,
      expect.any(Function),
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Renamed Project' }),
      })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['workspaces', WORKSPACE_ID, 'projects'],
    });
  });
});

describe('useDeleteProject', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends a DELETE to the nested project URL and invalidates that workspace's projects", async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue(undefined);

    const { Wrapper, queryClient } = createQueryWrapper();
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteProject(WORKSPACE_ID), { wrapper: Wrapper });

    await act(async () => {
      await result.current.mutateAsync('p1');
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      `/api/workspaces/${WORKSPACE_ID}/projects/p1`,
      expect.any(Function),
      expect.objectContaining({ method: 'DELETE' })
    );
    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: ['workspaces', WORKSPACE_ID, 'projects'],
    });
  });
});
