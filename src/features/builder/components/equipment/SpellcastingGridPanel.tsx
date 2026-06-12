import { Sparkles } from "lucide-react";
import type { BuilderSpellSelections, Spell } from "@/shared/types";
import { formatSpellNameWithMeta } from "./SpellMetaBadges";
import type { SpellcastingInfo } from "../../hooks/useSpellcasting";
import {
  grantsForPactPool,
  PACT_SPELL_POOL_LEVEL,
  PACT_SPELL_SLOT,
} from "../../utils/pact-magic.utils";
import { grantsForSpellLevel } from "../../utils/subclass-spells.utils";
import { GridElementSlot } from "../shared/GridElementSlot";
import type { BuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";
import {
  isSpellLevelSlot,
  parseSpellLevel,
  toSpellLevelSlot,
} from "../../hooks/useBuilderSlotSelection";

interface SpellcastingGridPanelProps {
  className: string;
  spellcastingInfo: SpellcastingInfo;
  spellSelections: BuilderSpellSelections;
  spellLevelByName: Map<string, number>;
  spellsByName: Spell[];
  selectedSlot: BuilderSlotSelection;
  onSelectSlot: (slot: BuilderSlotSelection) => void;
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

function formatSpellListName(name: string, spellsByName: Spell[]): string {
  const spell = spellsByName.find(
    (s) => s.name.toLowerCase() === name.toLowerCase(),
  );
  return formatSpellNameWithMeta(name, spell);
}

function getCantripEquipped(
  spellSelections: BuilderSpellSelections,
  spellcastingInfo: SpellcastingInfo,
  spellLevelByName: Map<string, number>,
  spellsByName: Spell[],
): { name: string; detail?: string } | null {
  const selected = (spellSelections ?? {})[0] ?? [];
  const alwaysPreparedGrants = grantsForSpellLevel(
    spellcastingInfo.subclassAlwaysPrepared,
    0,
    spellLevelByName,
    spellsByName,
  );
  const bonusKnownGrants = grantsForSpellLevel(
    spellcastingInfo.subclassBonusKnown,
    0,
    spellLevelByName,
    spellsByName,
  );
  const optionalFeatureGrants = grantsForSpellLevel(
    spellcastingInfo.optionalFeatureGranted,
    0,
    spellLevelByName,
    spellsByName,
  );
  const subclassCount =
    alwaysPreparedGrants.length +
    bonusKnownGrants.length +
    optionalFeatureGrants.length;

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
  const subclassNames = [
    ...alwaysPreparedGrants,
    ...bonusKnownGrants,
    ...optionalFeatureGrants,
  ]
    .map((g) => formatSpellListName(g.name, spellsByName))
    .join(", ");
  const selectedNames = selected
    .map((s) => formatSpellListName(s.name, spellsByName))
    .join(", ");
  const nameDetail = [subclassNames, selectedNames].filter(Boolean).join(" · ");
  const detail = nameDetail
    ? `${summaryParts.join(" + ")} — ${nameDetail}`
    : summaryParts.join(" + ");
  return { name: SPELL_LEVEL_LABELS[0], detail };
}

function getPactPoolEquipped(
  spellSelections: BuilderSpellSelections,
  spellcastingInfo: SpellcastingInfo,
  spellLevelByName: Map<string, number>,
  spellsByName: Spell[],
): { name: string; detail?: string } | null {
  const selected = (spellSelections ?? {})[PACT_SPELL_POOL_LEVEL] ?? [];
  const maxLevel = spellcastingInfo.pactMaxSpellLevel;

  const alwaysPreparedGrants = grantsForPactPool(
    spellcastingInfo.subclassAlwaysPrepared,
    maxLevel,
    spellLevelByName,
    spellsByName,
  );
  const bonusKnownGrants = grantsForPactPool(
    spellcastingInfo.subclassBonusKnown,
    maxLevel,
    spellLevelByName,
    spellsByName,
  );
  const optionalFeatureGrants = grantsForPactPool(
    spellcastingInfo.optionalFeatureGranted,
    maxLevel,
    spellLevelByName,
    spellsByName,
  );
  const subclassCount =
    alwaysPreparedGrants.length +
    bonusKnownGrants.length +
    optionalFeatureGrants.length;

  if (selected.length === 0 && subclassCount === 0) return null;

  const summaryParts: string[] = [];
  if (selected.length > 0) {
    summaryParts.push(
      `${selected.length}/${spellcastingInfo.maxPreparedOrKnown} ${
        spellcastingInfo.isPreparedCaster ? "prep." : "conoc."
      }`,
    );
  }
  if (subclassCount > 0) {
    summaryParts.push(`${subclassCount} subclase/feature`);
  }
  if (
    spellcastingInfo.pactSlotCount > 0 &&
    spellcastingInfo.pactMaxSpellLevel > 0
  ) {
    summaryParts.push(
      `${spellcastingInfo.pactSlotCount} slot${spellcastingInfo.pactSlotCount !== 1 ? "s" : ""} (niv. ${spellcastingInfo.pactMaxSpellLevel})`,
    );
  }

  const subclassNames = [
    ...alwaysPreparedGrants,
    ...bonusKnownGrants,
    ...optionalFeatureGrants,
  ]
    .map((g) => formatSpellListName(g.name, spellsByName))
    .join(", ");
  const selectedNames = selected
    .map((s) => formatSpellListName(s.name, spellsByName))
    .join(", ");
  const nameDetail = [subclassNames, selectedNames].filter(Boolean).join(" · ");
  const detail = nameDetail
    ? `${summaryParts.join(" · ")} — ${nameDetail}`
    : summaryParts.join(" · ");

  return {
    name: spellcastingInfo.isPreparedCaster
      ? "Prepared Spells"
      : "Spells Known",
    detail,
  };
}

function getSlotEquipped(
  level: number,
  levelLabel: string,
  spellSelections: BuilderSpellSelections,
  spellcastingInfo: SpellcastingInfo,
  spellLevelByName: Map<string, number>,
  spellsByName: Spell[],
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
  const optionalFeatureGrants = grantsForSpellLevel(
    spellcastingInfo.optionalFeatureGranted,
    level,
    spellLevelByName,
    spellsByName,
  );
  const subclassCount =
    alwaysPreparedGrants.length +
    bonusKnownGrants.length +
    optionalFeatureGrants.length;

  if (level === 0) {
    return getCantripEquipped(
      spellSelections,
      spellcastingInfo,
      spellLevelByName,
      spellsByName,
    );
  }

  if (selected.length === 0 && subclassCount === 0) return null;

  const summaryParts: string[] = [];
  if (selected.length > 0) {
    summaryParts.push(
      `${selected.length} ${spellcastingInfo.isPreparedCaster ? "prepared" : "known"}`,
    );
  }
  if (alwaysPreparedGrants.length > 0) {
    summaryParts.push(`${alwaysPreparedGrants.length} always prepared`);
  }
  if (bonusKnownGrants.length > 0) {
    summaryParts.push(`${bonusKnownGrants.length} bonus known`);
  }
  if (optionalFeatureGrants.length > 0) {
    summaryParts.push(`${optionalFeatureGrants.length} optional known feature`);
  }

  const subclassNames = [
    ...alwaysPreparedGrants,
    ...bonusKnownGrants,
    ...optionalFeatureGrants,
  ]
    .map((g) => formatSpellListName(g.name, spellsByName))
    .join(", ");
  const selectedNames = selected
    .map((s) => formatSpellListName(s.name, spellsByName))
    .join(", ");
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
  const { availableSpellLevels, usesUnifiedPactPool } = spellcastingInfo;

  if (availableSpellLevels.length === 0 && !usesUnifiedPactPool) {
    return null;
  }

  const gridSlots: Array<{ kind: "level"; level: number } | { kind: "pact" }> =
    [];

  if (availableSpellLevels.includes(0)) {
    gridSlots.push({ kind: "level", level: 0 });
  }
  if (usesUnifiedPactPool) {
    gridSlots.push({ kind: "pact" });
  } else {
    for (const level of availableSpellLevels) {
      if (level === 0) continue;
      gridSlots.push({ kind: "level", level });
    }
  }

  const rows: (typeof gridSlots)[] = [];
  for (let i = 0; i < gridSlots.length; i += 5) {
    rows.push(gridSlots.slice(i, i + 5));
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} className="grid grid-cols-5 gap-1.5">
          {row.map((entry) => {
            if (entry.kind === "pact") {
              const equipped = getPactPoolEquipped(
                spellSelections,
                spellcastingInfo,
                spellLevelByName,
                spellsByName,
              );
              const label = spellcastingInfo.isPreparedCaster
                ? "Prepared Spells"
                : "Spells Known";
              return (
                <GridElementSlot
                  key={PACT_SPELL_SLOT}
                  label={label}
                  icon={<Sparkles className="h-5 w-5 text-violet-400" />}
                  equipped={equipped}
                  onClickEquip={() => onSelectSlot(PACT_SPELL_SLOT)}
                  onClickDetails={() => onSelectSlot(PACT_SPELL_SLOT)}
                  isSelected={selectedSlot === PACT_SPELL_SLOT}
                  emptyTitle={`Elegir hechizos de Pact Magic (1–${spellcastingInfo.pactMaxSpellLevel})`}
                />
              );
            }

            const level = entry.level;
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
            const colorClass =
              SPELL_LEVEL_COLORS[level] ?? "text-muted-foreground";

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
