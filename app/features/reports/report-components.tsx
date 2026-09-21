import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowRight,
  Download,
  FileText,
  Layers3,
  Loader2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { LoadingSkeleton } from '~/components/loading-indicator';
import {
  api,
  type AssessmentReport,
  type ReportOverview,
} from '~/lib/api/soaird-client';
import { toastUtils } from '~/lib/utils/toast';
import { cn } from '~/lib/utils';

type ExportFormat = 'xlsx' | 'csv' | 'json';

export function ReportState({ state }: Readonly<{ state: string }>) {
  return (
    <span className={cn('report-state', state === 'final' && 'is-final')}>
      <span />
      {state === 'final' ? 'Final report' : 'Provisional report'}
    </span>
  );
}

export function DatasetIdentity({
  assessment,
}: Readonly<{ assessment: ReportOverview['assessment'] }>) {
  return (
    <div className="dataset-identity">
      <span>
        <Layers3 size={14} />
        {assessment.modality || 'Modality not specified'}
      </span>
      {assessment.country && <span>{assessment.country}</span>}
      {assessment.domain && <span>{assessment.domain}</span>}
      <span>Framework {assessment.framework_version}</span>
    </div>
  );
}

export function SummaryStat({
  label,
  value,
  unit,
  help,
  pending = false,
}: Readonly<{
  label: string;
  value: number | string | null | undefined;
  unit?: string;
  help?: string;
  pending?: boolean;
}>) {
  return (
    <div className={cn('report-stat', typeof value !== 'number' && 'is-text')}>
      <dt>{label}</dt>
      <dd>
        {pending
          ? '…'
          : typeof value === 'number'
            ? Math.round(value)
            : (value ?? 'Unavailable')}
        {!pending && typeof value === 'number' && unit && <small>{unit}</small>}
      </dd>
      {help && <p>{help}</p>}
    </div>
  );
}

export function ReportSummary({
  report,
  compact = false,
}: Readonly<{ report: ReportOverview; compact?: boolean }>) {
  const s = report.summary;
  return (
    <dl
      className={cn('report-summary', compact && 'is-compact')}
      aria-label="Report summary"
    >
      <SummaryStat
        label="Overall readiness"
        value={s.composite_score ?? 'Withheld'}
        unit="/100"
        help={
          compact
            ? undefined
            : s.composite_score === null
              ? 'See the scoring requirement below'
              : 'Read alongside coverage'
        }
      />
      <SummaryStat
        label="Scoring coverage"
        value={s.scoring_coverage}
        unit="%"
        help={
          compact
            ? undefined
            : `${s.scored_metric_count} of ${s.applicable_metric_count} applicable metrics`
        }
      />
      <SummaryStat
        label="Evidence coverage"
        value={s.evidence_coverage}
        unit="%"
        help={
          compact
            ? undefined
            : s.evidence_coverage == null
              ? 'Not calculated for this run'
              : 'Coverage recorded for this run'
        }
      />
      {!compact && (
        <SummaryStat
          label="Assessment completion"
          value={s.assessment_completion}
          unit="%"
          help={
            s.assessment_completion == null
              ? 'Not calculated for this run'
              : `${s.unresolved_metric_count} unresolved metrics`
          }
        />
      )}
    </dl>
  );
}

export function ScoreExplanation({
  report,
}: Readonly<{ report: ReportOverview }>) {
  if (report.summary.composite_score !== null) return null;
  return (
    <div className="report-notice">
      <AlertCircle size={18} />
      <div>
        <strong>Why is readiness withheld?</strong>
        <p>
          {report.summary.scored_metric_count} of{' '}
          {report.summary.applicable_metric_count} applicable metrics have
          scores ({Math.round(report.summary.scoring_coverage)}%). The framework
          requires at least{' '}
          {Math.round(report.summary.minimum_scoring_coverage)}% scoring
          coverage and a calculated pillar score. Continue reviewing findings
          and supporting evidence in the workbench.
        </p>
      </div>
    </div>
  );
}

