import { useCallback, useEffect, useState } from "react";
import type {
  OnChangeFn,
  PaginationState,
  SortingState,
} from "@tanstack/react-table";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { DataTable } from "@/components/data-table/data-table";
import { Select } from "@/components/ui/select";
import { bestiaryColumns } from "./bestiary-columns";
import { BestiaryMobileCard } from "./BestiaryMobileCard";

const TABLE_STATE_KEY = "bestiary-table-state";
const DEFAULT_PAGE_SIZE = 25;
const DEFAULT_SORTING: SortingState = [{ id: "name", desc: false }];

interface PersistedTableState {
  sorting: SortingState;
  pageIndex: number;
  pageSize: number;
}

function readPersistedState(): PersistedTableState {
  try {
    const raw = sessionStorage.getItem(TABLE_STATE_KEY);
    if (!raw) {
      return {
        sorting: DEFAULT_SORTING,
        pageIndex: 0,
        pageSize: DEFAULT_PAGE_SIZE,
      };
    }
    const parsed = JSON.parse(raw) as Partial<PersistedTableState>;
    return {
      sorting: Array.isArray(parsed.sorting) && parsed.sorting.length > 0
        ? parsed.sorting
        : DEFAULT_SORTING,
      pageIndex:
        typeof parsed.pageIndex === "number" && parsed.pageIndex >= 0
          ? parsed.pageIndex
          : 0,
      pageSize:
        typeof parsed.pageSize === "number" && parsed.pageSize > 0
          ? parsed.pageSize
          : DEFAULT_PAGE_SIZE,
    };
  } catch {
    return {
      sorting: DEFAULT_SORTING,
      pageIndex: 0,
      pageSize: DEFAULT_PAGE_SIZE,
    };
  }
}

function writePersistedState(state: PersistedTableState): void {
  try {
    sessionStorage.setItem(TABLE_STATE_KEY, JSON.stringify(state));
  } catch {
    /* ignore quota / private mode */
  }
}

function getCreatureRowId(row: BestiaryCreature): string {
  return row.id;
}

type SortPreset = "name-asc" | "name-desc" | "cr-asc" | "cr-desc";

function sortingToPreset(sorting: SortingState): SortPreset {
  const first = sorting[0];
  if (!first) return "name-asc";
  if (first.id === "cr") return first.desc ? "cr-desc" : "cr-asc";
  return first.desc ? "name-desc" : "name-asc";
}

function presetToSorting(preset: SortPreset): SortingState {
  switch (preset) {
    case "name-desc":
      return [{ id: "name", desc: true }];
    case "cr-asc":
      return [{ id: "cr", desc: false }];
    case "cr-desc":
      return [{ id: "cr", desc: true }];
    default:
      return [{ id: "name", desc: false }];
  }
}

interface BestiaryDataTableProps {
  creatures: BestiaryCreature[];
  onRowClick: (creature: BestiaryCreature) => void;
  /** When this key changes (search/filters), reset to page 0. Not for data growth. */
  filterResetKey: string;
}

export function BestiaryDataTable({
  creatures,
  onRowClick,
  filterResetKey,
}: BestiaryDataTableProps) {
  const [sorting, setSorting] = useState<SortingState>(
    () => readPersistedState().sorting,
  );
  const [pagination, setPagination] = useState<PaginationState>(() => {
    const saved = readPersistedState();
    return { pageIndex: saved.pageIndex, pageSize: saved.pageSize };
  });

  useEffect(() => {
    writePersistedState({
      sorting,
      pageIndex: pagination.pageIndex,
      pageSize: pagination.pageSize,
    });
  }, [sorting, pagination.pageIndex, pagination.pageSize]);

  useEffect(() => {
    setPagination((prev) =>
      prev.pageIndex === 0 ? prev : { ...prev, pageIndex: 0 },
    );
  }, [filterResetKey]);

  const handleSortingChange: OnChangeFn<SortingState> = useCallback(
    (updater) => {
      setSorting((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const handlePaginationChange: OnChangeFn<PaginationState> = useCallback(
    (updater) => {
      setPagination((prev) =>
        typeof updater === "function" ? updater(prev) : updater,
      );
    },
    [],
  );

  const renderMobileRow = useCallback(
    (row: BestiaryCreature) => (
      <BestiaryMobileCard creature={row} onSelect={onRowClick} />
    ),
    [onRowClick],
  );

  return (
    <div className="space-y-3">
      <div className="md:hidden">
        <label className="sr-only" htmlFor="bestiary-mobile-sort">
          Sort by
        </label>
        <Select
          id="bestiary-mobile-sort"
          className="h-8 text-xs"
          value={sortingToPreset(sorting)}
          onChange={(e) =>
            setSorting(presetToSorting(e.target.value as SortPreset))
          }
        >
          <option value="name-asc">Name A–Z</option>
          <option value="name-desc">Name Z–A</option>
          <option value="cr-asc">CR low → high</option>
          <option value="cr-desc">CR high → low</option>
        </Select>
      </div>

      <DataTable
        columns={bestiaryColumns}
        data={creatures}
        getRowId={getCreatureRowId}
        onRowClick={onRowClick}
        emptyMessage="No creatures found with those filters."
        pageSize={pagination.pageSize}
        initialColumnVisibility={{}}
        enableSearchToolbar={false}
        sorting={sorting}
        onSortingChange={handleSortingChange}
        pagination={pagination}
        onPaginationChange={handlePaginationChange}
        autoResetPageIndex={false}
        renderMobileRow={renderMobileRow}
      />
    </div>
  );
}
