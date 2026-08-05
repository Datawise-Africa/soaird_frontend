import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  BookOpen,
  Check,
  CheckCircle2,
  CircleGauge,
  CircleDot,
  Clock3,
  Database,
  Download,
  FileCheck2,
  FileText,
  Filter,
  History,
  Layers3,
  LockKeyhole,
  MapPin,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { ApiError, api, liveApiEnabled } from '~/lib/api/soaird-client';
import type {
  Assessment as ApiAssessment,
  AssessmentReport,
  CohortAnalytics,
  Dataset as ApiDataset,
} from '~/lib/api/soaird-client';
import { useEffect } from 'react';
import { useWorkspace } from '~/features/workspaces/workspace-context';
import { DatasetActions } from '~/features/datasets/dataset-actions';
import { DatasetRecordDialog } from '~/features/datasets/dataset-record-dialog';
import { AssessmentSetupDialog } from '~/features/assessments/assessment-setup-dialog';
import { AssessmentDatasetDialog } from '~/features/assessments/assessment-dataset-dialog';
import { AssessmentQuestionnaireDialog } from '~/features/assessments/assessment-questionnaire-dialog';

type View =
  | 'overview'
  | 'datasets'
  | 'assessments'
  | 'reviews'
  | 'reports'
  | 'governance';

type DatasetRecord = {
  code: string;
  name: string;
  country: string;
  region: string;
  domain: string;
  modality: string;
  owner: string;
  status: string;
  readiness: number | null;
  updated: string;
};

function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: Readonly<{
  eyebrow: string;
  title: string;
  description: string;
  action?: React.ReactNode;
}>) {
  return (
    <div className="section-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action ? <div className="section-actions">{action}</div> : null}
    </div>
  );
}

function Status({ children }: Readonly<{ children: string }>) {
  const tone = children.toLowerCase().replaceAll(' ', '-');
  return <span className={`status-pill ${tone}`}>{children}</span>;
}

function EmptyScore({ score }: Readonly<{ score: number | null }>) {
  if (score === null) return <span className="score-empty">Not assessed</span>;
  return (
    <span
      className={`score-chip ${score >= 75 ? 'good' : score >= 60 ? 'fair' : 'low'}`}
    >
      {score}
    </span>
  );
}

async function downloadReport(runId: string, filename: string) {
  const blob = await api.downloadAssessmentReport(runId, 'json');
  const href = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = href;
  anchor.download = `${filename}.json`;
  anchor.click();
  URL.revokeObjectURL(href);
}

export default function WorkspaceView({ view }: Readonly<{ view: View }>) {
  if (view === 'datasets') return <DatasetsView />;
  if (view === 'assessments') return <AssessmentsView />;
  if (view === 'reviews') return <ReviewsView />;
  if (view === 'reports') return <ReportsView />;
  if (view === 'governance') return <GovernanceView />;
  return null;
}

