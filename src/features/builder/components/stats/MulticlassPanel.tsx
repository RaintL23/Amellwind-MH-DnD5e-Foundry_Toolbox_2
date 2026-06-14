import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { NumberStepper } from "../shared/NumberStepper";
import {
  buildClassLevelEntries,
  getMulticlassPrerequisiteFailures,
  MAX_MULTICLASS_ENTRIES,
} from "../../utils/multiclass.utils";
import { useEffectiveAbilityScores } from "../../hooks/useEffectiveAbilityScores";

export function MulticlassPanel() {
  const {
    character,
    class: classSelection,
    classData,
    subclass,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
    setPrimaryClassLevel,
    setMulticlassEntryLevel,
    addMulticlassEntry,
    removeMulticlassEntry,
  } = useCharacterBuilder();

  const effectiveScores = useEffectiveAbilityScores();

  if (!multiclassEnabled) return null;

  const classEntries = buildClassLevelEntries(
    classSelection,
    classData,
    primaryClassLevel,
    subclass,
    multiclassEntries,
    multiclassClassData,
  );

  const prerequisiteFailures = getMulticlassPrerequisiteFailures(
    classEntries,
    effectiveScores,
  );

  const additionalTotal = multiclassEntries.reduce((s, e) => s + e.level, 0);

  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/20 p-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground">
          Multiclass (D&amp;D 5e){" "}
          <span className="text-xs text-muted-foreground">
            (Max. 20 levels) Total level: {character.level} / {20} levels (
            {additionalTotal} additional){" "}
            {prerequisiteFailures.length > 0 && (
              <span className="text-xs text-amber-500">
                ({prerequisiteFailures.length} prerequisite failures)
              </span>
            )}{" "}
          </span>
        </span>
      </div>

      {multiclassEntries.map((entry, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-2 text-xs"
        >
          <span className="truncate text-foreground">
            {entry.classRef?.name ?? `Class ${index + 2}`}
          </span>
          <div className="flex items-center gap-1">
            <NumberStepper
              value={entry.level}
              min={entry.classRef ? 1 : 0}
              max={Math.max(
                entry.classRef ? 1 : 0,
                20 - primaryClassLevel - additionalTotal + entry.level,
              )}
              onChange={(level) => setMulticlassEntryLevel(index, level)}
              ariaLabel={`Class level ${index + 2}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => removeMulticlassEntry(index)}
              aria-label={`Remove class ${index + 2}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}

      {multiclassEntries.length < MAX_MULTICLASS_ENTRIES && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 w-full gap-1 text-[10px]"
          onClick={addMulticlassEntry}
          disabled={!classSelection}
        >
          <Plus className="h-3 w-3" />
          Add class
        </Button>
      )}

      {prerequisiteFailures.length > 0 && (
        <div className="space-y-0.5 text-[10px] text-amber-500">
          <p className="font-medium">Prerequisites not met!</p>
          {prerequisiteFailures.map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
        </div>
      )}

      <p className="text-[9px] leading-relaxed text-muted-foreground">
        Requires 13+ in the primary ability score of each class. Levels are
        added to the total character level (max. 20).
      </p>
    </div>
  );
}
