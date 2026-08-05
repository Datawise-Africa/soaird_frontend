import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog';
import { buttonVariants } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Styles the confirm button as destructive. Use for deletes. */
  destructive?: boolean;
}

/**
 * Promise-based replacement for `window.confirm`.
 *
 * Render `confirmDialog` once in the component, then `await confirm(...)`
 * wherever you need the answer — the call site reads like the native API but
 * the dialog is styled, accessible and SSR-safe.
 *
 * @example
 * const { confirm, confirmDialog } = useConfirm();
 *
 * const handleDelete = async (id: string) => {
 *   const ok = await confirm({
 *     title: 'Delete this task?',
 *     description: 'This cannot be undone.',
 *     confirmLabel: 'Delete',
 *     destructive: true,
 *   });
 *   if (ok) deleteTask.mutate(id);
 * };
 *
 * return (<>{...}{confirmDialog}</>);
 */
export function useConfirm() {
  const [options, setOptions] = React.useState<ConfirmOptions | null>(null);

  // Held in a ref, not state: resolving is a side effect of the user's answer,
  // and re-rendering on every resolver swap would reopen the dialog.
  const resolverRef = React.useRef<((value: boolean) => void) | null>(null);

  const confirm = React.useCallback((next: ConfirmOptions) => {
    setOptions(next);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const settle = React.useCallback((answer: boolean) => {
    resolverRef.current?.(answer);
    resolverRef.current = null;
    setOptions(null);
  }, []);

  const confirmDialog = (
    <AlertDialog
      open={options !== null}
      // Covers Escape and overlay clicks too — every dismissal answers "no",
      // so an awaited `confirm()` can never hang.
      onOpenChange={(open) => {
        if (!open) settle(false);
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{options?.title}</AlertDialogTitle>
          {options?.description && (
            <AlertDialogDescription>
              {options.description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => settle(false)}>
            {options?.cancelLabel ?? 'Cancel'}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={() => settle(true)}
            className={cn(
              options?.destructive && buttonVariants({ variant: 'destructive' })
            )}
          >
            {options?.confirmLabel ?? 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { confirm, confirmDialog };
}
