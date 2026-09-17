import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";
import { DataTable } from "@/components/data-table/data-table";
import { bestiaryColumns } from "./bestiary-columns";

interface BestiaryDataTableProps {
  creatures: BestiaryCreature[];
  onRowClick: (creature: BestiaryCreature) => void;
}

export function BestiaryDataTable({
  creatures,
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
      initialColumnVisibility={{ environment: false }}
      enableSearchToolbar={false}
    />
  );
}
