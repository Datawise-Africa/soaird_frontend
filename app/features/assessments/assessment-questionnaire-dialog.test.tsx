import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { SourcePanel } from './assessment-questionnaire-dialog';
import { api, type AssessmentSource } from '~/lib/api/soaird-client';

vi.mock('~/lib/utils/toast', () => ({
  toastUtils: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

function renderSourcePanel(onAdded = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <SourcePanel
        assessmentCode="ASMT-TEST"
        sources={[]}
        onAdded={onAdded}
      />
    </QueryClientProvider>
  );
  return onAdded;
}

describe('SourcePanel', () => {
  it('clears the URL and native file input after a successful add', async () => {
    const user = userEvent.setup();
    const onAdded = renderSourcePanel();
    vi.spyOn(api, 'addAssessmentSource').mockResolvedValueOnce({
      processing_status: 'ready',
      processing_error: '',
    } as AssessmentSource);

    const urlInput = screen.getByLabelText('Public source URL (optional)');
    const fileInput = screen.getByLabelText(
      'Upload file (optional)'
    ) as HTMLInputElement;
    await user.type(urlInput, 'https://example.org/source.csv');
    await user.upload(
      fileInput,
      new File(['id,label\n1,test'], 'source.csv', { type: 'text/csv' })
    );
    expect(fileInput.files).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Add source' }));

    await waitFor(() => expect(onAdded).toHaveBeenCalledOnce());
    expect(urlInput).toHaveValue('');
    expect(
      (screen.getByLabelText('Upload file (optional)') as HTMLInputElement)
        .files
    ).toHaveLength(0);
  });
});