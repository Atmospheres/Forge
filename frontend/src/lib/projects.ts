import { useAuth0 } from '@auth0/auth0-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  createdAt: string;
}

export function useProjects(workspaceId: string) {
  const { getAccessTokenSilently } = useAuth0();

  return useQuery({
    queryKey: ['workspaces', workspaceId, 'projects'],
    queryFn: () =>
      apiFetch<Project[]>(`/api/workspaces/${workspaceId}/projects`, getAccessTokenSilently),
  });
}

export function useCreateProject(workspaceId: string) {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<Project>(`/api/workspaces/${workspaceId}/projects`, getAccessTokenSilently, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'projects'] });
    },
  });
}

export function useUpdateProject(workspaceId: string) {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, name }: { projectId: string; name: string }) =>
      apiFetch<Project>(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
        getAccessTokenSilently,
        { method: 'PATCH', body: JSON.stringify({ name }) }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'projects'] });
    },
  });
}

export function useDeleteProject(workspaceId: string) {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) =>
      apiFetch<undefined>(
        `/api/workspaces/${workspaceId}/projects/${projectId}`,
        getAccessTokenSilently,
        { method: 'DELETE' }
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces', workspaceId, 'projects'] });
    },
  });
}
