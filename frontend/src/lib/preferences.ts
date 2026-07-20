import { useAuth0 } from '@auth0/auth0-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from './api';
import type { Theme } from '../theme-context';

export interface UserPreferences {
  theme: Theme;
}

/** `enabled` should be the caller's isAuthenticated flag — this hits an
 * authenticated endpoint, so there's no point firing it pre-login. */
export function usePreferences(enabled: boolean) {
  const { getAccessTokenSilently } = useAuth0();

  return useQuery({
    queryKey: ['preferences'],
    queryFn: () => apiFetch<UserPreferences>('/api/me/preferences', getAccessTokenSilently),
    enabled,
    staleTime: Infinity,
  });
}

export function useUpdatePreferences() {
  const { getAccessTokenSilently } = useAuth0();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (theme: Theme) =>
      apiFetch<UserPreferences>('/api/me/preferences', getAccessTokenSilently, {
        method: 'PUT',
        body: JSON.stringify({ theme }),
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(['preferences'], data);
    },
  });
}
