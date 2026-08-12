import {
  AlertCircle,
  ArrowRight,
  BookOpenCheck,
  CircleGauge,
  Database,
  Sparkles,
  Users,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router';
import { api } from '~/lib/api/soaird-client';
import { useAuth } from '~/lib/auth/use-auth';
import { useWorkspace } from '~/features/workspaces/workspace-context';
import { CardGridSkeleton } from '~/components/loading-indicator';

type DashboardSummary = {
  datasets: number;
  assessments: number;
  reviewAssignments: number;
  completedAssessments: number;
  assessmentCompletion: number | null;
  evidenceCoverage: number | null;
};

const emptySummary: DashboardSummary = {
  datasets: 0,
  assessments: 0,
  reviewAssignments: 0,
  completedAssessments: 0,
  assessmentCompletion: null,
  evidenceCoverage: null,
};

function StatCard({
  icon: Icon,
  value,
  label,
  detail,
}: Readonly<{
  icon: typeof Database;
  value: string;
  label: string;
  detail: string;
}>) {
  return (
    <article className="stat-card">
      <div className="stat-icon">
        <Icon size={21} />
      </div>
      <div>
        <strong>{value}</strong>
        <span>{label}</span>
      </div>
      <small>{detail}</small>
    </article>
  );
}

function percentage(value: number | null): string {
  return value === null ? '—' : `${Math.round(value)}%`;
}

export function OverviewDashboard() {
  const { user } = useAuth();
  const { scopeQuery } = useWorkspace();
  const firstName = user?.first_name || 'Researcher';
  const scope = scopeQuery();
  const summaryQuery = useQuery({
    queryKey: ['overview-summary', scope],
    queryFn: async () => {
      const [datasets, assessments, assignments, analytics] = await Promise.all(
        [
          api.datasets(scopeQuery('page_size=1')),
          api.assessments(scopeQuery('page_size=1')),
          api.reviewAssignments('page_size=1&status=active'),
          api.cohortAnalytics('domain', scope),
        ]
      );
      return {
        datasets: datasets.count,
        assessments: assessments.count,
        reviewAssignments: assignments.count,
        completedAssessments: analytics.population.completed_assessments,
        assessmentCompletion: analytics.population.assessment_completion.median,
        evidenceCoverage: analytics.population.evidence_coverage.median,
      } satisfies DashboardSummary;
    },
  });
  const summary = summaryQuery.data ?? emptySummary;
  const loading = summaryQuery.isPending;
  const error = summaryQuery.error?.message ?? '';

  const display = (value: number) => (loading ? '…' : String(value));

  return (
    <>
      <section className="hero-panel">
        <div className="hero-copy">
          <p className="eyebrow">
            <Sparkles size={14} />
            Welcome back, {firstName}
          </p>
          <h1>
            Turn dataset evidence
            <br /> into trusted decisions.
          </h1>
          <p className="hero-description">
            Assess whether African datasets are genuinely ready for responsible
            AI—then document, review and share the evidence behind every score.
          </p>
          <div className="hero-actions">
            <Link className="button primary" to="/assessments">
              Start an assessment <ArrowRight size={17} />
            </Link>
            <Link className="button secondary" to="/datasets">
              Register a dataset <Database size={17} />
            </Link>
          </div>
        </div>
        <div className="map-visual" aria-hidden="true">
          <div className="map-orbit orbit-one" />
          <div className="map-orbit orbit-two" />
          <div className="africa-shape">AFRICA</div>
          <div className="map-caption">
            <CircleGauge size={14} />
            Evidence-led research
          </div>
        </div>
      </section>

      {error ? (
        <div className="inline-error">
          <AlertCircle size={15} /> Dashboard data could not be loaded: {error}
        </div>
      ) : null}

      {loading ? (
        <CardGridSkeleton cards={4} label="Loading research summary" />
      ) : (
        <section className="stats-grid" aria-label="Research summary">
          <StatCard
            icon={Database}
            value={display(summary.datasets)}
            label="Registered datasets"
            detail="Records currently accessible to you"
          />
          <StatCard
            icon={BookOpenCheck}
            value={display(summary.assessments)}
            label="Assessments"
            detail={`${display(summary.completedAssessments)} completed`}
          />
          <StatCard
            icon={Users}
            value={display(summary.reviewAssignments)}
            label="Review assignments"
            detail="Assignments currently accessible to you"
          />
          <StatCard
            icon={CircleGauge}
            value={loading ? '…' : percentage(summary.assessmentCompletion)}
            label="Median completion"
            detail={`Evidence coverage: ${
              loading ? '…' : percentage(summary.evidenceCoverage)
            }`}
          />
        </section>
      )}

      <section className="dashboard-grid">
        <article className="panel readiness-panel">
          <div className="panel-heading">
            <div>
              <p className="overline">Your research workflow</p>
              <h2>Build evidence in a clear sequence</h2>
            </div>
          </div>
          <div className="pillar-list">
            {[
              ['1', 'Register a dataset', 'Capture ownership and provenance'],
              ['2', 'Create an assessment', 'Define context and applicability'],
              ['3', 'Run and review', 'Evaluate evidence across the framework'],
              [
                '4',
                'Report findings',
                'Share transparent, versioned conclusions',
              ],
            ].map(([number, title, detail]) => (
              <Link className="pillar-row" to="/datasets" key={number}>
                <span className="pillar-number">{number}</span>
                <span className="pillar-name">
                  {title}
                  <small>{detail}</small>
                </span>
                <ArrowRight size={15} />
              </Link>
            ))}
          </div>
        </article>

        <article className="panel activity-panel">
          <div className="panel-heading">
            <div>
              <p className="overline">Current data</p>
              <h2>Research status</h2>
            </div>
            <Link to="/reports">Open analytics</Link>
          </div>
          <div className="activity-list">
            {summary.datasets === 0 && !loading ? (
              <p className="assessment-empty-state">
                No datasets are available yet. Register your first dataset to
                begin an assessment.
              </p>
            ) : (
              <>
                <Link to="/datasets">
                  <span className="activity-copy">
                    <strong>{display(summary.datasets)} datasets</strong>
                    <small>available in the registry</small>
                  </span>
                </Link>
                <Link to="/assessments">
                  <span className="activity-copy">
                    <strong>{display(summary.assessments)} assessments</strong>
                    <small>available in your research scope</small>
                  </span>
                </Link>
              </>
            )}
          </div>
        </article>
      </section>
    </>
  );
}