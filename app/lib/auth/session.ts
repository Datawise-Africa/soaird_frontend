import type { AuthUser } from '~/lib/schema';

/**
 * Reads the session that `redux-persist` writes to a cookie.
 *
 * The browser sends `persist:datawise` on every document request, so on the
 * server we can know who's signed in *during SSR* — which the client-only redux
 * store cannot tell us. The root loader uses this so it renders the same
 * authenticated tree the client will, eliminating the hydration mismatch that
 * otherwise blanks every protected route on a hard load.
 *
 * Isomorphic on purpose: the root loader runs on the server (where the `Cookie`
 * header is present) AND on client navigations (where it is not — there we read
 * `document.cookie`). A `.server`-only version would return "signed out" after
 * every client navigation.
 */
export interface SessionAuth {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
}

const EMPTY: SessionAuth = { user: null, token: null, isAuthenticated: false };

/**
 * `redux-persist` stores the whole persisted root under one cookie, named
 * `persist:<persistConfig.key>` (it prepends `persist:` itself). Keep the key
 * in step with `app/store/index.ts` (`key: 'datawise'`).
 *
 * The legacy name carries an extra prefix from a since-fixed double-prefix bug
 * in `cookie-storage.ts`; we still read it so sessions created before the fix
 * keep working until the cookie is next rewritten.
 */
const PERSIST_COOKIE = 'persist:soaird-app';
const LEGACY_PERSIST_COOKIE = 'persist:datawise';

/** Server: read the request's Cookie header. Client: read `document.cookie`. */
export function getAuthFromRequest(request: Request): SessionAuth {
  const header =
    request.headers.get('Cookie') ??
    (typeof document !== 'undefined' ? document.cookie : null);

  return parseAuthCookie(header);
}

export function parseAuthCookie(cookieHeader: string | null): SessionAuth {
  if (!cookieHeader) return EMPTY;

  const rootRaw =
    readCookie(cookieHeader, PERSIST_COOKIE) ??
    readCookie(cookieHeader, LEGACY_PERSIST_COOKIE);
  if (!rootRaw) return EMPTY;

  try {
    // The persisted root is `{ auth: "<json>", theme: "<json>", _persist: … }`,
    // where each slice is itself a JSON string (redux-persist serialises twice).
    const root = JSON.parse(rootRaw) as Record<string, unknown>;
    const authRaw = root.auth;
    if (typeof authRaw !== 'string') return EMPTY;

    const auth = JSON.parse(authRaw) as {
      token?: string;
      user?: AuthUser;
      isAuthenticated?: boolean;
    };

    if (!auth.token || !auth.user) return EMPTY;

    return { user: auth.user, token: auth.token, isAuthenticated: true };
  } catch {
    // Tampered or stale cookie — treat as signed out rather than crash SSR.
    return EMPTY;
  }
}

function readCookie(header: string, name: string): string | null {
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    if (part.slice(0, idx).trim() !== name) continue;
    return safeDecode(part.slice(idx + 1).trim());
  }
  return null;
}

function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}