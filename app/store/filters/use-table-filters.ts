import { useMemo } from 'react';
import {
  selectTableFilters,
  tableFiltersActions,
  toApiParams,
  type FilterValue,
  type TableSort,
} from '../slices/table-filters-slice';
import { useAppDispatch, useAppSelector } from '..';

/**
 * Hook that returns filter state + bound actions for a specific table.
 *
 * @example
 * const { state, params, setSearch, setFilter, reset } =
 *   useTableFilters("categories");
 *
 * // Pass params directly to your query
 * const { data } = useQuery({ queryKey: ["categories", params], ... });
 *
 * // Set filters directly as key-value
 * setFilter("status", "active");
 * setSearch("react");
 */
export function useTableFilters(table: string) {
  const state = useAppSelector((root) => selectTableFilters(table)(root));
  const dispatch = useAppDispatch();

  const actions = useMemo(
    () => ({
      setSearch: (search: string) =>
        dispatch(tableFiltersActions.setSearch({ table, search })),
      setPage: (page: number) =>
        dispatch(tableFiltersActions.setPage({ table, page })),
      setLimit: (limit: number) =>
        dispatch(tableFiltersActions.setLimit({ table, limit })),
      setFilter: (key: string, value: FilterValue) =>
        dispatch(tableFiltersActions.setFilter({ table, key, value })),
      removeFilter: (key: string) =>
        dispatch(tableFiltersActions.removeFilter({ table, key })),
      setSort: (sort: TableSort[]) =>
        dispatch(tableFiltersActions.setSort({ table, sort })),
      reset: () => dispatch(tableFiltersActions.reset({ table })),
    }),
    [dispatch, table]
  );

  const params = useMemo(() => toApiParams(state), [state]);

  return { state, params, ...actions };
}