export function PillarResults({
  pillars,
}: Readonly<{ pillars: ReportOverview['pillars'] }>) {
  return (
    <div className="pillar-results">
      {pillars.map((pillar) => (
        <div className="pillar-result" key={pillar.pillar_code}>
          <span className="pillar-code">{pillar.pillar_code}</span>
          <div className="pillar-label">
            <strong>{pillar.pillar_name}</strong>
            <span>
              {pillar.effective_score == null
                ? 'No scored metrics available'
                : pillar.scoring_coverage_percentage != null
                  ? `${Math.round(pillar.scoring_coverage_percentage)}% scoring coverage`
                  : 'Available metric scores'}
            </span>
          </div>
          <div
            className="pillar-meter"
            role="img"
            aria-label={`${pillar.pillar_name}: ${pillar.effective_score == null ? 'not scored' : `${Math.round(pillar.effective_score)} out of 100`}`}
          >
            <span
              style={{
                width: `${Math.max(0, Math.min(100, pillar.effective_score ?? 0))}%`,
              }}
            />
          </div>
          <span
            className={cn(
              'pillar-value',
              pillar.effective_score == null && 'is-missing'
            )}
          >
            {pillar.effective_score == null ? (
              'Not scored'
            ) : (
              <>
                {Math.round(pillar.effective_score)}
                <small>/100</small>
              </>
            )}
          </span>
        </div>
      ))}
    </div>
  );
}

