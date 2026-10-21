import type { ColumnDef } from "@tanstack/react-table";
import {
  RESOURCE_RARITIES,
  RESOURCE_RARITY_STYLES,
  type ResourceRarity,
} from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/shared/utils/cn";

/** Rarity badge shared by resources and material effects. */
export function ResourceRarityBadge({ rarity }: { rarity: ResourceRarity }) {
  return (
    <Badge
      variant="outline"
      className={cn("text-xs", RESOURCE_RARITY_STYLES[rarity].badge)}
    >
      {rarity}
    </Badge>
  );
}

/** Sortable "Rarity" column ordered by tier, not alphabetically. */
export function createResourceRarityColumn<
  T extends { rarity: ResourceRarity },
>(): ColumnDef<T> {
  return {
    accessorKey: "rarity",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Rarity" />
    ),
    cell: ({ row }) => <ResourceRarityBadge rarity={row.original.rarity} />,
    sortingFn: (a, b) =>
      RESOURCE_RARITIES.indexOf(a.original.rarity) -
      RESOURCE_RARITIES.indexOf(b.original.rarity),
  };
}
