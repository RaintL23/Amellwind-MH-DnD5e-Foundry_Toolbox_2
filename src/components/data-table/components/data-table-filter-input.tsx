import { Column } from "@tanstack/react-table";
import { Input } from "../../ui/input";
import { ColumnBasic } from "../data-table-interfaces";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { DateTimePicker } from "@/components/date-time-picker/date-time-picker";

interface DataTableFilterInputProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  columnsDef: ColumnBasic<TData>[];
}

const DataTableFilterInput = <TData, TValue>({
  column,
  columnsDef,
}: DataTableFilterInputProps<TData, TValue>) => {
  const columnDef = columnsDef.find((x) => x.id == column.id);
  if (
    columnDef == undefined ||
    columnDef == null ||
    columnDef?.enableFiltering != true
  ) {
    return <></>;
  }
  const value = column.getFilterValue() ?? "";
  return (
    <div className="flex justify-center py-1">
      {columnDef.type == "enum" ? (
        <>
          <DataTableFacetedFilter
            key={`${columnDef.accessorKey}-${columnDef.headerTitle}`}
            column={column}
            title="Selección"
            options={columnDef.facetedFilters!.options}
          />
        </>
      ) : (
        <>
          {columnDef.type == "date" ? (
            <DateTimePicker
              value={value as Date}
              onChange={(x) => column.setFilterValue(x)}
              className="w-full"
            />
          ) : (
            <Input
              type={columnDef.type}
              placeholder={columnDef.filterTitle ?? `Filtrar...`}
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
              value={value as any}
              onChange={(event) => column.setFilterValue(event.target.value)}
              className="h-9 text-xs dark:invert"
            />
          )}
        </>
      )}
    </div>
  );
};

export default DataTableFilterInput;
