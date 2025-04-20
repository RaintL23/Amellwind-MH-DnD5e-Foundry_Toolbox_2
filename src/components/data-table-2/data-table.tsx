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
import { Enviroments } from "@/features/monsters/list/components/columns";
// import { getAllCRs } from "@/api/monsters/monstersClient";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  hideControls?: boolean;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  hideControls,
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
    return Array.from(new Set(allTags)).sort((a, b) => a.localeCompare(b));
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

  const hasColumn = (id: string) => {
    return table.getAllColumns().some((col) => col.id === id)
      ? table.getColumn(id)
      : undefined;
  };

  const columnName = hasColumn("name");
  const uniqueTags = getUniqueTags(data as MonsterRune1[]);
  const tagColumn = hasColumn("type.tags");
  const tierColumn = hasColumn("tier");
  const typeColumn = hasColumn("type.type");
  const monsterNameColumn = hasColumn("monsterName");
  const effectColumn = hasColumn("effect");
  const enviromentColumn = hasColumn("environment");
  const tiers = [
    {
      tier: 0,
      cr: "",
    },
    {
      tier: 1,
      cr: "CR 1 - 5",
    },
    {
      tier: 2,
      cr: "CR 6 - 10",
    },
    {
      tier: 3,
      cr: "CR 11 - 15",
    },
    {
      tier: 4,
      cr: "CR 16 - 20",
    },
    {
      tier: 5,
      cr: "CR 20+",
    },
  ];
  // const crColumn = hasColumn("cr");
  // const CRs = getAllCRs();

  return (
    <div className="w-full">
      <div className="flex items-center py-4 space-x-2">
        {columnName && (
          <Input
            placeholder="Filter name..."
            value={(columnName?.getFilterValue() as string) ?? ""}
            onChange={(event) => columnName?.setFilterValue(event.target.value)}
            className="max-w-sm"
          />
        )}
        {monsterNameColumn && (
          <Input
            placeholder="Filter Monster Origin Name..."
            value={(monsterNameColumn?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              monsterNameColumn?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        )}
        {effectColumn && (
          <Input
            placeholder="Filter effect..."
            value={(effectColumn?.getFilterValue() as string) ?? ""}
            onChange={(event) =>
              effectColumn?.setFilterValue(event.target.value)
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
            <DropdownMenuContent
              align="start"
              className="max-h-64 overflow-auto"
            >
              {uniqueTags.map((tag) => (
                <DropdownMenuCheckboxItem
                  key={tag}
                  checked={
                    (tagColumn.getFilterValue() as string[])?.includes(tag) ??
                    false
                  }
                  onSelect={(e) => e.preventDefault()}
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
                  key={tier.tier}
                  checked={
                    (tierColumn?.getFilterValue() as number[])?.includes(
                      tier.tier
                    ) ?? false
                  }
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => {
                    const current =
                      (tierColumn?.getFilterValue() as number[]) ?? [];
                    if (checked) {
                      tierColumn?.setFilterValue([...current, tier.tier]);
                    } else {
                      tierColumn?.setFilterValue(
                        current.filter((t) => t !== tier.tier)
                      );
                    }
                  }}
                >
                  {tier.tier} ({tier.cr})
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {typeColumn && (
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
        )}
        {enviromentColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="max-w-sm">
                Enviroment <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="max-h-64 overflow-auto">
              {Enviroments.map((env) => (
                <DropdownMenuCheckboxItem
                  key={env.label}
                  checked={
                    (enviromentColumn?.getFilterValue() as string[])?.includes(
                      env.value
                    ) ?? false
                  }
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => {
                    const current =
                      (enviromentColumn?.getFilterValue() as string[]) ?? [];
                    if (checked) {
                      enviromentColumn?.setFilterValue([...current, env.value]);
                    } else {
                      enviromentColumn?.setFilterValue(
                        current.filter((t) => t !== env.value)
                      );
                    }
                  }}
                >
                  {env.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {/* {crColumn && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="max-w-sm">
                Challenge Rating <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="max-h-64 overflow-auto"
            >
              {CRs.map((cr) => (
                <DropdownMenuCheckboxItem
                  key={cr}
                  checked={
                    (crColumn.getFilterValue() as string[])?.includes(cr) ??
                    false
                  }
                  onSelect={(e) => e.preventDefault()}
                  onCheckedChange={(checked) => {
                    const current =
                      (crColumn.getFilterValue() as string[]) ?? [];
                    if (checked) {
                      crColumn.setFilterValue([...current, cr]);
                    } else {
                      crColumn.setFilterValue(current.filter((t) => t !== cr));
                    }
                  }}
                >
                  {cr}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )} */}
        {!hideControls && (
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
                      onSelect={(e) => e.preventDefault()}
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
        )}
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
      {!hideControls && (
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
      )}
    </div>
  );
}
