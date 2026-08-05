import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from 'react-router';
import { Toaster } from 'react-hot-toast';

import type { Route } from './+types/root';
import './app.css';
import { loadGTagScripts } from './lib/utils/add-google-tag';
import { QueryProvider } from './lib/providers/query-provider';
import { StoreProvider } from './lib/providers/store-provider';
import { env } from './lib/env';
import { getAuthFromRequest } from './lib/auth/session';

/**
 * Reads the session cookie on the server so auth is known during SSR. Every
 * component reads this via `useAuth()`, which is why the authenticated nav and
 * route guards hydrate without a mismatch. The token stays out of loader data —
 * the browser keeps its own copy in the same cookie for the API client.
 */
export async function loader({ request }: Route.LoaderArgs) {
  const { user, isAuthenticated } = getAuthFromRequest(request);
  return { auth: { user, isAuthenticated } };
}

export const links: Route.LinksFunction = () => [
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },
];

export function Layout({ children }: Readonly<{ children: React.ReactNode }>) {
  /**
   * Google Analytics Tracking ID
   * Replace 'G-XXXXXXXXXX' with your actual tracking ID or set it in the environment variable VITE_GTAG_ID
   */
  const GTAG = env.VITE_GTAG_ID;
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
        {GTAG && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GTAG}`}
            ></script>
            <script dangerouslySetInnerHTML={loadGTagScripts(GTAG)}></script>
          </>
        )}
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <QueryProvider>
        <Outlet />
        {/*
         * Mounted here, not in a layout, so every route can raise a toast —
         * including authentication routes outside the dashboard layout.
         *
         * Only `duration` is meaningful: toastUtils.success/error/info/warning
         * render `toast.custom(<CustomToast />)` and bring their own styling, so
         * `style` / `iconTheme` here would silently do nothing.
         */}
        <Toaster
          position="top-right"
          toastOptions={{ duration: 4000, success: { duration: 3000 } }}
        />
      </QueryProvider>
    </StoreProvider>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = 'Oops!';
  let details = 'An unexpected error occurred.';
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? '404' : 'Error';
    details =
      error.status === 404
        ? 'The requested page could not be found.'
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}