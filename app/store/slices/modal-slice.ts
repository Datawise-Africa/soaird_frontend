import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { useCallback, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '..';

/**
 * Augment this interface to register typed modals:
 *
 * ```ts
 * declare module '~/store/slices/modal-slice' {
 *   interface ModalRegistry {
 *     'confirm-delete': { id: string; name: string };
 *     'edit-user': { userId: string };
 *   }
 * }
 * ```
 *
 * Then `useAppModal('confirm-delete')` will infer `data` as `{ id: string; name: string } | null`.
 * Unregistered keys still work but `data` falls back to `unknown`.
 */
export interface ModalRegistry {}

type ModalData<K extends string> = K extends keyof ModalRegistry
  ? ModalRegistry[K]
  : unknown;

interface ModalEntry {
  isOpen: boolean;
  data: unknown;
}

interface ModalState {
  modals: Record<string, ModalEntry>;
}

const initialState: ModalState = {
  modals: {},
};

const defaultEntry: ModalEntry = { isOpen: false, data: null };

const modalSlice = createSlice({
  name: 'modals',
  initialState,
  reducers: {
    openModal(state, action: PayloadAction<{ key: string; data?: unknown }>) {
      const { key, data } = action.payload;
      state.modals[key] = { isOpen: true, data: data ?? null };
    },
    closeModal(state, action: PayloadAction<string>) {
      const entry = state.modals[action.payload];
      if (entry) {
        entry.isOpen = false;
        entry.data = null;
      }
    },
    toggleModal(state, action: PayloadAction<string>) {
      const entry = state.modals[action.payload];
      if (entry) {
        entry.isOpen = !entry.isOpen;
        if (!entry.isOpen) entry.data = null;
      } else {
        state.modals[action.payload] = { isOpen: true, data: null };
      }
    },
    closeAllModals(state) {
      for (const key of Object.keys(state.modals)) {
        state.modals[key] = { ...defaultEntry };
      }
    },
  },
});

export const { openModal, closeModal, toggleModal, closeAllModals } =
  modalSlice.actions;

export function useAppModal<K extends string>(key: K) {
  const dispatch = useAppDispatch();
  const entry = useAppSelector(
    (state) => state.modals.modals[key] ?? defaultEntry
  );

  const open = useCallback(
    (data?: ModalData<K>) => dispatch(openModal({ key, data })),
    [dispatch, key]
  );

  const close = useCallback(() => dispatch(closeModal(key)), [dispatch, key]);

  const toggle = useCallback(() => dispatch(toggleModal(key)), [dispatch, key]);

  return useMemo(
    () => ({
      isOpen: entry.isOpen,
      data: entry.data as ModalData<K> | null,
      open,
      close,
      toggle,
    }),
    [entry.isOpen, entry.data, open, close, toggle]
  );
}

export default modalSlice.reducer;
