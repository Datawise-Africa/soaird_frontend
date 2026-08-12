import { apiClient } from '~/lib/api/client';
import { env } from '~/lib/env';

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type Dataset = {
  id?: string;
  dataset_code: string;
  organization?: string | null;
  name: string;
  country?: string;
  region?: string;
  domain?: string;
  modality?: string;
  geographic_scope?: string;
  hosting_platform?: string;
  accessibility?: string;
  metadata_available?: string;
  source_url?: string;
  licence?: string;
  owner?: string;
  contact?: string;
  intended_use_case?: string;
  challenges_notes?: string;
  status?: string;
  extra_metadata?: Record<string, unknown>;
  sources?: Array<{
    id: string;
    source_type: string;
    uri: string;
    checksum: string;
    metadata: Record<string, unknown>;
    created_at: string;
  }>;
  versions?: Array<{
    id: string;
    version: string;
    source: string | null;
    checksum: string;
    metadata_snapshot: Record<string, unknown>;
    created_at: string;
  }>;
  created_at?: string;
  updated_at?: string;
};

export type DatasetInput = {
  organization?: string | null;
  name: string;
  domain?: string;
  country?: string;
  region?: string;
  geographic_scope?: string;
  modality?: string;
  hosting_platform?: string;
  accessibility?: string;
  metadata_available?: string;
  source_url?: string;
  licence?: string;
  owner?: string;
  contact?: string;
  intended_use_case?: string;
  challenges_notes?: string;
};

export type DatasetImportRow = {
  id: string;
  row_number: number;
  status: 'valid' | 'invalid' | 'duplicate' | 'imported';
  normalized_data: Record<string, unknown>;
  errors: Array<{ field?: string; message: string }>;
  dataset: string | null;
};

export type DatasetImportJob = {
  id: string;
  organization: string | null;
  input_name: string;
  input_format: string;
  sheet_name: string;
  status: 'previewed' | 'pending' | 'running' | 'completed' | 'failed';
  summary: {
    automation_status:
      | 'not_started'
      | 'queued'
      | 'running'
      | 'completed'
      | 'failed';
    total?: number;
    valid?: number;
    invalid?: number;
    duplicate?: number;
    imported?: number;
  };
  errors: Array<{ message: string }>;
  rows: DatasetImportRow[];
  created_at: string;
  confirmed_at: string | null;
  completed_at: string | null;
};

export const WORKSPACE_ROLES = [
  'admin',
  'research_lead',
  'assessor',
  'reviewer',
  'adjudicator',
  'reader',
] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

export type Workspace = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  roles: WorkspaceRole[];
  member_count: number;
  created_at: string;
  updated_at: string;
};

export type WorkspaceMembership = {
  id: string;
  organization: string;
  organization_name: string;
  user: string;
  user_email: string;
  user_name: string;
  role: WorkspaceRole;
  is_active: boolean;
  created_at: string;
};

