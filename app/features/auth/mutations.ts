import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { authKeys } from './query-keys';
import {
  authSessionSchema,
  registrationResponseSchema,
  type AuthSession,
  type LoginInput,
  type RegisterInput,
  type RegistrationResponse,
} from '~/lib/schema';
import { persistor, useAppDispatch } from '~/store';
import { clearAuth, setCredentials } from '~/store/slices/auth-slice';

/**
 * Sign in and persist the session.
 *
 * The token lands in the `auth` slice, which `redux-persist` writes to storage,
 * and `lib/api/client.ts` reads it back on every subsequent request — so
 * callers never touch tokens directly.
 */
export const useLogin = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: LoginInput): Promise<AuthSession> => {
      const { data } = await apiClient.post('/api/v1/auth/login/', input);
      return authSessionSchema.parse(data);
    },
    // async + flush: the root loader reads auth from the persisted cookie, so it
    // must be written before the caller navigates and revalidates. mutateAsync
    // awaits onSuccess, so the form's post-login navigate sees a fresh session.
    onSuccess: async (session) => {
      dispatch(setCredentials({ token: session.access, user: session.user }));
      queryClient.setQueryData(authKeys.session(), session.user);
      await persistor.flush();
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: async (
      input: RegisterInput
    ): Promise<RegistrationResponse> => {
      const { data } = await apiClient.post('/api/v1/auth/register/', input);
      return registrationResponseSchema.parse(data);
    },
  });
};

export const useLogout = () => {
  const dispatch = useAppDispatch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      // Best-effort: a failed logout call must never strand the user signed in.
      await apiClient.post('/api/v1/auth/logout/').catch(() => undefined);
    },
    onSettled: async () => {
      dispatch(clearAuth());
      queryClient.clear();
      // Flush the cleared session to the cookie before the caller navigates,
      // so the revalidated root loader sees a signed-out state.
      await persistor.flush();
    },
  });
};