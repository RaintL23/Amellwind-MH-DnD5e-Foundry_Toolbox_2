import { ColumnDef } from "@tanstack/react-table";
import type { DndFeat } from "@/shared/types";
import { DND_FEAT_CATEGORY_LABELS } from "@/shared/types";
import { createNameColumn } from "@/components/data-table/data-table-columns";
import { SourceAbbreviations } from "@/shared/components/SourceAbbreviations";
import {
  FEAT_TAG_BASE,
  createFeatAbilityColumn,
  createFeatPrerequisitesColumn,
} from "@/shared/components/feat/feat-columns";
import { cn } from "@/shared/utils/cn";

export function getDndFeatTypeLabel(feat: DndFeat): string | undefined {
  if (feat.isOriginFeat) return "Origin Feat";
  return feat.category
    ? (DND_FEAT_CATEGORY_LABELS[feat.category] ?? feat.category)
    : undefined;
}

export const dndFeatColumns: ColumnDef<DndFeat>[] = [
  createNameColumn<DndFeat>(),
  {
    id: "type",
    header: "Type",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => {
      const label = getDndFeatTypeLabel(row.original);
      if (!label) return null;
      return (
        <span
          className={cn(
            FEAT_TAG_BASE,
            row.original.isOriginFeat
              ? "border-sky-800/50 bg-sky-950/40 text-sky-300"
              : "border-border/50 text-muted-foreground",
          )}
        >
          {label}
        </span>
      );
    },
  },
  createFeatPrerequisitesColumn<DndFeat>(),
  createFeatAbilityColumn<DndFeat>(),
  {
    accessorKey: "source",
    header: "Source",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <SourceAbbreviations
        source={row.original.source}
        variantSources={row.original.variantSources}
      />
    ),
  },
];
