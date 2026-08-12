import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { act, render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoadingIndicator } from './loading-indicator';

function PendingRequest() {
  useQuery({
    queryKey: ['pending-loading-test'],
    queryFn: () => new Promise(() => undefined),
    retry: false,
  });
  return <LoadingIndicator />;
}

describe('LoadingIndicator', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('announces active server requests after the anti-flash delay', async () => {
    vi.useFakeTimers();
    const queryClient = new QueryClient();
    const router = createMemoryRouter([
      {
        path: '/',
        element: (
          <QueryClientProvider client={queryClient}>
            <PendingRequest />
          </QueryClientProvider>
        ),
      },
    ]);

    render(<RouterProvider router={router} />);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(160));

    expect(screen.getByRole('status')).toHaveTextContent('Loading data…');
  });
});