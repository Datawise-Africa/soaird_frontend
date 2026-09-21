import { ArrowRight, CircleGauge } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { LoadingSkeleton } from '~/components/loading-indicator';
import {
  DatasetIdentity,
  ExportActions,
  ReportBody,
  ReportState,
} from '~/features/reports/report-components';
import type {
  Assessment,
  AssessmentReport,
  Dataset,
} from '~/lib/api/soaird-client';

export function AssessmentPreviewDialog({
  assessment,
  dataset,
  run,
  report,
  loading,
  error,
  busy,
  onClose,
  onRetry,
  onStart,
  onWorkbench,
}: Readonly<{
  assessment: Assessment | null;
  dataset?: Dataset;
  run?: { id: string; status: string; current: number; total: number };
  report: AssessmentReport | null;
  loading: boolean;
  error?: string;
  busy: boolean;
  onClose: () => void;
  onRetry: () => void;
  onStart: () => void;
  onWorkbench: () => void;
}>) {
  const running = run?.status === 'queued' || run?.status === 'running';
  return (
    <Dialog
      open={Boolean(assessment)}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="report-dialog assessment-preview-dialog">
        <DialogHeader className="report-dialog-header" sticky={false}>
          <p className="eyebrow">Assessment overview</p>
          <DialogTitle>
            {dataset?.name ||
              report?.assessment.dataset_name ||
              assessment?.dataset_code}
          </DialogTitle>
          <DialogDescription>
            {assessment?.assessment_code} · {assessment?.dataset_code}
          </DialogDescription>
          {report ? (
            <DatasetIdentity assessment={report.assessment} />
          ) : (
            <div className="dataset-identity">
              <span>{dataset?.modality || 'Modality not specified'}</span>
              {dataset?.country && <span>{dataset.country}</span>}
            </div>
          )}
          {report && <ReportState state={report.report_state} />}
        </DialogHeader>
        <div className="report-dialog-body">
          {loading ? (
            <LoadingSkeleton label="Loading assessment report" rows={4} />
          ) : error ? (
            <div className="report-notice" role="alert">
              <div>
                <strong>Report could not be loaded</strong>
                <p>{error}</p>
                <button className="button secondary" onClick={onRetry}>
                  Try again
                </button>
              </div>
            </div>
          ) : report ? (
            <ReportBody report={report} />
          ) : (
            <div className="report-empty">
              <CircleGauge size={32} />
              <h3>
                {run?.status === 'failed'
                  ? 'Applicability check failed'
                  : running
                    ? 'Checking applicable metrics'
                    : run?.status === 'completed'
                      ? 'Your workbench is ready'
                      : 'Start with applicable metrics'}
              </h3>
              <p>
                {running
                  ? 'You can close this window while the check runs. Progress will update automatically.'
                  : run?.status === 'failed'
                    ? 'Try the applicability check again. Your assessment record is saved.'
                    : 'Identify the relevant framework metrics, then add sources and review findings in the workbench.'}
              </p>
              {running && (
                <progress
                  max={run?.total || 100}
                  value={run?.current || 0}
                  aria-label="Applicability progress"
                />
              )}
            </div>
          )}
        </div>
        <footer className="report-dialog-footer">
          <div>
            {report ? (
              <ExportActions
                runId={run!.id}
                filename={`${assessment?.assessment_code}-report`}
              />
            ) : (
              <span>Progress is saved to this assessment.</span>
            )}
          </div>
          {run?.status === 'completed' ? (
            <button className="button primary" onClick={onWorkbench}>
              Open assessment workbench <ArrowRight size={16} />
            </button>
          ) : (
            <button
              className="button primary"
              onClick={onStart}
              disabled={busy || running}
            >
              {busy
                ? 'Starting…'
                : running
                  ? 'Check in progress…'
                  : run?.status === 'failed'
                    ? 'Retry applicability check'
                    : 'Run applicability check'}
            </button>
          )}
        </footer>
      </DialogContent>
    </Dialog>
  );
}
