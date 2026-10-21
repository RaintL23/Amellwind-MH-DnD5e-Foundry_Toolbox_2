import { useState } from "react";
import { Plus, X } from "lucide-react";
import { toast } from "sonner";
import type { BuilderMulticlassEntry } from "@/shared/types";
import { Button } from "@/components/ui/button";
import { useCharacterBuilder } from "../../context/CharacterBuilderContext";
import { useBuildCompleteness } from "../../context/BuildCompletenessContext";
import { NumberStepper } from "../shared";
import { ConfirmActionDialog } from "../shared/ConfirmActionDialog";
import {
  buildClassLevelEntries,
  getFeatSlotLevelsForBuild,
  getMulticlassPrerequisiteFailures,
  MAX_MULTICLASS_ENTRIES,
  toMulticlassClassSlot,
} from "../../utils/multiclass.utils";
import { useEffectiveAbilityScores } from "../../hooks/useEffectiveAbilityScores";

type PendingChange =
  | { kind: "primary-level"; level: number; lostFeats: number }
  | { kind: "entry-level"; index: number; level: number; lostFeats: number }
  | { kind: "remove"; index: number; lostFeats: number };

export function MulticlassPanel() {
  const {
    character,
    class: classSelection,
    classData,
    subclass,
    featSelections,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    primaryClassLevel,
    setPrimaryClassLevel,
    setMulticlassEntryLevel,
    addMulticlassEntry,
    removeMulticlassEntry,
  } = useCharacterBuilder();
  const { goToIssue } = useBuildCompleteness();
  const effectiveScores = useEffectiveAbilityScores();
  const [pending, setPending] = useState<PendingChange | null>(null);

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
  const levelsLeft = 20 - primaryClassLevel - additionalTotal;
  const canAddClass =
    !!classSelection &&
    multiclassEntries.length < MAX_MULTICLASS_ENTRIES &&
    (levelsLeft > 0 || primaryClassLevel > 1);

  /** Filled feat picks that would no longer have a slot. */
  function countLostFeats(primaryLevel: number, entries: BuilderMulticlassEntry[]) {
    const total = primaryLevel + entries.reduce((s, e) => s + e.level, 0);
    // ASI levels only need class names, so entry class data can be omitted.
    const slots = getFeatSlotLevelsForBuild(
      buildClassLevelEntries(
        classSelection,
        classData,
        primaryLevel,
        subclass,
        entries,
        [],
      ),
      total,
    ).length;
    return featSelections.slice(slots).filter(Boolean).length;
  }

  function handlePrimaryLevel(level: number) {
    const lostFeats =
      level < primaryClassLevel ? countLostFeats(level, multiclassEntries) : 0;
    if (lostFeats > 0) {
      setPending({ kind: "primary-level", level, lostFeats });
      return;
    }
    setPrimaryClassLevel(level);
  }

  function handleEntryLevel(index: number, level: number) {
    const entries = multiclassEntries.map((entry, i) =>
      i === index ? { ...entry, level } : entry,
    );
    const lostFeats =
      level < multiclassEntries[index].level
        ? countLostFeats(primaryClassLevel, entries)
        : 0;
    if (lostFeats > 0) {
      setPending({ kind: "entry-level", index, level, lostFeats });
      return;
    }
    setMulticlassEntryLevel(index, level);
  }

  function handleRemove(index: number) {
    const entry = multiclassEntries[index];
    const lostFeats = countLostFeats(
      primaryClassLevel,
      multiclassEntries.filter((_, i) => i !== index),
    );
    if (!entry.classRef && lostFeats === 0) {
      removeMulticlassEntry(index);
      return;
    }
    setPending({ kind: "remove", index, lostFeats });
  }

  function openClassSlot(index: number) {
    goToIssue({
      id: `multiclass-class-${index}`,
      section: "identity",
      message: "",
      slot: toMulticlassClassSlot(index),
      highlightKey: toMulticlassClassSlot(index),
    });
  }

  function runPending() {
    if (!pending) return;
    if (pending.kind === "primary-level") setPrimaryClassLevel(pending.level);
    if (pending.kind === "entry-level") {
      setMulticlassEntryLevel(pending.index, pending.level);
    }
    if (pending.kind === "remove") {
      const name = multiclassEntries[pending.index]?.classRef?.name;
      removeMulticlassEntry(pending.index);
      toast.message(name ? `${name} removed` : "Class removed");
    }
  }

  const pendingEntry =
    pending && pending.kind !== "primary-level"
      ? multiclassEntries[pending.index]
      : null;
  const pendingEntryName =
    pendingEntry?.classRef?.name ??
    (pending && pending.kind !== "primary-level"
      ? `Class ${pending.index + 2}`
      : "");
  const lossItems: string[] = [];
  if (pending?.kind === "remove" && pendingEntry) {
    lossItems.push(
      `${pendingEntry.level} level${pendingEntry.level === 1 ? "" : "s"} (total level ${character.level} → ${character.level - pendingEntry.level})`,
    );
    if (pendingEntry.subclass) lossItems.push(pendingEntry.subclass.name);
  }
  if (pending && pending.lostFeats > 0) {
    lossItems.push(
      `${pending.lostFeats} feat pick${pending.lostFeats === 1 ? "" : "s"}`,
    );
  }

  return (
    <div className="space-y-2 rounded-md border border-border/60 bg-muted/30 p-2.5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-2 gap-y-0.5">
        <span className="text-[10px] font-medium text-foreground">
          Class levels
        </span>
        <span className="text-[10px] text-muted-foreground">
          Total {character.level}/20
          {prerequisiteFailures.length > 0 && (
            <span className="text-amber-500">
              {" "}
              · {prerequisiteFailures.length} prerequisite
              {prerequisiteFailures.length === 1 ? "" : "s"} missing
            </span>
          )}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="min-w-0 truncate text-foreground">
          {classSelection?.name ?? "Class 1"}
          <span className="ml-1 text-[10px] text-muted-foreground">
            primary
          </span>
        </span>
        <div className="flex items-center gap-1">
          <NumberStepper
            value={primaryClassLevel}
            min={1}
            max={Math.max(1, 20 - additionalTotal)}
            onChange={handlePrimaryLevel}
            ariaLabel={`${classSelection?.name ?? "Primary class"} level`}
          />
          {/* Keeps the steppers aligned with the removable rows below. */}
          <span className="h-6 w-6 shrink-0" aria-hidden />
        </div>
      </div>

      {multiclassEntries.map((entry, index) => (
        <div
          key={index}
          className="flex items-center justify-between gap-2 text-xs"
        >
          {entry.classRef ? (
            <span className="min-w-0 truncate text-foreground">
              {entry.classRef.name}
            </span>
          ) : (
            <button
              type="button"
              className="min-w-0 truncate text-left text-amber-500 underline-offset-2 hover:underline"
              onClick={() => openClassSlot(index)}
            >
              Choose class {index + 2}
            </button>
          )}
          <div className="flex items-center gap-1">
            <NumberStepper
              value={entry.level}
              min={1}
              max={Math.max(1, levelsLeft + entry.level)}
              onChange={(level) => handleEntryLevel(index, level)}
              ariaLabel={`${entry.classRef?.name ?? `Class ${index + 2}`} level`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => handleRemove(index)}
              aria-label={`Remove ${entry.classRef?.name ?? `class ${index + 2}`}`}
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
          disabled={!canAddClass}
          title={!classSelection ? "Choose your first class first" : undefined}
        >
          <Plus className="h-3 w-3" />
          Add class
        </Button>
      )}

      {prerequisiteFailures.length > 0 && (
        <div className="space-y-0.5 text-[10px] text-amber-500">
          <p className="font-medium">Prerequisites not met</p>
          {prerequisiteFailures.map((msg) => (
            <p key={msg}>{msg}</p>
          ))}
          <p className="text-muted-foreground">
            Raise these scores or ask your DM to waive the requirement.
          </p>
        </div>
      )}

      <p className="text-[9px] leading-relaxed text-muted-foreground">
        Total level is the sum of your class levels (max 20). Every class,
        including your first one, needs 13+ in its primary ability. Pick each
        additional class and its subclass in the Build grid.
      </p>

      {pending && (
        <ConfirmActionDialog
          open
          onOpenChange={(open) => {
            if (!open) setPending(null);
          }}
          title={
            pending.kind === "remove"
              ? `Remove ${pendingEntryName}?`
              : `Lower ${
                  pending.kind === "primary-level"
                    ? (classSelection?.name ?? "class")
                    : pendingEntryName
                } to level ${pending.level}?`
          }
          description={
            pending.kind === "remove"
              ? "The class and its levels are removed; your other classes keep their levels."
              : "Feat slots granted by the lost levels are removed."
          }
          lossItems={lossItems}
          confirmLabel={pending.kind === "remove" ? "Remove class" : "Lower level"}
          onConfirm={runPending}
        />
      )}
    </div>
  );
}
