/**
 * RuneDataTable Component
 *
 * A fully-featured data table for displaying runes from all monsters
 * Features:
 * - Sorting by all columns
 * - Text filtering by rune name
 * - Filtering by Type (Armor/Weapon/Other)
 * - Filtering by Monster
 * - Pagination
 * - Responsive design
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { RuneWithMonster } from "../types/rune.types";

interface RuneDataTableProps {
  data: RuneWithMonster[];
}

/**
 * Get badge color based on rune type
 */
function getRuneTypeBadgeColor(type: string): string {
  switch (type.toLowerCase()) {
    case "armor":
      return "bg-blue-600 hover:bg-blue-700";
    case "weapon":
      return "bg-red-600 hover:bg-red-700";
    default:
      return "bg-purple-600 hover:bg-purple-700";
  }
}

/**
 * Column definitions for the rune table
 */
const columns: ColumnDef<RuneWithMonster>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="hover:bg-accent"
        >
          Rune Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="font-medium">{row.getValue("name")}</div>
    ),
  },
  {
    accessorKey: "tier",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Tier
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const tier = row.getValue("tier") as number;
      return (
        <Badge variant="outline" className="font-mono">
          T{tier}
        </Badge>
      );
    },
    filterFn: (row, _id, value) => {
      return value === "all" || row.getValue("tier") === Number(value);
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
      const type = row.getValue("type") as string;
      return (
        <Badge className={getRuneTypeBadgeColor(type)}>
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </Badge>
      );
    },
    filterFn: (row, _id, value) => {
      return value === "all" || row.getValue("type") === value;
    },
  },
  {
    accessorKey: "effect",
    header: "Effect",
    cell: ({ row }) => {
      const effect = row.getValue("effect") as string;
      // Truncate long effects
      const truncated =
        effect.length > 150 ? `${effect.slice(0, 150)}...` : effect;
      return (
        <div className="text-sm max-w-md" title={effect}>
          {truncated}
        </div>
      );
    },
  },
  {
    accessorKey: "intent",
    header: "Intent",
    cell: ({ row }) => {
      const intents = row.original.intent;
      if (!intents || intents.length === 0)
        return <span className="text-muted-foreground">—</span>;

      return (
        <div className="flex flex-wrap gap-1">
          {intents.slice(0, 2).map((intent, i) => (
            <Badge key={i} variant="secondary" className="text-xs">
              {intent}
            </Badge>
          ))}
          {intents.length > 2 && (
            <Badge variant="secondary" className="text-xs">
              +{intents.length - 2}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      if (value === "all") return true;
      const intents = row.original.intent || [];
      return intents.includes(value);
    },
  },
  {
    accessorKey: "weapons",
    header: "Weapons",
    cell: ({ row }) => {
      const weapons = row.original.weapons;
      if (!weapons || weapons.length === 0)
        return <span className="text-muted-foreground">—</span>;

      return (
        <div className="flex flex-wrap gap-1">
          {weapons.slice(0, 1).map((weapon, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {weapon}
            </Badge>
          ))}
          {weapons.length > 1 && (
            <Badge variant="outline" className="text-xs">
              +{weapons.length - 1}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      if (value === "all") return true;
      const weapons = row.original.weapons || [];
      return weapons.includes(value);
    },
  },
  {
    accessorKey: "classes",
    header: "Classes",
    cell: ({ row }) => {
      const classes = row.original.classes;
      if (!classes || classes.length === 0)
        return <span className="text-muted-foreground">—</span>;

      return (
        <div className="flex flex-wrap gap-1">
          {classes.slice(0, 1).map((className, i) => (
            <Badge key={i} variant="outline" className="text-xs">
              {className}
            </Badge>
          ))}
          {classes.length > 1 && (
            <Badge variant="outline" className="text-xs">
              +{classes.length - 1}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, _id, value) => {
      if (value === "all") return true;
      const classes = row.original.classes || [];
      return classes.includes(value);
    },
  },
  {
    accessorKey: "monsterName",
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
        >
          Monster
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className="text-sm font-medium">{row.getValue("monsterName")}</div>
    ),
    filterFn: (row, _id, value) => {
      return value === "all" || row.getValue("monsterName") === value;
    },
  },
];

export function RuneDataTable({ data }: RuneDataTableProps) {
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

  // Extract unique values for filters
  const uniqueTiers = React.useMemo(() => {
    const tiers = new Set<number>();
    data.forEach((rune) => {
      tiers.add(rune.tier);
    });
    return Array.from(tiers).sort();
  }, [data]);

  const uniqueTypes = React.useMemo(() => {
    const types = new Set<string>();
    data.forEach((rune) => {
      types.add(rune.type);
    });
    return Array.from(types).sort();
  }, [data]);

  const uniqueIntents = React.useMemo(() => {
    const intents = new Set<string>();
    data.forEach((rune) => {
      if (rune.intent) {
        rune.intent.forEach((intent) => intents.add(intent));
      }
    });
    return Array.from(intents).sort();
  }, [data]);

  const uniqueWeapons = React.useMemo(() => {
    const weapons = new Set<string>();
    data.forEach((rune) => {
      if (rune.weapons) {
        rune.weapons.forEach((weapon) => weapons.add(weapon));
      }
    });
    return Array.from(weapons).sort();
  }, [data]);

  const uniqueClasses = React.useMemo(() => {
    const classes = new Set<string>();
    data.forEach((rune) => {
      if (rune.classes) {
        rune.classes.forEach((className) => classes.add(className));
      }
    });
    return Array.from(classes).sort();
  }, [data]);

  const uniqueMonsters = React.useMemo(() => {
    const monsters = new Set<string>();
    data.forEach((rune) => {
      monsters.add(rune.monsterName);
    });
    return Array.from(monsters).sort();
  }, [data]);

  return (
    <div className="w-full space-y-4">
      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Search */}
        <div className="md:col-span-2 lg:col-span-4">
          <Input
            placeholder="Search runes..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="w-full"
          />
        </div>

        {/* Tier Filter */}
        <div>
          <Select
            value={
              (table.getColumn("tier")?.getFilterValue() as string) ?? "all"
            }
            onChange={(event) => {
              const value = event.target.value;
              table
                .getColumn("tier")
                ?.setFilterValue(value === "all" ? undefined : value);
            }}
            className="w-full"
          >
            <option value="all">All Tiers</option>
            {uniqueTiers.map((tier) => (
              <option key={tier} value={tier}>
                Tier {tier}
              </option>
            ))}
          </Select>
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
                ?.setFilterValue(value === "all" ? undefined : value);
            }}
            className="w-full"
          >
            <option value="all">All Types</option>
            {uniqueTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        {/* Intent Filter */}
        <div>
          <Select
            value={
              (table.getColumn("intent")?.getFilterValue() as string) ?? "all"
            }
            onChange={(event) => {
              const value = event.target.value;
              table
                .getColumn("intent")
                ?.setFilterValue(value === "all" ? undefined : value);
            }}
            className="w-full"
          >
            <option value="all">All Intents</option>
            {uniqueIntents.map((intent) => (
              <option key={intent} value={intent}>
                {intent
                  .split("-")
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(" ")}
              </option>
            ))}
          </Select>
        </div>

        {/* Weapon Filter */}
        <div>
          <Select
            value={
              (table.getColumn("weapons")?.getFilterValue() as string) ?? "all"
            }
            onChange={(event) => {
              const value = event.target.value;
              table
                .getColumn("weapons")
                ?.setFilterValue(value === "all" ? undefined : value);
            }}
            className="w-full"
          >
            <option value="all">All Weapons</option>
            {uniqueWeapons.map((weapon) => (
              <option key={weapon} value={weapon}>
                {weapon.charAt(0).toUpperCase() + weapon.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        {/* Class Filter */}
        <div>
          <Select
            value={
              (table.getColumn("classes")?.getFilterValue() as string) ?? "all"
            }
            onChange={(event) => {
              const value = event.target.value;
              table
                .getColumn("classes")
                ?.setFilterValue(value === "all" ? undefined : value);
            }}
            className="w-full"
          >
            <option value="all">All Classes</option>
            {uniqueClasses.map((className) => (
              <option key={className} value={className}>
                {className.charAt(0).toUpperCase() + className.slice(1)}
              </option>
            ))}
          </Select>
        </div>

        {/* Monster Filter */}
        <div>
          <Select
            value={
              (table.getColumn("monsterName")?.getFilterValue() as string) ??
              "all"
            }
            onChange={(event) => {
              const value = event.target.value;
              table
                .getColumn("monsterName")
                ?.setFilterValue(value === "all" ? undefined : value);
            }}
            className="w-full"
          >
            <option value="all">All Monsters</option>
            {uniqueMonsters.map((monster) => (
              <option key={monster} value={monster}>
                {monster}
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
                <TableRow key={row.id}>
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
                  No runes found.
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
          {table.getFilteredRowModel().rows.length} runes
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
