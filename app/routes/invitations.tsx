import { WorkspaceManagement } from '~/features/workspaces/workspace-management';
import { generateSEOTags } from '~/lib/utils/seo';

export function meta() {
  return generateSEOTags({
    title: 'Workspace Invitation | SOAIRD App',
    description: 'Review a SOAIRD App workspace invitation.',
    url: '/invitations',
    noIndex: true,
  });
}

export default function InvitationPage() {
  return <WorkspaceManagement invitationOnly />;
}