function DatasetsView() {
  const { scopeQuery, activeWorkspace } = useWorkspace();
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('All domains');
  const [selected, setSelected] = useState<DatasetRecord | null>(null);
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [assessmentDatasetCode, setAssessmentDatasetCode] = useState<
    string | null
  >(null);
  const [records, setRecords] = useState<DatasetRecord[]>([]);
  const [totalRecords, setTotalRecords] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [refreshVersion, setRefreshVersion] = useState(0);
  const canManage =
    activeWorkspace.personal ||
    activeWorkspace.roles.some(
      (role) => role === 'admin' || role === 'research_lead'
    );

  useEffect(() => {
    api
      .datasets(scopeQuery('page_size=100'))
      .then((response) => {
        setTotalRecords(response.count);
        setRecords(
          response.results.map((item) => ({
            code: String(item.dataset_code ?? ''),
            name: String(item.name ?? 'Untitled dataset'),
            country: String(item.country ?? 'Not specified'),
            region: String(item.region ?? 'Not specified'),
            domain: String(item.domain ?? 'Other'),
            modality: String(item.modality ?? 'Other'),
            owner: String(item.owner ?? 'Not specified'),
            status: String(item.status ?? 'Registered').replaceAll('_', ' '),
            readiness: null,
            updated: item.updated_at
              ? new Date(String(item.updated_at)).toLocaleDateString()
              : 'Recently',
          }))
        );
      })
      .catch((error: Error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, [scopeQuery, refreshVersion]);
  const countryCount = new Set(
    records.map((item) => item.country).filter(Boolean)
  ).size;
  const domainCount = new Set(
    records.map((item) => item.domain).filter(Boolean)
  ).size;
  const filtered = useMemo(
    () =>
      records.filter(
        (item) =>
          (domain === 'All domains' || item.domain === domain) &&
          `${item.name} ${item.country} ${item.owner}`
            .toLowerCase()
            .includes(query.toLowerCase())
      ),
    [query, domain, records]
  );

  return (
    <>
      <PageHeader
        eyebrow="Dataset registry"
        title="Find and understand African datasets"
        description="A shared catalogue with ownership, provenance and AI-readiness evidence explained in plain language."
        action={
          <DatasetActions
            onChanged={() => setRefreshVersion((value) => value + 1)}
          />
        }
      />

      <section className="registry-summary">
        <div>
          <Database size={19} />
          <span>
            <strong>{loading ? '…' : `${totalRecords} datasets`}</strong>
            <small>Across {countryCount} visible countries</small>
          </span>
        </div>
        <div>
          <CheckCircle2 size={19} />
          <span>
            <strong>
              {
                records.filter(
                  (item) => item.status.toLowerCase() === 'assessed'
                ).length
              }{' '}
              assessed
            </strong>
            <small>Within the loaded registry records</small>
          </span>
        </div>
        <div>
          <Layers3 size={19} />
          <span>
            <strong>{domainCount} data domains</strong>
            <small>Within the loaded registry records</small>
          </span>
        </div>
        <div className="coverage-mini">
          <span className="coverage-dot" />
          <strong>Registry coverage</strong>
          <small>Based on records available to your account</small>
        </div>
      </section>

      <section className="data-panel">
        {loadError ? (
          <div className="inline-error">
            <AlertCircle size={15} /> {loadError}
          </div>
        ) : null}
        {loading ? (
          <div className="inline-loading">
            Loading datasets from the registry…
          </div>
        ) : null}
        <div className="table-tools">
          <label className="table-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search by dataset, country or owner"
              aria-label="Search datasets"
            />
          </label>
          <select
            value={domain}
            onChange={(event) => setDomain(event.target.value)}
            aria-label="Filter by domain"
          >
            <option>All domains</option>
            <option>Health</option>
            <option>Agriculture</option>
            <option>Education</option>
            <option>Mobility</option>
            <option>Language</option>
          </select>
          <button className="tool-button">
            <Filter size={15} /> More filters
          </button>
          <button className="tool-button compact" aria-label="Table options">
            <SlidersHorizontal size={16} />
          </button>
        </div>

        <div className="dataset-table" role="table" aria-label="Datasets">
          <div className="table-row table-head" role="row">
            <span>Dataset</span>
            <span>Location</span>
            <span>Domain</span>
            <span>Status</span>
            <span>Readiness</span>
            <span />
          </div>
          {filtered.map((item) => (
            <button
              className="table-row"
              role="row"
              key={item.code}
              onClick={() => setSelected(item)}
            >
              <span className="dataset-cell">
                <span className={`data-icon ${item.modality.toLowerCase()}`}>
                  <Database size={16} />
                </span>
                <span>
                  <strong>{item.name}</strong>
                  <small>
                    {item.code} · {item.owner}
                  </small>
                </span>
              </span>
              <span className="location-cell">
                <MapPin size={13} />
                <span>
                  <strong>{item.country}</strong>
                  <small>{item.region}</small>
                </span>
              </span>
              <span>
                <strong className="plain-value">{item.domain}</strong>
                <small>{item.modality}</small>
              </span>
              <span>
                <Status>{item.status}</Status>
              </span>
              <span>
                <EmptyScore score={item.readiness} />
              </span>
              <span>
                <MoreHorizontal size={17} />
              </span>
            </button>
          ))}
          {!loading && !loadError && filtered.length === 0 ? (
            <div className="assessment-empty-state">
              <Database size={28} />
              <h3>No datasets found</h3>
              <p>
                {records.length === 0
                  ? 'Register or import a dataset to begin.'
                  : 'Change the search or domain filter to see other records.'}
              </p>
            </div>
          ) : null}
        </div>

        <div className="table-footer">
          <span>
            Showing {filtered.length} of {totalRecords} datasets
          </span>
        </div>
      </section>

      {selected ? (
        <div className="modal-layer" role="dialog" aria-modal="true">
          <button
            className="modal-scrim"
            onClick={() => setSelected(null)}
            aria-label="Close"
          />
          <aside className="record-drawer">
            <button
              className="quick-close"
              onClick={() => setSelected(null)}
              aria-label="Close"
            >
              <X size={19} />
            </button>
            <div className="record-code">{selected.code}</div>
            <h2>{selected.name}</h2>
            <div className="record-tags">
              <Status>{selected.status}</Status>
              <span>{selected.domain}</span>
              <span>{selected.modality}</span>
            </div>
            <div className="record-score">
              <div>
                <span>AI-readiness score</span>
                <strong>
                  {selected.readiness ?? '—'}
                  <small>/100</small>
                </strong>
              </div>
              <div
                className="score-ring"
                style={
                  {
                    '--score': `${selected.readiness ?? 0}%`,
                  } as React.CSSProperties
                }
              >
                <Sparkles size={20} />
              </div>
            </div>
            <dl className="record-details">
              <div>
                <dt>Country</dt>
                <dd>{selected.country}</dd>
              </div>
              <div>
                <dt>Region</dt>
                <dd>{selected.region}</dd>
              </div>
              <div>
                <dt>Data owner</dt>
                <dd>{selected.owner}</dd>
              </div>
              <div>
                <dt>Last updated</dt>
                <dd>{selected.updated}</dd>
              </div>
            </dl>
            <div className="drawer-actions">
              <button
                className="button secondary"
                onClick={() => {
                  setDetailCode(selected.code);
                  setSelected(null);
                }}
              >
                View full record
              </button>
              <button
                className="button primary"
                onClick={() => {
                  setAssessmentDatasetCode(selected.code);
                  setSelected(null);
                }}
              >
                Start assessment <ArrowRight size={16} />
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <DatasetRecordDialog
        datasetCode={detailCode}
        canManage={canManage}
        onOpenChange={(open) => !open && setDetailCode(null)}
        onUpdated={() => setRefreshVersion((value) => value + 1)}
        onStartAssessment={setAssessmentDatasetCode}
      />
      <AssessmentSetupDialog
        datasetCode={assessmentDatasetCode}
        onOpenChange={(open) => !open && setAssessmentDatasetCode(null)}
      />
    </>
  );
}

function AssessmentsView() {
  const { scopeQuery } = useWorkspace();
  const [tab, setTab] = useState('Active');
  const [records, setRecords] = useState<ApiAssessment[]>([]);
  const [datasetMap, setDatasetMap] = useState<Record<string, ApiDataset>>({});
  const [datasets, setDatasets] = useState<ApiDataset[]>([]);
  const [datasetsLoading, setDatasetsLoading] = useState(true);
  const [datasetChooserOpen, setDatasetChooserOpen] = useState(false);
  const [assessmentDatasetCode, setAssessmentDatasetCode] = useState<
    string | null
  >(null);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [selected, setSelected] = useState<ApiAssessment | null>(null);
  const [questionnaireRunId, setQuestionnaireRunId] = useState<string | null>(
    null
  );
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [runState, setRunState] = useState<
    Record<
      string,
      {
        id: string;
        status: string;
        current: number;
        total: number;
      }
    >
  >({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!liveApiEnabled) return;
    setDatasetsLoading(true);
    Promise.all([
      api.assessments(scopeQuery('page_size=100')),
      api.datasets(scopeQuery('page_size=100')),
    ])
      .then(([assessmentResponse, datasetResponse]) => {
        setRecords(assessmentResponse.results);
        setDatasets(datasetResponse.results);
        setDatasetMap(
          Object.fromEntries(
            datasetResponse.results.map((dataset) => [
              dataset.dataset_code,
              dataset,
            ])
          )
        );
        setRunState(
          Object.fromEntries(
            assessmentResponse.results
              .filter((assessment) => assessment.latest_run)
              .map((assessment) => {
                const run = assessment.latest_run!;
                return [
                  assessment.assessment_code,
                  {
                    id: run.id,
                    status: run.status,
                    current: run.progress_current,
                    total: run.progress_total,
                  },
                ];
              })
          )
        );
      })
      .catch((error: Error) => setMessage(error.message))
      .finally(() => setDatasetsLoading(false));
  }, [scopeQuery, refreshVersion]);

  const beginAssessment = () => setDatasetChooserOpen(true);

  useEffect(() => {
    if (!selected) return;
    const run = runState[selected.assessment_code];
    if (!run || run.status !== 'completed') return;
    api
      .assessmentReport(run.id)
      .then((result) => {
        const hasScoredResult =
          result.summary.composite_score !== null ||
          result.pillars.some((pillar) => pillar.effective_score !== null);
        setReport(hasScoredResult ? result : null);
      })
      .catch(() => undefined);
  }, [selected, runState]);

  async function startRun(assessment: ApiAssessment) {
    setBusy(true);
    setMessage('');
    try {
      const run = await api.runApplicability(assessment.assessment_code);
      setRunState((current) => ({
        ...current,
        [assessment.assessment_code]: {
          id: run.id,
          status: run.status,
          current: run.progress_current,
          total: run.progress_total,
        },
      }));
      setMessage(
        'Applicability check queued. Progress will update automatically.'
      );
    } catch (error) {
      setMessage(
        error instanceof ApiError
          ? error.message
          : 'The assessment could not be started.'
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    const active = Object.entries(runState).filter(([, run]) =>
      ['queued', 'running'].includes(run.status)
    );
    if (!active.length) return;
    const timer = window.setInterval(() => {
      active.forEach(([code, current]) => {
        api
          .runStatus(current.id)
          .then((run) => {
            setRunState((state) => ({
              ...state,
              [code]: {
                id: run.id,
                status: run.status,
                current: run.progress_current,
                total: run.progress_total,
              },
            }));
          })
          .catch(() => undefined);
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [runState]);

  return (
    <>
      <PageHeader
        eyebrow="Assessment workspace"
        title="Move from context to credible conclusions"
        description="Each assessment follows the same transparent journey, with progress saved and evidence visible at every step."
        action={
          <button className="button primary" onClick={beginAssessment}>
            <Plus size={16} /> Start assessment
          </button>
        }
      />

      <section className="journey-strip" aria-label="Assessment stages">
        {[
          ['1', 'Sources', 'Provide files or links'],
          ['2', 'Applicability', 'Select relevant metrics'],
          ['3', 'Automation', 'Calculate and extract'],
          ['4', 'Workbench', 'Review exceptions'],
          ['5', 'Completion', 'Accept conclusions'],
          ['6', 'Report', 'Explore and export'],
        ].map(([number, title, help], index) => (
          <div key={number} className={index === 0 ? 'current' : ''}>
            <span>{number}</span>
            <p>
              <strong>{title}</strong>
              <small>{help}</small>
            </p>
            {index < 5 ? <ArrowRight size={13} /> : null}
          </div>
        ))}
      </section>

      <div className="view-tabs">
        {['Active', 'Ready for review', 'Completed', 'All assessments'].map(
          (item) => (
            <button
              className={tab === item ? 'active' : ''}
              onClick={() => setTab(item)}
              key={item}
            >
              {item}
              {item === 'Active' ? <span>{records.length}</span> : null}
            </button>
          )
        )}
      </div>

      <section className="assessment-grid">
        {records.map((item) => {
          const dataset = datasetMap[item.dataset_code];
          const run = runState[item.assessment_code];
          const applicabilityProgress =
            run && run.total > 0
              ? Math.round((run.current / run.total) * 100)
              : 0;
          const progress =
            item.status === 'completed'
              ? 100
              : item.status === 'ready_for_review'
                ? 85
                : run?.status === 'completed'
                  ? 60
                  : run
                    ? Math.min(50, 10 + Math.round(applicabilityProgress * 0.4))
                    : 10;
          const status =
            run && ['queued', 'running', 'failed'].includes(run.status)
              ? `Applicability ${run.status.replaceAll('_', ' ')}`
              : item.status.replaceAll('_', ' ');
          return (
            <article className="assessment-card" key={item.assessment_code}>
              <div className="assessment-card-top">
                <span className="assessment-icon">
                  <FileCheck2 size={18} />
                </span>
                <Status>{status}</Status>
                <button aria-label="Assessment options">
                  <MoreHorizontal size={18} />
                </button>
              </div>
              <p className="record-code">{item.assessment_code}</p>
              <h2>{dataset?.name ?? item.dataset_code}</h2>
              <div className="assessment-meta">
                <span>
                  <MapPin size={13} /> {dataset?.country ?? 'Registry dataset'}
                </span>
                <span>
                  <UserCheck size={13} /> Assessment owner
                </span>
              </div>
              <div className="progress-header">
                <span>Assessment progress</span>
                <strong>{progress}%</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${progress}%` }} />
              </div>
              <div className="assessment-footer">
                <span>
                  <Clock3 size={13} /> Created{' '}
                  {new Date(item.created_at).toLocaleDateString()}
                </span>
                <button
                  onClick={() => {
                    setReport(null);
                    setSelected(item);
                  }}
                >
                  Open <ArrowRight size={14} />
                </button>
              </div>
            </article>
          );
        })}
        {records.length === 0 && !message ? (
          <div className="assessment-empty-state">
            <FileCheck2 size={28} />
            <h3>No assessments yet</h3>
            <p>Create an assessment from a registered dataset to begin.</p>
            <button className="button primary" onClick={beginAssessment}>
              Start assessment
            </button>
          </div>
        ) : null}
      </section>

      {message ? (
        <button className="toast" onClick={() => setMessage('')}>
          {message}
        </button>
      ) : null}

      {selected ? (
        <div
          className="modal-layer"
          role="dialog"
          aria-modal="true"
          aria-label="Assessment details"
        >
          <button
            className="modal-scrim"
            onClick={() => {
              setReport(null);
              setSelected(null);
            }}
            aria-label="Close"
          />
          <aside className="record-drawer assessment-drawer">
            <button
              className="quick-close"
              onClick={() => {
                setReport(null);
                setSelected(null);
              }}
              aria-label="Close"
            >
              <X size={19} />
            </button>
            <p className="record-code">{selected.assessment_code}</p>
            <h2>
              {datasetMap[selected.dataset_code]?.name ?? selected.dataset_code}
            </h2>
            <p className="drawer-intro">
              This page keeps the overall conclusion, pillar results and
              supporting research trail together.
            </p>

            {report ? (
              <>
                <section className="assessment-summary-grid">
                  <div>
                    <span>Overall readiness</span>
                    <strong>
                      {Math.round(report.summary.composite_score ?? 0)}
                      <small>/100</small>
                    </strong>
                  </div>
                  <div>
                    <span>Assessment complete</span>
                    <strong>
                      {Math.round(report.summary.assessment_completion ?? 0)}
                      <small>%</small>
                    </strong>
                  </div>
                  <div>
                    <span>Evidence coverage</span>
                    <strong>
                      {Math.round(report.summary.evidence_coverage ?? 0)}
                      <small>%</small>
                    </strong>
                  </div>
                </section>
                <div className="drawer-section">
                  <div className="drawer-heading">
                    <h3>Nine readiness pillars</h3>
                    <span>{report.summary.metric_count} checks</span>
                  </div>
                  <div className="report-pillar-list">
                    {report.pillars.map((pillar, index) => (
                      <div key={pillar.pillar_code}>
                        <span>{index + 1}</span>
                        <p>
                          <strong>{pillar.pillar_name}</strong>
                          <small>{pillar.pillar_code}</small>
                        </p>
                        <i>
                          <b
                            style={{ width: `${pillar.effective_score ?? 0}%` }}
                          />
                        </i>
                        <em>{Math.round(pillar.effective_score ?? 0)}</em>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="method-note">
                  <AlertCircle size={14} />
                  Accepted reviewer scores are shown where adjudication is
                  complete; otherwise the automated score is clearly retained.
                </div>
              </>
            ) : (
              <section className="assessment-empty-state">
                <CircleGauge size={28} />
                <h3>
                  {runState[selected.assessment_code]?.status === 'completed'
                    ? 'Applicability check complete'
                    : runState[selected.assessment_code]
                      ? 'Applicability check in progress'
                      : 'Ready to determine applicability'}
                </h3>
                <p>
                  {runState[selected.assessment_code]?.status === 'completed'
                    ? 'The framework has selected the relevant metrics. Open the workbench to add sources, run automated profiling and review only the findings that need attention.'
                    : runState[selected.assessment_code]
                      ? 'The framework is determining which checks apply. You can leave this page and return while processing continues.'
                      : 'Run the framework applicability check first. This step does not calculate readiness scores.'}
                </p>
                {runState[selected.assessment_code] ? (
                  <div className="progress-track">
                    <span
                      style={{
                        width: `${
                          runState[selected.assessment_code].total
                            ? Math.round(
                                (runState[selected.assessment_code].current /
                                  runState[selected.assessment_code].total) *
                                  100
                              )
                            : 8
                        }%`,
                      }}
                    />
                  </div>
                ) : null}
              </section>
            )}

            <div className="drawer-actions">
              {report ? (
                <button
                  className="button primary"
                  onClick={() =>
                    downloadReport(
                      runState[selected.assessment_code].id,
                      `${selected.assessment_code}-report`
                    )
                  }
                >
                  <Download size={16} /> Export complete report
                </button>
              ) : runState[selected.assessment_code]?.status === 'completed' ? (
                <button
                  className="button primary"
                  onClick={() => {
                    const runId = runState[selected.assessment_code].id;
                    setReport(null);
                    setSelected(null);
                    setQuestionnaireRunId(runId);
                  }}
                >
                  Open assessment workbench <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  className="button primary"
                  disabled={busy || Boolean(runState[selected.assessment_code])}
                  onClick={() => startRun(selected)}
                >
                  {busy ? 'Starting…' : 'Run applicability check'}{' '}
                  <ArrowRight size={16} />
                </button>
              )}
            </div>
          </aside>
        </div>
      ) : null}

      <section className="guidance-banner">
        <div className="guidance-icon">
          <BookOpen size={22} />
        </div>
        <div>
          <span className="overline">Research guidance</span>
          <h2>Not sure what information belongs in assessment context?</h2>
          <p>
            Use the plain-language context guide with examples for technical,
            governance and cultural considerations.
          </p>
        </div>
        <button className="button secondary">Open context guide</button>
      </section>

      <AssessmentDatasetDialog
        open={datasetChooserOpen}
        datasets={datasets}
        loading={datasetsLoading}
        onOpenChange={setDatasetChooserOpen}
        onSelect={(datasetCode) => {
          setDatasetChooserOpen(false);
          setAssessmentDatasetCode(datasetCode);
        }}
      />
      <AssessmentSetupDialog
        datasetCode={assessmentDatasetCode}
        onOpenChange={(open) => !open && setAssessmentDatasetCode(null)}
        onCreated={() => setRefreshVersion((value) => value + 1)}
      />
      <AssessmentQuestionnaireDialog
        runId={questionnaireRunId}
        assessmentCode={
          records.find(
            (assessment) =>
              runState[assessment.assessment_code]?.id === questionnaireRunId
          )?.assessment_code ?? null
        }
        onOpenChange={(open) => !open && setQuestionnaireRunId(null)}
      />
    </>
  );
}

function ReviewsView() {
  const [assignments, setAssignments] = useState<
    Array<{
      id: string;
      assessment: string;
      role: string;
      status: string;
      created_at: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    api
      .reviewAssignments('page_size=100')
      .then((response) => setAssignments(response.results))
      .catch((error: Error) => setLoadError(error.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <PageHeader
        eyebrow="Independent review"
        title="Review evidence, not just scores"
        description="Make a clear finding, explain your reasoning and preserve an independent record for adjudication."
        action={
          <div className="review-count">
            <strong>{loading ? '…' : assignments.length}</strong>
            <span>accessible assignments</span>
          </div>
        }
      />

      <section className="data-panel">
        {loadError ? (
          <div className="inline-error">
            <AlertCircle size={15} /> {loadError}
          </div>
        ) : null}
        {loading ? (
          <div className="inline-loading">Loading review assignments…</div>
        ) : null}
        {!loading && !loadError && assignments.length === 0 ? (
          <div className="assessment-empty-state">
            <UserCheck size={28} />
            <h3>No review assignments</h3>
            <p>
              Review work will appear here after a research lead assigns you to
              an assessment.
            </p>
          </div>
        ) : (
          <div className="queue-heading">
            <div>
              <h2>Review assignments</h2>
              <span>{assignments.length} records available</span>
            </div>
          </div>
        )}
        {assignments.length > 0 ? (
          <div className="queue-list">
            {assignments.map((item) => (
              <div key={item.id}>
                <span className="priority-dot normal" />
                <span>
                  <small>
                    {item.role.replaceAll('_', ' ')} · {item.id}
                  </small>
                  <strong>Assessment {item.assessment}</strong>
                  <em>
                    Assigned {new Date(item.created_at).toLocaleDateString()}
                  </em>
                </span>
                <Status>{item.status.replaceAll('_', ' ')}</Status>
              </div>
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}

function ReportsView() {
  const { scopeQuery } = useWorkspace();
  const [group, setGroup] = useState('Domain');
  const [analytics, setAnalytics] = useState<CohortAnalytics | null>(null);
  const [analyticsError, setAnalyticsError] = useState('');
  const [loading, setLoading] = useState(true);
  const [assessmentReports, setAssessmentReports] = useState<
    AssessmentReport[]
  >([]);

  useEffect(() => {
    setLoading(true);
    setAnalyticsError('');
    api
      .cohortAnalytics(
        group.toLowerCase() as 'country' | 'region' | 'domain' | 'modality',
        scopeQuery()
      )
      .then(setAnalytics)
      .catch((error: Error) => setAnalyticsError(error.message))
      .finally(() => setLoading(false));
  }, [group, scopeQuery]);

  useEffect(() => {
    api
      .assessments(scopeQuery('page_size=100'))
      .then(async (response) => {
        const completed = response.results.filter(
          (assessment) =>
            assessment.status === 'completed' && assessment.latest_run
        );
        const reports = await Promise.allSettled(
          completed.map((assessment) =>
            api.assessmentReport(assessment.latest_run!.id)
          )
        );
        setAssessmentReports(
          reports.flatMap((result) =>
            result.status === 'fulfilled' ? [result.value] : []
          )
        );
      })
      .catch(() => setAssessmentReports([]));
  }, [scopeQuery]);

  const chartRows = (analytics?.cohorts ?? [])
    .filter((item) => !item.suppressed && item.statistics?.median !== null)
    .map((item) => ({
      label: String(
        item[group.toLowerCase() as keyof typeof item] ?? 'Unspecified'
      ),
      value: Math.round(item.statistics?.median ?? 0),
      count: item.count,
    }));
  const population = analytics?.population;

  return (
    <>
      <PageHeader
        eyebrow="Research analytics"
        title="See where readiness is advancing—and where it is not"
        description="Compare responsibly, disclose coverage and export analysis with the framework version attached."
      />

      <section className="report-kpis">
        <article>
          <span>Completed assessments</span>
          <strong>
            {loading ? '…' : (population?.completed_assessments ?? 0)}
          </strong>
          <small>Latest completed run only</small>
        </article>
        <article>
          <span>Assessment completion</span>
          <strong>
            {loading
              ? '…'
              : population?.assessment_completion.median === null ||
                  population?.assessment_completion.median === undefined
                ? '—'
                : `${Math.round(population.assessment_completion.median)}%`}
          </strong>
          <small>Median across the selected population</small>
        </article>
        <article>
          <span>Evidence coverage</span>
          <strong>
            {loading
              ? '…'
              : population?.evidence_coverage.median === null ||
                  population?.evidence_coverage.median === undefined
                ? '—'
                : `${Math.round(population.evidence_coverage.median)}%`}
          </strong>
          <small>Median verified coverage</small>
        </article>
      </section>

      <section className="reports-layout">
        <article className="panel cohort-panel">
          {analyticsError ? (
            <div className="inline-error">
              <AlertCircle size={15} /> {analyticsError}
            </div>
          ) : null}
          <div className="panel-heading">
            <div>
              <p className="overline">Cohort comparison</p>
              <h2>Median readiness by {group.toLowerCase()}</h2>
            </div>
            <select
              value={group}
              onChange={(event) => setGroup(event.target.value)}
            >
              <option>Domain</option>
              <option>Region</option>
              <option>Modality</option>
            </select>
          </div>
          <div className="cohort-chart">
            {chartRows.map((item) => (
              <div key={item.label}>
                <span>
                  {item.label}
                  <small>{item.count} datasets</small>
                </span>
                <div>
                  <i style={{ width: `${item.value}%` }} />
                  <em>{item.value}</em>
                </div>
              </div>
            ))}
            {!loading && !analyticsError && chartRows.length === 0 ? (
              <div className="assessment-empty-state">
                <BarChart3 size={28} />
                <h3>No publishable cohort results yet</h3>
                <p>
                  Complete enough assessments in a cohort to meet the privacy
                  threshold before aggregate scores are displayed.
                </p>
              </div>
            ) : null}
          </div>
          <p className="method-note">
            <AlertCircle size={14} /> Only cohorts meeting the minimum sample
            threshold of {analytics?.minimum_cohort_size ?? 3} are shown.
          </p>
        </article>
      </section>

      <section className="data-panel">
        <div className="panel-heading">
          <div>
            <p className="overline">Completed research</p>
            <h2>Assessment reports</h2>
          </div>
          <span>{assessmentReports.length} available</span>
        </div>
        <div className="assessment-grid">
          {assessmentReports.map((report) => (
            <article
              className="assessment-card"
              key={report.assessment.run_code}
            >
              <div className="assessment-card-top">
                <span className="assessment-icon">
                  <BarChart3 size={18} />
                </span>
                <Status>Completed</Status>
              </div>
              <p className="record-code">{report.assessment.assessment_code}</p>
              <h2>{report.assessment.dataset_name}</h2>
              <section className="assessment-summary-grid compact-summary">
                <div>
                  <span>Readiness</span>
                  <strong>
                    {Math.round(report.summary.composite_score ?? 0)}
                    <small>/100</small>
                  </strong>
                </div>
                <div>
                  <span>Evidence</span>
                  <strong>
                    {Math.round(report.summary.evidence_coverage ?? 0)}
                    <small>%</small>
                  </strong>
                </div>
                <div>
                  <span>Metrics</span>
                  <strong>{report.summary.metric_count}</strong>
                </div>
              </section>
              <div className="assessment-footer">
                <span>Framework {report.assessment.framework_version}</span>
                <button
                  onClick={() =>
                    downloadReport(
                      report.assessment.run_id,
                      `${report.assessment.assessment_code}-report`
                    )
                  }
                >
                  Export
                </button>
              </div>
            </article>
          ))}
          {!loading && assessmentReports.length === 0 ? (
            <div className="assessment-empty-state">
              <FileText size={28} />
              <h3>No completed reports yet</h3>
              <p>
                Complete a reviewed assessment in the workbench to make its
                report available here.
              </p>
            </div>
          ) : null}
        </div>
      </section>
    </>
  );
}

function GovernanceView() {
  const [tab, setTab] = useState('Framework versions');
  const [versions, setVersions] = useState<Array<Record<string, unknown>>>([]);
  const [proposals, setProposals] = useState<Array<Record<string, unknown>>>(
    []
  );
  const [audit, setAudit] = useState<Array<Record<string, unknown>>>([]);
  const [integrity, setIntegrity] = useState<Record<string, unknown> | null>(
    null
  );
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    if (!liveApiEnabled) return;
    Promise.allSettled([
      api.frameworkVersions('page_size=100'),
      api.frameworkProposals('page_size=100'),
      api.auditEvents('page_size=20'),
      api.verifyAuditChain(),
    ]).then(([versionResult, proposalResult, auditResult, integrityResult]) => {
      if (versionResult.status === 'fulfilled')
        setVersions(versionResult.value.results);
      if (proposalResult.status === 'fulfilled')
        setProposals(proposalResult.value.results);
      if (auditResult.status === 'fulfilled')
        setAudit(auditResult.value.results);
      if (integrityResult.status === 'fulfilled')
        setIntegrity(integrityResult.value);
      const failure = [
        versionResult,
        proposalResult,
        auditResult,
        integrityResult,
      ].find((result) => result.status === 'rejected');
      if (failure?.status === 'rejected') {
        setLoadError(
          failure.reason instanceof Error
            ? failure.reason.message
            : 'Governance data could not be loaded.'
        );
      }
    });
  }, []);

  const activeVersion =
    versions.find((item) => item.status === 'published') ?? versions[0];
  const versionRows = versions.map((item) => [
    String(item.version ?? '—'),
    String(item.status ?? 'Draft').replaceAll('_', ' '),
    String(item.name ?? item.description ?? 'Research framework'),
    item.published_at
      ? new Date(String(item.published_at)).toLocaleDateString()
      : 'Not published',
    String(item.published_by ?? 'Research governance board'),
  ]);
  const proposalRows = proposals.map((item) => [
    String(item.id ?? '—').slice(0, 12),
    String(item.title ?? item.summary ?? 'Framework change proposal'),
    String(item.status ?? 'Draft').replaceAll('_', ' '),
    String(item.requested_by ?? 'Research team'),
    item.updated_at
      ? new Date(String(item.updated_at)).toLocaleDateString()
      : 'Recently',
  ]);
  const auditRows = audit.map((item) => [
    item.occurred_at
      ? new Date(String(item.occurred_at)).toLocaleTimeString()
      : '—',
    String(item.action ?? 'Recorded event').replaceAll('.', ' '),
    String(item.actor_username ?? 'System'),
    String(item.target_type ?? 'Platform'),
    'Recorded',
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Governance & accountability"
        title="Keep the framework trustworthy over time"
        description="Propose improvements, preserve independent approval and verify the history behind every published framework."
        action={
          <button className="button primary">
            <Plus size={16} /> New framework proposal
          </button>
        }
      />

      {loadError ? (
        <div className="inline-error">
          <AlertCircle size={15} /> {loadError}
        </div>
      ) : null}

      {activeVersion ? (
        <section className="governance-banner">
          <span className="governance-seal">
            <ShieldCheck size={25} />
          </span>
          <div>
            <span>Active research framework</span>
            <h2>{String(activeVersion.name ?? 'SOAI-RD Framework')}</h2>
            <p>Version {String(activeVersion.version ?? '—')}</p>
          </div>
          <Status>
            {String(activeVersion.status ?? 'Draft').replaceAll('_', ' ')}
          </Status>
          <button className="button secondary">View framework</button>
        </section>
      ) : (
        <div className="assessment-empty-state">
          <ShieldCheck size={28} />
          <h3>No framework version is available</h3>
          <p>
            A system administrator must publish or grant access to a framework
            version.
          </p>
        </div>
      )}

      <div className="view-tabs governance-tabs">
        {['Framework versions', 'Change proposals', 'Audit trail'].map(
          (item) => (
            <button
              className={tab === item ? 'active' : ''}
              onClick={() => setTab(item)}
              key={item}
            >
              {item}
            </button>
          )
        )}
      </div>

      {tab === 'Framework versions' ? (
        <section className="governance-grid">
          <article className="panel version-timeline">
            <div className="panel-heading">
              <div>
                <p className="overline">Version history</p>
                <h2>Framework evolution</h2>
              </div>
              <button>
                <History size={15} /> Compare versions
              </button>
            </div>
            {versionRows.length === 0 ? (
              <div className="assessment-empty-state">
                <History size={28} />
                <h3>No framework versions found</h3>
              </div>
            ) : null}
            {versionRows.map(
              ([version, status, description, date, author], index) => (
                <div className="version-item" key={version}>
                  <span
                    className={`version-node ${index === 0 ? 'active' : ''}`}
                  >
                    {index === 0 ? <Check size={15} /> : ''}
                  </span>
                  <div>
                    <span className="record-code">{date}</span>
                    <h3>SOAI-RD Framework {version}</h3>
                    <p>{description}</p>
                    <small>Published by {author}</small>
                  </div>
                  <Status>{status}</Status>
                  <button aria-label="Version options">
                    <MoreHorizontal size={17} />
                  </button>
                </div>
              )
            )}
          </article>
          <aside className="governance-side">
            <article className="panel integrity-card">
              <div className="integrity-icon">
                <LockKeyhole size={22} />
              </div>
              <p className="overline">Integrity status</p>
              <h2>
                {integrity
                  ? integrity.valid === false
                    ? 'Integrity check needs attention'
                    : 'Audit chain verified'
                  : 'Integrity status unavailable'}
              </h2>
              <p>
                {integrity
                  ? `${String(integrity.checked_count ?? integrity.event_count ?? 'All')} recorded events were checked.`
                  : 'Run the audit-chain check with a system administrator account.'}
              </p>
              <button className="button secondary">Verify again</button>
            </article>
            <article className="panel principle-card">
              <p className="overline">Governance principle</p>
              <blockquote>
                “No one can approve their own framework proposal.”
              </blockquote>
              <p>
                Independent approval protects the integrity of changes before
                publication.
              </p>
            </article>
          </aside>
        </section>
      ) : tab === 'Change proposals' ? (
        <section className="data-panel proposals-table">
          {proposalRows.length === 0 ? (
            <div className="assessment-empty-state">
              <FileText size={28} />
              <h3>No framework proposals found</h3>
            </div>
          ) : null}
          {proposalRows.map(([code, title, status, author, date]) => (
            <div className="proposal-row" key={code}>
              <span className="file-icon">
                <FileText size={17} />
              </span>
              <span>
                <small>{code}</small>
                <strong>{title}</strong>
              </span>
              <span>
                <Status>{status}</Status>
              </span>
              <span>
                <strong>{author}</strong>
                <small>{date}</small>
              </span>
              <button>
                <ArrowRight size={16} />
              </button>
            </div>
          ))}
        </section>
      ) : (
        <section className="data-panel audit-panel">
          <div className="table-tools">
            <label className="table-search">
              <Search size={16} />
              <input placeholder="Search audit events" />
            </label>
            <button className="tool-button">
              <Filter size={15} /> Filter events
            </button>
            <button className="tool-button">
              <Download size={15} /> Export CSV
            </button>
          </div>
          {auditRows.length === 0 ? (
            <div className="assessment-empty-state">
              <History size={28} />
              <h3>No audit events found</h3>
            </div>
          ) : null}
          {auditRows.map(([time, event, actor, area, status], index) => (
            <div className="audit-row" key={`${time}-${index}`}>
              <span>
                <CircleDot size={14} />
              </span>
              <time>{time}</time>
              <strong>{event}</strong>
              <span>{actor}</span>
              <span>{area}</span>
              <Status>{status}</Status>
            </div>
          ))}
        </section>
      )}
    </>
  );
}