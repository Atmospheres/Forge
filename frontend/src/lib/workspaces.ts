import { useAuth0 } from '@auth0/auth0-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';

export interface Workspace {
  id: string;
  name: string;
  ownerSub: string;
  createdAt: string;
}

export function useWorkspaces() {
  const { getAccessTokenSilently } = useAuth0();

  return useQuery({
    queryKey: ['workspaces'],
    queryFn: () => apiFetch<Workspace[]>('/api/workspaces', getAccessTokenSilently),
  });
}

export function useWorkspace(workspaceId: string) {
  const { getAccessTokenSilently } = useAuth0();

  return useQuery({
    queryKey: ['workspaces', workspaceId],
    queryFn: () => apiFetch<Workspace>(`/api/workspaces/${workspaceId}`, getAccessTokenSilently),
  });
}

export function useCreateWorkspace() {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) =>
      apiFetch<Workspace>('/api/workspaces', getAccessTokenSilently, {
        method: 'POST',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useUpdateWorkspace() {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ workspaceId, name }: { workspaceId: string; name: string }) =>
      apiFetch<Workspace>(`/api/workspaces/${workspaceId}`, getAccessTokenSilently, {
        method: 'PATCH',
        body: JSON.stringify({ name }),
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}

export function useDeleteWorkspace() {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (workspaceId: string) =>
      apiFetch<undefined>(`/api/workspaces/${workspaceId}`, getAccessTokenSilently, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
}
