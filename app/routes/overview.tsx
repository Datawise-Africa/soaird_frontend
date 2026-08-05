import { OverviewDashboard } from '~/features/research/overview';
import { generateSEOTags } from '~/lib/utils/seo';

export function meta() {
  return generateSEOTags({
    title: 'Overview | SOAIRD App',
    description:
      'Track AI-ready datasets, assessments, reviews and evidence coverage across Africa.',
    url: '/overview',
    noIndex: true,
  });
}

export default function OverviewPage() {
  return <OverviewDashboard />;
}