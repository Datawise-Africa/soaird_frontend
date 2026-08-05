import { WorkspaceManagement } from '~/features/workspaces/workspace-management';
import { generateSEOTags } from '~/lib/utils/seo';

export function meta() {
  return generateSEOTags({
    title: 'Workspace Settings | SOAIRD App',
    description: 'Manage SOAIRD App workspace members and invitations.',
    url: '/workspace',
    noIndex: true,
  });
}

export default function WorkspacePage() {
  return <WorkspaceManagement />;
}