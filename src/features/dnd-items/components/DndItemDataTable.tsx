import { Table } from "@tanstack/react-table";
import { Search } from "lucide-react";
import { DndItem } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { SourceOption } from "@/features/spells/services/book-source.service";
import { dndItemColumns, dndItemGlobalFilter } from "./dnd-item-columns";

const MUNDANE_OPTIONS = [
  { value: "", label: "All items" },
  { value: "mundane", label: "Mundane" },
  { value: "magic", label: "Magic" },
];

interface DndItemDataTableProps {
  items: DndItem[];
  sourceOptions: SourceOption[];
  rarityOptions: string[];
  typeOptions: string[];
  onRowClick: (item: DndItem) => void;
}

function DndItemDataTableToolbar({
  table,
  sourceOptions,
  rarityOptions,
  typeOptions,
}: {
  table: Table<DndItem>;
  sourceOptions: SourceOption[];
  rarityOptions: string[];
  typeOptions: string[];
}) {
  const filteredCount = table.getFilteredRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;

  return (
    <div className="space-y-3">
      <p className="text-xs text-muted-foreground">
        Showing {filteredCount} of {totalCount} items
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
            placeholder="Search name, type, description..."
            className="pl-9 h-8 text-sm"
          />
        </div>

        <Select
          value={
            (table.getColumn("mundaneMagic")?.getFilterValue() as string) ?? ""
          }
          onChange={(e) => {
            table
              .getColumn("mundaneMagic")
              ?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[120px] text-xs"
        >
          {MUNDANE_OPTIONS.map(({ value, label }) => (
            <option key={value || "all"} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={(table.getColumn("rarity")?.getFilterValue() as string) ?? ""}
          onChange={(e) => {
            table
              .getColumn("rarity")
              ?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[130px] text-xs"
        >
          <option value="">All rarities</option>
          {rarityOptions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>

        <Select
          value={
            (table.getColumn("typeLabel")?.getFilterValue() as string) ?? ""
          }
          onChange={(e) => {
            table
              .getColumn("typeLabel")
              ?.setFilterValue(e.target.value || undefined);
            table.setPageIndex(0);
          }}
          className="h-8 w-auto min-w-[160px] text-xs"
        >
          <option value="">All types</option>
          {typeOptions.map((t) => (
            <option key={t} value={t}>
              {t}
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

export function DndItemDataTable({
  items,
  sourceOptions,
  rarityOptions,
  typeOptions,
  onRowClick,
}: DndItemDataTableProps) {
  return (
    <DataTable
      columns={dndItemColumns}
      data={items}
      onRowClick={onRowClick}
      emptyMessage="No items found with those filters."
      pageSize={25}
      globalFilterFn={dndItemGlobalFilter}
      initialColumnVisibility={{ mundaneMagic: false }}
      toolbar={(table) => (
        <DndItemDataTableToolbar
          table={table}
          sourceOptions={sourceOptions}
          rarityOptions={rarityOptions}
          typeOptions={typeOptions}
        />
      )}
    />
  );
}
