import { AxiosError } from 'axios';

/**
 * Pull a human-readable message out of an unknown thrown value.
 *
 * Mutation `catch` blocks should surface the API's actual reason rather than a
 * hardcoded "Please try again" — the server already told us what went wrong.
 *
 * @example
 * } catch (error) {
 *   toastUtils.error('Update Failed', extractError(error, 'Failed to update product.'));
 * }
 */
export function extractError(error: unknown, fallbackMessage?: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | { detail?: string; message?: string }
      | undefined;

    return (
      data?.detail ||
      data?.message ||
      error.message ||
      fallbackMessage ||
      'An unknown error occurred'
    );
  }

  if (error instanceof Error) return error.message;

  return fallbackMessage || 'An unknown error occurred';
}
