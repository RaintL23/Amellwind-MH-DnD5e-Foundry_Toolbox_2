import { memo } from "react";
import { Table } from "@tanstack/react-table";
import { Search } from "lucide-react";
import type { DndRace } from "@/shared/types";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SourceOption } from "@/features/spells/services/book-source.service";

interface DndRaceDataTableToolbarProps {
  table: Table<DndRace>;
  searchValue: string;
  onSearchChange: (value: string) => void;
  filteredCount: number;
  totalCount: number;
  sourceOptions: SourceOption[];
}

export const DndRaceDataTableToolbar = memo(function DndRaceDataTableToolbar({
  table,
  searchValue,
  onSearchChange,
  filteredCount,
  totalCount,
  sourceOptions,
}: DndRaceDataTableToolbarProps) {
  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {filteredCount} of {totalCount} races
      </p>
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name, parent race, tags..."
            className="pl-9 h-8 text-sm"
          />
        </div>

        <Select
          value={(table.getColumn("source")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table
              .getColumn("source")
              ?.setFilterValue(e.target.value || undefined);
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
