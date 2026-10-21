import { ColumnDef } from "@tanstack/react-table";
import type { Feat } from "@/shared/types";
import {
  createNameColumn,
  createSourcePageColumn,
} from "@/components/data-table/data-table-columns";
import {
  createFeatAbilityColumn,
  createFeatPrerequisitesColumn,
} from "@/shared/components/feat/feat-columns";

export const featColumns: ColumnDef<Feat>[] = [
  createNameColumn<Feat>(),
  createFeatPrerequisitesColumn<Feat>(),
  createFeatAbilityColumn<Feat>(),
  {
    accessorKey: "summary",
    header: "Summary",
    enableSorting: false,
    meta: { hideBelowMd: true },
    cell: ({ row }) => (
      <p className="line-clamp-2 max-w-md text-xs text-muted-foreground">
        {row.original.paragraphs[0] ??
          row.original.sections[0]?.paragraphs[0] ??
          row.original.summary}
      </p>
    ),
  },
  createSourcePageColumn<Feat>(),
];
