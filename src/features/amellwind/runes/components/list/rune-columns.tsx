import { ColumnDef } from "@tanstack/react-table";
import { Layers } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import { cn } from "@/shared/utils/cn";
import { TierBadge } from "../shared/TierBadge";
import {
  createRuneListRowFilterFn,
  RUNE_LIST_FILTER_COLUMN_ID,
  type RuneListRow,
} from "./rune-table-filters.utils";

export interface CreateRuneColumnsOptions {
  isInBuild: (rune: RuneListRow["rune"]) => boolean;
  materialEffectIndex: MaterialEffectNameIndex | null;
}

export function createRuneColumns({
  isInBuild,
  materialEffectIndex,
}: CreateRuneColumnsOptions): ColumnDef<RuneListRow>[] {
  const rowFilterFn = createRuneListRowFilterFn(materialEffectIndex);

  return [
    {
      id: RUNE_LIST_FILTER_COLUMN_ID,
      accessorFn: () => null,
      filterFn: rowFilterFn,
      enableColumnFilter: true,
      enableHiding: false,
      meta: { filterOnly: true },
    },
    {
      id: "name",
      accessorFn: (row) => row.rune.name,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const inBuild = isInBuild(row.original.rune);
        return (
          <div className="flex items-center gap-2 font-medium text-foreground">
            {row.original.rune.name}
            {inBuild && (
              <Layers className="h-3 w-3 text-amber-400 shrink-0" />
            )}
          </div>
        );
      },
    },
    {
      id: "monsterName",
      accessorFn: (row) => row.rune.monsterName,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Monster" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.rune.monsterName}</span>
      ),
    },
    {
      id: "slots",
      enableSorting: false,
      header: "Slots",
      cell: ({ row }) => (
        <div className="flex gap-1">
          {row.original.rune.slots.includes("A") && (
            <Badge variant="blue">A</Badge>
          )}
          {row.original.rune.slots.includes("W") && (
            <Badge variant="orange">W</Badge>
          )}
        </div>
      ),
    },
    {
      id: "carveChance",
      accessorFn: (row) => row.rune.carveChance,
      enableSorting: false,
      header: "Carve",
      cell: ({ row }) =>
        row.original.rune.carveChance === "-" ? (
          <span className="text-muted-foreground/40">—</span>
        ) : (
          <span className="text-muted-foreground">
            {row.original.rune.carveChance}
          </span>
        ),
    },
    {
      id: "captureChance",
      accessorFn: (row) => row.rune.captureChance,
      enableSorting: false,
      header: "Capture",
      cell: ({ row }) =>
        row.original.rune.captureChance === "-" ? (
          <span className="text-muted-foreground/40">—</span>
        ) : (
          <span className="text-muted-foreground">
            {row.original.rune.captureChance}
          </span>
        ),
    },
    {
      id: "tier",
      accessorFn: (row) => row.rune.tier,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Tier" />
      ),
      cell: ({ row }) => <TierBadge tier={row.original.rune.tier} />,
    },
  ];
}

export function runeRowClassName(
  row: RuneListRow,
  isInBuild: (rune: RuneListRow["rune"]) => boolean,
): string {
  return cn(isInBuild(row.rune) && "bg-amber-900/10 hover:bg-amber-900/20");
}
