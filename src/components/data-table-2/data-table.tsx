import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ChevronDown } from "lucide-react";
import MonsterRune1 from "@/models/monster/monsterRune1";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function DataTable<TData, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      "type.tags": false,
      monsterName: false,
    });
  const [rowSelection, setRowSelection] = React.useState({});

  const getUniqueTags = (data: MonsterRune1[]) => {
    const allTags = data.flatMap((rune) => {
      if (typeof rune.type !== "string" && Array.isArray(rune.type?.tags)) {
        return rune.type.tags;
      }
      return [];
    });

    return Array.from(new Set(allTags));
  };

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const uniqueTags = getUniqueTags(data as MonsterRune1[]); // `data` es tu array de MonsterRune1
  const tagColumn = table.getColumn("type.tags");
  const tierColumn = table.getColumn("tier");
  const tiers = [0, 1, 2, 3, 4, 5];

  return (
    <div className="w-full">
      <div className="flex items-center py-4 space-x-2">
        <Input
          placeholder="Filter name..."
          value={(table.getColumn("name")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("name")?.setFilterValue(event.target.value)
          }
          className="max-w-sm"
        />
        {table.getColumn("monsterName") && (
          <Input
            placeholder="Filter Monster Origin Name..."
            value={
              (table.getColumn("monsterName")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("monsterName")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
        {table.getColumn("effect") && (
          <Input
            placeholder="Filter effect..."
            value={
              (table.getColumn("effect")?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table.getColumn("effect")?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
        {tagColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="max-w-sm">
                Tags <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 overflow-auto">
              {uniqueTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={
                    (tagColumn.getFilterValue() as string[])?.includes(tag) ??
                    false
                  }
                  onCheckedChange={(checked) => {
                    const current =
                      (tagColumn.getFilterValue() as string[]) ?? [];
                    if (checked) {
                      tagColumn.setFilterValue([...current, tag]);
                    } else {
                      tagColumn.setFilterValue(
                        current.filter((t) => t !== tag)
                      );
                    }
                  }}
                >
                  {tag}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {tierColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="max-w-sm">
                Tier <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 overflow-auto">
              {tiers.map((tier) => (
                <DropdownMenuCheckboxItem
                  key={tier}
                  checked={
                    (tierColumn.getFilterValue() as number[])?.includes(tier) ??
                    false
                  }
                  onCheckedChange={(checked) => {
                    const current =
                      (tierColumn.getFilterValue() as number[]) ?? [];
                    if (checked) {
                      tierColumn.setFilterValue([...current, tier]);
                    } else {
                      tierColumn.setFilterValue(
                        current.filter((t) => t !== tier)
                      );
                    }
                  }}
                >
                  {tier}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {/* Dropdown para Type */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              Type
              <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {/* Opción para limpiar el filtro */}
            <DropdownMenuCheckboxItem
              key="all-types"
              checked={!table.getColumn("type.type")?.getFilterValue()}
              onCheckedChange={() => {
                table.getColumn("type.type")?.setFilterValue(undefined);
              }}
            >
              All Types
            </DropdownMenuCheckboxItem>

            {(
              [
                ...new Set(
                  table
                    .getPreFilteredRowModel()
                    .rows.map((row) => row.getValue("type.type"))
                ),
              ] as string[]
            )
              .filter(Boolean)
              .map((type: string) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={
                    table.getColumn("type.type")?.getFilterValue() === type
                  }
                  onCheckedChange={(checked) => {
                    if (checked) {
                      table.getColumn("type.type")?.setFilterValue(type);
                    } else {
                      table.getColumn("type.type")?.setFilterValue(undefined);
                    }
                  }}
                >
                  {type}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="ml-auto">
              Columns <ChevronDown />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        {/* <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div> */}
        <div className="space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
