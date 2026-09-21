import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
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
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { ApiError, api, liveApiEnabled } from '~/lib/api/soaird-client';
import type { Assessment as ApiAssessment } from '~/lib/api/soaird-client';
import { useEffect } from 'react';
import { useWorkspace } from '~/features/workspaces/workspace-context';
import ReportsView from '~/features/reports/reports-page';
import { AssessmentPreviewDialog } from '~/features/assessments/assessment-preview-dialog';
import { DatasetActions } from '~/features/datasets/dataset-actions';
import { DatasetRecordDialog } from '~/features/datasets/dataset-record-dialog';
import { AssessmentSetupDialog } from '~/features/assessments/assessment-setup-dialog';
import { AssessmentDatasetDialog } from '~/features/assessments/assessment-dataset-dialog';
import { AssessmentQuestionnaireDialog } from '~/features/assessments/assessment-questionnaire-dialog';
import { LoadingSkeleton } from '~/components/loading-indicator';

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
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setSearchTerm(query);
      setPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [query]);
  useEffect(() => {
    setPage(1);
  }, [activeWorkspace.id]);
  const [selected, setSelected] = useState<DatasetRecord | null>(null);
  const [detailCode, setDetailCode] = useState<string | null>(null);
  const [assessmentDatasetCode, setAssessmentDatasetCode] = useState<
    string | null
  >(null);
  const canManage =
    activeWorkspace.personal ||
    activeWorkspace.roles.some(
      (role) => role === 'admin' || role === 'research_lead'
    );

  const datasetParams = new URLSearchParams({
    page_size: '25',
    page: String(page),
  });
  if (searchTerm) datasetParams.set('search', searchTerm);
  if (domain !== 'All domains') datasetParams.set('domain', domain);
  const datasetScope = scopeQuery(datasetParams.toString());
  const datasetsQuery = useQuery({
    queryKey: ['datasets', datasetScope],
    queryFn: () => api.datasets(datasetScope),
  });
  const records = useMemo(
    () =>
      (datasetsQuery.data?.results ?? []).map((item) => ({
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
      })),
    [datasetsQuery.data]
  );
  const totalRecords = datasetsQuery.data?.count ?? 0;
  const loading = datasetsQuery.isPending;
  const loadError = datasetsQuery.error?.message ?? '';
  const countryCount = new Set(
    records.map((item) => item.country).filter(Boolean)
  ).size;
  const domainCount = new Set(
    records.map((item) => item.domain).filter(Boolean)
  ).size;
  const filtered = records;

  return (
    <>
      <PageHeader
        eyebrow="Dataset registry"
        title="Find and understand African datasets"
        description="A shared catalogue with ownership, provenance and AI-readiness evidence explained in plain language."
        action={
          <DatasetActions onChanged={() => void datasetsQuery.refetch()} />
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
        {loading ? <LoadingSkeleton label="Loading datasets" /> : null}
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
            onChange={(event) => {
              setDomain(event.target.value);
              setPage(1);
            }}
            aria-label="Filter by domain"
          >
            <option>All domains</option>
            <option>Health</option>
            <option>Agriculture</option>
            <option>Education</option>
            <option>Mobility</option>
            <option>Language</option>
          </select>
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
            Showing {filtered.length} of {totalRecords} matching datasets
          </span>
          <div className="report-downloads">
            <button
              className="button secondary"
              disabled={!datasetsQuery.data?.previous || loading}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </button>
            <span>Page {page}</span>
            <button
              className="button secondary"
              disabled={!datasetsQuery.data?.next || loading}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
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
        onUpdated={() => void datasetsQuery.refetch()}
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
  const { scopeQuery, activeWorkspace } = useWorkspace();
  const [page, setPage] = useState(1);
  useEffect(() => {
    setPage(1);
    setSelected(null);
    setQuestionnaireRunId(null);
  }, [activeWorkspace.id]);
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('Active');
  const [datasetChooserOpen, setDatasetChooserOpen] = useState(false);
  const [assessmentDatasetCode, setAssessmentDatasetCode] = useState<
    string | null
  >(null);
  const [selected, setSelected] = useState<ApiAssessment | null>(null);
  const [questionnaireRunId, setQuestionnaireRunId] = useState<string | null>(
    null
  );
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

  const assessmentStatus =
    tab === 'Active'
      ? 'active'
      : tab === 'Completed'
        ? 'completed'
        : tab === 'Ready for review'
          ? 'ready_for_review'
          : '';
  const assessmentScope = scopeQuery(
    `page_size=20&page=${page}&status=${assessmentStatus}`
  );
  const assessmentsQuery = useQuery({
    queryKey: ['assessments-workspace', assessmentScope],
    enabled: liveApiEnabled,
    queryFn: async () => ({
      assessmentResponse: await api.assessments(assessmentScope),
    }),
  });
  const records = assessmentsQuery.data?.assessmentResponse.results ?? [];
  const datasetMap = useMemo(
    () =>
      Object.fromEntries(
        (assessmentsQuery.data?.assessmentResponse.results ?? []).map(
          (assessment) => [
            assessment.dataset_code,
            {
              dataset_code: assessment.dataset_code,
              name: assessment.dataset_name,
              modality: assessment.dataset_modality,
              country: assessment.dataset_country,
            },
          ]
        )
      ),
    [assessmentsQuery.data]
  );
  const datasetsLoading = assessmentsQuery.isPending;
  const refetchAssessments = assessmentsQuery.refetch;
  const selectedRun = selected ? runState[selected.assessment_code] : undefined;
  const selectedReportQuery = useQuery({
    queryKey: ['assessment-report', selectedRun?.id],
    queryFn: () => api.assessmentReport(selectedRun!.id),
    enabled: selectedRun?.status === 'completed',
    staleTime: 1000 * 60 * 10,
  });
  const report = selectedReportQuery.data ?? null;

  useEffect(() => {
    const assessmentResponse = assessmentsQuery.data?.assessmentResponse;
    if (!assessmentResponse) return;
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
  }, [assessmentsQuery.data]);

  useEffect(() => {
    if (assessmentsQuery.error) setMessage(assessmentsQuery.error.message);
  }, [assessmentsQuery.error]);

  const beginAssessment = () => setDatasetChooserOpen(true);

  function openWorkbench(assessment: ApiAssessment) {
    const run = runState[assessment.assessment_code];
    if (!run || run.status !== 'completed') return;
    setSelected(null);
    setQuestionnaireRunId(run.id);
  }

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
            const justCompleted =
              run.status === 'completed' && current.status !== 'completed';
            setRunState((state) => ({
              ...state,
              [code]: {
                id: run.id,
                status: run.status,
                current: run.progress_current,
                total: run.progress_total,
              },
            }));
            if (justCompleted) {
              setMessage(
                'Applicability check complete. The assessment workbench is ready to open.'
              );
              void refetchAssessments();
            }
          })
          .catch(() => undefined);
      });
    }, 4000);
    return () => window.clearInterval(timer);
  }, [refetchAssessments, runState]);

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
          <div key={number} className="journey-step">
            <span>{number}</span>
            <p>
              <strong>{title}</strong>
              <small>{help}</small>
            </p>
            {index < 5 ? <ArrowRight size={13} /> : null}
          </div>
        ))}
      </section>

      {datasetsLoading ? (
        <LoadingSkeleton label="Loading assessments" rows={5} />
      ) : null}

      <div className="view-tabs">
        {['Active', 'Ready for review', 'Completed', 'All assessments'].map(
          (item) => (
            <button
              className={tab === item ? 'active' : ''}
              onClick={() => {
                setTab(item);
                setPage(1);
              }}
              key={item}
            >
              {item}
              {item === 'Active' && tab === 'Active' ? (
                <span>
                  {assessmentsQuery.data?.assessmentResponse.count ?? 0}
                </span>
              ) : null}
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
            run?.status === 'completed' ? 100 : applicabilityProgress;
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
              </div>
              <p className="record-code">{item.assessment_code}</p>
              <h2>{dataset?.name ?? item.dataset_code}</h2>
              <div className="assessment-meta">
                <span>
                  <MapPin size={13} /> {dataset?.country ?? 'Registry dataset'}
                </span>
                <span>
                  <Layers3 size={13} />
                  {dataset?.modality || 'Modality not specified'}
                </span>
              </div>
              <div className="progress-header">
                <span>
                  {item.status === 'completed'
                    ? 'Assessment complete'
                    : run?.status === 'completed'
                      ? 'Applicability complete · Workbench ready'
                      : 'Applicability check'}
                </span>
                <strong>{run ? `${progress}%` : 'Not started'}</strong>
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
                    setSelected(item);
                  }}
                >
                  Open <ArrowRight size={14} />
                </button>
              </div>
            </article>
          );
        })}
        {records.length === 0 && !datasetsLoading && !message ? (
          <div className="assessment-empty-state">
            <FileCheck2 size={28} />
            <h3>No assessments in this view</h3>
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

      {(assessmentsQuery.data?.assessmentResponse.count ?? 0) > 20 && (
        <div className="report-pagination">
          <button
            className="button secondary"
            disabled={!assessmentsQuery.data?.assessmentResponse.previous}
            onClick={() => setPage(page - 1)}
          >
            Previous assessments
          </button>
          <span>Page {page}</span>
          <button
            className="button secondary"
            disabled={!assessmentsQuery.data?.assessmentResponse.next}
            onClick={() => setPage(page + 1)}
          >
            Next assessments
          </button>
        </div>
      )}
      <AssessmentPreviewDialog
        assessment={selected}
        dataset={selected ? datasetMap[selected.dataset_code] : undefined}
        run={selectedRun}
        report={report}
        loading={
          selectedReportQuery.isPending && selectedRun?.status === 'completed'
        }
        error={selectedReportQuery.error?.message}
        busy={busy}
        onClose={() => setSelected(null)}
        onRetry={() => void selectedReportQuery.refetch()}
        onStart={() => selected && void startRun(selected)}
        onWorkbench={() => selected && openWorkbench(selected)}
      />

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
        <details>
          <summary className="button secondary">
            Assessment context guide
          </summary>
          <p>
            Describe the dataset’s modality, intended task, population and
            collection period when setting up the assessment. In the workbench,
            add the dataset and supporting documentation under Sources. Use each
            metric’s requested inputs and evidence guidance to resolve missing
            information.
          </p>
        </details>
      </section>

      <AssessmentDatasetDialog
        open={datasetChooserOpen}
        onOpenChange={setDatasetChooserOpen}
        onSelect={(datasetCode) => {
          setDatasetChooserOpen(false);
          setAssessmentDatasetCode(datasetCode);
        }}
      />
      <AssessmentSetupDialog
        datasetCode={assessmentDatasetCode}
        onOpenChange={(open) => !open && setAssessmentDatasetCode(null)}
        onCreated={() => void assessmentsQuery.refetch()}
      />
      <AssessmentQuestionnaireDialog
        runId={questionnaireRunId}
        assessmentCode={
          records.find(
            (assessment) =>
              runState[assessment.assessment_code]?.id === questionnaireRunId
          )?.assessment_code ?? null
        }
        onOpenChange={(open) => {
          if (!open) {
            if (questionnaireRunId) {
              void queryClient.invalidateQueries({
                queryKey: ['assessment-report', questionnaireRunId],
              });
            }
            setQuestionnaireRunId(null);
            void assessmentsQuery.refetch();
          }
        }}
      />
    </>
  );
}

