/**
 * MonsterDataTable Component
 *
 * A fully-featured data table for displaying Monster Hunter monsters
 * Features:
 * - Sorting by all columns
 * - Text filtering by name
 * - Filtering by CR, Type, and Environment
 * - Pagination
 * - Responsive design
 * - Row click for details (placeholder)
 */

import * as React from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip } from "@/components/ui/tooltip";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { Monster } from "../types/monster.types";
import {
  getCRValue,
  getMonsterType,
  getMonsterSize,
  formatCR,
} from "../services/monster.service";

interface MonsterDataTableProps {
  data: Monster[];
  onRowClick?: (monster: Monster) => void;
}

/**
 * Column definitions for the monster table
 * Defines how each column is displayed and sorted
 */
const columns: ColumnDef<Monster>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-accent"
        >
          Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "size",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Size
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const size = getMonsterSize(row.original.size);
      return <div className="text-sm">{size}</div>;
    },
  },
  {
    accessorKey: "type",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Type
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const type = getMonsterType(row.original.type);
      return <Badge variant="secondary">{type}</Badge>;
    },
    filterFn: (row, _id, value) => {
      const type = getMonsterType(row.original.type);
      return value.includes(type);
    },
  },
  {
    accessorKey: "cr",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          CR
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const cr = row.original.cr;
      return <div className="text-sm font-mono">{formatCR(cr)}</div>;
    },
    sortingFn: (rowA, rowB) => {
      const crA = getCRValue(rowA.original.cr);
      const crB = getCRValue(rowB.original.cr);
      return crA - crB;
    },
    filterFn: (row, _id, value) => {
      const formattedCR = formatCR(row.original.cr);
      return formattedCR === value;
    },
  },
  {
    accessorKey: "environment",
    header: "Environment",
    cell: ({ row }) => {
      const env = row.original.environment;
      if (!env || env.length === 0)
        return <span className="text-muted-foreground">—</span>;

      const visibleEnvironments = env.slice(0, 2);
      const hiddenEnvironments = env.slice(2);

      return (
        <div className="flex flex-wrap gap-1">
          {visibleEnvironments.map((e, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {e}
            </Badge>
          ))}
          {hiddenEnvironments.length > 0 && (
            <Tooltip
              content={
                <div className="flex flex-col gap-1">
                  {hiddenEnvironments.map((e, i) => (
                    <span key={i}>{e}</span>
                  ))}
                </div>
              }
            >
              <Badge
                variant="outline"
                className="text-xs cursor-help hover:bg-accent"
              >
                +{hiddenEnvironments.length}
              </Badge>
            </Tooltip>
          )}
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      const environments = row.original.environment;
      if (!environments || environments.length === 0) return false;
      return environments.some((env) => env === value);
    },
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => (
      <div className="text-xs text-muted-foreground">
        {row.getValue("source")}
      </div>
    ),
  },
];

export function MonsterDataTable({ data, onRowClick }: MonsterDataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    initialState: {
      pagination: {
        pageSize: 20,
      },
    },
  });

  // Extract unique types and CRs for filters
  const uniqueTypes = React.useMemo(() => {
    const types = new Set<string>();
    data.forEach((monster) => {
      const type = getMonsterType(monster.type);
      types.add(type);
    });
    return Array.from(types).sort();
  }, [data]);

  const uniqueCRs = React.useMemo(() => {
    const crs = new Set<string>();
    data.forEach((monster) => {
      if (monster.cr) {
        crs.add(formatCR(monster.cr));
      }
    });
    return Array.from(crs).sort((a, b) => {
      // Extract the base CR value for sorting (before any " / " or parentheses)
      const extractBaseCR = (crStr: string) => {
        const baseCR = crStr.split(" / ")[0].split(" (")[0];
        return getCRValue(baseCR);
      };
      return extractBaseCR(a) - extractBaseCR(b);
    });
  }, [data]);

  const uniqueEnvironments = React.useMemo(() => {
    const environments = new Set<string>();
    data.forEach((monster) => {
      if (monster.environment && monster.environment.length > 0) {
        monster.environment.forEach((env) => environments.add(env));
      }
    });
    return Array.from(environments).sort();
  }, [data]);

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search - Takes full width on mobile, spans 2 columns on desktop */}
        <div className="md:col-span-2 lg:col-span-1">
          <Input
            placeholder="Search monsters..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full"
          />
        </div>

        {/* Type Filter */}
        <div>
          <Select
            value={
              (table.getColumn("type")?.getFilterValue() as string) ?? "all"
            }
            onChange={(event) => {
              const value = event.target.value;
              table
                .getColumn("type")
                ?.setFilterValue(value === "all" ? undefined : [value]);
            }}
            className="w-full"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </Select>
        </div>

        {/* CR Filter */}
        <div>
          <Select
            value={(table.getColumn("cr")?.getFilterValue() as string) ?? "all"}
            onChange={(event) => {
              const value = event.target.value;
              table
                .getColumn("cr")
                ?.setFilterValue(value === "all" ? undefined : value);
            }}
            className="w-full"
          >
            <option value="all">All CRs</option>
            {uniqueCRs.map((cr) => (
              <option key={cr} value={cr}>
                CR {cr}
              </option>
            ))}
          </Select>
        </div>

        {/* Environment Filter */}
        <div>
          <Select
            value={
              (table.getColumn("environment")?.getFilterValue() as string) ??
              "all"
            }
            onChange={(event) => {
              const value = event.target.value;
              table
                .getColumn("environment")
                ?.setFilterValue(value === "all" ? undefined : value);
            }}
            className="w-full"
          >
            <option value="all">All Environments</option>
            {uniqueEnvironments.map((env) => (
              <option key={env} value={env}>
                {env}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                  onClick={() => onRowClick?.(row.original)}
                  className="cursor-pointer"
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
                  No monsters found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing {table.getRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} monsters
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <div className="text-sm">
            Page {table.getState().pagination.pageIndex + 1} of{" "}
            {table.getPageCount()}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
