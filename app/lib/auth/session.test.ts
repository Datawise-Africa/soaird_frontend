import { describe, expect, it } from 'vitest';
import { parseAuthCookie } from './session';

/** Build the cookie value redux-persist writes: a root of JSON-stringified slices. */
function persistCookie(
  name: string,
  auth: Record<string, unknown> | null
): string {
  const root: Record<string, string> = {
    theme: JSON.stringify({ dark: false }),
    _persist: JSON.stringify({ version: 1, rehydrated: true }),
  };
  if (auth) root.auth = JSON.stringify(auth);

  return `${name}=${encodeURIComponent(JSON.stringify(root))}`;
}

const session = {
  token: 'mock.user-1.123',
  user: {
    id: 'user-1',
    first_name: 'Demo',
    last_name: 'User',
    email: 'demo@datawise.africa',
  },
  isAuthenticated: true,
};

describe('parseAuthCookie', () => {
  it('reads a signed-in session from the persist cookie', () => {
    const result = parseAuthCookie(
      persistCookie('persist:soaird-app', session)
    );

    expect(result.isAuthenticated).toBe(true);
    expect(result.user?.first_name).toBe('Demo');
    expect(result.token).toBe('mock.user-1.123');
  });

  it('reads the legacy double-prefixed cookie name too', () => {
    const result = parseAuthCookie(
      persistCookie('persist:datawise', session)
    );

    expect(result.isAuthenticated).toBe(true);
    expect(result.user?.first_name).toBe('Demo');
  });

  it('finds the session among other cookies', () => {
    const header = `ff_theme=dark; ${persistCookie('persist:soaird-app', session)}; other=1`;
    expect(parseAuthCookie(header).isAuthenticated).toBe(true);
  });

  it('returns signed-out for a null header', () => {
    expect(parseAuthCookie(null).isAuthenticated).toBe(false);
    expect(parseAuthCookie(null).user).toBeNull();
  });

  it('returns signed-out when the persist cookie is absent', () => {
    expect(parseAuthCookie('ff_theme=dark; other=1').isAuthenticated).toBe(
      false
    );
  });

  it('returns signed-out when auth has no token', () => {
    const result = parseAuthCookie(
      persistCookie('persist:soaird-app', { user: session.user })
    );
    expect(result.isAuthenticated).toBe(false);
  });

  it('does not throw on a malformed cookie value', () => {
    expect(parseAuthCookie('persist:datawise=not-json').isAuthenticated).toBe(
      false
    );
  });
});