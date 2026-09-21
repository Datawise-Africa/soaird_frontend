import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Check,
  FileText,
  Filter,
  Layers3,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Form } from '~/components/ui/form';
import { FormSelectField, FormTextField } from '~/components/form-fields';
import { LoadingSkeleton } from '~/components/loading-indicator';
import { useWorkspace } from '~/features/workspaces/workspace-context';
import { api, type CohortReport } from '~/lib/api/soaird-client';
import {
  cohortFiltersResolver,
  EMPTY_COHORT_FILTERS,
  type CohortFilters,
} from '~/lib/schema/report.schema';
import { cn } from '~/lib/utils';
import {
  DatasetReportDialog,
  ExportActions,
  ReportCard,
  ReportState,
  SummaryStat,
} from './report-components';

export default function ReportsPage() {
  const { activeWorkspace } = useWorkspace();
  return <ReportsWorkspace key={activeWorkspace.id} />;
}

function ReportsWorkspace() {
  const [view, setView] = useState<'datasets' | 'cohort'>('datasets');
  const [runId, setRunId] = useState<string | null>(null);
  return (
    <div className="research-reports">
      <div className="section-header">
        <div>
          <p className="eyebrow">Research & evidence</p>
          <h1>Reports that put results in context</h1>
          <p>
            Explore a dataset in depth, or build a cohort to compare readiness
            and identify shared gaps.
          </p>
        </div>
        <span className="report-page-icon">
          <BarChart3 size={26} />
        </span>
      </div>
      <div className="report-view-switch" role="group" aria-label="Report type">
        <button
          className={cn(view === 'datasets' && 'active')}
          aria-pressed={view === 'datasets'}
          onClick={() => setView('datasets')}
        >
          <FileText size={17} />
          Dataset reports
        </button>
        <button
          className={cn(view === 'cohort' && 'active')}
          aria-pressed={view === 'cohort'}
          onClick={() => setView('cohort')}
        >
          <Layers3 size={17} />
          Cohort reports
        </button>
      </div>
      {view === 'datasets' ? (
        <DatasetReports onOpen={setRunId} />
      ) : (
        <CohortReports onOpen={setRunId} />
      )}
      <DatasetReportDialog runId={runId} onClose={() => setRunId(null)} />
    </div>
  );
}