function ReviewsView() {
  const assignmentsQuery = useQuery({
    queryKey: ['review-assignments', 'page_size=100'],
    queryFn: () => api.reviewAssignments('page_size=100'),
  });
  const assignments = assignmentsQuery.data?.results ?? [];
  const loading = assignmentsQuery.isPending;
  const loadError = assignmentsQuery.error?.message ?? '';

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
          <LoadingSkeleton label="Loading review assignments" />
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

function GovernanceView() {
  const [tab, setTab] = useState('Framework versions');
  const governanceQuery = useQuery({
    queryKey: ['governance-overview'],
    enabled: liveApiEnabled,
    queryFn: () =>
      Promise.allSettled([
        api.frameworkVersions('page_size=100'),
        api.frameworkProposals('page_size=100'),
        api.auditEvents('page_size=20'),
        api.verifyAuditChain(),
      ]),
  });
  const [versionResult, proposalResult, auditResult, integrityResult] =
    governanceQuery.data ?? [];
  const versions =
    versionResult?.status === 'fulfilled' ? versionResult.value.results : [];
  const proposals =
    proposalResult?.status === 'fulfilled' ? proposalResult.value.results : [];
  const audit =
    auditResult?.status === 'fulfilled' ? auditResult.value.results : [];
  const integrity =
    integrityResult?.status === 'fulfilled' ? integrityResult.value : null;
  const failedResult = governanceQuery.data?.find(
    (result) => result.status === 'rejected'
  );
  const loadError =
    governanceQuery.error?.message ??
    (failedResult?.status === 'rejected'
      ? failedResult.reason instanceof Error
        ? failedResult.reason.message
        : 'Governance data could not be loaded.'
      : '');

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

      {governanceQuery.isPending ? (
        <LoadingSkeleton label="Loading governance data" rows={4} />
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
