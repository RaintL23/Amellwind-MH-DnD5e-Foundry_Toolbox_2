/**
 * Grid section of one additional class (multiclass entry): its optional
 * features (Fighting Style, Invocations…) and its own spellcasting slots.
 * Spell slots are scoped (`multiclass-<i>:<slot>`) so the shared slot
 * selection can tell them apart from the primary class grid.
 */
import { GraduationCap } from "lucide-react";
import type {
  AbilityKey,
  BuilderOptionalFeatureSelections,
  Spell,
} from "@/shared/types";
import type { BuilderSlotSelection } from "../../hooks/useBuilderSlotSelection";
import type { MulticlassSpellcastingInfo } from "../../context/SpellcastingContext";
import {
  isMulticlassSpellSlot,
  parseMulticlassSpellSlot,
  toMulticlassSpellSlot,
  type MulticlassEntryContext,
} from "../../utils/multiclass.utils";
import {
  buildSpellcastingSectionTitle,
  computeSpellcastingAttackStats,
  hasChoosableSpellList,
} from "../../utils/spellcasting-stats.utils";
import { BuilderPanel } from "../shared/BuilderPanel";
import { GlossaryHint } from "../shared/GlossaryHint";
import { OptionalFeatureGridPanel } from "./OptionalFeatureGridPanel";
import { SpellcastingGridPanel } from "./SpellcastingGridPanel";

interface MulticlassClassGridPanelProps {
  context: MulticlassEntryContext;
  spellcasting: MulticlassSpellcastingInfo | undefined;
  optionalFeatureSelections: BuilderOptionalFeatureSelections;
  proficiencyBonus: number;
  getAbilityModifier: (key: AbilityKey) => number;
  spellLevelByName: Map<string, number>;
  allSpells: Spell[];
  selectedSlot: BuilderSlotSelection;
  onSelectSlot: (slot: BuilderSlotSelection) => void;
  onUnequipSlot: (slot: BuilderSlotSelection) => void;
}

export function MulticlassClassGridPanel({
  context,
  spellcasting,
  optionalFeatureSelections,
  proficiencyBonus,
  getAbilityModifier,
  spellLevelByName,
  allSpells,
  selectedSlot,
  onSelectSlot,
  onUnequipSlot,
}: Readonly<MulticlassClassGridPanelProps>) {
  const { index, classData, subclassData, entry, progressions } = context;
  const info = spellcasting?.spellcasting ?? null;
  const showSpells =
    !!info &&
    (hasChoosableSpellList(info) ||
      info.subclassAlwaysPrepared.length > 0 ||
      info.subclassBonusKnown.length > 0 ||
      info.optionalFeatureGranted.length > 0);

  if (progressions.length === 0 && !showSpells) return null;

  const innerSelected =
    selectedSlot && isMulticlassSpellSlot(selectedSlot)
      ? (() => {
          const parsed = parseMulticlassSpellSlot(selectedSlot);
          return parsed.index === index
            ? (parsed.innerSlot as BuilderSlotSelection)
            : null;
        })()
      : null;

  const stats = info
    ? computeSpellcastingAttackStats(
        info.spellcastingAbility,
        proficiencyBonus,
        getAbilityModifier,
      )
    : null;
  const spellTitle = info
    ? buildSpellcastingSectionTitle({
        sectionLabel: info.sectionLabel,
        sourceName: info.spellcastingFromSubclass
          ? (info.subclassShortName ?? info.subclassName ?? classData.name)
          : classData.name,
        spellAttackBonus: stats?.spellAttackBonus,
        spellSaveDc: stats?.spellSaveDc,
      })
    : "";

  return (
    <BuilderPanel
      title={
        <>
          <GraduationCap className="h-3.5 w-3.5 text-orange-400" aria-hidden />
          Class {index + 2} · {classData.name} {entry.level}
          {subclassData ? ` (${subclassData.shortName ?? subclassData.name})` : ""}
        </>
      }
      action={
        info && info.maxPreparedOrKnown > 0 ? (
          <span
            className={
              info.selectedSpellCount >= info.maxPreparedOrKnown
                ? "text-[11px] text-muted-foreground"
                : "text-[11px] text-emerald-400"
            }
          >
            <GlossaryHint term="prepared-known">
              {info.isPreparedCaster
                ? "Prepared"
                : info.usesUnifiedPactPool
                  ? "Pact known"
                  : "Known"}
            </GlossaryHint>{" "}
            {info.selectedSpellCount}/{info.maxPreparedOrKnown}
          </span>
        ) : undefined
      }
    >
      <div className="space-y-2.5">
        {progressions.length > 0 && (
          <OptionalFeatureGridPanel
            progressions={progressions}
            selections={optionalFeatureSelections}
            selectedSlot={selectedSlot}
            onSelectSlot={onSelectSlot}
            onUnequipSlot={onUnequipSlot}
          />
        )}
        {showSpells && info && (
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium text-muted-foreground">
              {spellTitle}
            </p>
            <SpellcastingGridPanel
              className={classData.name}
              spellcastingInfo={info}
              spellSelections={entry.spellSelections ?? {}}
              spellLevelByName={spellLevelByName}
              spellsByName={allSpells}
              selectedSlot={innerSelected}
              onSelectSlot={(slot) =>
                onSelectSlot(slot ? toMulticlassSpellSlot(index, slot) : null)
              }
            />
          </div>
        )}
      </div>
    </BuilderPanel>
  );
}
