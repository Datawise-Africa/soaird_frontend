import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import { ArrowRight, ExternalLink, Pencil, Save } from 'lucide-react';
import { Form } from '~/components/ui/form';
import { Button } from '~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { DatasetFormFields, EMPTY_DATASET } from './dataset-form-fields';
import {
  ApiError,
  api,
  type Dataset,
  type DatasetInput,
} from '~/lib/api/soaird-client';
import {
  datasetRegistrationResolver,
  type DatasetRegistrationInput,
} from '~/lib/schema/dataset.schema';
import { toastUtils } from '~/lib/utils/toast';

function text(value: unknown) {
  return typeof value === 'string' && value.trim() ? value : 'Not provided';
}

function date(value?: string) {
  return value ? new Date(value).toLocaleString() : 'Not available';
}

function formValues(dataset: Dataset): DatasetRegistrationInput {
  const metadata = String(dataset.metadata_available ?? '').toLowerCase();
  return {
    ...EMPTY_DATASET,
    name: dataset.name,
    domain: dataset.domain ?? '',
    country: dataset.country ?? '',
    region: dataset.region ?? '',
    geographic_scope: dataset.geographic_scope ?? '',
    modality: dataset.modality ?? '',
    hosting_platform: dataset.hosting_platform ?? '',
    accessibility: dataset.accessibility ?? '',
    metadata_available: ['yes', 'no', 'unknown'].includes(metadata)
      ? (metadata as 'yes' | 'no' | 'unknown')
      : '',
    source_url: dataset.source_url ?? '',
    licence: dataset.licence ?? '',
    owner: dataset.owner ?? '',
    contact: dataset.contact ?? '',
    intended_use_case: dataset.intended_use_case ?? '',
    challenges_notes: dataset.challenges_notes ?? '',
  };
}

