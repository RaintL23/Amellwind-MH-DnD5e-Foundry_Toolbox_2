import { useEffect, useMemo, useRef, useState } from "react";
import { Table } from "@tanstack/react-table";
import { ChevronDown, Search } from "lucide-react";
import { Class } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/shared/utils/cn";
import { classColumns, classGlobalFilter } from "./class-columns";

const CASTER_OPTIONS = [
  { value: "", label: "All casters" },
  { value: "full", label: "Full caster" },
  { value: "1/2", label: "Half caster" },
  { value: "1/3", label: "Third caster" },
  { value: "artificer", label: "Artificer" },
  { value: "none", label: "None" },
];

export const DEFAULT_EXCLUDED_SOURCES = ["UATheMysticClass"] as const;

export function defaultSelectedSources(sourceOptions: string[]): string[] {
  return sourceOptions.filter(
    (source) => !DEFAULT_EXCLUDED_SOURCES.includes(source as (typeof DEFAULT_EXCLUDED_SOURCES)[number]),
  );
}

interface ClassDataTableProps {
  classes: Class[];
  sourceOptions: string[];
  onRowClick: (cls: Class) => void;
}

function SourceMultiSelect({
  options,
  selected,
  onChange,
}: {
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open]);

  const allSelected = selected.length === options.length;
  const label =
    selected.length === 0
      ? "No sources"
      : allSelected
        ? "All sources"
        : `${selected.length} sources`;

  function toggleSource(source: string) {
    if (selected.includes(source)) {
      onChange(selected.filter((s) => s !== source));
    } else {
      onChange([...selected, source].sort((a, b) => a.localeCompare(b)));
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-8 min-w-[140px] items-center justify-between gap-2 rounded-md border border-input bg-background px-3 text-xs",
          "hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <span className="truncate">{label}</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 shrink-0 opacity-60 transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-1 max-h-64 w-56 overflow-y-auto rounded-md border border-border bg-popover p-2 shadow-md">
          <div className="mb-2 flex gap-2 border-b border-border pb-2">
            <button
              type="button"
              className="text-[11px] text-sky-400 hover:underline"
              onClick={() => onChange([...options])}
            >
              All
            </button>
            <button
              type="button"
              className="text-[11px] text-muted-foreground hover:underline"
              onClick={() => onChange([])}
            >
              None
            </button>
          </div>
          <ul className="space-y-1">
            {options.map((source) => {
              const checked = selected.includes(source);
              return (
                <li key={source}>
                  <label className="flex cursor-pointer items-center gap-2 rounded px-1.5 py-1 text-xs hover:bg-muted/60">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleSource(source)}
                      className="rounded border-border"
                    />
                    <span className="font-mono">{source}</span>
                  </label>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function ClassDataTableToolbar({
  table,
  sourceOptions,
}: {
  table: Table<Class>;
  sourceOptions: string[];
}) {
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;

  const selectedSources =
    (table.getColumn("source")?.getFilterValue() as string[] | undefined) ??
    defaultSelectedSources(sourceOptions);

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {filteredCount} of {totalCount} classes
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
            placeholder="Search name, subclass, source..."
            className="pl-9 h-8 text-sm"
          />
        </div>

        <Select
          value={
            (table
              .getColumn("casterProgression")
              ?.getFilterValue() as string) ?? ""
          }
          onChange={(e) => {
            table
              .getColumn("casterProgression")
              ?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[130px] text-xs"
        >
          {CASTER_OPTIONS.map(({ value, label }) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <SourceMultiSelect
          options={sourceOptions}
          selected={selectedSources}
          onChange={(next) => {
            table.getColumn("source")?.setFilterValue(next);
            table.setPageIndex(0);
          }}
        />
      </div>
    </div>
  );
}

export function ClassDataTable({
  classes,
  sourceOptions,
  onRowClick,
}: ClassDataTableProps) {
  const initialSourceFilter = useMemo(
    () => defaultSelectedSources(sourceOptions),
    [sourceOptions],
  );

  const initialColumnFilters = useMemo(
    () => [{ id: "source", value: initialSourceFilter }],
    [initialSourceFilter],
  );

  return (
    <DataTable
      columns={classColumns}
      data={classes}
      onRowClick={onRowClick}
      emptyMessage="No classes found with those filters."
      pageSize={25}
      globalFilterFn={classGlobalFilter}
      initialColumnVisibility={{ edition: false }}
      initialColumnFilters={initialColumnFilters}
      toolbar={(table) => (
        <ClassDataTableToolbar table={table} sourceOptions={sourceOptions} />
      )}
    />
  );
}
