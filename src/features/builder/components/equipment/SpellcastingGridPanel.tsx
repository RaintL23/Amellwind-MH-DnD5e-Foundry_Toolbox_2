import { Sparkles } from "lucide-react";
import type { BuilderSpellSelections } from "@/shared/types";
import type { SpellcastingInfo } from "../../hooks/useSpellcasting";
import { grantsForSpellLevel } from "../../utils/subclass-spells.utils";
import { GridElementSlot } from "../shared/GridElementSlot";
import type { PaperDollSelection } from "../../hooks/usePaperDollSelection";
import {
  isSpellLevelSlot,
  parseSpellLevel,
  toSpellLevelSlot,
} from "../../hooks/usePaperDollSelection";

interface SpellcastingGridPanelProps {
  className: string;
  spellcastingInfo: SpellcastingInfo;
  spellSelections: BuilderSpellSelections;
  spellLevelByName: Map<string, number>;
  spellsByName: Array<{ name: string; level: number }>;
  selectedSlot: PaperDollSelection;
  onSelectSlot: (slot: PaperDollSelection) => void;
}

const SPELL_LEVEL_LABELS: Record<number, string> = {
  0: "Cantrips",
  1: "Nivel 1",
  2: "Nivel 2",
  3: "Nivel 3",
  4: "Nivel 4",
  5: "Nivel 5",
  6: "Nivel 6",
  7: "Nivel 7",
  8: "Nivel 8",
  9: "Nivel 9",
};

const SPELL_LEVEL_COLORS: Record<number, string> = {
  0: "text-sky-400",
  1: "text-emerald-400",
  2: "text-lime-400",
  3: "text-amber-400",
  4: "text-orange-400",
  5: "text-red-400",
  6: "text-rose-400",
  7: "text-violet-400",
  8: "text-purple-400",
  9: "text-fuchsia-400",
};

function getSlotEquipped(
  level: number,
  levelLabel: string,
  spellSelections: BuilderSpellSelections,
  spellcastingInfo: SpellcastingInfo,
  spellLevelByName: Map<string, number>,
  spellsByName: Array<{ name: string; level: number }>,
): { name: string; detail?: string } | null {
  const selected = (spellSelections ?? {})[level] ?? [];
  const alwaysPreparedGrants = grantsForSpellLevel(
    spellcastingInfo.subclassAlwaysPrepared,
    level,
    spellLevelByName,
    spellsByName,
  );
  const bonusKnownGrants = grantsForSpellLevel(
    spellcastingInfo.subclassBonusKnown,
    level,
    spellLevelByName,
    spellsByName,
  );
  const subclassCount = alwaysPreparedGrants.length + bonusKnownGrants.length;

  if (level === 0) {
    if (selected.length === 0 && subclassCount === 0) return null;
    const summaryParts: string[] = [];
    if (selected.length > 0) {
      summaryParts.push(
        `${selected.length} cantrip${selected.length !== 1 ? "s" : ""}`,
      );
    }
    if (subclassCount > 0) {
      summaryParts.push(`${subclassCount} subclase`);
    }
    const subclassNames = [...alwaysPreparedGrants, ...bonusKnownGrants]
      .map((g) => g.name)
      .join(", ");
    const selectedNames = selected.map((s) => s.name).join(", ");
    const nameDetail = [subclassNames, selectedNames].filter(Boolean).join(" · ");
    const detail = nameDetail
      ? `${summaryParts.join(" + ")} — ${nameDetail}`
      : summaryParts.join(" + ");
    return { name: levelLabel, detail };
  }

  if (selected.length === 0 && subclassCount === 0) return null;

  const summaryParts: string[] = [];
  if (selected.length > 0) {
    summaryParts.push(
      `${selected.length} ${spellcastingInfo.isPreparedCaster ? "prep." : "conoc."}`,
    );
  }
  if (alwaysPreparedGrants.length > 0) {
    summaryParts.push(`${alwaysPreparedGrants.length} siempre prep.`);
  }
  if (bonusKnownGrants.length > 0) {
    summaryParts.push(`${bonusKnownGrants.length} bonus`);
  }

  const subclassNames = [...alwaysPreparedGrants, ...bonusKnownGrants]
    .map((g) => g.name)
    .join(", ");
  const selectedNames = selected.map((s) => s.name).join(", ");
  const nameDetail = [subclassNames, selectedNames].filter(Boolean).join(" · ");
  const detail = nameDetail
    ? `${summaryParts.join(" + ")} — ${nameDetail}`
    : summaryParts.join(" + ");

  return { name: levelLabel, detail };
}

export function SpellcastingGridPanel({
  className,
  spellcastingInfo,
  spellSelections,
  spellLevelByName,
  spellsByName,
  selectedSlot,
  onSelectSlot,
}: SpellcastingGridPanelProps) {
  const { availableSpellLevels } = spellcastingInfo;

  if (availableSpellLevels.length === 0) return null;

  // Break spell levels into rows of up to 5
  const rows: number[][] = [];
  for (let i = 0; i < availableSpellLevels.length; i += 5) {
    rows.push(availableSpellLevels.slice(i, i + 5));
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="grid gap-1.5"
          style={{ gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))` }}
        >
          {row.map((level) => {
            const slot = toSpellLevelSlot(level);
            const label = SPELL_LEVEL_LABELS[level] ?? `Nivel ${level}`;
            const isSelected =
              isSpellLevelSlot(selectedSlot) &&
              parseSpellLevel(selectedSlot) === level;
            const equipped = getSlotEquipped(
              level,
              label,
              spellSelections,
              spellcastingInfo,
              spellLevelByName,
              spellsByName,
            );
            const colorClass = SPELL_LEVEL_COLORS[level] ?? "text-muted-foreground";

            return (
              <GridElementSlot
                key={slot}
                label={label}
                icon={<Sparkles className={`h-5 w-5 ${colorClass}`} />}
                equipped={equipped}
                onClickEquip={() => onSelectSlot(slot)}
                onClickDetails={() => onSelectSlot(slot)}
                isSelected={isSelected}
                emptyTitle={
                  level === 0
                    ? `Elegir cantrips de ${className}`
                    : `Elegir hechizos de nivel ${level} de ${className}`
                }
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
