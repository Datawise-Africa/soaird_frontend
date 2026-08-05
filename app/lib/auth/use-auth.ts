import { useRouteLoaderData } from 'react-router';
import type { AuthUser } from '~/lib/schema';

export interface AuthView {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const SIGNED_OUT: AuthView = { user: null, isAuthenticated: false };

/**
 * The single source of truth for *rendering* auth state.
 *
 * Reads what the root loader derived from the session cookie, so a component
 * renders identically on the server and the client — no hydration mismatch.
 * The redux `auth` slice still owns the write path (login/logout dispatch to
 * it, and redux-persist writes the cookie this loader reads); components just
 * shouldn't render from redux directly, or SSR and client diverge again.
 *
 * Loader data refreshes on navigation/revalidation, so the auth flows call
 * `navigate(...)` (or revalidate) after mutating the session.
 */
export function useAuth(): AuthView {
  const data = useRouteLoaderData('root') as { auth?: AuthView } | undefined;

  return data?.auth ?? SIGNED_OUT;
}
