import WorkspaceView from '~/features/research/workspace-view';
import { generateSEOTags } from '~/lib/utils/seo';

export function meta() {
  return generateSEOTags({
    title: 'Datasets | SOAIRD App',
    description:
      'Search and examine the shared registry of African datasets and their AI-readiness status.',
    url: '/datasets',
    noIndex: true,
  });
}

export default function DatasetsPage() {
  return <WorkspaceView view="datasets" />;
}