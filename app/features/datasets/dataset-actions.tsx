import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Plus,
  Upload,
} from 'lucide-react';
import { Form } from '~/components/ui/form';
import { Button } from '~/components/ui/button';
import { DropZone } from '~/components/ui/drop-zone';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '~/components/ui/dialog';
import { FormTextField } from '~/components/form-fields';
import {
  api,
  ApiError,
  type DatasetImportJob,
  type DatasetInput,
} from '~/lib/api/soaird-client';
import {
  datasetImportResolver,
  datasetRegistrationResolver,
  type DatasetImportInput,
  type DatasetRegistrationInput,
} from '~/lib/schema/dataset.schema';
import { toastUtils } from '~/lib/utils/toast';
import { useWorkspace } from '~/features/workspaces/workspace-context';
import {
  DatasetFormFields,
  EMPTY_DATASET,
} from '~/features/datasets/dataset-form-fields';

export function DatasetActions({
  onChanged,
}: Readonly<{ onChanged: () => void }>) {
  const { activeWorkspace } = useWorkspace();
  const [registerOpen, setRegisterOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const canManage =
    activeWorkspace.personal ||
    activeWorkspace.roles.some(
      (role) => role === 'admin' || role === 'research_lead'
    );

  return (
    <>
      <button
        className="button secondary"
        onClick={() => setImportOpen(true)}
        disabled={!canManage}
        title={
          canManage
            ? 'Bulk register datasets from a tracker file'
            : 'Dataset management permission is required'
        }
      >
        <Upload size={16} /> Import tracker
      </button>
      <button
        className="button primary"
        onClick={() => setRegisterOpen(true)}
        disabled={!canManage}
        title={
          canManage
            ? 'Register one dataset'
            : 'Dataset management permission is required'
        }
      >
        <Plus size={16} /> Register dataset
      </button>
      <RegisterDatasetDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onCreated={onChanged}
      />
      <ImportTrackerDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onCompleted={onChanged}
      />
    </>
  );
}

function RegisterDatasetDialog({
  open,
  onOpenChange,
  onCreated,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}>) {
  const { activeWorkspace } = useWorkspace();
  const form = useForm<DatasetRegistrationInput>({
    resolver: datasetRegistrationResolver,
    defaultValues: EMPTY_DATASET,
  });
  const create = useMutation({
    mutationFn: (values: DatasetRegistrationInput) => {
      const input = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== '')
      ) as DatasetInput;
      input.name = values.name.trim();
      if (!activeWorkspace.personal) input.organization = activeWorkspace.id;
      return api.createDataset(input);
    },
    onSuccess: (dataset) => {
      toastUtils.success(
        'Dataset registered',
        `${dataset.name} is now in the registry.`
      );
      form.reset(EMPTY_DATASET);
      onOpenChange(false);
      onCreated();
    },
    onError: (error) => applyApiErrors(error, form.setError),
  });

  useEffect(() => {
    if (!open) form.reset(EMPTY_DATASET);
  }, [form, open]);

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => !create.isPending && onOpenChange(next)}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        disableOutsideClose
      >
        <DialogHeader>
          <DialogTitle>Register a dataset</DialogTitle>
          <DialogDescription>
            This record will be created in{' '}
            <strong>{activeWorkspace.name}</strong>. Only the dataset name is
            required by the registry; add other metadata when it is known.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={form.handleSubmit((values) => create.mutate(values))}
          >
            <DatasetFormFields control={form.control} />
            {create.error ? (
              <p className="inline-error sm:col-span-2">
                {create.error.message}
              </p>
            ) : null}
            <DialogFooter className="sm:col-span-2">
              <Button
                type="button"
                variant="outline"
                disabled={create.isPending}
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={create.isPending}>
                {create.isPending ? 'Registering…' : 'Register dataset'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function ImportTrackerDialog({
  open,
  onOpenChange,
  onCompleted,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}>) {
  const { activeWorkspace } = useWorkspace();
  const [preview, setPreview] = useState<DatasetImportJob | null>(null);
  const completionNotified = useRef<string | null>(null);
  const form = useForm<DatasetImportInput>({
    resolver: datasetImportResolver,
    defaultValues: { file: undefined, sheet_name: 'Datasets' },
  });
  const trackedJob = useQuery({
    queryKey: ['dataset-import', preview?.id],
    queryFn: () => api.datasetImport(preview!.id),
    enabled: Boolean(
      preview && ['pending', 'running'].includes(preview.status)
    ),
    refetchInterval: (query) =>
      ['pending', 'running'].includes(
        (query.state.data as DatasetImportJob | undefined)?.status ??
          preview?.status ??
          ''
      )
        ? 1500
        : false,
  });
  const job = trackedJob.data ?? preview;
  const previewMutation = useMutation({
    mutationFn: (values: DatasetImportInput) =>
      api.previewDatasetImport({
        ...values,
        organization: activeWorkspace.personal ? null : activeWorkspace.id,
      }),
    onSuccess: setPreview,
    onError: (error) => applyApiErrors(error, form.setError),
  });
  const confirm = useMutation({
    mutationFn: (id: string) => api.confirmDatasetImport(id),
    onSuccess: ({ job: confirmed }) => {
      setPreview(confirmed);
      toastUtils.info(
        'Import started',
        'Valid rows are being added to the registry.'
      );
    },
    onError: (error) =>
      toastUtils.error(
        'Import failed',
        error instanceof Error
          ? error.message
          : 'The tracker could not be imported.'
      ),
  });

  useEffect(() => {
    if (job?.status !== 'completed' || completionNotified.current === job.id)
      return;
    completionNotified.current = job.id;
    toastUtils.success(
      'Tracker imported',
      `${job.summary.imported ?? 0} datasets were added.`
    );
    onCompleted();
  }, [job, onCompleted]);

  const rowsWithIssues = useMemo(
    () =>
      job?.rows.filter(
        (row) => row.status === 'invalid' || row.status === 'duplicate'
      ) ?? [],
    [job]
  );

  const reset = () => {
    setPreview(null);
    completionNotified.current = null;
    form.reset({ file: undefined, sheet_name: 'Datasets' });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (previewMutation.isPending || confirm.isPending) return;
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"
        disableOutsideClose
      >
        <DialogHeader>
          <DialogTitle>Import a dataset tracker</DialogTitle>
          <DialogDescription>
            Bulk register datasets in <strong>{activeWorkspace.name}</strong>{' '}
            from a CSV or Excel tracker. The file is validated first; nothing is
            imported until you confirm the preview.
          </DialogDescription>
        </DialogHeader>
        {!job ? (
          <Form {...form}>
            <form
              className="grid gap-4"
              onSubmit={form.handleSubmit((values) =>
                previewMutation.mutate(values)
              )}
            >
              <div className="rounded-md border bg-muted/30 p-4 text-sm">
                <strong>Supported columns</strong>
                <p className="mt-1 text-muted-foreground">
                  Dataset name (required), domain, country, region, geographic
                  scope, modality, hosting platform, accessibility, metadata
                  availability, source URL, licence/license, owner, contact,
                  intended use case, challenges notes and status.
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="mt-2 h-auto p-0"
                  onClick={downloadTrackerTemplate}
                >
                  <Download /> Download CSV template
                </Button>
              </div>
              <div>
                <DropZone
                  multiple={false}
                  accept=".csv,.xlsx,.xlsm"
                  disabled={previewMutation.isPending}
                  hint="CSV, XLSX or XLSM — maximum 25 MB"
                  onFiles={(files) => {
                    const file =
                      files instanceof File ? files : Array.from(files)[0];
                    if (file)
                      form.setValue('file', file, {
                        shouldValidate: true,
                        shouldDirty: true,
                      });
                  }}
                />
                <p className="mt-2 text-sm">
                  {form.watch('file')?.name || 'No tracker selected'}
                </p>
                {form.formState.errors.file ? (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.file.message}
                  </p>
                ) : null}
              </div>
              <FormTextField
                control={form.control}
                name="sheet_name"
                label="Excel worksheet name"
                required
                placeholder="Datasets"
              />
              <p className="text-xs text-muted-foreground">
                The worksheet name is ignored for CSV files.
              </p>
              {previewMutation.error ? (
                <p className="inline-error">{previewMutation.error.message}</p>
              ) : null}
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={previewMutation.isPending}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={previewMutation.isPending}>
                  {previewMutation.isPending
                    ? 'Validating…'
                    : 'Preview tracker'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        ) : (
          <div className="grid gap-4">
            <div className="flex items-center gap-3 rounded-md border p-4">
              {job.status === 'completed' ? (
                <CheckCircle2 className="text-emerald-600" />
              ) : (
                <FileSpreadsheet className="text-primary" />
              )}
              <div>
                <strong>{job.input_name}</strong>
                <p className="text-sm text-muted-foreground">
                  Status: {job.status.replaceAll('_', ' ')}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              <Summary label="Total" value={job.summary.total} />
              <Summary label="Valid" value={job.summary.valid} />
              <Summary label="Invalid" value={job.summary.invalid} />
              <Summary label="Duplicates" value={job.summary.duplicate} />
              <Summary label="Imported" value={job.summary.imported} />
            </div>
            {rowsWithIssues.length ? (
              <div className="max-h-52 overflow-auto rounded-md border">
                {rowsWithIssues.map((row) => (
                  <div
                    className="border-b p-3 text-sm last:border-0"
                    key={row.id}
                  >
                    <strong>
                      Row {row.row_number}: {row.status}
                    </strong>
                    <p className="text-muted-foreground">
                      {row.errors.map((item) => item.message).join(' ') ||
                        'This dataset already exists or is repeated in the tracker.'}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}
            {job.errors.map((error) => (
              <p className="inline-error" key={error.message}>
                {error.message}
              </p>
            ))}
            {['pending', 'running'].includes(job.status) ? (
              <p className="inline-loading">
                Importing valid rows… Keep the Celery worker running.
              </p>
            ) : null}
            <DialogFooter>
              {job.status === 'previewed' ? (
                <Button type="button" variant="outline" onClick={reset}>
                  Choose another file
                </Button>
              ) : null}
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Close
              </Button>
              {job.status === 'previewed' ? (
                <Button
                  type="button"
                  disabled={confirm.isPending || !(job.summary.valid ?? 0)}
                  onClick={() => confirm.mutate(job.id)}
                >
                  {confirm.isPending
                    ? 'Starting import…'
                    : `Import ${job.summary.valid ?? 0} valid rows`}
                </Button>
              ) : null}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Summary({
  label,
  value,
}: Readonly<{ label: string; value?: number }>) {
  return (
    <div className="rounded-md border p-3 text-center">
      <strong className="block text-lg">{value ?? 0}</strong>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

function applyApiErrors(
  error: unknown,
  setError: (name: never, error: { message: string }) => void
) {
  if (
    error instanceof ApiError &&
    error.details &&
    typeof error.details === 'object'
  ) {
    for (const [field, messages] of Object.entries(
      error.details as Record<string, unknown>
    )) {
      const message = Array.isArray(messages)
        ? String(messages[0])
        : String(messages);
      setError(field as never, { message });
    }
  }
  toastUtils.error(
    'Request failed',
    error instanceof Error
      ? error.message
      : 'Please review the form and try again.'
  );
}

function downloadTrackerTemplate() {
  const csv =
    'dataset name,domain,country,region,geographic scope,modality,hosting platform,accessibility,metadata availability,source url,licence,owner,contact,intended use case,challenges notes,status\n';
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'soaird-dataset-tracker-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}