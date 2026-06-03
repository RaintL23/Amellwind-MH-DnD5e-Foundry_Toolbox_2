import { memo } from "react";
import { Table } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { Class } from "@/shared/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SourceOption } from "@/features/spells/services/book-source.service";
import { CASTER_OPTIONS, defaultSelectedSources } from "./class-table.constants";
import { SourceMultiSelect } from "./SourceMultiSelect";

interface ClassDataTableToolbarProps {
  table: Table<Class>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  sourceOptions: SourceOption[];
}

export const ClassDataTableToolbar = memo(function ClassDataTableToolbar({
  table,
  searchValue,
  onSearchChange,
  filteredCount,
  totalCount,
  sourceOptions,
}: ClassDataTableToolbarProps) {
  const selectedSources =
    (table.getColumn("source")?.getFilterValue() as string[] | undefined) ??
    defaultSelectedSources(sourceOptions.map((option) => option.value));

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {filteredCount} of {totalCount} classes
      </p>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
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
});
