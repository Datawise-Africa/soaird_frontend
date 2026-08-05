import WorkspaceView from '~/features/research/workspace-view';
import { generateSEOTags } from '~/lib/utils/seo';

export function meta() {
  return generateSEOTags({
    title: 'Reports & Insights | SOAIRD App',
    description:
      'Compare AI-readiness cohorts, research coverage and assessment outcomes responsibly.',
    url: '/reports',
    noIndex: true,
  });
}

export default function ReportsPage() {
  return <WorkspaceView view="reports" />;
}