function DatasetReports({
  onOpen,
}: Readonly<{ onOpen: (runId: string) => void }>) {
  const { scopeQuery } = useWorkspace();
  const [search, setSearch] = useState('');
  const [term, setTerm] = useState('');
  const [page, setPage] = useState(1);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTerm(search.trim());
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search]);
  const params = new URLSearchParams({ page: String(page), page_size: '12' });
  if (term) params.set('search', term);
  const queryString = scopeQuery(params.toString());
  const query = useQuery({
    queryKey: ['dataset-reports', queryString],
    queryFn: () => api.datasetReports(queryString),
  });
  return (
    <section aria-label="Dataset reports">
      <div className="report-list-heading">
        <div>
          <h2>Single-dataset reports</h2>
          <p>
            Latest run per dataset. Provisional results stay clearly labelled.
          </p>
        </div>
        <label className="report-search">
          <Search size={16} />
          <span className="sr-only">Search dataset reports</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Find a dataset…"
          />
        </label>
      </div>
      {query.isPending ? (
        <LoadingSkeleton label="Loading dataset reports" rows={4} />
      ) : query.isError ? (
        <QueryError
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : (
        <>
          <p className="report-result-count" role="status">
            {query.data.count} dataset reports{term && ` matching “${term}”`}
          </p>
          {query.data.results.length ? (
            <div className="dataset-report-grid">
              {query.data.results.map((report) => (
                <ReportCard
                  key={report.assessment.run_id}
                  report={report}
                  onOpen={() => onOpen(report.assessment.run_id)}
                />
              ))}
            </div>
          ) : (
            <div className="report-empty">
              <FileText size={30} />
              <h3>
                {term ? 'No matching reports' : 'Your reports will appear here'}
              </h3>
              <p>
                {term
                  ? 'Try another dataset name or code.'
                  : 'Run an assessment’s applicability check, then add evidence and review findings in the workbench.'}
              </p>
            </div>
          )}
          {query.data.count > 12 && (
            <div className="report-pagination">
              <button
                className="button secondary"
                disabled={!query.data.previous}
                onClick={() => setPage(page - 1)}
              >
                <ArrowLeft size={14} />
                Previous
              </button>
              <span>
                Page {page} of {Math.ceil(query.data.count / 12)}
              </span>
              <button
                className="button secondary"
                disabled={!query.data.next}
                onClick={() => setPage(page + 1)}
              >
                Next
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function QueryError({
  message,
  onRetry,
}: Readonly<{ message: string; onRetry: () => void }>) {
  return (
    <div className="report-notice" role="alert">
      <div>
        <strong>We couldn’t load these results</strong>
        <p>{message}</p>
        <button className="button secondary" onClick={onRetry}>
          Try again
        </button>
      </div>
    </div>
  );
}

function CohortReports({
  onOpen,
}: Readonly<{ onOpen: (runId: string) => void }>) {
  const { scopeQuery, activeWorkspace } = useWorkspace();
  const form = useForm<CohortFilters>({
    resolver: cohortFiltersResolver,
    defaultValues: EMPTY_COHORT_FILTERS,
  });
  const [applied, setApplied] = useState(EMPTY_COHORT_FILTERS);
  const [selection, setSelection] = useState<string[]>([]);
  const [cohortCodes, setCohortCodes] = useState<string[]>([]);
  const params = new URLSearchParams(
    Object.entries(applied).filter(([, value]) => value !== '')
  );
  if (cohortCodes.length) params.set('dataset_codes', cohortCodes.join(','));
  const queryString = scopeQuery(params.toString());
  const query = useQuery({
    queryKey: ['cohort-report', queryString],
    queryFn: () => api.cohortReport(queryString),
  });
  const report = query.data;
  const reset = () => {
    form.reset(EMPTY_COHORT_FILTERS);
    setApplied(EMPTY_COHORT_FILTERS);
    setCohortCodes([]);
    setSelection([]);
  };
  return (
    <section className="cohort-workspace" aria-label="Cohort reports">
      <div className="cohort-builder">
        <div className="report-section-heading">
          <div>
            <p className="eyebrow">01 / Define your cohort</p>
            <h2>Choose the datasets you want to study</h2>
          </div>
          <SlidersHorizontal size={21} />
        </div>
        <p className="cohort-builder-intro">
          Results are scoped to <strong>{activeWorkspace.name}</strong>. Leave a
          field blank to include all values. Filters match registry metadata,
          ignoring letter case.
        </p>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((values) => {
              setApplied(values);
              setCohortCodes([]);
              setSelection([]);
              form.reset(values);
            })}
          >
            <div className="cohort-filter-grid">
              <FormTextField
                control={form.control}
                name="country"
                label="Country"
                placeholder="e.g. Kenya"
              />
              <FormTextField
                control={form.control}
                name="region"
                label="Region"
                placeholder="e.g. East Africa"
              />
              <FormTextField
                control={form.control}
                name="domain"
                label="Domain"
                placeholder="e.g. Health"
              />
              <FormTextField
                control={form.control}
                name="modality"
                label="Modality"
                placeholder="e.g. Tabular"
              />
              <FormTextField
                control={form.control}
                name="framework_version"
                label="Framework version"
                placeholder="e.g. 1.0"
              />
              <FormSelectField
                control={form.control}
                name="group_by"
                label="Compare by"
                options={['domain', 'country', 'region', 'modality'].map(
                  (value) => ({
                    value,
                    label: value[0].toUpperCase() + value.slice(1),
                  })
                )}
              />
              <FormTextField
                control={form.control}
                name="completed_from"
                label="Run completed from"
                type="date"
              />
              <FormTextField
                control={form.control}
                name="completed_to"
                label="Run completed to"
                type="date"
              />
            </div>
            <div className="cohort-filter-footer">
              <FormSelectField
                control={form.control}
                name="include_provisional"
                label="Assessment scope"
                options={[
                  { value: 'false', label: 'Final assessments only' },
                  { value: 'true', label: 'Include provisional assessments' },
                ]}
              />
              <div>
                <button
                  type="button"
                  className="button secondary"
                  onClick={reset}
                >
                  Reset
                </button>
                <button className="button primary" type="submit">
                  <Filter size={15} />
                  Apply filters
                </button>
              </div>
            </div>
            {form.formState.isDirty && (
              <p className="report-draft-note" role="status">
                Filter changes are not applied yet. Apply filters to update the
                report and downloads.
              </p>
            )}
          </form>
        </Form>
      </div>
      <div className="cohort-results-heading">
        <div>
          <p className="eyebrow">02 / Explore & export</p>
          <h2>
            {cohortCodes.length ? 'Your selected cohort' : 'Cohort report'}
          </h2>
          <p>
            {applied.include_provisional === 'true'
              ? 'Final and provisional assessments'
              : 'Final assessments only'}{' '}
            · One latest run per dataset
          </p>
        </div>
        <ExportActions
          cohortQuery={queryString}
          filename="soaird-cohort-report"
          disabled={
            !report || !report.population.dataset_count || query.isFetching
          }
        />
      </div>
      {cohortCodes.length > 0 && (
        <div className="cohort-selection-note">
          <span>
            <Check size={15} /> {cohortCodes.length} datasets selected
          </span>
          <button
            className="button secondary"
            onClick={() => {
              setCohortCodes([]);
              setSelection([]);
            }}
          >
            Return to all matches
          </button>
        </div>
      )}
      {query.isPending ? (
        <LoadingSkeleton label="Building cohort report" rows={5} />
      ) : query.isError ? (
        <QueryError
          message={query.error.message}
          onRetry={() => void query.refetch()}
        />
      ) : (
        report && (
          <CohortResults
            report={report}
            onOpen={onOpen}
            selection={selection}
            setSelection={setSelection}
            onUseSelection={() => {
              setCohortCodes(selection);
              setSelection([]);
            }}
          />
        )
      )}
    </section>
  );
}

function CohortResults({
  report,
  onOpen,
  selection,
  setSelection,
  onUseSelection,
}: Readonly<{
  report: CohortReport;
  onOpen: (id: string) => void;
  selection: string[];
  setSelection: (codes: string[]) => void;
  onUseSelection: () => void;
}>) {
  const p = report.population;
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [report]);
  const pageRows = report.datasets.slice((page - 1) * 20, page * 20);
  const toggle = (code: string) =>
    setSelection(
      selection.includes(code)
        ? selection.filter((item) => item !== code)
        : [...selection, code]
    );
  return (
    <>
      <dl className="report-summary cohort-summary">
        <SummaryStat
          label="Datasets in cohort"
          value={p.dataset_count}
          help={`${p.final_count} final · ${p.provisional_count} provisional`}
        />
        <SummaryStat
          label="Median readiness"
          value={p.readiness.median ?? 'Withheld'}
          unit="/100"
          help={`${p.publishable_count} publishable · ${p.withheld_count} withheld`}
        />
        <SummaryStat
          label="Median evidence coverage"
          value={p.evidence_coverage.median ?? 'Withheld'}
          unit="%"
          help={`${p.evidence_coverage.count} datasets with coverage values`}
        />
        <SummaryStat
          label="Median scoring coverage"
          value={p.scoring_coverage.median ?? 'Withheld'}
          unit="%"
          help={`${p.scoring_coverage.count} contributing datasets`}
        />
      </dl>
      <section className="cohort-observations">
        <h3>What this cohort tells you</h3>
        <ul>
          {report.insights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      {p.dataset_count > 0 && (
        <>
          <div className="cohort-charts">
            <section className="report-chart-card">
              <div className="report-section-heading">
                <div>
                  <p className="eyebrow">Group comparison</p>
                  <h3>Median readiness by {report.group_by}</h3>
                </div>
              </div>
              <div className="cohort-group-list">
                {report.groups.map((group) => (
                  <div key={group.label}>
                    <div>
                      <strong>{group.label}</strong>
                      <span>
                        {group.dataset_count} datasets ·{' '}
                        {group.statistics.count} with scores
                      </span>
                    </div>
                    <div className="cohort-group-meter">
                      <div>
                        <span
                          style={{ width: `${group.statistics.median ?? 0}%` }}
                        />
                      </div>
                      <strong>
                        {group.statistics.median === null
                          ? 'Withheld'
                          : `${Math.round(group.statistics.median)}/100`}
                      </strong>
                    </div>
                  </div>
                ))}
              </div>
              <p className="report-chart-note">
                At least {report.minimum_cohort_size} scored datasets are
                required per group.
              </p>
            </section>
            <section className="report-chart-card">
              <div className="report-section-heading">
                <div>
                  <p className="eyebrow">Pillar comparison</p>
                  <h3>Where the shared gaps are</h3>
                </div>
              </div>
              <div className="cohort-pillar-list">
                {report.pillars.map((pillar) => (
                  <div key={pillar.pillar_code}>
                    <span className="pillar-code">{pillar.pillar_code}</span>
                    <div>
                      <strong>{pillar.pillar_name}</strong>
                      <small>{pillar.statistics.count} scored datasets</small>
                    </div>
                    <span>
                      {pillar.statistics.median === null
                        ? 'Withheld'
                        : `${Math.round(pillar.statistics.median)}/100`}
                    </span>
                  </div>
                ))}
              </div>
              <p className="report-chart-note">
                Medians use each pillar’s available scores; contributors can
                differ by pillar.
              </p>
            </section>
          </div>
          {report.readiness_distribution && (
            <section className="cohort-distribution">
              <div>
                <h3>Readiness distribution</h3>
                <p>Datasets with publishable composite scores</p>
              </div>
              <div className="cohort-distribution-values">
                {Object.entries(report.readiness_distribution).map(
                  ([label, count]) => (
                    <div key={label}>
                      <strong>{count}</strong>
                      <span>{label.replaceAll('_', ' ')}</span>
                    </div>
                  )
                )}
              </div>
            </section>
          )}
          <section className="cohort-dataset-section">
            <div className="report-section-heading">
              <div>
                <h3>Datasets in this report</h3>
                <p>Select rows to build a more specific cohort.</p>
              </div>
              <button
                className="button secondary"
                disabled={selection.length === 0 || selection.length > 1000}
                onClick={onUseSelection}
              >
                Build selected cohort ({selection.length}){' '}
                <ArrowRight size={14} />
              </button>
            </div>
            <div className="report-table-scroll">
              <table className="report-table cohort-table">
                <thead>
                  <tr>
                    <th>
                      <input
                        type="checkbox"
                        aria-label="Select all datasets on this page"
                        checked={
                          pageRows.length > 0 &&
                          pageRows.every((r) =>
                            selection.includes(r.assessment.dataset_code)
                          )
                        }
                        onChange={(e) => {
                          const codes = pageRows.map(
                            (r) => r.assessment.dataset_code
                          );
                          setSelection(
                            e.target.checked
                              ? [...new Set([...selection, ...codes])]
                              : selection.filter(
                                  (code) => !codes.includes(code)
                                )
                          );
                        }}
                      />
                    </th>
                    <th>Dataset</th>
                    <th>Report state</th>
                    <th>Readiness</th>
                    <th>Evidence</th>
                    <th>Scoring coverage</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map((item) => (
                    <tr key={item.assessment.dataset_code}>
                      <td>
                        <input
                          type="checkbox"
                          aria-label={`Select ${item.assessment.dataset_name}`}
                          checked={selection.includes(
                            item.assessment.dataset_code
                          )}
                          onChange={() => toggle(item.assessment.dataset_code)}
                        />
                      </td>
                      <td>
                        <button
                          className="dataset-report-link"
                          onClick={() => onOpen(item.assessment.run_id)}
                        >
                          {item.assessment.dataset_name}
                        </button>
                        <span>
                          {item.assessment.modality || 'Modality not specified'}{' '}
                          · {item.assessment.country || 'Country not specified'}
                        </span>
                      </td>
                      <td>
                        <ReportState state={item.report_state} />
                      </td>
                      <td>
                        {item.summary.composite_score === null
                          ? 'Withheld'
                          : `${Math.round(item.summary.composite_score)}/100`}
                      </td>
                      <td>
                        {item.summary.evidence_coverage === null
                          ? 'Unavailable'
                          : `${Math.round(item.summary.evidence_coverage)}%`}
                      </td>
                      <td>{Math.round(item.summary.scoring_coverage)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {p.dataset_count > 20 && (
              <div className="report-pagination">
                <button
                  className="button secondary"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Previous
                </button>
                <span>
                  Page {page} of {Math.ceil(p.dataset_count / 20)}
                </span>
                <button
                  className="button secondary"
                  disabled={page * 20 >= p.dataset_count}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </section>
        </>
      )}
      <details className="report-methodology">
        <summary>How this report was calculated</summary>
        <ul>
          {report.methodology.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          Generated {new Date(report.generated_at).toLocaleString()} ·{' '}
          {report.framework_versions
            .map(
              (v) =>
                `${v.framework} ${v.version} (scoring ${v.scoring_version})`
            )
            .join(', ') || 'No eligible framework results'}
        </p>
      </details>
    </>
  );
}
