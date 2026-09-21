import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { api, type DatasetImportJob } from '~/lib/api/soaird-client';
import { ImportTrackerDialog } from './dataset-actions';

vi.mock('~/features/workspaces/workspace-context', () => ({
  useWorkspace: () => ({
    activeWorkspace: {
      id: 'personal',
      personal: true,
      name: 'Personal workspace',
    },
  }),
}));
vi.mock('~/lib/utils/toast', () => ({
  toastUtils: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
const preview: DatasetImportJob = {
  id: 'import1',
  organization: null,
  input_name: 'tracker.csv',
  input_format: 'csv',
  sheet_name: '',
  status: 'previewed',
  summary: { total: 2, valid: 1, invalid: 1, duplicate: 0, imported: 0 },
  errors: [],
  rows: [
    {
      id: 'one',
      row_number: 2,
      status: 'valid',
      normalized_data: { name: 'Kenya Health', modality: 'Tabular' },
      errors: [],
      dataset: null,
    },
    {
      id: 'two',
      row_number: 3,
      status: 'invalid',
      normalized_data: { name: '' },
      errors: [{ field: 'name', message: 'Dataset name is required.' }],
      dataset: null,
    },
  ],
  created_at: '2026-09-21T00:00:00Z',
  confirmed_at: null,
  completed_at: null,
};

beforeEach(() => {
  localStorage.clear();
  vi.restoreAllMocks();
});

async function previewTracker() {
  vi.spyOn(api, 'previewDatasetImport').mockResolvedValue(preview);
  vi.spyOn(api, 'datasetImport').mockResolvedValue(preview);
  const onCompleted = vi.fn();
  const { container } = render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
          },
        })
      }
    >
      <ImportTrackerDialog
        open
        onOpenChange={vi.fn()}
        onCompleted={onCompleted}
      />
    </QueryClientProvider>
  );
  const user = userEvent.setup();
  await user.upload(
    container.ownerDocument.querySelector(
      'input[type=file]'
    ) as HTMLInputElement,
    new File(['name\nKenya Health\n'], 'tracker.csv', { type: 'text/csv' })
  );
  await user.click(screen.getByRole('button', { name: 'Preview tracker' }));
  await screen.findByText('Dataset name is required.');
  return { user, onCompleted };
}

it('shows row issues and imports only valid rows after confirmation', async () => {
  vi.spyOn(api, 'confirmDatasetImport').mockResolvedValue({
    job: {
      ...preview,
      status: 'completed',
      summary: { ...preview.summary, imported: 1 },
    },
    task_id: 'task',
  });
  const { user, onCompleted } = await previewTracker();
  expect(api.confirmDatasetImport).not.toHaveBeenCalled();
  expect(screen.getByText('Kenya Health')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Import 1 dataset' }));
  await waitFor(() => expect(onCompleted).toHaveBeenCalledOnce());
  expect(screen.getByText(/1 dataset added/)).toBeInTheDocument();
});

it('offers a retry when the queue reports failure', async () => {
  vi.spyOn(api, 'confirmDatasetImport').mockResolvedValue({
    job: {
      ...preview,
      status: 'failed',
      errors: [{ message: 'The import service is temporarily unavailable.' }],
    },
    task_id: null,
  });
  const { user, onCompleted } = await previewTracker();
  await user.click(screen.getByRole('button', { name: 'Import 1 dataset' }));
  expect(
    await screen.findByRole('button', { name: 'Retry import' })
  ).toBeInTheDocument();
  expect(
    screen.getByText('The import service is temporarily unavailable.')
  ).toBeInTheDocument();
  vi.mocked(api.confirmDatasetImport).mockResolvedValue({
    job: {
      ...preview,
      status: 'completed',
      summary: { ...preview.summary, imported: 1 },
    },
    task_id: 'retry-task',
  });
  await user.click(screen.getByRole('button', { name: 'Retry import' }));
  await waitFor(() => expect(onCompleted).toHaveBeenCalledOnce());
  expect(screen.getByText(/1 dataset added/)).toBeInTheDocument();
});