export function DatasetRecordDialog({
  datasetCode,
  canManage,
  onOpenChange,
  onUpdated,
  onStartAssessment,
}: Readonly<{
  datasetCode: string | null;
  canManage: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated: () => void;
  onStartAssessment: (datasetCode: string) => void;
}>) {
  const [editing, setEditing] = useState(false);
  const detail = useQuery({
    queryKey: ['dataset', datasetCode],
    queryFn: () => api.dataset(datasetCode!),
    enabled: Boolean(datasetCode),
  });
  const form = useForm<DatasetRegistrationInput>({
    resolver: datasetRegistrationResolver,
    defaultValues: EMPTY_DATASET,
  });
  const update = useMutation({
    mutationFn: (values: DatasetRegistrationInput) => {
      const input = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== '')
      ) as Partial<DatasetInput>;
      input.name = values.name.trim();
      return api.updateDataset(datasetCode!, input);
    },
    onSuccess: (dataset) => {
      detail.refetch();
      form.reset(formValues(dataset));
      setEditing(false);
      onUpdated();
      toastUtils.success('Dataset updated', `${dataset.name} was updated.`);
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
        'Update failed',
        error instanceof Error
          ? error.message
          : 'Review the form and try again.'
      );
    },
  });

  useEffect(() => {
    if (detail.data) form.reset(formValues(detail.data));
  }, [detail.data, form]);

  const close = () => {
    if (update.isPending) return;
    setEditing(false);
    onOpenChange(false);
  };

  const dataset = detail.data;
  const extraMetadata = Object.entries(dataset?.extra_metadata ?? {});

  return (
    <Dialog
      open={Boolean(datasetCode)}
      onOpenChange={(open) => !open && close()}
    >
      <DialogContent
        className="max-h-[92vh] overflow-y-auto sm:max-w-4xl"
        disableOutsideClose
      >
        <DialogHeader>
          <DialogTitle>
            {editing ? 'Update dataset' : 'Full dataset record'}
          </DialogTitle>
          <DialogDescription>
            {dataset?.dataset_code ?? datasetCode} · Registry metadata and
            source history
          </DialogDescription>
        </DialogHeader>

        {detail.isLoading ? (
          <p className="inline-loading">Loading the full dataset record…</p>
        ) : null}
        {detail.error ? (
          <p className="inline-error">{detail.error.message}</p>
        ) : null}

        {dataset && editing ? (
          <Form {...form}>
            <form
              className="grid gap-4 sm:grid-cols-2"
              onSubmit={form.handleSubmit((values) => update.mutate(values))}
            >
              <DatasetFormFields control={form.control} />
              <DialogFooter className="sm:col-span-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditing(false)}
                  disabled={update.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={update.isPending}>
                  <Save /> {update.isPending ? 'Saving…' : 'Save changes'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : null}

        {dataset && !editing ? (
          <div className="dataset-full-record">
            <section className="dataset-record-heading">
              <div>
                <span className="record-code">{dataset.dataset_code}</span>
                <h2>{dataset.name}</h2>
                <p>{text(dataset.intended_use_case)}</p>
              </div>
              <span
                className={`status-pill ${String(dataset.status ?? 'discovered').replaceAll('_', '-')}`}
              >
                {String(dataset.status ?? 'discovered').replaceAll('_', ' ')}
              </span>
            </section>

            <RecordSection title="Classification and coverage">
              <RecordItem label="Domain" value={dataset.domain} />
              <RecordItem label="Modality" value={dataset.modality} />
              <RecordItem label="Country" value={dataset.country} />
              <RecordItem label="Region" value={dataset.region} />
              <RecordItem
                label="Geographic coverage"
                value={dataset.geographic_scope}
              />
              <RecordItem
                label="Workspace"
                value={
                  dataset.organization
                    ? 'Organization workspace'
                    : 'Personal workspace'
                }
              />
            </RecordSection>

            <RecordSection title="Access and documentation">
              <RecordItem
                label="Hosting platform"
                value={dataset.hosting_platform}
              />
              <RecordItem label="Accessibility" value={dataset.accessibility} />
              <RecordItem
                label="Metadata available"
                value={dataset.metadata_available}
              />
              <RecordItem label="Licence" value={dataset.licence} />
              <RecordItem label="Owner or publisher" value={dataset.owner} />
              <RecordItem label="Contact" value={dataset.contact} />
            </RecordSection>

            <section className="dataset-record-section">
              <h3>Source and research notes</h3>
              <dl className="dataset-record-grid">
                <RecordItem
                  label="Source URL"
                  value={
                    dataset.source_url ? (
                      <a
                        href={dataset.source_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Open source <ExternalLink size={14} />
                      </a>
                    ) : undefined
                  }
                />
                <RecordItem
                  label="Known challenges or notes"
                  value={dataset.challenges_notes}
                />
                <RecordItem label="Created" value={date(dataset.created_at)} />
                <RecordItem
                  label="Last updated"
                  value={date(dataset.updated_at)}
                />
              </dl>
            </section>

            <RecordSection title="Sources and versions">
              <RecordItem
                label="Registered sources"
                value={String(dataset.sources?.length ?? 0)}
              />
              <RecordItem
                label="Recorded versions"
                value={String(dataset.versions?.length ?? 0)}
              />
              {(dataset.sources ?? []).map((source) => (
                <RecordItem
                  key={source.id}
                  label={`Source · ${source.source_type}`}
                  value={
                    <a href={source.uri} target="_blank" rel="noreferrer">
                      {source.uri} <ExternalLink size={14} />
                    </a>
                  }
                />
              ))}
              {(dataset.versions ?? []).map((version) => (
                <RecordItem
                  key={version.id}
                  label="Version"
                  value={`${version.version} · ${date(version.created_at)}`}
                />
              ))}
            </RecordSection>

            {extraMetadata.length ? (
              <RecordSection title="Additional imported metadata">
                {extraMetadata.map(([key, value]) => (
                  <RecordItem
                    key={key}
                    label={key.replaceAll('_', ' ')}
                    value={String(value)}
                  />
                ))}
              </RecordSection>
            ) : null}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={close}>
                Close
              </Button>
              {canManage ? (
                <Button type="button" onClick={() => setEditing(true)}>
                  <Pencil /> Edit dataset
                </Button>
              ) : null}
              <Button
                type="button"
                onClick={() => {
                  onOpenChange(false);
                  onStartAssessment(dataset.dataset_code);
                }}
              >
                Start assessment <ArrowRight />
              </Button>
            </DialogFooter>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function RecordSection({
  title,
  children,
}: Readonly<{ title: string; children: React.ReactNode }>) {
  return (
    <section className="dataset-record-section">
      <h3>{title}</h3>
      <dl className="dataset-record-grid">{children}</dl>
    </section>
  );
}

function RecordItem({
  label,
  value,
}: Readonly<{ label: string; value?: React.ReactNode }>) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value || 'Not provided'}</dd>
    </div>
  );
}