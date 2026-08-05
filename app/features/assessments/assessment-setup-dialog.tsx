import { useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, FileCheck2 } from 'lucide-react';
import { useNavigate } from 'react-router';
import { FormTextField, FormTextareaField } from '~/components/form-fields';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { Form } from '~/components/ui/form';
import { useAuth } from '~/lib/auth/use-auth';
import { ApiError, api, type Dataset } from '~/lib/api/soaird-client';
import {
  assessmentDraftResolver,
  type AssessmentDraftFormInput,
} from '~/lib/schema/assessment.schema';
import { toastUtils } from '~/lib/utils/toast';
import { useWorkspace } from '~/features/workspaces/workspace-context';

function contextFor(dataset: Dataset) {
  return Object.fromEntries(
    Object.entries({
      domain: dataset.domain,
      country: dataset.country,
      region: dataset.region,
      modality: dataset.modality,
      hosting_platform: dataset.hosting_platform,
      accessibility: dataset.accessibility,
      metadata_available: dataset.metadata_available,
      intended_use_case: dataset.intended_use_case,
    }).filter(([, value]) => typeof value === 'string' && value.trim())
  );
}

export function AssessmentSetupDialog({
  datasetCode,
  onOpenChange,
  onCreated,
}: Readonly<{
  datasetCode: string | null;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}>) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeWorkspace } = useWorkspace();
  const idempotencyKey = useRef('');
  const dataset = useQuery({
    queryKey: ['assessment-setup-dataset', datasetCode],
    queryFn: () => api.dataset(datasetCode!),
    enabled: Boolean(datasetCode),
  });
  const framework = useQuery({
    queryKey: ['active-assessment-framework'],
    queryFn: api.activeAssessmentFramework,
    enabled: Boolean(datasetCode),
  });
  const form = useForm<AssessmentDraftFormInput>({
    resolver: assessmentDraftResolver,
    defaultValues: { title: '', framework_version: '', scope_notes: '' },
  });

  useEffect(() => {
    if (!datasetCode) return;
    idempotencyKey.current = crypto.randomUUID();
  }, [datasetCode]);

  useEffect(() => {
    if (!dataset.data || !framework.data) return;
    form.reset({
      title: `${dataset.data.name} – Initial AI Readiness Assessment`,
      framework_version: framework.data.id,
      scope_notes: '',
    });
  }, [dataset.data, framework.data, form]);

  const create = useMutation({
    mutationFn: (values: AssessmentDraftFormInput) =>
      api.createAssessment({
        dataset_code: datasetCode!,
        framework_version: values.framework_version,
        title: values.title.trim(),
        scope_notes: values.scope_notes?.trim(),
        context: contextFor(dataset.data!),
        idempotency_key: idempotencyKey.current,
      }),
    onSuccess: (assessment) => {
      toastUtils.success(
        'Assessment draft created',
        `${assessment.assessment_code} is ready for setup.`
      );
      onOpenChange(false);
      onCreated?.();
      if (!onCreated) navigate('/assessments');
    },
    onError: (error) => {
      if (error instanceof ApiError && error.details) {
        Object.entries(error.details as Record<string, unknown>).forEach(
          ([field, messages]) =>
            form.setError(field as never, {
              message: Array.isArray(messages)
                ? String(messages[0])
                : String(messages),
            })
        );
      }
      toastUtils.error(
        'Assessment was not created',
        error instanceof Error
          ? error.message
          : 'Review the form and try again.'
      );
    },
  });

  const close = () => {
    if (!create.isPending) onOpenChange(false);
  };
  const record = dataset.data;

  return (
    <Dialog
      open={Boolean(datasetCode)}
      onOpenChange={(open) => !open && close()}
    >
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-3xl"
        disableOutsideClose
      >
        <DialogHeader>
          <DialogTitle>Start an assessment</DialogTitle>
          <DialogDescription>
            Create a draft first. No assessment run or readiness score begins at
            this stage.
          </DialogDescription>
        </DialogHeader>

        {dataset.isLoading || framework.isLoading ? (
          <p className="inline-loading">Preparing the assessment setup…</p>
        ) : null}
        {dataset.error || framework.error ? (
          <p className="inline-error">
            {(dataset.error ?? framework.error)?.message}
          </p>
        ) : null}

        {record && framework.data ? (
          <Form {...form}>
            <form
              className="assessment-setup-form"
              onSubmit={form.handleSubmit((values) => create.mutate(values))}
            >
              <section className="assessment-context-card">
                <span className="assessment-icon">
                  <FileCheck2 size={18} />
                </span>
                <div>
                  <small>Dataset · read only</small>
                  <strong>{record.name}</strong>
                  <p>{record.dataset_code}</p>
                </div>
                <span className="status-pill draft">Draft setup</span>
              </section>

              <dl className="dataset-record-grid assessment-context-grid">
                <ContextItem label="Workspace" value={activeWorkspace.name} />
                <ContextItem label="Assessor" value={user?.email} />
                <ContextItem label="Domain" value={record.domain} />
                <ContextItem label="Country" value={record.country} />
                <ContextItem label="Region" value={record.region} />
                <ContextItem label="Modality" value={record.modality} />
                <ContextItem
                  label="Hosting platform"
                  value={record.hosting_platform}
                />
                <ContextItem
                  label="Accessibility"
                  value={record.accessibility}
                />
                <ContextItem
                  label="Metadata available"
                  value={record.metadata_available}
                />
              </dl>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <FormTextField
                    control={form.control}
                    name="title"
                    label="Assessment title"
                    required
                  />
                </div>
                <div className="assessment-readonly-field">
                  <span>Framework version</span>
                  <strong>{framework.data.label}</strong>
                  <small>
                    Scoring version {framework.data.scoring_version} · pinned on
                    creation
                  </small>
                </div>
                <div className="assessment-readonly-field">
                  <span>Assessment mode</span>
                  <strong>Full AI-readiness assessment</strong>
                  <small>Applicability is configured in the next gate</small>
                </div>
                <input type="hidden" {...form.register('framework_version')} />
                <div className="sm:col-span-2">
                  <FormTextareaField
                    control={form.control}
                    name="scope_notes"
                    label="Scope notes (optional)"
                    placeholder="Describe the intended scope, constraints, or assessor notes."
                    rows={4}
                  />
                </div>
              </div>

              {create.error ? (
                <p className="inline-error">{create.error.message}</p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={close}
                  disabled={create.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={create.isPending}>
                  {create.isPending
                    ? 'Creating draft…'
                    : 'Create assessment draft'}
                  {!create.isPending ? <ArrowRight /> : null}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function ContextItem({
  label,
  value,
}: Readonly<{ label: string; value?: string }>) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value?.trim() || 'Not provided'}</dd>
    </div>
  );
}