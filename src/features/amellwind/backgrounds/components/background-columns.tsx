import { ColumnDef } from "@tanstack/react-table";
import {
  Background,
  BACKGROUND_FACTION_LABELS,
  BackgroundFaction,
} from "@/shared/types";
import { DataTableColumnHeader } from "@/components/data-table/data-table-column-header";
import {
  createNameColumn,
  createSourcePageColumn,
} from "@/components/data-table/data-table-columns";
import { cn } from "@/shared/utils/cn";

const FACTION_ACCENT: Record<BackgroundFaction, string> = {
  "helix-commission": "text-rose-400",
  "hunters-guild": "text-emerald-400",
  "royal-scrivener": "text-amber-400",
  "talon-society": "text-orange-400",
  wycademy: "text-violet-400",
  "handlers-guild": "text-sky-400",
};

export function FactionBadge({ faction }: { faction: BackgroundFaction }) {
  return (
    <span
      className={cn(
        "inline-block whitespace-nowrap rounded border border-border/50 px-1.5 py-0.5 text-[10px] font-medium",
        FACTION_ACCENT[faction],
      )}
    >
      {BACKGROUND_FACTION_LABELS[faction]}
    </span>
  );
}

export const backgroundColumns: ColumnDef<Background>[] = [
  createNameColumn<Background>(),
  {
    accessorKey: "faction",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Guild" />
    ),
    cell: ({ row }) => <FactionBadge faction={row.original.faction} />,
    sortingFn: (a, b) =>
      BACKGROUND_FACTION_LABELS[a.original.faction].localeCompare(
        BACKGROUND_FACTION_LABELS[b.original.faction],
      ),
  },
  {
    id: "skills",
    header: "Skills",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.proficiencies.skills}
      </span>
    ),
  },
  {
    id: "feature",
    header: "Feature",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.features[0]?.name}
      </span>
    ),
  },
  createSourcePageColumn<Background>(),
];
