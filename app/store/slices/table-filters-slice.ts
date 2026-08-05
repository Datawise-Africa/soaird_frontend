import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

// ── Types ──────────────────────────────────────────────────────────────────────

export type SortDirection = 'asc' | 'desc';

export interface TableSort {
  field: string;
  direction: SortDirection;
}

export type FilterValue = string | string[];

export interface TableFiltersState {
  search: string;
  filters: Record<string, FilterValue>;
  sort: TableSort[];
  page: number;
  limit: number;
}

// ── Slice state ────────────────────────────────────────────────────────────────

interface SliceState {
  tables: Record<string, TableFiltersState>;
}

const defaultTableState: TableFiltersState = {
  search: '',
  filters: {},
  sort: [],
  page: 1,
  limit: 10,
};

function ensureTable(state: SliceState, table: string): TableFiltersState {
  if (!state.tables[table]) {
    state.tables[table] = { ...defaultTableState, filters: {}, sort: [] };
  }

  return state.tables[table];
}

// ── Slice ──────────────────────────────────────────────────────────────────────

const tableFiltersSlice = createSlice({
  name: 'tableFilters',
  initialState: { tables: {} } as SliceState,
  reducers: {
    setSearch(state, action: PayloadAction<{ table: string; search: string }>) {
      const t = ensureTable(state, action.payload.table);

      t.search = action.payload.search;
      t.page = 1;
    },

    setPage(state, action: PayloadAction<{ table: string; page: number }>) {
      const t = ensureTable(state, action.payload.table);

      t.page = action.payload.page;
    },

    setLimit(state, action: PayloadAction<{ table: string; limit: number }>) {
      const t = ensureTable(state, action.payload.table);

      t.limit = action.payload.limit;
      t.page = 1;
    },

    setFilter(
      state,
      action: PayloadAction<{ table: string; key: string; value: FilterValue }>
    ) {
      const t = ensureTable(state, action.payload.table);

      t.filters[action.payload.key] = action.payload.value;
      t.page = 1;
    },

    removeFilter(state, action: PayloadAction<{ table: string; key: string }>) {
      const t = state.tables[action.payload.table];

      if (t) {
        delete t.filters[action.payload.key];
        t.page = 1;
      }
    },

    setSort(
      state,
      action: PayloadAction<{ table: string; sort: TableSort[] }>
    ) {
      const t = ensureTable(state, action.payload.table);

      t.sort = action.payload.sort;
    },

    reset(state, action: PayloadAction<{ table: string }>) {
      state.tables[action.payload.table] = {
        ...defaultTableState,
        filters: {},
        sort: [],
      };
    },
  },
});

export const tableFiltersActions = tableFiltersSlice.actions;

export default tableFiltersSlice.reducer;

// ── Selectors ──────────────────────────────────────────────────────────────────

export function selectTableFilters(table: string) {
  return (state: { tableFilters: SliceState }): TableFiltersState =>
    state.tableFilters.tables[table] ?? defaultTableState;
}

// ── API param serialization ────────────────────────────────────────────────────

/**
 * Flatten a TableFiltersState into a plain params object.
 * Filters are spread directly as key-value pairs.
 */
export function toApiParams(
  state: TableFiltersState
): Record<string, string | string[] | number> {
  const params: Record<string, string | string[] | number> = {
    page: state.page,
    limit: state.limit,
  };

  if (state.search) {
    params.q = state.search;
  }

  for (const [key, value] of Object.entries(state.filters)) {
    if (value !== undefined && value !== '') {
      params[key] = value;
    }
  }

  if (state.sort.length > 0) {
    params.sort = state.sort.map((s) => `${s.field}:${s.direction}`);
  }

  return params;
}
