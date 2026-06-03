import { memo } from "react";
import { Table } from "@tanstack/react-table";
import { Search } from "lucide-react";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SourceOption } from "@/features/spells/services/book-source.service";
import { CR_FILTER_OPTIONS, SIZE_FILTER_OPTIONS } from "./bestiary-columns";

interface BestiaryDataTableToolbarProps {
  table: Table<BestiaryCreature>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  typeOptions: string[];
  environmentOptions: string[];
  sourceOptions: SourceOption[];
}

export const BestiaryDataTableToolbar = memo(function BestiaryDataTableToolbar({
  table,
  searchValue,
  onSearchChange,
  filteredCount,
  totalCount,
  typeOptions,
  environmentOptions,
  sourceOptions,
}: BestiaryDataTableToolbarProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {filteredCount} of {totalCount} creatures
      </p>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
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
});
