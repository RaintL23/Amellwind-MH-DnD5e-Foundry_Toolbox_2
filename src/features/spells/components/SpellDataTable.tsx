import { Table } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Spell } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SCHOOL_NAMES } from "../mappers/spell.mapper";
import { spellColumns, spellGlobalFilter } from "./spell-columns";

const LEVEL_OPTIONS = [
  { value: "", label: "All levels" },
  { value: "0", label: "Cantrip" },
  { value: "1", label: "1st" },
  { value: "2", label: "2nd" },
  { value: "3", label: "3rd" },
  { value: "4", label: "4th" },
  { value: "5", label: "5th" },
  { value: "6", label: "6th" },
  { value: "7", label: "7th" },
  { value: "8", label: "8th" },
  { value: "9", label: "9th" },
];

const SCHOOL_OPTIONS = [
  { value: "", label: "All schools" },
  ...Object.entries(SCHOOL_NAMES).map(([code, name]) => ({
    value: code,
    label: name,
  })),
];

// type QuickFilter = "" | "ritual" | "concentration";

// const QUICK_FILTERS: Array<{ value: QuickFilter; label: string }> = [
//   { value: "", label: "All" },
//   { value: "ritual", label: "Ritual" },
//   { value: "concentration", label: "Concentration" },
// ];

interface SpellDataTableProps {
  spells: Spell[];
  classOptions: string[];
  sourceOptions: string[];
  onRowClick: (spell: Spell) => void;
}

function SpellDataTableToolbar({
  table,
  classOptions,
  sourceOptions,
}: {
  table: Table<Spell>;
  classOptions: string[];
  sourceOptions: string[];
}) {
  // const flagsFilter =
  //   (table.getColumn("flags")?.getFilterValue() as string) ?? "";
  // const quickFilter: QuickFilter =
  //   flagsFilter === "ritual" || flagsFilter === "concentration"
  //     ? flagsFilter
  //     : "";

  // function setQuickFilter(value: QuickFilter) {
  //   table.getColumn("flags")?.setFilterValue(value || undefined);
  //   table.setPageIndex(0);
  // }

  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {filteredCount} of {totalCount} spells
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
            placeholder="Search name, school, class..."
            className="pl-9 h-8 text-sm"
          />
        </div>

        <Select
          value={(table.getColumn("level")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table
              .getColumn("level")
              ?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[120px] text-xs"
        >
          {LEVEL_OPTIONS.map(({ value, label }) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={
            (table.getColumn("schoolName")?.getFilterValue() as string) ?? ""
          }
          onChange={(e) => {
            table
              .getColumn("schoolName")
              ?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[140px] text-xs"
        >
          {SCHOOL_OPTIONS.map(({ value, label }) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={(table.getColumn("classNames")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table
              .getColumn("classNames")
              ?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[140px] text-xs"
        >
          <option value="">All classes</option>
          {classOptions.map((cls) => (
            <option key={cls} value={cls}>
              {cls}
            </option>
          ))}
        </Select>

        <Select
          value={(table.getColumn("source")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table
              .getColumn("source")
              ?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[120px] text-xs"
        >
          <option value="">All sources</option>
          {sourceOptions.map((source) => (
            <option key={source} value={source}>
              {source}
            </option>
          ))}
        </Select>
      </div>

      {/* <div className="flex flex-wrap gap-1">
        {QUICK_FILTERS.map(({ value, label }) => (
          <button
            key={value || "all"}
            type="button"
            onClick={() => setQuickFilter(value)}
            className={cn(
              "rounded-md border px-2.5 py-1 text-xs font-medium transition-colors",
              quickFilter === value
                ? "border-violet-500 bg-violet-500/20 text-violet-400"
                : "border-border bg-card text-muted-foreground hover:bg-accent",
            )}
          >
            {label}
          </button>
        ))}
      </div> */}
    </div>
  );
}

export function SpellDataTable({
  spells,
  classOptions,
  sourceOptions,
  onRowClick,
}: SpellDataTableProps) {
  return (
    <DataTable
      columns={spellColumns}
      data={spells}
      onRowClick={onRowClick}
      emptyMessage="No spells found with those filters."
      pageSize={25}
      globalFilterFn={spellGlobalFilter}
      initialColumnVisibility={{ classNames: false }}
      toolbar={(table) => (
        <SpellDataTableToolbar
          table={table}
          classOptions={classOptions}
          sourceOptions={sourceOptions}
        />
      )}
    />
  );
}
