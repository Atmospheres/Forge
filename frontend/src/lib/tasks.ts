import { useAuth0 } from '@auth0/auth0-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';

export interface Task {
  id: string;
  title: string;
  status: 'TODO' | 'IN_PROGRESS' | 'DONE';
  position: number;
  assigneeSub: string | null;
  createdAt: string;
}

export function useTasks(projectId: string) {
  const { getAccessTokenSilently } = useAuth0();

  return useQuery({
    queryKey: ['projects', projectId, 'tasks'],
    queryFn: () => apiFetch<Task[]>(`/api/projects/${projectId}/tasks`, getAccessTokenSilently),
  });
}

export function useCreateTask(projectId: string) {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (title: string) =>
      apiFetch<Task>(`/api/projects/${projectId}/tasks`, getAccessTokenSilently, {
        method: 'POST',
        body: JSON.stringify({ title }),
      }),
    onMutate: async (title) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'tasks'] });
      const previous = queryClient.getQueryData<Task[]>(['projects', projectId, 'tasks']);

      const optimisticTask: Task = {
        id: `optimistic-${String(Date.now())}`,
        title,
        status: 'TODO',
        position: previous?.length ?? 0,
        assigneeSub: null,
        createdAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Task[]>(['projects', projectId, 'tasks'], (old = []) => [
        ...old,
        optimisticTask,
      ]);

      return { previous };
    },
    onError: (_err, _title, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId, 'tasks'], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
    },
  });
}

export function useUpdateTask(projectId: string) {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      taskId,
      title,
      status,
      position,
    }: {
      taskId: string;
      title?: string;
      status?: Task['status'];
      position?: number;
    }) =>
      apiFetch<Task>(`/api/projects/${projectId}/tasks/${taskId}`, getAccessTokenSilently, {
        method: 'PATCH',
        body: JSON.stringify({ title, status, position }),
      }),
    onMutate: async ({ taskId, title, status, position }) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'tasks'] });
      const previous = queryClient.getQueryData<Task[]>(['projects', projectId, 'tasks']);

      queryClient.setQueryData<Task[]>(['projects', projectId, 'tasks'], (old = []) =>
        old.map((task) =>
          task.id === taskId
            ? {
                ...task,
                title: title ?? task.title,
                status: status ?? task.status,
                position: position ?? task.position,
              }
            : task
        )
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId, 'tasks'], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
    },
  });
}

export function useDeleteTask(projectId: string) {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) =>
      apiFetch<undefined>(`/api/projects/${projectId}/tasks/${taskId}`, getAccessTokenSilently, {
        method: 'DELETE',
      }),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['projects', projectId, 'tasks'] });
      const previous = queryClient.getQueryData<Task[]>(['projects', projectId, 'tasks']);

      queryClient.setQueryData<Task[]>(['projects', projectId, 'tasks'], (old = []) =>
        old.filter((task) => task.id !== taskId)
      );

      return { previous };
    },
    onError: (_err, _taskId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(['projects', projectId, 'tasks'], context.previous);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'tasks'] });
    },
  });
}
