import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
        key={activeWorkspace.id}
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

export function ImportTrackerDialog({
  open,
  onOpenChange,
  onCompleted,
}: Readonly<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCompleted: () => void;
}>) {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [preview, setPreview] = useState<DatasetImportJob | null>(null);
  const [resumeId, setResumeId] = useState<string | null>(null);
  const [rowPage, setRowPage] = useState(1);
  const storageKey = `soaird:tracker-import:${activeWorkspace.id}`;
  useEffect(() => {
    if (open && !preview) setResumeId(window.localStorage.getItem(storageKey));
  }, [open, preview, storageKey]);
  const jobId = preview?.id ?? resumeId;
  const completionNotified = useRef<string | null>(null);
  const form = useForm<DatasetImportInput>({
    resolver: datasetImportResolver,
    defaultValues: { file: undefined, sheet_name: 'Datasets' },
  });
  const trackedJob = useQuery({
    queryKey: ['dataset-import', jobId],
    queryFn: () => api.datasetImport(jobId!),
    enabled: Boolean(jobId && open),
    refetchInterval: (query) =>
      ['pending', 'running'].includes(
        (query.state.data as DatasetImportJob | undefined)?.status ??
          preview?.status ??
          ''
      )
        ? 2500
        : false,
  });
  const job = trackedJob.data ?? preview;
  const pendingTooLong =
    job?.status === 'pending' &&
    Boolean(job.confirmed_at) &&
    trackedJob.dataUpdatedAt - Date.parse(job.confirmed_at!) > 60000;
  const previewMutation = useMutation({
    mutationFn: (values: DatasetImportInput) =>
      api.previewDatasetImport({
        ...values,
        organization: activeWorkspace.personal ? null : activeWorkspace.id,
      }),
    onSuccess: (job) => {
      setPreview(job);
      setResumeId(job.id);
      setRowPage(1);
      queryClient.setQueryData(['dataset-import', job.id], job);
      window.localStorage.setItem(storageKey, job.id);
    },
    onError: (error) => applyApiErrors(error, form.setError),
  });
  const confirm = useMutation({
    mutationFn: (id: string) => api.confirmDatasetImport(id),
    onSuccess: ({ job: confirmed }) => {
      setPreview(confirmed);
      setResumeId(confirmed.id);
      window.localStorage.setItem(storageKey, confirmed.id);
      queryClient.setQueryData(['dataset-import', confirmed.id], confirmed);
      if (confirmed.status !== 'failed')
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
    if (!job || completionNotified.current === `${job.id}:${job.status}`)
      return;
    if (job.status === 'completed') {
      completionNotified.current = `${job.id}:${job.status}`;
      toastUtils.success(
        'Tracker imported',
        `${job.summary.imported ?? 0} datasets were added.`
      );
      onCompleted();
    } else if (job.status === 'failed') {
      completionNotified.current = `${job.id}:${job.status}`;
      toastUtils.error(
        'Tracker import failed',
        job.errors.at(-1)?.message ||
          'The import worker could not complete the tracker.'
      );
    }
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
    setResumeId(null);
    setRowPage(1);
    window.localStorage.removeItem(storageKey);
    completionNotified.current = null;
    form.reset({ file: undefined, sheet_name: 'Datasets' });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (previewMutation.isPending || confirm.isPending) return;
        onOpenChange(next);
      }}
    >
      <DialogContent
        className="max-h-[90vh] overflow-y-auto sm:max-w-4xl"
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
        <ol className="import-steps" aria-label="Import progress">
          <li className={!job ? 'active' : ''}>
            <span>1</span>Choose tracker
          </li>
          <li className={job?.status === 'previewed' ? 'active' : ''}>
            <span>2</span>Review rows
          </li>
          <li className={job && job.status !== 'previewed' ? 'active' : ''}>
            <span>3</span>Import datasets
          </li>
        </ol>
        {trackedJob.isError && (
          <div className="report-notice" role="alert">
            <div>
              <strong>Import status could not be loaded</strong>
              <p>{trackedJob.error.message}</p>
              <Button
                variant="outline"
                onClick={() => void trackedJob.refetch()}
              >
                Refresh status
              </Button>
              <Button variant="outline" onClick={reset}>
                Choose another tracker
              </Button>
            </div>
          </div>
        )}
        {resumeId && !job && trackedJob.isPending ? (
          <p role="status">Loading your previous import…</p>
        ) : null}
        {!job ? (
          <Form {...form}>
            <form
              className="grid gap-4"
              onSubmit={form.handleSubmit((values) =>
                previewMutation.mutate(values)
              )}
            >
              <div className="import-guide">
                <strong>Start with a clean tracker</strong>
                <ol>
                  <li>
                    Put column headings in the first row, with one dataset per
                    row.
                  </li>
                  <li>
                    Include a <b>Dataset name</b> column. Add modality, country
                    and domain to make assessment and cohort filtering easier.
                  </li>
                  <li>
                    For Excel, use a sheet named <b>Datasets</b> or enter its
                    name below. A workbook with one sheet is detected
                    automatically.
                  </li>
                </ol>
                <strong>Optional columns</strong>
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
                placeholder="Datasets"
              />
              <p className="text-xs text-muted-foreground">
                Ignored for CSV. Export CSV as UTF-8; comma, semicolon and tab
                separators are supported. Maximum 10,000 data rows.
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
            <p className="text-sm text-muted-foreground">
              {job.status === 'completed'
                ? `${job.summary.imported ?? 0} ${job.summary.imported === 1 ? 'dataset' : 'datasets'} added. Invalid and duplicate rows were skipped.`
                : 'Only valid rows will be imported. Invalid and duplicate rows are skipped; existing datasets are not overwritten.'}
              {job.sheet_name ? ` Worksheet: ${job.sheet_name}.` : ''}
            </p>
            <div className="import-preview-table">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Row</th>
                    <th>Dataset</th>
                    <th>Modality</th>
                    <th>Status / guidance</th>
                  </tr>
                </thead>
                <tbody>
                  {job.rows
                    .slice((rowPage - 1) * 50, rowPage * 50)
                    .map((row) => (
                      <tr key={row.id}>
                        <td>{row.row_number}</td>
                        <td>
                          {String(
                            row.normalized_data.name || 'Missing dataset name'
                          )}
                        </td>
                        <td>
                          {String(
                            row.normalized_data.modality || 'Not specified'
                          )}
                        </td>
                        <td>
                          <strong className={`import-row-status ${row.status}`}>
                            {row.status}
                          </strong>
                          <span>
                            {row.errors.map((item) => item.message).join(' ') ||
                              (row.status === 'duplicate'
                                ? 'Already registered or repeated in this tracker.'
                                : '')}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {job.rows.length > 50 && (
              <div className="report-pagination">
                <Button
                  variant="outline"
                  disabled={rowPage === 1}
                  onClick={() => setRowPage(rowPage - 1)}
                >
                  Previous rows
                </Button>
                <span>
                  Page {rowPage} of {Math.ceil(job.rows.length / 50)}
                </span>
                <Button
                  variant="outline"
                  disabled={rowPage * 50 >= job.rows.length}
                  onClick={() => setRowPage(rowPage + 1)}
                >
                  Next rows
                </Button>
              </div>
            )}
            {rowsWithIssues.length ? (
              <Button
                variant="outline"
                onClick={() => downloadImportIssues(rowsWithIssues)}
              >
                <Download size={14} />
                Download row issues ({rowsWithIssues.length})
              </Button>
            ) : null}
            {job.errors.map((error) => (
              <p className="inline-error" key={error.message}>
                {error.message}
              </p>
            ))}
            {['pending', 'running'].includes(job.status) ? (
              <div className="import-progress" role="status">
                <strong>
                  {job.status === 'pending'
                    ? 'Your import is queued.'
                    : 'Your datasets are being registered.'}
                </strong>
                <p>
                  You can close this window. Reopen Import tracker to check
                  progress.
                </p>
                {pendingTooLong && (
                  <p>
                    This is taking longer than expected. You can retry safely;
                    duplicate records will not be created.
                  </p>
                )}
              </div>
            ) : null}
            <DialogFooter>
              {['previewed', 'completed', 'failed'].includes(job.status) ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={reset}
                  disabled={confirm.isPending}
                >
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
                    : `Import ${job.summary.valid ?? 0} ${job.summary.valid === 1 ? 'dataset' : 'datasets'}`}
                </Button>
              ) : null}
              {(job.status === 'failed' || pendingTooLong) && (
                <Button
                  disabled={confirm.isPending}
                  onClick={() => confirm.mutate(job.id)}
                >
                  {confirm.isPending ? 'Retrying…' : 'Retry import'}
                </Button>
              )}
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

function downloadImportIssues(rows: DatasetImportJob['rows']) {
  const cell = (value: unknown) => {
    const text = String(value ?? '');
    const safe = /^[=+@-]/.test(text.trimStart()) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  const csv = [
    ['row', 'dataset_name', 'status', 'guidance'],
    ...rows.map((row) => [
      row.row_number,
      row.normalized_data.name,
      row.status,
      row.errors.map((item) => item.message).join(' ') ||
        'Already registered or repeated in this tracker.',
    ]),
  ]
    .map((row) => row.map(cell).join(','))
    .join('\r\n');
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' })
  );
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'soaird-tracker-row-issues.csv';
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
