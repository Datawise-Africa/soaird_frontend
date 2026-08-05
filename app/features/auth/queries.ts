import { useQuery } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { authKeys } from './query-keys';
import { authUserSchema, type AuthUser } from '~/lib/schema';
import { useAppSelector } from '~/store';

/**
 * Re-validate the persisted session against the API.
 *
 * `redux-persist` restores the token across reloads, but a token can expire or
 * be revoked server-side. This confirms it still works; the 401 interceptor in
 * `lib/api/client.ts` clears auth if it doesn't.
 */
export const useSession = () => {
  const token = useAppSelector((state) => state.auth.token);

  return useQuery({
    queryKey: authKeys.session(),
    queryFn: async (): Promise<AuthUser> => {
      const { data } = await apiClient.get('/api/v1/auth/me/');
      return authUserSchema.parse(data);
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
};