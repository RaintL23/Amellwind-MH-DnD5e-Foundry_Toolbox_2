import { flexRender } from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../ui/table";
import { Table as TanstackTable } from "@tanstack/table-core";
import DataTablePagination from "./data-table-pagination";
import DataTableFilterInput from "./data-table-filter-input";
import { ColumnBasic } from "../data-table-interfaces";
import { cn } from "@/lib/utils";

interface DataTableBodyProps<TData> {
  table: TanstackTable<TData>;
  columnsBasic: ColumnBasic<TData>[];
  loading: boolean;
}

const DataTableBody = <TData,>({
  table,
  columnsBasic,
  loading,
}: DataTableBodyProps<TData>) => {
  let body;
  if (loading) {
    body = (
      <TableRow>
        <TableCell
          colSpan={columnsBasic.length}
          className="h-24 space-y-4 text-center"
        >
          <span>Cargando...</span>
        </TableCell>
      </TableRow>
    );
  } else {
    body = table.getRowModel().rows?.length ? (
      table.getRowModel().rows.map((row) => (
        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
          {row.getVisibleCells().map((cell) => (
            <TableCell className="py-0.5 text-xs" key={cell.id}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </TableCell>
          ))}
        </TableRow>
      ))
    ) : (
      <TableRow>
        <TableCell colSpan={columnsBasic.length} className="h-24 text-center">
          No se han encontrado resultados.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <div className="space-y-2">
      <div className="max-h-[90dvh] overflow-y-auto rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        header.id != "select" ? "min-w-[180px]" : "",
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      <DataTableFilterInput
                        column={header.column}
                        columnsDef={columnsBasic}
                      />
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{body}</TableBody>
        </Table>
      </div>
      <DataTablePagination
        table={table}
        hasSelect={columnsBasic.some((x) => x.id === "select")}
      />
    </div>
  );
};

export default DataTableBody;
