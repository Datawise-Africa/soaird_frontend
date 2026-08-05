import WorkspaceView from '~/features/research/workspace-view';
import { generateSEOTags } from '~/lib/utils/seo';

export function meta() {
  return generateSEOTags({
    title: 'Governance | SOAIRD App',
    description:
      'Manage framework evolution, independent proposals and the research audit trail.',
    url: '/governance',
    noIndex: true,
  });
}

export default function GovernancePage() {
  return <WorkspaceView view="governance" />;
}