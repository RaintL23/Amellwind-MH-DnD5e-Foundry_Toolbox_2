import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MULTICLASS_SPELL_SLOTS } from "@/shared/utils/multiclass-spell-slots.utils";

const SLOT_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;

export function MulticlassSpellSlotReferenceTable({
  highlightCasterLevel,
}: {
  highlightCasterLevel?: number;
}) {
  return (
    <div className="overflow-x-auto rounded-md border border-border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-24">Caster Lvl</TableHead>
            {SLOT_LEVELS.map((level) => (
              <TableHead key={level} className="text-center">
                {level}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {MULTICLASS_SPELL_SLOTS.map((row, index) => {
            const casterLevel = index + 1;
            const highlighted = highlightCasterLevel === casterLevel;
            return (
              <TableRow
                key={casterLevel}
                className={highlighted ? "bg-primary/10" : undefined}
              >
                <TableCell className="font-medium">{casterLevel}</TableCell>
                {row.map((slots, slotIndex) => (
                  <TableCell
                    key={`${casterLevel}-${slotIndex}`}
                    className="text-center tabular-nums"
                  >
                    {slots > 0 ? slots : "—"}
                  </TableCell>
                ))}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
