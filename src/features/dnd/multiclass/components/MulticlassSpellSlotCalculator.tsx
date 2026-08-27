import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import type { Class } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { NumberStepper } from "@/shared/components/NumberStepper";
import {
  getCasterContributionBreakdown,
  getMulticlassCasterLevel,
  getMulticlassSpellSlotCounts,
  hasMultipleSpellcastingClasses,
  hasPactMagic,
  type MulticlassCasterEntry,
} from "@/shared/utils/multiclass-spell-slots.utils";
import { MulticlassSpellSlotReferenceTable } from "./MulticlassSpellSlotReferenceTable";

const MAX_CLASSES = 4;

interface CalculatorRow {
  classId: string;
  subclassId: string;
  level: number;
}

function createEmptyRow(): CalculatorRow {
  return { classId: "", subclassId: "", level: 1 };
}

function findClass(classes: Class[], classId: string): Class | undefined {
  return classes.find((cls) => cls.id === classId);
}

function buildCasterEntries(
  rows: CalculatorRow[],
  classes: Class[],
): MulticlassCasterEntry[] {
  const entries: MulticlassCasterEntry[] = [];

  for (const row of rows) {
    const classData = findClass(classes, row.classId);
    if (!classData) continue;
    const subclass = classData.subclasses.find((sc) => sc.id === row.subclassId);
    entries.push({
      classData,
      level: row.level,
      subclassName: subclass?.name ?? null,
    });
  }

  return entries;
}

export function MulticlassSpellSlotCalculator({
  classes,
}: {
  classes: Class[];
}) {
  const [rows, setRows] = useState<CalculatorRow[]>([
    { classId: "", subclassId: "", level: 1 },
    createEmptyRow(),
  ]);

  const sortedClasses = useMemo(
    () => [...classes].filter((cls) => !cls.isSidekick).sort((a, b) => a.name.localeCompare(b.name)),
    [classes],
  );

  const casterEntries = useMemo(
    () => buildCasterEntries(rows, sortedClasses),
    [rows, sortedClasses],
  );

  const totalLevel = rows.reduce((sum, row) => sum + (row.classId ? row.level : 0), 0);
  const usesMulticlassTable = hasMultipleSpellcastingClasses(casterEntries);
  const pactMagic = hasPactMagic(casterEntries);
  const nonPactEntries = casterEntries.filter(
    (entry) => entry.classData?.casterProgression !== "pact",
  );
  const casterLevel =
    nonPactEntries.length > 0 ? getMulticlassCasterLevel(casterEntries) : 0;
  const slotCounts =
    casterLevel > 0 && (usesMulticlassTable || nonPactEntries.length === 1)
      ? getMulticlassSpellSlotCounts(casterLevel)
      : {};
  const breakdown = getCasterContributionBreakdown(casterEntries);

  function updateRow(index: number, patch: Partial<CalculatorRow>) {
    setRows((current) =>
      current.map((row, i) => (i === index ? { ...row, ...patch } : row)),
    );
  }

  function handleClassChange(index: number, classId: string) {
    updateRow(index, { classId, subclassId: "" });
  }

  function addRow() {
    if (rows.length >= MAX_CLASSES) return;
    setRows((current) => [...current, createEmptyRow()]);
  }

  function removeRow(index: number) {
    setRows((current) =>
      current.length <= 1 ? current : current.filter((_, i) => i !== index),
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Build Your Classes</CardTitle>
          <CardDescription>
            Add each class and its level. For Fighter/Rogue third-caster
            subclasses, pick the subclass so the calculator can apply the
            one-third contribution from level 3 onward.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {rows.map((row, index) => {
            const selectedClass = findClass(sortedClasses, row.classId);
            const maxLevel = Math.max(1, 20 - totalLevel + (row.classId ? row.level : 0));

            return (
              <div
                key={index}
                className="grid gap-3 rounded-md border border-border/70 bg-muted/20 p-3 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_auto_auto]"
              >
                <div className="space-y-1">
                  <Label htmlFor={`class-${index}`}>Class</Label>
                  <Select
                    id={`class-${index}`}
                    value={row.classId}
                    onChange={(event) =>
                      handleClassChange(index, event.target.value)
                    }
                  >
                    <option value="">— Select class —</option>
                    {sortedClasses.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label htmlFor={`subclass-${index}`}>Subclass</Label>
                  <Select
                    id={`subclass-${index}`}
                    value={row.subclassId}
                    disabled={!selectedClass?.subclasses.length}
                    onChange={(event) =>
                      updateRow(index, { subclassId: event.target.value })
                    }
                  >
                    <option value="">— Optional —</option>
                    {selectedClass?.subclasses.map((subclass) => (
                      <option key={subclass.id} value={subclass.id}>
                        {subclass.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Level</Label>
                  <NumberStepper
                    value={row.level}
                    min={row.classId ? 1 : 0}
                    max={row.classId ? maxLevel : 0}
                    onChange={(level) => updateRow(index, { level })}
                    ariaLabel={`Level for class ${index + 1}`}
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    disabled={rows.length <= 1}
                    onClick={() => removeRow(index)}
                    aria-label={`Remove class row ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addRow}
              disabled={rows.length >= MAX_CLASSES || totalLevel >= 20}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add class
            </Button>
            <p className="text-xs text-muted-foreground">
              Total character level: {totalLevel} / 20
            </p>
          </div>
        </CardContent>
      </Card>

      {casterEntries.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spell Slot Result</CardTitle>
            <CardDescription>
              {usesMulticlassTable
                ? "Multiple spellcasting classes detected — using the Multiclass Spellcaster table."
                : casterEntries.length === 1
                  ? "Single spellcasting class — using that class's normal progression (shown here as combined caster level for reference)."
                  : "Add spellcasting classes to calculate combined slots."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {breakdown.length > 0 ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Caster level breakdown
                </p>
                <ul className="space-y-1 text-sm">
                  {breakdown.map((item) => (
                    <li key={`${item.className}-${item.classLevel}`}>
                      <span className="font-medium text-foreground">
                        {item.className} {item.classLevel}
                      </span>
                      {" → "}
                      <span className="tabular-nums text-primary">
                        +{item.contribution}
                      </span>
                      {item.note ? (
                        <span className="text-muted-foreground">
                          {" "}
                          ({item.note})
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
                <p className="text-sm font-medium">
                  Combined caster level:{" "}
                  <span className="text-primary">{casterLevel || "—"}</span>
                </p>
              </div>
            ) : null}

            {Object.keys(slotCounts).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(slotCounts).map(([level, count]) => (
                  <div
                    key={level}
                    className="rounded-md border border-border bg-muted/30 px-3 py-2 text-center"
                  >
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                      Level {level}
                    </p>
                    <p className="text-lg font-semibold tabular-nums">{count}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No combined spell slots from these classes.
              </p>
            )}

            {pactMagic ? (
              <Alert>
                <AlertTitle>Warlock Pact Magic</AlertTitle>
                <AlertDescription>
                  Warlock spell slots are tracked separately and are not added
                  to the combined multiclass pool above. Use your warlock level
                  for Pact Magic slot progression.
                </AlertDescription>
              </Alert>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold">Multiclass Spellcaster Table</h3>
        <p className="text-xs text-muted-foreground">
          Official combined slot progression (PHB / XPHB). Your current combined
          caster level is highlighted when applicable.
        </p>
        <MulticlassSpellSlotReferenceTable
          highlightCasterLevel={casterLevel > 0 ? casterLevel : undefined}
        />
      </div>
    </div>
  );
}