export type WorkspaceInvitation = {
  id: string;
  organization: string;
  organization_name: string;
  email: string;
  role: WorkspaceRole;
  status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  effective_status: 'pending' | 'accepted' | 'declined' | 'revoked' | 'expired';
  can_accept: boolean;
  invited_by: string;
  invited_by_name: string;
  expires_at: string;
  accepted_at: string | null;
  declined_at: string | null;
  revoked_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Assessment = {
  id: string;
  assessment_code: string;
  title: string;
  status: 'draft' | 'in_progress' | 'ready_for_review' | 'completed';
  dataset_code: string;
  dataset_name: string;
  organization: string | null;
  dataset_version: string | null;
  framework_version: string;
  context: Record<string, unknown>;
  scope_notes: string;
  created_by: string;
  assessor_email: string;
  created_at: string;
  updated_at: string;
  latest_run: AssessmentRun | null;
};

export type AssessmentFramework = {
  id: string;
  name: string;
  version: string;
  scoring_version: string;
  label: string;
};

export type AssessmentDraftInput = {
  dataset_code: string;
  framework_version: string;
  title: string;
  scope_notes?: string;
  context: Record<string, unknown>;
  idempotency_key: string;
};

export type AssessmentRun = {
  id: string;
  run_code?: string;
  kind?: string;
  status: string;
  progress_current: number;
  progress_total: number;
};

export type AssessmentSource = {
  id: string;
  source_type:
    | 'dataset'
    | 'metadata'
    | 'documentation'
    | 'licence'
    | 'publication'
    | 'collection_methodology'
    | 'preprocessing'
    | 'provenance'
    | 'consent_privacy'
    | 'governance'
    | 'security'
    | 'version_history'
    | 'community_review'
    | 'institutional_capacity'
    | 'sustainability'
    | 'experiment_results'
    | 'other';
  ingestion_mode: 'upload' | 'reference' | 'import_url';
  original_filename: string;
  source_uri: string;
  content_type: string;
  size_bytes: number | null;
  discovered_inputs: string[];
  processing_status: string;
  processing_error: string;
  created_at: string;
};

export type AssessmentPreflight = {
  assessment_code: string;
  sources: AssessmentSource[];
  available_inputs: string[];
  metrics: {
    applicable: number;
    automated: number;
    evidence_assisted: number;
    researcher_judgement: number;
    blocked: number;
  };
};

export type MetricSuggestion = {
  id: string;
  finding: MetricAnswer['finding'];
  confidence: MetricAnswer['confidence'];
  score: number | null;
  calculated_value: Record<string, unknown> | null;
  rationale: string;
  execution_method: string;
  missing_inputs: string[];
  provenance: {
    source_ids?: string[];
    dataset_profile?: Record<string, unknown> | null;
  };
  review_status:
    | 'ready_for_review'
    | 'missing_input'
    | 'accepted'
    | 'edited'
    | 'updated_result';
  revision: number;
  generated_at: string;
};

export type MetricInputField = {
  name: string;
  label: string;
  type:
    | 'text'
    | 'textarea'
    | 'select'
    | 'number'
    | 'date'
    | 'url'
    | 'boolean'
    | 'tags';
  required: boolean;
  options?: Array<{ value: string; label: string }>;
};

export type MetricInputRequirement = {
  key: string;
  label: string;
  description: string;
  fields: MetricInputField[];
  delivery_modes?: Array<
    'structured' | 'upload' | 'import_url' | 'reference_url' | 'text'
  >;
  source_type?: AssessmentSource['source_type'];
};

export type AssessmentInput = {
  id: string;
  input_key: string;
  value: Record<string, string>;
  revision: number;
  supplied_by_email: string | null;
  updated_at: string;
};

export type MetricEvaluationCheck = {
  key: string;
  label: string;
  status:
    | 'demonstrated'
    | 'partially_demonstrated'
    | 'contradicted'
    | 'not_demonstrated'
    | 'not_checked';
  explanation: string;
  evidence?: Array<{
    source_id?: string;
    source_name: string;
    source_uri?: string;
    excerpt?: string;
  }>;
};

export type MetricAnswer = {
  id: string;
  metric_result: string;
  finding:
    | 'meets'
    | 'partially_meets'
    | 'does_not_meet'
    | 'insufficient_evidence';
  response: Record<string, unknown>;
  comments: string;
  confidence: 'not_provided' | 'low' | 'medium' | 'high';
  revision: number;
  answered_by_email: string | null;
  updated_at: string;
};

export type QuestionnaireMetric = {
  id: string;
  metric_code: string;
  metric_name: string;
  pillar_code: string;
  pillar_name: string;
  applicability: string;
  assessment_method: string;
  status: string;
  explanation: string;
  question: string;
  methodology: {
    formula: string;
    checks: Array<{ key: string; label: string; weight: number }>;
  };
  required_inputs: string[];
  input_requirements: MetricInputRequirement[];
  provided_inputs: Record<string, AssessmentInput>;
  evidence_required: boolean;
  accepted_decision: {
    finding: string;
    confidence: string;
    score: number | null;
  } | null;
  answer: MetricAnswer | null;
  suggestion: MetricSuggestion | null;
  evidence: Array<{
    id: string;
    evidence_code: string;
    evidence_type: string;
    original_filename: string;
    source_uri: string;
    verification_status: string;
    collected_at: string;
  }>;
};

export type AssessmentQuestionnaire = {
  run: AssessmentRun;
  assessment: { assessment_code: string; title: string; status: string };
  progress: { answered: number; total: number };
  workbench: {
    automation_status:
      | 'not_started'
      | 'queued'
      | 'running'
      | 'completed'
      | 'failed';
    automation_error: string;
    suggested: number;
    ready_for_review: number;
    missing_input: number;
    accepted: number;
    resolved: number;
    unresolved: number;
    scoring_coverage_percentage: number;
    can_finalize: boolean;
    automation_complete: boolean;
  };
  metrics: QuestionnaireMetric[];
};

export type AssessmentReport = {
  report_state: 'provisional' | 'final';
  assessment: {
    run_id: string;
    assessment_code: string;
    run_code: string;
    dataset_code: string;
    dataset_name: string;
    framework: string;
    framework_version: string;
    completed_at: string | null;
  };
  summary: {
    automation_status:
      | 'not_started'
      | 'queued'
      | 'running'
      | 'completed'
      | 'failed';
    composite_score: number | null;
    assessment_completion: number | null;
    evidence_coverage: number | null;
    metric_count: number;
    applicable_metric_count: number;
    scored_metric_count: number;
    scoring_coverage: number;
    minimum_scoring_coverage: number;
    composite_publishable: boolean;
    score_warning: string;
    unresolved_metric_count: number;
  };
  pillars: Array<{
    pillar_code: string;
    pillar_name: string;
    effective_score: number | null;
  }>;
  metrics: Array<{
    pillar_code: string;
    metric_code: string;
    metric_name: string;
    effective_score: number | null;
    accepted_finding: string | null;
    confidence: string;
    status: string;
    explanation: string;
    recommendations: string[];
  }>;
  insights: {
    overview: string;
    outcome_counts: {
      meets: number;
      partially_meets: number;
      does_not_meet: number;
      insufficient_evidence: number;
      unresolved: number;
      not_applicable: number;
    };
    strengths: Array<{
      pillar_code: string;
      pillar_name: string;
      score: number;
      interpretation: string;
    }>;
    priority_gaps: Array<{
      pillar_code: string;
      pillar_name: string;
      score: number;
      interpretation: string;
    }>;
  };
};

type DistributionSummary = {
  count: number;
  mean: number | null;
  median: number | null;
  minimum: number | null;
  maximum: number | null;
};

export type CohortAnalytics = {
  minimum_cohort_size: number;
  population: {
    completed_assessments: number;
    assessment_completion: DistributionSummary;
    evidence_coverage: DistributionSummary;
    readiness: DistributionSummary;
    readiness_distribution: {
      highly_ready: number;
      moderately_ready: number;
      emerging: number;
      limited_readiness: number;
    };
  };
  cohorts: Array<{
    country?: string;
    region?: string;
    domain?: string;
    modality?: string;
    count: number;
    suppressed: boolean;
    statistics: DistributionSummary | null;
  }>;
  pillars: Array<{
    pillar_code: string;
    groups: Array<{
      country?: string;
      region?: string;
      domain?: string;
      modality?: string;
      count: number;
      suppressed: boolean;
      statistics: DistributionSummary | null;
    }>;
  }>;
};

type ApiErrorEnvelope = {
  detail?: string;
  message?: string;
  error?: {
    code?: string;
    message?: string;
    details?: unknown;
  };
};

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;

  constructor(
    message: string,
    status = 500,
    code = 'request_failed',
    details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const liveApiEnabled = Boolean(env.VITE_API_BASE_URL);

function queryPath(path: string, query: string): string {
  return query ? `${path}?${query}` : path;
}

function normalizeError(error: unknown): never {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (
      error as {
        response?: { status?: number; data?: ApiErrorEnvelope };
      }
    ).response;
    const payload = response?.data;
    throw new ApiError(
      payload?.error?.message ||
        payload?.detail ||
        payload?.message ||
        'We could not complete that request. Please try again.',
      response?.status,
      payload?.error?.code,
      payload?.error?.details
    );
  }

  if (error instanceof Error) throw error;
  throw new ApiError('We could not complete that request. Please try again.');
}

async function get<T>(path: string): Promise<T> {
  try {
    const { data } = await apiClient.get<T>(path);
    return data;
  } catch (error) {
    return normalizeError(error);
  }
}

async function post<T>(path: string, body?: unknown): Promise<T> {
  try {
    const { data } = await apiClient.post<T>(path, body);
    return data;
  } catch (error) {
    return normalizeError(error);
  }
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  try {
    const { data } = await apiClient.patch<T>(path, body);
    return data;
  } catch (error) {
    return normalizeError(error);
  }
}

export const api = {
  datasets(query = '') {
    return get<Paginated<Dataset>>(queryPath('/api/v1/datasets/', query));
  },

  dataset(datasetCode: string) {
    return get<Dataset>(`/api/v1/datasets/${encodeURIComponent(datasetCode)}/`);
  },

  createDataset(input: DatasetInput) {
    return post<Dataset>('/api/v1/datasets/', input);
  },

  updateDataset(datasetCode: string, input: Partial<DatasetInput>) {
    return patch<Dataset>(
      `/api/v1/datasets/${encodeURIComponent(datasetCode)}/`,
      input
    );
  },

  previewDatasetImport(input: {
    file: File;
    organization?: string | null;
    sheet_name?: string;
  }) {
    const body = new FormData();
    body.append('file', input.file);
    if (input.organization) body.append('organization', input.organization);
    body.append('sheet_name', input.sheet_name || 'Datasets');
    return post<DatasetImportJob>('/api/v1/dataset-imports/preview/', body);
  },

  datasetImport(id: string) {
    return get<DatasetImportJob>(
      `/api/v1/dataset-imports/${encodeURIComponent(id)}/`
    );
  },

  confirmDatasetImport(id: string) {
    return post<{ job: DatasetImportJob; task_id: string | null }>(
      `/api/v1/dataset-imports/${encodeURIComponent(id)}/confirm/`
    );
  },

  assessments(query = '') {
    return get<Paginated<Assessment>>(queryPath('/api/v1/assessments/', query));
  },

  createAssessment(input: AssessmentDraftInput) {
    return post<Assessment>('/api/v1/assessments/', input);
  },

  activeAssessmentFramework() {
    return get<AssessmentFramework>('/api/v1/framework-versions/active/');
  },

  runAssessment(assessmentCode: string) {
    return post<AssessmentRun>(
      `/api/v1/assessments/${encodeURIComponent(assessmentCode)}/run/`
    );
  },

  runApplicability(assessmentCode: string) {
    return post<AssessmentRun>(
      `/api/v1/assessments/${encodeURIComponent(assessmentCode)}/applicability/`
    );
  },

  runStatus(runId: string) {
    return get<AssessmentRun>(
      `/api/v1/assessment-runs/${encodeURIComponent(runId)}/status/`
    );
  },

  questionnaire(runId: string) {
    return get<AssessmentQuestionnaire>(
      `/api/v1/assessment-runs/${encodeURIComponent(runId)}/questionnaire/`
    );
  },

  assessmentPreflight(assessmentCode: string) {
    return get<AssessmentPreflight>(
      `/api/v1/assessments/${encodeURIComponent(assessmentCode)}/preflight/`
    );
  },

  addAssessmentSource(
    assessmentCode: string,
    input: {
      source_type: AssessmentSource['source_type'];
      file?: File;
      source_uri?: string;
      ingestion_mode?: AssessmentSource['ingestion_mode'];
    }
  ) {
    const body = new FormData();
    body.append('source_type', input.source_type);
    if (input.file) body.append('file', input.file);
    if (input.source_uri) body.append('source_uri', input.source_uri);
    if (input.ingestion_mode)
      body.append('ingestion_mode', input.ingestion_mode);
    return post<AssessmentSource>(
      `/api/v1/assessments/${encodeURIComponent(assessmentCode)}/sources/`,
      body
    );
  },

  executeAssessment(runId: string) {
    return post<{ run_id: string; task_id: string; status: string }>(
      `/api/v1/assessment-runs/${encodeURIComponent(runId)}/execute/`
    );
  },

  acceptMetricSuggestion(metricId: string) {
    return post<Record<string, unknown>>(
      `/api/v1/metric-results/${encodeURIComponent(metricId)}/accept-suggestion/`
    );
  },

  markInformationUnavailable(metricId: string, reason: string) {
    return post<MetricAnswer>(
      `/api/v1/metric-results/${encodeURIComponent(metricId)}/information-unavailable/`,
      { reason }
    );
  },

  acceptReadySuggestions(runId: string) {
    return post<{ accepted: number }>(
      `/api/v1/assessment-runs/${encodeURIComponent(runId)}/accept-ready/`
    );
  },

  finalizeAssessment(runId: string) {
    return post<AssessmentRun>(
      `/api/v1/assessment-runs/${encodeURIComponent(runId)}/finalize/`
    );
  },

  saveMetricAnswer(
    metricId: string,
    input: {
      finding: MetricAnswer['finding'];
      comments?: string;
      confidence?: MetricAnswer['confidence'];
      response?: Record<string, unknown>;
      revision?: number;
    }
  ) {
    return patch<MetricAnswer>(
      `/api/v1/metric-results/${encodeURIComponent(metricId)}/answer/`,
      input
    );
  },

  provideMetricInputs(
    metricId: string,
    inputs: Record<string, Record<string, unknown>>
  ) {
    return post<{
      status: string;
      task_id: string;
      trigger_metric: string;
      affected_metrics: string[];
      inputs: AssessmentInput[];
    }>(`/api/v1/metric-results/${encodeURIComponent(metricId)}/inputs/`, {
      inputs,
    });
  },

  createMetricEvidence(input: {
    metric_result: string;
    source_uri?: string;
    file?: File;
  }) {
    const body = new FormData();
    body.append('metric_result', input.metric_result);
    body.append('evidence_type', input.file ? 'file' : 'url');
    if (input.file) body.append('file', input.file);
    if (input.source_uri) body.append('source_uri', input.source_uri);
    return post<Record<string, unknown>>('/api/v1/evidence/', body);
  },

  assessmentReport(runId: string) {
    return get<AssessmentReport>(
      `/api/v1/reporting/assessment-runs/${encodeURIComponent(runId)}/`
    );
  },

  reportExportUrl(runId: string, format: 'json' | 'csv' | 'xlsx') {
    const base = env.VITE_API_BASE_URL.replace(/\/$/, '');
    return `${base}/api/v1/reporting/assessment-runs/${encodeURIComponent(
      runId
    )}/export/?format=${format}`;
  },

  async downloadAssessmentReport(
    runId: string,
    format: 'json' | 'csv' | 'xlsx'
  ) {
    try {
      const response = await apiClient.get(
        `/api/v1/reporting/assessment-runs/${encodeURIComponent(runId)}/export/?format=${format}`,
        { responseType: 'blob' }
      );
      return response.data as Blob;
    } catch (error) {
      return normalizeError(error);
    }
  },

  cohortAnalytics(
    groupBy: 'country' | 'region' | 'domain' | 'modality',
    scope = ''
  ) {
    const params = new URLSearchParams(scope);
    params.set('group_by', groupBy);
    return get<CohortAnalytics>(
      queryPath('/api/v1/reporting/analytics/cohorts/', params.toString())
    );
  },

  frameworkVersions(query = '') {
    return get<Paginated<Record<string, unknown>>>(
      queryPath('/api/v1/framework-versions/', query)
    );
  },

  frameworkProposals(query = '') {
    return get<Paginated<Record<string, unknown>>>(
      queryPath('/api/v1/framework-proposals/', query)
    );
  },

  auditEvents(query = '') {
    return get<Paginated<Record<string, unknown>>>(
      queryPath('/api/v1/audit/events/', query)
    );
  },

  verifyAuditChain() {
    return get<Record<string, unknown>>('/api/v1/audit/events/verify-chain/');
  },

  reviewAssignments(query = '') {
    return get<
      Paginated<{
        id: string;
        assessment: string;
        user: string;
        role: string;
        status: string;
        assigned_by: string | null;
        created_at: string;
        completed_at: string | null;
      }>
    >(queryPath('/api/v1/reviews/reviewer-assignments/', query));
  },

  workspaces(query = '') {
    return get<Paginated<Workspace>>(
      queryPath('/api/v1/auth/organizations/', query)
    );
  },

  workspaceMembers(organization: string) {
    return get<Paginated<WorkspaceMembership>>(
      queryPath(
        '/api/v1/auth/organization-memberships/',
        new URLSearchParams({ organization, page_size: '100' }).toString()
      )
    );
  },

  workspaceInvitations(query = '') {
    return get<Paginated<WorkspaceInvitation>>(
      queryPath('/api/v1/auth/organization-invitations/', query)
    );
  },

  inviteWorkspaceMember(input: {
    organization: string;
    email: string;
    role: WorkspaceRole;
  }) {
    return post<WorkspaceInvitation>(
      '/api/v1/auth/organization-invitations/',
      input
    );
  },

  acceptWorkspaceInvitation(id: string) {
    return post<WorkspaceMembership>(
      `/api/v1/auth/organization-invitations/${encodeURIComponent(id)}/accept/`
    );
  },

  declineWorkspaceInvitation(id: string) {
    return post<WorkspaceInvitation>(
      `/api/v1/auth/organization-invitations/${encodeURIComponent(id)}/decline/`
    );
  },

  revokeWorkspaceInvitation(id: string) {
    return post<WorkspaceInvitation>(
      `/api/v1/auth/organization-invitations/${encodeURIComponent(id)}/revoke/`
    );
  },

  resendWorkspaceInvitation(id: string) {
    return post<WorkspaceInvitation>(
      `/api/v1/auth/organization-invitations/${encodeURIComponent(id)}/resend/`
    );
  },

  acceptWorkspaceInvitationToken(token: string) {
    return post<WorkspaceMembership>(
      '/api/v1/auth/organization-invitations/accept-token/',
      { token }
    );
  },

  changeWorkspaceMemberRole(id: string, role: WorkspaceRole) {
    return post<WorkspaceMembership>(
      `/api/v1/auth/organization-memberships/${encodeURIComponent(id)}/change-role/`,
      { role }
    );
  },

  revokeWorkspaceMembership(id: string) {
    return post<WorkspaceMembership>(
      `/api/v1/auth/organization-memberships/${encodeURIComponent(id)}/revoke/`
    );
  },
};