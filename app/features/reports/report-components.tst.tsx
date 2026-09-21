import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { api, type AssessmentReport } from '~/lib/api/soaird-client';
import { toastUtils } from '~/lib/utils/toast';
import {
  DatasetReportDialog,
  ExportActions,
  ReportSummary,
} from './report-components';

vi.mock('~/lib/utils/toast', () => ({ toastUtils: { error: vi.fn() } }));
const report = {
  report_state: 'provisional',
  assessment: {
    run_id: 'r1',
    dataset_name: 'Rainfall series',
    dataset_code: 'D1',
    assessment_code: 'A1',
    modality: 'Time series',
    framework_version: '1.0',
  },
  summary: {
    composite_score: null,
    evidence_coverage: null,
    assessment_completion: null,
    scoring_coverage: 49,
    minimum_scoring_coverage: 80,
    scored_metric_count: 33,
    applicable_metric_count: 68,
    unresolved_metric_count: 35,
    metric_count: 68,
  },
  pillars: [
    {
      pillar_code: 'P1',
      pillar_name: 'Technical quality',
      effective_score: 57,
      scoring_coverage_percentage: 60,
    },
  ],
  insights: {
    overview: 'Continue assessment.',
    strengths: [],
    priority_gaps: [],
  },
  metrics: [],
} as unknown as AssessmentReport;

it('distinguishes withheld and missing results from a measured zero', () => {
  const { rerender } = render(<ReportSummary report={report} />);
  expect(screen.getByText('Withheld')).toBeInTheDocument();
  expect(screen.getAllByText('Unavailable')).toHaveLength(2);
  expect(screen.queryByText('0')).not.toBeInTheDocument();
  rerender(
    <ReportSummary
      report={{
        ...report,
        summary: { ...report.summary, evidence_coverage: 0 },
      }}
    />
  );
  expect(screen.getByText('0')).toBeInTheDocument();
});

it('opens the selected dataset report with its identity and handles Escape', async () => {
  vi.spyOn(api, 'assessmentReport').mockResolvedValue(report);
  const close = vi.fn();
  const user = userEvent.setup();
  render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <DatasetReportDialog runId="r1" onClose={close} />
    </QueryClientProvider>
  );
  expect(
    await screen.findByRole('heading', { name: 'Rainfall series' })
  ).toBeInTheDocument();
  expect(screen.getByText('Time series')).toBeInTheDocument();
  expect(screen.getByText('Why is readiness withheld?')).toBeInTheDocument();
  await user.keyboard('{Escape}');
  expect(close).toHaveBeenCalled();
});

it('reports download errors without an unhandled promise rejection', async () => {
  vi.spyOn(api, 'downloadCohortReport').mockRejectedValue(
    new Error('Download unavailable')
  );
  render(<ExportActions cohortQuery="country=Kenya" />);
  await userEvent.click(screen.getByRole('button', { name: 'Excel' }));
  await waitFor(() =>
    expect(toastUtils.error).toHaveBeenCalledWith(
      'Download failed',
      'Download unavailable'
    )
  );
  expect(api.downloadCohortReport).toHaveBeenCalledWith(
    'country=Kenya',
    'xlsx'
  );
  expect(screen.getByRole('button', { name: 'Excel' })).not.toBeDisabled();
});
