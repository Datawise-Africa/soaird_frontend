/**
 * SSR-safe cookie storage engine for redux-persist.
 *
 * On the server (or when `document` is unavailable) every operation is a no-op
 * that resolves to `undefined` / `null`, so the store boots with its initial
 * state and hydrates once the client takes over.
 *
 * Each persisted slice is stored as its own cookie:
 *   persist:<key>   →  JSON string
 *
 * Options mirror the most common cookie attributes. The defaults are
 * deliberately long-lived and lax so auth/theme tokens survive across sessions.
 */

const DEFAULT_PATH = '/';
const DEFAULT_MAX_AGE = 60 * 60 * 24 * 365; // 1 year
const DEFAULT_SAME_SITE = 'lax';

export interface CookieStorageOptions {
  /** Cookie path (default "/") */
  path?: string;
  /** Max-age in seconds (default 1 year) */
  maxAge?: number;
  /** SameSite attribute (default "lax") */
  sameSite?: 'strict' | 'lax' | 'none';
  /** Mark as Secure (default: true when served over HTTPS) */
  secure?: boolean;
  /**
   * Prefix prepended to the storage key (default ""). redux-persist ALREADY
   * prepends `persist:` to the key it hands us, so a non-empty prefix here
   * double-prefixes the cookie (e.g. `persist:persist:datawise`). Leave empty
   * unless you deliberately want an extra namespace.
   */
  prefix?: string;
}

function isBrowser(): boolean {
  return typeof document !== 'undefined';
}

function encodeCookieValue(value: string): string {
  return encodeURIComponent(value);
}

function decodeCookieValue(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function parseCookies(): Record<string, string> {
  if (!isBrowser()) return {};

  const cookies: Record<string, string> = {};

  for (const part of document.cookie.split(';')) {
    const [rawKey, ...rest] = part.split('=');
    const key = rawKey?.trim();

    if (!key) continue;

    cookies[key] = decodeCookieValue(rest.join('='));
  }

  return cookies;
}

function setCookie(
  name: string,
  value: string,
  opts: Required<Omit<CookieStorageOptions, 'prefix'>>
) {
  if (!isBrowser()) return;

  let cookie = `${name}=${encodeCookieValue(value)}; path=${opts.path}; max-age=${opts.maxAge}; samesite=${opts.sameSite}`;

  if (opts.secure) cookie += '; secure';

  document.cookie = cookie;
}

function removeCookie(name: string, path: string) {
  if (!isBrowser()) return;

  document.cookie = `${name}=; path=${path}; max-age=0`;
}

/**
 * Create a redux-persist compatible storage engine backed by cookies.
 *
 * @example
 * import { createCookieStorage } from '~/stores/cookie-storage';
 *
 * const persistConfig = {
 *   key: 'learning-africa',
 *   storage: createCookieStorage(),
 *   whitelist: ['auth', 'theme'],
 * };
 */
export function createCookieStorage(options: CookieStorageOptions = {}) {
  const {
    path = DEFAULT_PATH,
    maxAge = DEFAULT_MAX_AGE,
    sameSite = DEFAULT_SAME_SITE,
    secure = isBrowser() && location.protocol === 'https:',
    prefix = '',
  } = options;

  const cookieOpts = { path, maxAge, sameSite, secure } as const;

  const cookieKey = (key: string) => `${prefix}${key}`;

  return {
    getItem(key: string): Promise<string | null> {
      const cookies = parseCookies();

      return Promise.resolve(cookies[cookieKey(key)] ?? null);
    },

    setItem(key: string, value: string): Promise<void> {
      setCookie(cookieKey(key), value, cookieOpts);

      return Promise.resolve();
    },

    removeItem(key: string): Promise<void> {
      removeCookie(cookieKey(key), path);

      return Promise.resolve();
    },
  };
}
