import WorkspaceView from '~/features/research/workspace-view';
import { generateSEOTags } from '~/lib/utils/seo';

export function meta() {
  return generateSEOTags({
    title: 'Assessments | SOAIRD App',
    description:
      'Run transparent nine-pillar AI-readiness assessments with evidence and progress tracking.',
    url: '/assessments',
    noIndex: true,
  });
}

export default function AssessmentsPage() {
  return <WorkspaceView view="assessments" />;
}