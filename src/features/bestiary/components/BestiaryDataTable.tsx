import { Table } from "@tanstack/react-table";
import { Search } from "lucide-react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { DataTable } from "@/components/data-table/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SourceOption } from "@/features/spells/services/book-source.service";
import {
  bestiaryColumns,
  bestiaryGlobalFilter,
  CR_FILTER_OPTIONS,
  SIZE_FILTER_OPTIONS,
} from "./bestiary-columns";

interface BestiaryDataTableProps {
  creatures: BestiaryCreature[];
  typeOptions: string[];
  environmentOptions: string[];
  sourceOptions: SourceOption[];
  onRowClick: (creature: BestiaryCreature) => void;
}

function BestiaryDataTableToolbar({
  table,
  typeOptions,
  environmentOptions,
  sourceOptions,
}: {
  table: Table<BestiaryCreature>;
  typeOptions: string[];
  environmentOptions: string[];
  sourceOptions: SourceOption[];
}) {
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {filteredCount} of {totalCount} creatures
      </p>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={(table.getState().globalFilter as string) ?? ""}
            onChange={(e) => {
              table.setGlobalFilter(e.target.value);
              table.setPageIndex(0);
            }}
            placeholder="Search name, type, CR..."
            className="pl-9 h-8 text-sm"
          />
        </div>

        <Select
          value={(table.getColumn("cr")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table.getColumn("cr")?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[100px] text-xs"
        >
          {CR_FILTER_OPTIONS.map(({ value, label }) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={(table.getColumn("size")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table.getColumn("size")?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[120px] text-xs"
        >
          {SIZE_FILTER_OPTIONS.map(({ value, label }) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={(table.getColumn("creatureType")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table
              .getColumn("creatureType")
              ?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[140px] text-xs"
        >
          <option value="">All types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </Select>

        {environmentOptions.length > 0 && (
          <Select
            value={(table.getColumn("environment")?.getFilterValue() as string) ?? ""}
            onChange={(e) => {
              table
                .getColumn("environment")
                ?.setFilterValue(e.target.value || undefined);
              table.setPageIndex(0);
            }}
            className="h-8 w-auto min-w-[140px] text-xs"
          >
            <option value="">All environments</option>
            {environmentOptions.map((env) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </Select>
        )}

        <Select
          value={(table.getColumn("source")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table.getColumn("source")?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[200px] max-w-[280px] text-xs"
        >
          <option value="">All sources</option>
          {sourceOptions.map(({ value, label }) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}

export function BestiaryDataTable({
  creatures,
  typeOptions,
  environmentOptions,
  sourceOptions,
  onRowClick,
}: BestiaryDataTableProps) {
  return (
    <DataTable
      columns={bestiaryColumns}
      data={creatures}
      getRowId={(row) => row.id}
      onRowClick={onRowClick}
      emptyMessage="No creatures found with those filters."
      pageSize={25}
      globalFilterFn={bestiaryGlobalFilter}
      initialColumnVisibility={{ environment: false }}
      toolbar={(table) => (
        <BestiaryDataTableToolbar
          table={table}
          typeOptions={typeOptions}
          environmentOptions={environmentOptions}
          sourceOptions={sourceOptions}
        />
      )}
    />
  );
}
