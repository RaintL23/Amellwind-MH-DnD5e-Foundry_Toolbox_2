import { useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import type { ColumnFiltersState } from "@tanstack/react-table";
import type { DataTableFilterState } from "@/components/data-table/data-table.types";
import { preserveParams } from "@/shared/utils/list-url-params.utils";

/** Maps TanStack Table column ids to short URL query keys. */
export type DataTableColumnUrlMap = Record<string, string>;

interface UseDataTableUrlStateOptions {
  /** Extra query keys copied from the previous URL when filters change. */
  preserveKeys?: string[];
}

export function useDataTableUrlState(
  columnParamMap: DataTableColumnUrlMap,
  options?: UseDataTableUrlStateOptions,
) {
  const [searchParams, setSearchParams] = useSearchParams();
  const preserveKeys = options?.preserveKeys ?? [];

  const initialSearch = searchParams.get("q") ?? "";

  const initialColumnFilters = useMemo<ColumnFiltersState>(() => {
    const filters: ColumnFiltersState = [];
    for (const [columnId, paramKey] of Object.entries(columnParamMap)) {
      const value = searchParams.get(paramKey);
      if (value) filters.push({ id: columnId, value });
    }
    return filters;
  // Restore once on mount; subsequent updates flow through onFilterStateChange.
  }, []);

  const handleFilterStateChange = useCallback(
    (state: DataTableFilterState) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams();
          if (state.search) next.set("q", state.search);
          for (const filter of state.columnFilters) {
            const paramKey = columnParamMap[filter.id];
            if (!paramKey) continue;
            const value = String(filter.value ?? "");
            if (value) next.set(paramKey, value);
          }
          if (state.pageIndex > 0) {
            next.set("page", String(state.pageIndex + 1));
          }
          preserveParams(next, prev, preserveKeys);
          return next;
        },
        { replace: true },
      );
    },
    [setSearchParams, columnParamMap, preserveKeys],
  );

  return { initialSearch, initialColumnFilters, handleFilterStateChange };
}
