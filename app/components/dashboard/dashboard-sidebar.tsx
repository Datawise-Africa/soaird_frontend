import { Link, NavLink, useNavigate, useRevalidator } from 'react-router';
import {
  ChevronDown,
  Database,
  FileBarChart,
  FileCheck2,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  ShieldCheck,
  Users,
  X,
} from 'lucide-react';
import { useAuth } from '~/lib/auth/use-auth';
import { useLogout } from '~/features/auth';
import { toastUtils } from '~/lib/utils/toast';
import { cn } from '~/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';

const NAV = [
  { to: '/overview', label: 'Overview', icon: LayoutDashboard },
  { to: '/datasets', label: 'Datasets', icon: Database },
  { to: '/assessments', label: 'Assessments', icon: FileCheck2 },
  { to: '/reviews', label: 'Review workspace', icon: Users },
  { to: '/reports', label: 'Reports & insights', icon: FileBarChart },
  { to: '/governance', label: 'Governance', icon: ShieldCheck },
];

export function DashboardSidebar({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const navigate = useNavigate();
  const revalidator = useRevalidator();
  const logout = useLogout();
  const { user } = useAuth();
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(' ') ||
    user?.email ||
    'Account';

  const handleLogout = async () => {
    await logout.mutateAsync();
    await revalidator.revalidate();
    toastUtils.success('Signed out', 'Your research session has ended.');
    navigate('/auth/login', { replace: true });
  };

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r border-[#173b43] bg-[#041c24] text-[#f4f8f7] transition-transform md:sticky md:top-0 md:h-svh md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-20 items-center justify-between border-b border-[#173b43] px-5">
          <Link
            to="/overview"
            className="flex items-center gap-3"
            onClick={onClose}
          >
            <span className="logo-mark" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span>
              <strong className="block font-serif text-lg font-medium text-[#f4eadf]">
                SOAIRD App
              </strong>
              <small className="block text-[11px] uppercase tracking-[0.16em] text-[#6f9699]">
                State of AI-Ready Data
              </small>
            </span>
          </Link>
          <button
            type="button"
            aria-label="Close menu"
            onClick={onClose}
            className="rounded-md p-1 text-[#8aa6aa] hover:bg-[#0b3038] md:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5">
          <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#61888d]">
            Workspace
          </p>
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-[#123841] text-[#65ddcf]'
                    : 'text-[#9ab1b4] hover:bg-[#0b3038] hover:text-[#f4f8f7]'
                )
              }
            >
              <item.icon className="h-[18px] w-[18px]" strokeWidth={1.7} />
              <span className="flex-1">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-[#173b43] p-3">
          <button
            type="button"
            onClick={() => {
              navigate('/workspace');
              onClose();
            }}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#89a6aa] hover:bg-[#0b3038] hover:text-white"
          >
            <HelpCircle className="h-[18px] w-[18px]" />
            Research guide
          </button>
          <button
            type="button"
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#89a6aa] hover:bg-[#0b3038] hover:text-white"
          >
            <Settings className="h-[18px] w-[18px]" />
            Workspace settings
          </button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="mt-2 flex w-full items-center gap-3 rounded-xl border border-[#20434b] bg-[#082630] p-3 text-left hover:bg-[#0b3038]"
                aria-label="Open account menu"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#123b43] text-xs font-semibold text-[#6de0d2]">
                  {initials(displayName)}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block truncate text-sm font-medium">
                    {displayName}
                  </strong>
                  <small className="block truncate text-[11px] text-[#78979b]">
                    {user?.email}
                  </small>
                </span>
                <ChevronDown className="h-4 w-4 text-[#78979b]" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="w-60 border-[#28515a] bg-[#09222a] text-[#f4f8f7]"
            >
              <DropdownMenuLabel>
                <span className="block truncate">{displayName}</span>
                <small className="block truncate font-normal text-[#86a1a4]">
                  {user?.email}
                </small>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-[#28515a]" />
              <DropdownMenuItem
                onSelect={handleLogout}
                disabled={logout.isPending}
                className="focus:bg-[#123841] focus:text-white"
              >
                <LogOut />
                {logout.isPending ? 'Signing out…' : 'Sign out'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>
    </>
  );
}

function initials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}