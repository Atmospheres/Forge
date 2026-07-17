import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useTasks, useCreateTask, useUpdateTask, useDeleteTask, type Task } from '../tasks';
import { createQueryWrapper } from '../../test/queryWrapper';
import * as api from '../api';

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    getAccessTokenSilently: vi.fn().mockResolvedValue('fake-token'),
  }),
}));

const PROJECT_ID = 'project-1';

const existingTask: Task = {
  id: 't1',
  title: 'Existing task',
  status: 'TODO',
  position: 0,
  assigneeSub: null,
  createdAt: '2026-01-01T00:00:00Z',
};

describe('useTasks', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('fetches tasks for the given project', async () => {
    vi.spyOn(api, 'apiFetch').mockResolvedValue([existingTask]);

    const { Wrapper } = createQueryWrapper();
    const { result } = renderHook(() => useTasks(PROJECT_ID), { wrapper: Wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(api.apiFetch).toHaveBeenCalledWith(
      `/api/projects/${PROJECT_ID}/tasks`,
      expect.any(Function)
    );
    expect(result.current.data).toEqual([existingTask]);
  });
});

describe('useCreateTask', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the task optimistically before the request resolves', async () => {
    let resolveCreate!: (task: Task) => void;
    vi.spyOn(api, 'apiFetch').mockImplementation(() => {
      return new Promise<Task>((resolve) => {
        resolveCreate = resolve;
      });
    });

    const { Wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(['projects', PROJECT_ID, 'tasks'], [existingTask]);

    const { result } = renderHook(() => useCreateTask(PROJECT_ID), { wrapper: Wrapper });

    act(() => {
      result.current.mutate('New task');
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Task[]>(['projects', PROJECT_ID, 'tasks']);
      expect(cached).toHaveLength(2);
      expect(cached?.[1].title).toBe('New task');
      expect(cached?.[1].id).toMatch(/^optimistic-/);
    });

    act(() => {
      resolveCreate({ ...existingTask, id: 't2', title: 'New task' });
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('rolls back the optimistic task if the request fails', async () => {
    vi.spyOn(api, 'apiFetch').mockRejectedValue(new Error('server error'));

    const { Wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(['projects', PROJECT_ID, 'tasks'], [existingTask]);

    const { result } = renderHook(() => useCreateTask(PROJECT_ID), { wrapper: Wrapper });

    act(() => {
      result.current.mutate('Doomed task');
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      const cached = queryClient.getQueryData<Task[]>(['projects', PROJECT_ID, 'tasks']);
      expect(cached).toEqual([existingTask]);
    });
  });
});

describe('useUpdateTask', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('optimistically renames a task before the request resolves', async () => {
    let resolveUpdate!: (task: Task) => void;
    vi.spyOn(api, 'apiFetch').mockImplementation(() => {
      return new Promise<Task>((resolve) => {
        resolveUpdate = resolve;
      });
    });

    const { Wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(['projects', PROJECT_ID, 'tasks'], [existingTask]);

    const { result } = renderHook(() => useUpdateTask(PROJECT_ID), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ taskId: existingTask.id, title: 'Renamed task' });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Task[]>(['projects', PROJECT_ID, 'tasks']);
      expect(cached?.[0].title).toBe('Renamed task');
    });

    act(() => {
      resolveUpdate({ ...existingTask, title: 'Renamed task' });
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('optimistically moves a task to a new status/position (drag-and-drop)', async () => {
    let resolveUpdate!: (task: Task) => void;
    vi.spyOn(api, 'apiFetch').mockImplementation(() => {
      return new Promise<Task>((resolve) => {
        resolveUpdate = resolve;
      });
    });

    const { Wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(['projects', PROJECT_ID, 'tasks'], [existingTask]);

    const { result } = renderHook(() => useUpdateTask(PROJECT_ID), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ taskId: existingTask.id, status: 'DONE', position: 0 });
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Task[]>(['projects', PROJECT_ID, 'tasks']);
      expect(cached?.[0].status).toBe('DONE');
    });

    act(() => {
      resolveUpdate({ ...existingTask, status: 'DONE' });
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('rolls back the update if the request fails', async () => {
    vi.spyOn(api, 'apiFetch').mockRejectedValue(new Error('server error'));

    const { Wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(['projects', PROJECT_ID, 'tasks'], [existingTask]);

    const { result } = renderHook(() => useUpdateTask(PROJECT_ID), { wrapper: Wrapper });

    act(() => {
      result.current.mutate({ taskId: existingTask.id, status: 'DONE' });
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      const cached = queryClient.getQueryData<Task[]>(['projects', PROJECT_ID, 'tasks']);
      expect(cached).toEqual([existingTask]);
    });
  });
});

describe('useDeleteTask', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('optimistically removes the task before the request resolves', async () => {
    let resolveDelete!: () => void;
    vi.spyOn(api, 'apiFetch').mockImplementation(() => {
      return new Promise<undefined>((resolve) => {
        resolveDelete = () => {
          resolve(undefined);
        };
      });
    });

    const { Wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(['projects', PROJECT_ID, 'tasks'], [existingTask]);

    const { result } = renderHook(() => useDeleteTask(PROJECT_ID), { wrapper: Wrapper });

    act(() => {
      result.current.mutate(existingTask.id);
    });

    await waitFor(() => {
      const cached = queryClient.getQueryData<Task[]>(['projects', PROJECT_ID, 'tasks']);
      expect(cached).toEqual([]);
    });

    act(() => {
      resolveDelete();
    });
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('rolls back the removal if the request fails', async () => {
    vi.spyOn(api, 'apiFetch').mockRejectedValue(new Error('server error'));

    const { Wrapper, queryClient } = createQueryWrapper();
    queryClient.setQueryData(['projects', PROJECT_ID, 'tasks'], [existingTask]);

    const { result } = renderHook(() => useDeleteTask(PROJECT_ID), { wrapper: Wrapper });

    act(() => {
      result.current.mutate(existingTask.id);
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
      const cached = queryClient.getQueryData<Task[]>(['projects', PROJECT_ID, 'tasks']);
      expect(cached).toEqual([existingTask]);
    });
  });
});
