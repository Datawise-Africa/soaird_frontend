import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  Check,
  CheckCircle2,
  FileSearch,
  FileUp,
  Play,
  Search,
  Sparkles,
} from 'lucide-react';
import {
  FormSelectField,
  FormTextField,
  FormTextareaField,
} from '~/components/form-fields';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '~/components/ui/form';
import { Input } from '~/components/ui/input';
import {
  ApiError,
  api,
  type AssessmentSource,
  type MetricEvaluationCheck,
  type QuestionnaireMetric,
} from '~/lib/api/soaird-client';
import {
  assessmentSourceResolver,
  metricAnswerResolver,
  metricInputResolver,
  type AssessmentSourceFormInput,
  type MetricAnswerFormInput,
  type MetricInputFormInput,
} from '~/lib/schema/questionnaire.schema';
import { toastUtils } from '~/lib/utils/toast';

const FINDINGS = [
  { value: 'meets', label: 'Meets the requirement' },
  { value: 'partially_meets', label: 'Partially meets' },
  { value: 'does_not_meet', label: 'Does not meet' },
  { value: 'insufficient_evidence', label: 'Insufficient evidence' },
];
const CONFIDENCE = [
  { value: 'not_provided', label: 'Not provided' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
const SOURCE_TYPES = [
  { value: 'dataset', label: 'Dataset file' },
  { value: 'metadata', label: 'Metadata or data dictionary' },
  { value: 'documentation', label: 'README or methodology' },
  { value: 'licence', label: 'Licence' },
  { value: 'publication', label: 'Publication or report' },
  { value: 'other', label: 'Other supporting source' },
];

export function AssessmentQuestionnaireDialog({
  runId,
  assessmentCode,
  onOpenChange,
}: Readonly<{
  runId: string | null;
  assessmentCode: string | null;
  onOpenChange: (open: boolean) => void;
}>) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showSources, setShowSources] = useState(false);
  const [executionQueued, setExecutionQueued] = useState(false);
  const questionnaire = useQuery({
    queryKey: ['assessment-workbench', runId],
    queryFn: () => api.questionnaire(runId!),
    enabled: Boolean(runId),
    refetchInterval: (query) => {
      const status = query.state.data?.workbench.automation_status;
      return executionQueued || status === 'queued' || status === 'running'
        ? 2500
        : false;
    },
  });
  const preflight = useQuery({
    queryKey: ['assessment-preflight', assessmentCode],
    queryFn: () => api.assessmentPreflight(assessmentCode!),
    enabled: Boolean(assessmentCode),
  });
  const metrics = useMemo(
    () =>
      questionnaire.data?.metrics.filter(
        (metric) => metric.status !== 'not_applicable'
      ) ?? [],
    [questionnaire.data?.metrics]
  );
  useEffect(() => {
    if (!selectedId && metrics.length) setSelectedId(metrics[0].id);
  }, [metrics, selectedId]);
  useEffect(() => {
    const status = questionnaire.data?.workbench.automation_status;
    if (status === 'completed' || status === 'failed') {
      setExecutionQueued(false);
    }
  }, [questionnaire.data?.workbench.automation_status]);
  const visible = useMemo(
    () =>
      metrics.filter((metric) => {
        const matchesSearch =
          `${metric.metric_code} ${metric.metric_name} ${metric.pillar_name}`
            .toLowerCase()
            .includes(search.toLowerCase());
        const matchesFilter =
          filter === 'all' ||
          (filter === 'ready' &&
            metric.suggestion?.review_status === 'ready_for_review') ||
          (filter === 'missing' &&
            metric.suggestion?.review_status === 'missing_input') ||
          (filter === 'accepted' && metric.status === 'accepted');
        return matchesSearch && matchesFilter;
      }),
    [metrics, search, filter]
  );
  const selected = metrics.find((metric) => metric.id === selectedId) ?? null;

  const execute = useMutation({
    mutationFn: () => api.executeAssessment(runId!),
    onSuccess: () => {
      setExecutionQueued(true);
      toastUtils.success(
        'Assessment automation started',
        'The system is profiling sources and drafting metric findings.'
      );
      window.setTimeout(() => questionnaire.refetch(), 2500);
      window.setTimeout(() => questionnaire.refetch(), 6000);
    },
    onError: showError('Automation could not start'),
  });
  const bulkAccept = useMutation({
    mutationFn: () => api.acceptReadySuggestions(runId!),
    onSuccess: (result) => {
      toastUtils.success(
        'System findings accepted',
        `${result.accepted} proposed findings were accepted, including clearly labelled insufficient-evidence conclusions.`
      );
      questionnaire.refetch();
    },
    onError: showError('Findings were not accepted'),
  });
  const finalize = useMutation({
    mutationFn: () => api.finalizeAssessment(runId!),
    onSuccess: () => {
      toastUtils.success(
        'Assessment completed',
        'Scores and the report are now available.'
      );
      queryClient.invalidateQueries({
        queryKey: ['assessment-workbench', runId],
      });
      onOpenChange(false);
    },
    onError: showError('Assessment could not be completed'),
  });

  return (
    <Dialog open={Boolean(runId)} onOpenChange={onOpenChange}>
      <DialogContent className="h-[94vh] max-h-[94vh] overflow-hidden p-0 sm:max-w-7xl">
        <DialogHeader className="border-b border-border px-6 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4 pr-8">
            <div>
              <DialogTitle>Assessment workbench</DialogTitle>
              <DialogDescription>
                The system drafts findings from dataset files and documentation.
                Review exceptions instead of answering every metric from
                scratch.
              </DialogDescription>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowSources((value) => !value)}
            >
              <FileUp className="mr-2 size-4" /> Sources (
              {preflight.data?.sources.length ?? 0})
            </Button>
          </div>
        </DialogHeader>
        {showSources ? (
          <SourcePanel
            assessmentCode={assessmentCode!}
            sources={preflight.data?.sources ?? []}
            onAdded={() => {
              preflight.refetch();
              questionnaire.refetch();
            }}
          />
        ) : null}
        <section className="workbench-summary">
          <Summary
            label="Applicable"
            value={preflight.data?.metrics.applicable ?? metrics.length}
          />
          <Summary
            label="System findings"
            value={questionnaire.data?.workbench.suggested ?? 0}
          />
          <Summary
            label="Ready to accept"
            value={questionnaire.data?.workbench.ready_for_review ?? 0}
          />
          <Summary
            label="Missing input"
            value={questionnaire.data?.workbench.missing_input ?? 0}
          />
          <Summary
            label="Accepted"
            value={questionnaire.data?.workbench.accepted ?? 0}
          />
          <div className="ml-auto flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={execute.isPending || executionQueued}
              onClick={() => execute.mutate()}
            >
              <Play className="mr-2 size-4" />{' '}
              {executionQueued ? 'Analysing…' : 'Run automated assessment'}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={
                !questionnaire.data?.workbench.suggested ||
                questionnaire.data.workbench.accepted >=
                  questionnaire.data.workbench.suggested ||
                bulkAccept.isPending
              }
              onClick={() => bulkAccept.mutate()}
            >
              <Check className="mr-2 size-4" /> Accept all system findings
            </Button>
            <Button
              type="button"
              disabled={
                !questionnaire.data?.workbench.automation_complete ||
                finalize.isPending
              }
              onClick={() => finalize.mutate()}
            >
              Complete assessment
            </Button>
          </div>
        </section>
        {questionnaire.error ? (
          <p className="inline-error mx-6">{questionnaire.error.message}</p>
        ) : null}
        {preflight.data?.sources.some(
          (source) => source.processing_status === 'failed'
        ) ? (
          <p className="inline-error mx-6">
            One or more sources could not be processed. Open Sources and replace
            the unsupported or invalid file.
          </p>
        ) : null}
        <div className="grid min-h-0 flex-1 md:grid-cols-[21rem_1fr]">
          <aside className="flex min-h-0 flex-col border-r border-border bg-muted/30 p-4">
            <label className="table-search w-full">
              <Search size={16} />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search metrics"
                aria-label="Search workbench metrics"
              />
            </label>
            <select
              className="mt-3"
              value={filter}
              onChange={(event) => setFilter(event.target.value)}
              aria-label="Filter findings"
            >
              <option value="all">All applicable metrics</option>
              <option value="ready">Ready to accept</option>
              <option value="missing">Missing input</option>
              <option value="accepted">Accepted</option>
            </select>
            <div className="mt-4 min-h-0 space-y-2 overflow-y-auto pr-1">
              {visible.map((metric) => (
                <button
                  key={metric.id}
                  type="button"
                  onClick={() => setSelectedId(metric.id)}
                  className={`w-full rounded-lg border p-3 text-left transition ${selectedId === metric.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-primary/60'}`}
                >
                  <span className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <b>{metric.metric_code}</b>
                    {metric.status === 'accepted' ? (
                      <CheckCircle2 className="size-4 text-primary" />
                    ) : metric.suggestion?.review_status === 'missing_input' ? (
                      <AlertCircle className="size-4 text-amber-500" />
                    ) : metric.suggestion ? (
                      <Sparkles className="size-4 text-primary" />
                    ) : null}
                  </span>
                  <strong className="mt-1 block text-sm text-foreground">
                    {metric.metric_name}
                  </strong>
                  <small className="mt-1 block text-muted-foreground">
                    {metric.pillar_name}
                  </small>
                </button>
              ))}
            </div>
          </aside>
          <main className="min-h-0 overflow-y-auto p-6">
            {selected ? (
              <MetricWorkbench
                key={`${selected.id}-${selected.answer?.revision ?? 0}-${selected.suggestion?.review_status ?? 'none'}`}
                metric={selected}
                onSaved={() => questionnaire.refetch()}
                onAutomationQueued={() => setExecutionQueued(true)}
              />
            ) : (
              <EmptyWorkbench />
            )}
          </main>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Summary({ label, value }: Readonly<{ label: string; value: number }>) {
  return (
    <div>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function EmptyWorkbench() {
  return (
    <div className="assessment-empty-state">
      <FileSearch size={28} />
      <h3>Select a metric</h3>
      <p>
        Run automated assessment first, then review the system-generated
        findings and exceptions.
      </p>
    </div>
  );
}

function SourcePanel({
  assessmentCode,
  sources,
  onAdded,
}: Readonly<{
  assessmentCode: string;
  sources: AssessmentSource[];
  onAdded: () => void;
}>) {
  const form = useForm<AssessmentSourceFormInput>({
    resolver: assessmentSourceResolver,
    defaultValues: {
      source_type: 'dataset',
      source_uri: '',
      source_file: undefined,
    },
  });
  const add = useMutation({
    mutationFn: (values: AssessmentSourceFormInput) => {
      const file =
        values.source_file instanceof FileList
          ? (values.source_file.item(0) ?? undefined)
          : undefined;
      return api.addAssessmentSource(assessmentCode, {
        source_type: values.source_type,
        file,
        source_uri: values.source_uri || undefined,
      });
    },
    onSuccess: (source) => {
      form.reset();
      if (source.processing_status === 'failed') {
        toastUtils.error(
          'Source added but not processed',
          source.processing_error || 'Use a supported file or public URL.'
        );
      } else {
        toastUtils.success(
          'Source added',
          'The source is ready for assessment preflight.'
        );
      }
      onAdded();
    },
    onError: showError('Source could not be added'),
  });
  return (
    <div className="source-inventory">
      <Form {...form}>
        <form
          className="source-panel"
          onSubmit={form.handleSubmit((values) => add.mutate(values))}
        >
          <FormSelectField
            control={form.control}
            name="source_type"
            label="What are you providing?"
            options={SOURCE_TYPES}
            required
          />
          <FormTextField
            control={form.control}
            name="source_uri"
            label="Public source URL (optional)"
            placeholder="https://…"
          />
          <FormField
            control={form.control}
            name="source_file"
            render={({ field: { onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Upload file (optional)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={undefined}
                    type="file"
                    onChange={(event) => onChange(event.target.files)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={add.isPending}>
            {add.isPending ? 'Adding…' : 'Add source'}
          </Button>
          <p>
            Direct profiling supports CSV, JSON and image ZIP archives. Text
            extraction supports PDF, DOCX, TXT, Markdown, CSV, JSON and YAML.
            URLs are recorded without unsafe server-side fetching.
          </p>
        </form>
      </Form>
      {sources.length ? (
        <div className="source-list">
          {sources.map((source) => (
            <div key={source.id}>
              <FileSearch size={15} />
              <span>
                <strong>{source.original_filename || source.source_uri}</strong>
                <small>
                  {source.source_type.replaceAll('_', ' ')} ·{' '}
                  {source.processing_status.replaceAll('_', ' ')}
                </small>
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function MetricWorkbench({
  metric,
  onSaved,
  onAutomationQueued,
}: Readonly<{
  metric: QuestionnaireMetric;
  onSaved: () => void;
  onAutomationQueued: () => void;
}>) {
  const [editing, setEditing] = useState(false);
  const [supplyingInput, setSupplyingInput] = useState(false);
  const suggestion = metric.suggestion;
  const accept = useMutation({
    mutationFn: () => api.acceptMetricSuggestion(metric.id),
    onSuccess: () => {
      toastUtils.success(
        'Finding accepted',
        `${metric.metric_code} is now part of the assessment.`
      );
      onSaved();
    },
    onError: showError('Finding was not accepted'),
  });
  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">
          {metric.pillar_code} · {metric.assessment_method.replaceAll('_', ' ')}
        </p>
        <h2 className="mt-1 text-xl font-semibold text-foreground">
          {metric.metric_name}
        </h2>
        <p className="mt-3 text-sm leading-6 text-muted-foreground">
          {metric.question}
        </p>
      </div>
      {!suggestion ? (
        <div className="assessment-empty-state">
          <Sparkles size={28} />
          <h3>No system finding yet</h3>
          <p>
            Add the available sources and run automated assessment. The system
            will calculate or draft the first-pass finding.
          </p>
        </div>
      ) : (
        <section
          className={`system-finding ${suggestion.review_status === 'missing_input' ? 'needs-input' : ''}`}
        >
          <div className="system-finding-heading">
            <span>
              <Sparkles size={16} /> System finding
            </span>
            <StatusBadge value={suggestion.review_status} />
          </div>
          <div className="system-finding-result">
            <strong>{suggestion.finding.replaceAll('_', ' ')}</strong>
            {suggestion.score !== null ? (
              <b>{Math.round(suggestion.score)}/100</b>
            ) : null}
          </div>
          {hasEvaluationChecks(suggestion.calculated_value) ? (
            <EvaluationChecklist
              checks={suggestion.calculated_value.evaluation_checks}
            />
          ) : suggestion.calculated_value ? (
            <pre>{JSON.stringify(suggestion.calculated_value, null, 2)}</pre>
          ) : null}
          <p>{suggestion.rationale}</p>
          <dl>
            <div>
              <dt>Method</dt>
              <dd>{suggestion.execution_method.replaceAll('_', ' ')}</dd>
            </div>
            <div>
              <dt>Confidence</dt>
              <dd>{suggestion.confidence}</dd>
            </div>
            <div>
              <dt>Sources used</dt>
              <dd>{suggestion.provenance.source_ids?.length ?? 0}</dd>
            </div>
          </dl>
          {suggestion.missing_inputs.length ? (
            <div className="targeted-request">
              <AlertCircle size={16} />
              <span>
                <strong>Help the system resolve this metric</strong>
                <small>
                  Add:{' '}
                  {suggestion.missing_inputs
                    .map((item) => item.replaceAll('_', ' '))
                    .join(', ')}
                </small>
              </span>
            </div>
          ) : null}
          {suggestion.review_status === 'updated_result' ? (
            <div className="targeted-request">
              <AlertCircle size={16} />
              <span>
                <strong>New system result available</strong>
                <small>
                  Your earlier accepted decision is preserved. Review this
                  revision before accepting it.
                </small>
              </span>
            </div>
          ) : null}
          <div className="flex gap-3">
            <Button
              type="button"
              disabled={accept.isPending || metric.status === 'accepted'}
              onClick={() => accept.mutate()}
            >
              {metric.status === 'accepted' ? 'Accepted' : 'Accept finding'}
            </Button>
            {suggestion.missing_inputs.length ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setSupplyingInput((value) => !value)}
              >
                Provide missing information
              </Button>
            ) : null}
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing((value) => !value)}
            >
              Edit interpretation
            </Button>
          </div>
        </section>
      )}
      {supplyingInput ? (
        <MetricInputForm
          metric={metric}
          onAutomationQueued={onAutomationQueued}
          onSaved={() => {
            setSupplyingInput(false);
            onSaved();
          }}
        />
      ) : null}
      {editing ? (
        <ManualOverrideForm
          metric={metric}
          onSaved={() => {
            setEditing(false);
            onSaved();
          }}
        />
      ) : null}
    </div>
  );
}

function hasEvaluationChecks(
  value: Record<string, unknown> | null
): value is { evaluation_checks: MetricEvaluationCheck[] } {
  return Boolean(
    value &&
      Array.isArray(value.evaluation_checks) &&
      value.evaluation_checks.length
  );
}

function EvaluationChecklist({
  checks,
}: Readonly<{ checks: MetricEvaluationCheck[] }>) {
  return (
    <div className="evaluation-checklist">
      <h3>Checks evaluated</h3>
      {checks.map((check) => (
        <article key={check.key}>
          <div>
            <strong>{check.label}</strong>
            <StatusBadge value={check.status} />
          </div>
          <p>{check.explanation}</p>
          {check.evidence?.map((evidence, index) => (
            <small key={`${check.key}-${evidence.source_id ?? index}`}>
              <b>{evidence.source_name}</b>
              {evidence.excerpt ? ` — “${evidence.excerpt}”` : ''}
            </small>
          ))}
        </article>
      ))}
    </div>
  );
}

function MetricInputForm({
  metric,
  onSaved,
  onAutomationQueued,
}: Readonly<{
  metric: QuestionnaireMetric;
  onSaved: () => void;
  onAutomationQueued: () => void;
}>) {
  const inputRequirements = metric.input_requirements ?? [];
  const providedInputs = metric.provided_inputs ?? {};
  const defaults = Object.fromEntries(
    inputRequirements.map((requirement) => [
      requirement.key,
      providedInputs[requirement.key]?.value ?? {},
    ])
  );
  const form = useForm<MetricInputFormInput>({
    resolver: metricInputResolver,
    defaultValues: { values: defaults },
  });
  const save = useMutation({
    mutationFn: (values: MetricInputFormInput) =>
      api.provideMetricInputs(metric.id, values.values),
    onSuccess: (result) => {
      onAutomationQueued();
      toastUtils.success(
        'Information saved and recalculation started',
        `${result.affected_metrics.length} affected metric${result.affected_metrics.length === 1 ? '' : 's'} will receive a new system result.`
      );
      onSaved();
    },
    onError: showError('Information was not saved'),
  });
  return (
    <Form {...form}>
      <form
        className="manual-override metric-input-form"
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
      >
        <h3>Provide missing information for {metric.metric_code}</h3>
        <p>
          This is assessment context, not an interpretation. Saving it reruns
          every metric that depends on the supplied input.
        </p>
        {inputRequirements.length === 0 ? (
          <p>
            No input fields are defined for this metric yet. Contact an
            administrator if you expected to see a form here.
          </p>
        ) : null}
        {inputRequirements.map((requirement) => (
          <fieldset key={requirement.key}>
            <legend>{requirement.label}</legend>
            <p>{requirement.description}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              {requirement.fields.map((field) => {
                const name =
                  `values.${requirement.key}.${field.name}` as const;
                return (
                  <label
                    key={`${requirement.key}-${field.name}`}
                    className={field.type === 'textarea' ? 'sm:col-span-2' : ''}
                  >
                    <span>{field.label}</span>
                    {field.type === 'select' ? (
                      <select
                        {...form.register(name, { required: field.required })}
                      >
                        <option value="">Select an option</option>
                        {field.options?.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    ) : field.type === 'textarea' ? (
                      <textarea
                        rows={3}
                        {...form.register(name, { required: field.required })}
                      />
                    ) : (
                      <Input
                        {...form.register(name, { required: field.required })}
                      />
                    )}
                    {form.formState.errors.values?.[requirement.key]?.[
                      field.name
                    ] ? (
                      <small>This field is required.</small>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save and rerun affected metrics'}
        </Button>
      </form>
    </Form>
  );
}

function StatusBadge({ value }: Readonly<{ value: string }>) {
  return <span className="status-pill">{value.replaceAll('_', ' ')}</span>;
}

function ManualOverrideForm({
  metric,
  onSaved,
}: Readonly<{ metric: QuestionnaireMetric; onSaved: () => void }>) {
  const form = useForm<MetricAnswerFormInput>({
    resolver: metricAnswerResolver,
    defaultValues: {
      finding:
        metric.answer?.finding ??
        metric.suggestion?.finding ??
        'insufficient_evidence',
      confidence:
        metric.answer?.confidence ??
        metric.suggestion?.confidence ??
        'not_provided',
      comments: metric.answer?.comments ?? '',
      evidence_url: '',
      evidence_file: undefined,
    },
  });
  const save = useMutation({
    mutationFn: async (values: MetricAnswerFormInput) => {
      await api.saveMetricAnswer(metric.id, {
        finding: values.finding,
        confidence: values.confidence,
        comments: values.comments,
        response: {},
        revision: metric.answer?.revision,
      });
      const file =
        values.evidence_file instanceof FileList
          ? (values.evidence_file.item(0) ?? undefined)
          : undefined;
      if (file || values.evidence_url)
        await api.createMetricEvidence({
          metric_result: metric.id,
          file,
          source_uri: values.evidence_url || undefined,
        });
    },
    onSuccess: () => {
      toastUtils.success(
        'Interpretation saved',
        'Review it, then accept the finding.'
      );
      onSaved();
    },
    onError: showError('Interpretation was not saved'),
  });
  return (
    <Form {...form}>
      <form
        className="manual-override"
        onSubmit={form.handleSubmit((values) => save.mutate(values))}
      >
        <h3>Researcher correction or contextual judgement</h3>
        <p>
          Only edit when the system missed context or a human judgement is
          genuinely required.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <FormSelectField
            control={form.control}
            name="finding"
            label="Finding"
            options={FINDINGS}
            required
          />
          <FormSelectField
            control={form.control}
            name="confidence"
            label="Confidence"
            options={CONFIDENCE}
          />
          <div className="sm:col-span-2">
            <FormTextareaField
              control={form.control}
              name="comments"
              label="Reason for correction"
              rows={4}
              placeholder="Explain the contextual evidence or why the system proposal should change."
            />
          </div>
          <FormTextField
            control={form.control}
            name="evidence_url"
            label="Evidence URL"
            placeholder="https://…"
          />
          <FormField
            control={form.control}
            name="evidence_file"
            render={({ field: { onChange, ...field } }) => (
              <FormItem>
                <FormLabel>Evidence file</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    value={undefined}
                    type="file"
                    onChange={(event) => onChange(event.target.files)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <Button type="submit" disabled={save.isPending}>
          {save.isPending ? 'Saving…' : 'Save correction'}
        </Button>
      </form>
    </Form>
  );
}

function showError(title: string) {
  return (error: Error) =>
    toastUtils.error(
      title,
      error instanceof ApiError ? error.message : 'Please try again.'
    );
}