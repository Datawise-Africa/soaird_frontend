import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useQuery } from '@tanstack/react-query';
import { api, type Workspace } from '~/lib/api/soaird-client';

const PERSONAL_WORKSPACE_ID = 'personal';
const STORAGE_KEY = 'soaird:active-workspace';

type ActiveWorkspace =
  | { id: typeof PERSONAL_WORKSPACE_ID; name: 'Personal workspace'; personal: true }
  | (Workspace & { personal: false });

type WorkspaceContextValue = {
  activeWorkspace: ActiveWorkspace;
  workspaces: Workspace[];
  isLoading: boolean;
  setActiveWorkspaceId: (id: string) => void;
  scopeQuery: (query?: string) => string;
  refreshWorkspaces: () => Promise<unknown>;
};

const WorkspaceContext = createContext<WorkspaceContextValue | null>(null);

export function WorkspaceProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [activeId, setActiveId] = useState(PERSONAL_WORKSPACE_ID);
  const workspacesQuery = useQuery({
    queryKey: ['workspaces'],
    queryFn: () => api.workspaces('page_size=100'),
  });
  const workspaces = useMemo(
    () => workspacesQuery.data?.results ?? [],
    [workspacesQuery.data]
  );

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setActiveId(saved);
  }, []);

  useEffect(() => {
    if (
      activeId !== PERSONAL_WORKSPACE_ID &&
      !workspacesQuery.isLoading &&
      !workspaces.some((workspace) => workspace.id === activeId)
    ) {
      setActiveId(PERSONAL_WORKSPACE_ID);
      window.localStorage.setItem(STORAGE_KEY, PERSONAL_WORKSPACE_ID);
    }
  }, [activeId, workspaces, workspacesQuery.isLoading]);

  const activeWorkspace = useMemo<ActiveWorkspace>(() => {
    const workspace = workspaces.find((item) => item.id === activeId);
    return workspace
      ? { ...workspace, personal: false }
      : { id: PERSONAL_WORKSPACE_ID, name: 'Personal workspace', personal: true };
  }, [activeId, workspaces]);

  const setActiveWorkspaceId = useCallback((id: string) => {
    setActiveId(id);
    window.localStorage.setItem(STORAGE_KEY, id);
  }, []);

  const scopeQuery = useCallback(
    (query = '') => {
      const params = new URLSearchParams(query);
      if (activeWorkspace.personal) params.set('personal', 'true');
      else params.set('organization', activeWorkspace.id);
      return params.toString();
    },
    [activeWorkspace]
  );

  const value = useMemo(
    () => ({
      activeWorkspace,
      workspaces,
      isLoading: workspacesQuery.isLoading,
      setActiveWorkspaceId,
      scopeQuery,
      refreshWorkspaces: workspacesQuery.refetch,
    }),
    [
      activeWorkspace,
      scopeQuery,
      setActiveWorkspaceId,
      workspaces,
      workspacesQuery.isLoading,
      workspacesQuery.refetch,
    ]
  );

  return (
    <WorkspaceContext.Provider value={value}>
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) {
    throw new Error('useWorkspace must be used within WorkspaceProvider');
  }
  return value;
}