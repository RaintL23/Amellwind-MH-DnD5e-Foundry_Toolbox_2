import type { GuideTable, MaterialEffectSlot, ResourceRarity } from "@/shared/types";
import { RESOURCE_RARITY_STYLES } from "@/shared/types";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/shared/utils/cn";
import { DndRichText } from "@/shared/components/DndRichText";
import { MaterialEffectRef } from "./MaterialEffectRef";

// Row layout of the plan tables in artificer-forge.data.ts.
const COL = { effect: 0, slot: 1, rarity: 2, summary: 3, replaces: 4 } as const;

const NO_REPLACEMENT = "—";

function toSlot(label: string): MaterialEffectSlot {
  return label.toLowerCase() === "weapon" ? "weapon" : "armor";
}

/** GuideTable look-alike whose effect names open the Material Effect dialog. */
export function PlanListTable({ table }: { table: GuideTable }) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table className="text-sm">
        <TableHeader>
          <TableRow className="border-b border-border bg-muted/40 hover:bg-transparent">
            {table.colLabels.map((label) => (
              <TableHead
                key={label}
                className="h-auto px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {table.rows.map((row) => {
            const slot = toSlot(row[COL.slot]);
            const rarity = RESOURCE_RARITY_STYLES[row[COL.rarity] as ResourceRarity];
            const replaces = row[COL.replaces];

            return (
              <TableRow
                key={row[COL.effect]}
                className="border-b border-border/60 last:border-0 hover:bg-transparent"
              >
                <TableCell className="px-3 py-2 align-top whitespace-nowrap">
                  <MaterialEffectRef name={row[COL.effect]} slot={slot} />
                </TableCell>
                <TableCell className="px-3 py-2 align-top text-foreground">
                  {row[COL.slot]}
                </TableCell>
                <TableCell className="px-3 py-2 align-top whitespace-nowrap">
                  <Badge
                    variant="outline"
                    className={cn(
                      "whitespace-nowrap text-xs font-semibold",
                      rarity?.badge,
                    )}
                  >
                    {row[COL.rarity]}
                  </Badge>
                </TableCell>
                <TableCell className="px-3 py-2 align-top text-foreground">
                  <DndRichText text={row[COL.summary]} />
                </TableCell>
                <TableCell className="px-3 py-2 align-top whitespace-nowrap">
                  {replaces === NO_REPLACEMENT ? (
                    replaces
                  ) : (
                    <MaterialEffectRef name={replaces} slot={slot} />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