export function ExportActions({
  runId,
  cohortQuery,
  filename = 'soaird-report',
  disabled = false,
}: Readonly<{
  runId?: string;
  cohortQuery?: string;
  filename?: string;
  disabled?: boolean;
}>) {
  const [busy, setBusy] = useState<ExportFormat | null>(null);
  const download = async (format: ExportFormat) => {
    setBusy(format);
    try {
      const blob =
        cohortQuery !== undefined
          ? await api.downloadCohortReport(cohortQuery, format)
          : await api.downloadAssessmentReport(runId!, format);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `${filename}.${format}`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      toastUtils.error(
        'Download failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="report-downloads" role="group" aria-label="Download report">
      {(['xlsx', 'csv', 'json'] as const).map((format) => (
        <button
          type="button"
          className="button secondary"
          key={format}
          disabled={disabled || busy !== null}
          onClick={() => void download(format)}
        >
          {busy === format ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <Download size={14} />
          )}
          {format === 'xlsx' ? 'Excel' : format.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function ReportBody({
  report,
  full = false,
}: Readonly<{ report: AssessmentReport | ReportOverview; full?: boolean }>) {
  return (
    <>
      <ReportSummary report={report} />
      <ScoreExplanation report={report} />
      <section className="report-section">
        <div className="report-section-heading">
          <div>
            <p className="eyebrow">Pillar breakdown</p>
            <h3>
              {report.pillars.length === 9
                ? 'Nine readiness pillars'
                : 'Readiness pillars'}
            </h3>
          </div>
          <span>{report.summary.metric_count} metrics</span>
        </div>
        <PillarResults pillars={report.pillars} />
      </section>
      {full && (
        <>
          <section className="report-interpretation-card">
            <FileText size={20} />
            <div>
              <h3>What these results mean</h3>
              <p>{report.insights.overview}</p>
            </div>
          </section>
          <div className="report-insight-grid">
            {[
              {
                title: 'Strongest assessed areas',
                items: report.insights.strengths,
              },
              { title: 'Priority gaps', items: report.insights.priority_gaps },
            ].map((section) => (
              <section key={section.title} className="report-insight-card">
                <h3>{section.title}</h3>
                {section.items.length ? (
                  section.items.map((item) => (
                    <p key={item.pillar_code}>
                      <span>{item.pillar_name}</span>
                      <strong>
                        {Math.round(item.score)}
                        <small>/100</small>
                      </strong>
                    </p>
                  ))
                ) : (
                  <p>No scored findings available for this section.</p>
                )}
              </section>
            ))}
          </div>
          {'metrics' in report && (
            <details className="report-metric-details">
              <summary>
                Explore all {report.metrics.length} metric findings
              </summary>
              <div className="report-table-scroll">
                <table className="report-table">
                  <thead>
                    <tr>
                      <th>Metric</th>
                      <th>Finding</th>
                      <th>Score</th>
                      <th>Confidence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.metrics.map((metric) => (
                      <tr key={metric.metric_code}>
                        <td>
                          <strong>{metric.metric_code}</strong>
                          <span>{metric.metric_name}</span>
                          {metric.explanation && (
                            <details>
                              <summary>Explanation</summary>
                              <p>{metric.explanation}</p>
                              {metric.recommendations?.map((item, index) => (
                                <p key={index}>{item}</p>
                              ))}
                            </details>
                          )}
                        </td>
                        <td>
                          {(
                            metric.accepted_finding || metric.status
                          ).replaceAll('_', ' ')}
                        </td>
                        <td>
                          {metric.effective_score === null
                            ? 'Not scored'
                            : `${Math.round(metric.effective_score)}/100`}
                        </td>
                        <td>
                          {metric.confidence.replaceAll('_', ' ') ||
                            'Unavailable'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          )}
        </>
      )}
    </>
  );
}

export function DatasetReportDialog({
  runId,
  onClose,
}: Readonly<{ runId: string | null; onClose: () => void }>) {
  const query = useQuery({
    queryKey: ['assessment-report', runId],
    queryFn: () => api.assessmentReport(runId!),
    enabled: Boolean(runId),
  });
  const report = query.data;
  return (
    <Dialog open={Boolean(runId)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="report-dialog">
        <DialogHeader className="report-dialog-header" sticky={false}>
          <p className="eyebrow">Dataset report</p>
          <DialogTitle>
            {report?.assessment.dataset_name || 'Loading dataset report…'}
          </DialogTitle>
          <DialogDescription>
            {report
              ? `${report.assessment.assessment_code} · ${report.assessment.dataset_code}`
              : 'Readiness, coverage and supporting findings.'}
          </DialogDescription>
          {report && (
            <>
              <DatasetIdentity assessment={report.assessment} />
              <ReportState state={report.report_state} />
            </>
          )}
        </DialogHeader>
        <div className="report-dialog-body">
          {query.isPending && (
            <LoadingSkeleton label="Loading dataset report" rows={4} />
          )}
          {query.isError && (
            <div role="alert" className="report-notice">
              <p>{query.error.message}</p>
              <button
                className="button secondary"
                onClick={() => void query.refetch()}
              >
                Try again
              </button>
            </div>
          )}
          {report && <ReportBody report={report} full />}
        </div>
        {report && (
          <footer className="report-dialog-footer">
            <span>Download this {report.report_state} report</span>
            <ExportActions
              runId={report.assessment.run_id}
              filename={`${report.assessment.assessment_code}-report`}
            />
          </footer>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function ReportCard({
  report,
  onOpen,
}: Readonly<{ report: ReportOverview; onOpen: () => void }>) {
  return (
    <article className="dataset-insight-card">
      <div className="report-card-heading">
        <span className="report-file-icon">
          <FileText size={20} />
        </span>
        <ReportState state={report.report_state} />
      </div>
      <p className="record-code">{report.assessment.dataset_code}</p>
      <h3>{report.assessment.dataset_name}</h3>
      <DatasetIdentity assessment={report.assessment} />
      <ReportSummary report={report} compact />
      <p className="report-card-note">
        {report.summary.composite_score === null
          ? `Overall score needs at least ${Math.round(report.summary.minimum_scoring_coverage)}% scoring coverage.`
          : `${report.summary.unresolved_metric_count} unresolved metrics · Review coverage alongside readiness.`}
      </p>
      <div className="report-card-actions">
        <button type="button" className="button primary" onClick={onOpen}>
          View report <ArrowRight size={15} />
        </button>
        <ExportActions
          runId={report.assessment.run_id}
          filename={`${report.assessment.assessment_code}-report`}
        />
      </div>
    </article>
  );
}
