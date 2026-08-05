import toast from 'react-hot-toast';
import { CustomToast } from '~/components/ui/custom-toast';

/**
 * Toast utility functions with custom designs
 */

export const toastUtils = {
  /**
   * Show success toast with custom design
   */
  success: (title: string, message?: string) => {
    toast.custom(
      (t) => (
        <CustomToast
          toast={t}
          title={title}
          message={message || ''}
          type="success"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      { duration: 3000 }
    );
  },

  /**
   * Show error toast with custom design
   */
  error: (title: string, message?: string) => {
    toast.custom(
      (t) => (
        <CustomToast
          toast={t}
          title={title}
          message={message || ''}
          type="error"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      { duration: 4000 }
    );
  },

  /**
   * Show info toast with custom design
   */
  info: (title: string, message?: string) => {
    toast.custom(
      (t) => (
        <CustomToast
          toast={t}
          title={title}
          message={message || ''}
          type="info"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      { duration: 4000 }
    );
  },

  /**
   * Show warning toast with custom design
   */
  warning: (title: string, message?: string) => {
    toast.custom(
      (t) => (
        <CustomToast
          toast={t}
          title={title}
          message={message || ''}
          type="warning"
          onDismiss={() => toast.dismiss(t.id)}
        />
      ),
      { duration: 4000 }
    );
  },

  /**
   * Show loading toast and return its ID
   */
  loading: (message: string) => {
    return toast.loading(message);
  },

  /**
   * Dismiss a specific toast by ID
   */
  dismiss: (toastId: string) => {
    toast.dismiss(toastId);
  },

  /**
   * Show promise toast - automatically handles loading, success, and error states
   */
  promise: <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((err: Error) => string);
    }
  ) => {
    return toast.promise(promise, messages);
  },

  /**
   * Custom toast with custom options
   */
  custom: (message: string, options?: Parameters<typeof toast>[1]) => {
    toast(message, options);
  },
};

/**
 * Pre-configured toast messages for common actions
 */
export const toastMessages = {
  create: {
    success: (entity: string) => ({
      title: 'Success!',
      message: `${entity} has been created successfully.`,
    }),
    error: (entity: string) => ({
      title: 'Creation Failed',
      message: `Failed to create ${entity}. Please try again.`,
    }),
  },
  update: {
    success: (entity: string) => ({
      title: 'Updated!',
      message: `${entity} has been updated successfully.`,
    }),
    error: (entity: string) => ({
      title: 'Update Failed',
      message: `Failed to update ${entity}. Please try again.`,
    }),
  },
  delete: {
    success: (entity: string) => ({
      title: 'Deleted!',
      message: `${entity} has been deleted successfully.`,
    }),
    error: (entity: string) => ({
      title: 'Deletion Failed',
      message: `Failed to delete ${entity}. Please try again.`,
    }),
  },
  fetch: {
    error: (entity: string) => ({
      title: 'Loading Failed',
      message: `Failed to load ${entity}. Please try again.`,
    }),
  },
};

// Re-export toast for direct access if needed
export { toast };
