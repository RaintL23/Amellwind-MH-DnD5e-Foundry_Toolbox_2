import { useCallback, useMemo } from "react";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/data-table/data-table";
import {
  createNameColumn,
  createSourcePageColumn,
  getEntityRowId,
} from "@/components/data-table/data-table-columns";
import { CompendiumMobileCard } from "@/shared/components/CompendiumMobileCard";
import { cn } from "@/shared/utils/cn";

interface ConditionEntry {
  id: string;
  name: string;
  source: string;
  page?: number;
  summary: string;
}

const TONE_BADGE = {
  condition: "border-rose-800/40 bg-rose-950/30 text-rose-300",
  disease: "border-purple-800/40 bg-purple-950/30 text-purple-300",
} as const;

interface ConditionEntryDataTableProps<T extends ConditionEntry> {
  entries: T[];
  tone: keyof typeof TONE_BADGE;
  /** Label shown in the Type column; must be a stable reference. */
  getBadge: (entry: T) => string;
  onRowClick: (entry: T) => void;
}

/** Shared table for the Conditions / Diseases tabs (Amellwind MH and D&D 5e). */
export function ConditionEntryDataTable<T extends ConditionEntry>({
  entries,
  tone,
  getBadge,
  onRowClick,
}: ConditionEntryDataTableProps<T>) {
  const columns = useMemo<ColumnDef<T>[]>(
    () => [
      createNameColumn<T>(),
      {
        id: "type",
        header: "Type",
        enableSorting: false,
        cell: ({ row }) => (
          <span
            className={cn(
              "inline-block whitespace-nowrap rounded border px-1.5 py-0.5 text-[10px] font-medium",
              TONE_BADGE[tone],
            )}
          >
            {getBadge(row.original)}
          </span>
        ),
      },
      {
        id: "summary",
        header: "Summary",
        enableSorting: false,
        meta: { hideBelowMd: true },
        cell: ({ row }) => (
          <p className="line-clamp-2 max-w-xl text-xs text-muted-foreground">
            {row.original.summary}
          </p>
        ),
      },
      createSourcePageColumn<T>(),
    ],
    [tone, getBadge],
  );

  const renderMobileRow = useCallback(
    (entry: T) => (
      <CompendiumMobileCard
        title={entry.name}
        onSelect={() => onRowClick(entry)}
        primary={<span>{getBadge(entry)}</span>}
        secondary={<span className="line-clamp-2">{entry.summary}</span>}
      />
    ),
    [getBadge, onRowClick],
  );

  return (
    <DataTable
      columns={columns}
      data={entries}
      getRowId={getEntityRowId}
      onRowClick={onRowClick}
      pageSize={25}
      enableSearchToolbar={false}
      renderMobileRow={renderMobileRow}
    />
  );
}
