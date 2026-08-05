import { useState } from 'react';
import {
  Outlet,
  redirect,
  useLocation,
} from 'react-router';
import { Bell, Globe2, Menu, Search } from 'lucide-react';
import type { Route } from './+types/dashboard-layout';
import { getAuthFromRequest } from '~/lib/auth/session';
import { DashboardSidebar } from './dashboard/dashboard-sidebar';
import { ErrorBoundary as RouteErrorBoundary } from './error-boundary';
import { LoadingIndicator } from './loading-indicator';
import {
  WorkspaceProvider,
  useWorkspace,
} from '~/features/workspaces/workspace-context';

const ROUTE_LABELS: Record<string, string> = {
  '/overview': 'Overview',
  '/datasets': 'Datasets',
  '/assessments': 'Assessments',
  '/reviews': 'Review workspace',
  '/reports': 'Reports & insights',
  '/governance': 'Governance',
  '/workspace': 'Workspace settings',
  '/invitations': 'Workspace invitation',
};

export async function loader({ request }: Route.LoaderArgs) {
  const { isAuthenticated } = getAuthFromRequest(request);

  if (!isAuthenticated) {
    const url = new URL(request.url);
    const redirectTo = encodeURIComponent(`${url.pathname}${url.search}`);
    throw redirect(`/auth/login?redirectTo=${redirectTo}`);
  }

  return null;
}

export default function DashboardLayout() {
  return (
    <WorkspaceProvider>
      <DashboardShell />
    </WorkspaceProvider>
  );
}

function DashboardShell() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const currentLabel = ROUTE_LABELS[location.pathname] ?? 'Research workspace';

  return (
    <div className="flex min-h-svh bg-[#031820] text-[#f4f8f7]">
      <DashboardSidebar
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />

      <div className="flex min-w-0 flex-1 flex-col">
        <LoadingIndicator />

        <header className="topbar">
          <div className="topbar-title">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setMobileOpen(true)}
              className="mobile-menu-trigger"
            >
              <Menu size={20} />
            </button>
            <div>
              <span>Datawise Africa</span>
              <strong>{currentLabel}</strong>
            </div>
          </div>
          <label className="global-search">
            <Search size={17} />
            <input
              aria-label="Search the platform"
              placeholder="Search datasets, assessments…"
            />
            <kbd>⌘ K</kbd>
          </label>
          <div className="top-actions">
            <button
              type="button"
              aria-label="Notifications"
              className="icon-button"
            >
              <Bell size={19} />
              <span />
            </button>
            <WorkspaceSelector />
          </div>
        </header>

        <main className="min-w-0 flex-1">
          <RouteErrorBoundary>
            <section className="page-content" aria-live="polite">
              <Outlet />
            </section>
          </RouteErrorBoundary>
        </main>
      </div>
    </div>
  );
}

function WorkspaceSelector() {
  const {
    activeWorkspace,
    workspaces,
    isLoading,
    setActiveWorkspaceId,
  } = useWorkspace();

  return (
    <label className="workspace-badge">
      <Globe2 size={16} />
      <span className="sr-only">Active workspace</span>
      <select
        aria-label="Active workspace"
        value={activeWorkspace.id}
        onChange={(event) => setActiveWorkspaceId(event.target.value)}
        disabled={isLoading}
      >
        <option value="personal">Personal workspace</option>
        {workspaces.map((workspace) => (
          <option key={workspace.id} value={workspace.id}>
            {workspace.name}
          </option>
        ))}
      </select>
    </label>
  );
}