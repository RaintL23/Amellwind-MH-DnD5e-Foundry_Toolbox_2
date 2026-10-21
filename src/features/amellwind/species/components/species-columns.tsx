import { ColumnDef } from "@tanstack/react-table";
import { Species, SPECIES_CATEGORY_LABELS } from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import { createSourcePageColumn } from "@/components/data-table/data-table-columns";
import { cn } from "@/shared/utils/cn";
import { Eye, Shield } from "lucide-react";

const CATEGORY_ACCENT: Record<string, string> = {
  ancestry: "text-emerald-400",
  folk: "text-cyan-400",
  "elder-dragon": "text-amber-400",
  subrace: "text-violet-400",
  lineage: "text-rose-400",
};

const TRAIT_BADGE =
  "inline-flex items-center gap-0.5 whitespace-nowrap rounded border border-border/50 bg-muted/40 px-1.5 py-0.5 text-[10px] text-muted-foreground";

export function SpeciesCategoryBadge({ category }: { category: Species["category"] }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium",
        CATEGORY_ACCENT[category] ?? "text-primary",
      )}
    >
      {SPECIES_CATEGORY_LABELS[category]}
    </span>
  );
}

export const speciesColumns: ColumnDef<Species>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Name" />
    ),
    cell: ({ row }) => {
      const species = row.original;
      return (
        <div>
          <span className="font-medium text-foreground">{species.name}</span>
          {species.isSubrace && species.parentSpecies && (
            <p className="text-xs text-muted-foreground">
              {species.parentSpecies}
              {species.parentSource ? ` (${species.parentSource})` : ""}
            </p>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Category" />
    ),
    cell: ({ row }) => <SpeciesCategoryBadge category={row.original.category} />,
    sortingFn: (a, b) =>
      SPECIES_CATEGORY_LABELS[a.original.category].localeCompare(
        SPECIES_CATEGORY_LABELS[b.original.category],
      ),
  },
  {
    id: "abilities",
    header: "Ability Bonuses",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.abilitySummary}
      </span>
    ),
  },
  {
    id: "sizeSpeed",
    header: "Size · Speed",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-xs text-muted-foreground">
        {row.original.sizes.join(", ")} · {row.original.speed}
      </span>
    ),
  },
  {
    id: "traits",
    header: "Traits",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => {
      const species = row.original;
      return (
        <div className="flex flex-wrap gap-1">
          {species.darkvision !== undefined && (
            <span className={TRAIT_BADGE}>
              <Eye className="h-2.5 w-2.5" />
              DV {species.darkvision} ft.
            </span>
          )}
          {species.resistances.map((r) => (
            <span key={r} className={cn(TRAIT_BADGE, "capitalize")}>
              <Shield className="h-2.5 w-2.5" />
              {r}
            </span>
          ))}
          {species.resistanceSummary && (
            <span
              className="inline-flex items-center gap-0.5 whitespace-nowrap rounded border border-amber-800/40 bg-amber-950/30 px-1.5 py-0.5 text-[10px] capitalize text-amber-300/90"
              title={species.resistanceSummary}
            >
              <Shield className="h-2.5 w-2.5" />
              {species.resistanceSummary}
            </span>
          )}
          {species.traitTags.slice(0, 2).map((tag) => (
            <span key={tag} className={TRAIT_BADGE}>
              {tag}
            </span>
          ))}
        </div>
      );
    },
  },
  createSourcePageColumn<Species>(),
];
