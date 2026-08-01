import type { Class } from "@/shared/types";
import { DataTable } from "@/components/data-table/data-table";
import { classColumns } from "./class-columns";

export {
  DEFAULT_EXCLUDED_SOURCES,
  defaultSelectedSources,
} from "./table/class-table.constants";

interface ClassDataTableProps {
  classes: Class[];
  onRowClick: (cls: Class) => void;
}

export function ClassDataTable({ classes, onRowClick }: ClassDataTableProps) {
  return (
    <DataTable
      columns={classColumns}
      data={classes}
      onRowClick={onRowClick}
      emptyMessage="No classes found with those filters."
      pageSize={25}
      initialColumnVisibility={{ edition: false }}
      toolbar={(ctx) => (
        <p className="text-xs text-muted-foreground">
          Showing {ctx.filteredCount} of {ctx.totalCount} classes
        </p>
      )}
    />
  );
}
