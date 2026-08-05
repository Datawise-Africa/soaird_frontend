import WorkspaceView from '~/features/research/workspace-view';
import { generateSEOTags } from '~/lib/utils/seo';

export function meta() {
  return generateSEOTags({
    title: 'Review Workspace | SOAIRD App',
    description:
      'Review assessment evidence independently and preserve transparent research decisions.',
    url: '/reviews',
    noIndex: true,
  });
}

export default function ReviewsPage() {
  return <WorkspaceView view="reviews" />;
}