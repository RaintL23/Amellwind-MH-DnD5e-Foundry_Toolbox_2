import { ColumnDef } from "@tanstack/react-table";
import type { MaterialEffect } from "@/shared/types";
import {
  MATERIAL_EFFECT_SLOT_LABELS,
  RESOURCE_RARITY_STYLES,
} from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";
import { Link2 } from "lucide-react";
import { MATERIAL_EFFECT_RARITIES } from "../constants/material-effect.constants";

export function MaterialEffectSlotBadge({ slot }: { slot: MaterialEffect["slot"] }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-xs",
        slot === "weapon"
          ? "bg-orange-950/40 text-orange-300 border-orange-800/50"
          : "bg-blue-950/40 text-blue-300 border-blue-800/50",
      )}
    >
      {MATERIAL_EFFECT_SLOT_LABELS[slot]}
    </Badge>
  );
}

export function MaterialEffectRarityBadge({
  rarity,
}: {
  rarity: MaterialEffect["rarity"];
}) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs", RESOURCE_RARITY_STYLES[rarity].badge)}
    >
      {rarity}
    </Badge>
  );
}

export const materialEffectColumns: ColumnDef<MaterialEffect>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span
        className={cn(
          "font-medium",
          RESOURCE_RARITY_STYLES[row.original.rarity].text,
        )}
      >
        {row.original.name}
      </span>
    ),
  },
  {
    id: "effect",
    header: "Effect",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <div className="max-w-xl">
        <p className="line-clamp-2 text-xs text-muted-foreground">
          {row.original.summary}
        </p>
        {row.original.isReference && (
          <p className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
            <Link2 className="h-3 w-3" />
            References a monster material
          </p>
        )}
      </div>
    ),
  },
  {
    accessorKey: "slot",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Slot" />
    ),
    cell: ({ row }) => <MaterialEffectSlotBadge slot={row.original.slot} />,
  },
  {
    accessorKey: "rarity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rarity" />
    ),
    cell: ({ row }) => <MaterialEffectRarityBadge rarity={row.original.rarity} />,
    sortingFn: (a, b) =>
      MATERIAL_EFFECT_RARITIES.indexOf(a.original.rarity) -
      MATERIAL_EFFECT_RARITIES.indexOf(b.original.rarity),
  },
];
