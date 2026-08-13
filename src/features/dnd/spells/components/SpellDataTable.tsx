import type { Spell } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { spellColumns } from "./spell-columns";

interface SpellDataTableProps {
  spells: Spell[];
  onRowClick: (spell: Spell) => void;
}

export function SpellDataTable({ spells, onRowClick }: SpellDataTableProps) {
  return (
    <DataTable
      columns={spellColumns}
      data={spells}
      initialSorting={[
        { id: "level", desc: false },
        { id: "name", desc: false },
      ]}
      onRowClick={onRowClick}
      emptyMessage="No spells found with those filters."
      pageSize={25}
      initialColumnVisibility={{ classNames: false }}
      toolbar={(ctx) => (
        <p className="text-xs text-muted-foreground">
          Showing {ctx.filteredCount} of {ctx.totalCount} spells
        </p>
      )}
    />
  );
}
