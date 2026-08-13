import type { LevelTier } from "@/shared/types";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function EncounterTable({ tier }: { tier: LevelTier }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <Table className="text-xs">
        <TableHeader>
          <TableRow className="bg-card/80 hover:bg-transparent">
            <TableHead className="h-auto w-10 px-2 py-1.5 text-center font-medium text-muted-foreground">
              d10
            </TableHead>
            <TableHead className="h-auto px-2 py-1.5 font-medium text-muted-foreground">
              Encounter
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tier.encounters.map((enc) => (
            <TableRow
              key={enc.roll}
              className="border-t border-border/50 hover:bg-accent/20 transition-colors"
            >
              <TableCell className="px-2 py-1.5 text-center font-bold text-muted-foreground">
                {enc.roll}
              </TableCell>
              <TableCell className="px-2 py-1.5 text-foreground">{enc.description}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
