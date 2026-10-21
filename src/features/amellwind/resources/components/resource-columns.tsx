import { ColumnDef } from "@tanstack/react-table";
import {
  RESOURCE_CATEGORY_ICONS,
  RESOURCE_RARITY_STYLES,
  type Resource,
} from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createResourceRarityColumn } from "@/shared/components/ResourceRarityBadge";
import { cn } from "@/shared/utils/cn";
import { Hammer } from "lucide-react";

export function getResourceRowId(resource: Resource): string {
  return `${resource.category}-${resource.name}`;
}

export const resourceColumns: ColumnDef<Resource>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => (
      <span className="inline-flex items-center gap-1.5">
        <span
          className={cn(
            "font-medium",
            RESOURCE_RARITY_STYLES[row.original.rarity].text,
          )}
        >
          {row.original.name}
        </span>
        {row.original.isCraftingMaterial && (
          <Hammer
            className="h-3 w-3 shrink-0 text-yellow-500"
            aria-label="Crafting material"
          />
        )}
      </span>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {RESOURCE_CATEGORY_ICONS[row.original.category]} {row.original.category}
      </span>
    ),
  },
  createResourceRarityColumn<Resource>(),
  {
    id: "details",
    header: "Details",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <p className="line-clamp-2 max-w-md text-xs text-muted-foreground">
        {row.original.details}
      </p>
    ),
  },
  {
    accessorKey: "sellValue",
    header: "Sell Value",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs font-medium text-amber-400">
        {row.original.sellValue}
      </span>
    ),
  },
];
