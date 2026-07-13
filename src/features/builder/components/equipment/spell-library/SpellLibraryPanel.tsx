import { BookOpen, Search } from "lucide-react";
import type { Spell } from "@/shared/types";
import type {
  BuilderSpellSelection,
  BuilderSpellSelections,
} from "@/shared/types";
import type { SpellLevelSlot, BuilderPactSpellSlot, BuilderBonusCantripSlot } from "@/shared/types";
import type { SpellcastingInfo } from "@/features/builder/hooks/useSpellcasting";
import { BuilderPanel } from "../../shared/BuilderPanel";
import { ScrollableWhenNeeded } from "../../shared/ScrollableWhenNeeded";
import { Input } from "@/components/ui/input";
import { cn } from "@/shared/utils/cn";
import {
  EmptyState,
  SectionLabel,
} from "../library/shared/LibraryUi";
import { findSpellByName } from "@/features/builder/utils/spell-selection.utils";
import { isSpeciesLineageSpell } from "@/features/builder/utils/species-spell-grants.utils";
import { AvailableSpellRow } from "./AvailableSpellRow";
import { SelectedSpellRow } from "./SelectedSpellRow";
import { SubclassGrantRow } from "./SubclassGrantRow";
import { useSpellLibraryPanelState } from "./useSpellLibraryPanelState";

export interface SpellLibraryPanelProps {
  selectedSlot: SpellLevelSlot | BuilderPactSpellSlot | BuilderBonusCantripSlot;
  className: string;
  speciesName?: string | null;
  characterLevel: number;
  spellcastingInfo: SpellcastingInfo;
  spellSelections: BuilderSpellSelections;
  allSpells: Spell[];
  spellsLoading: boolean;
  spellLevelByName: Map<string, number>;
  onAddSpell: (level: number, spell: BuilderSpellSelection) => void;
  onRemoveSpell: (level: number, spellId: string) => void;
}

export function SpellLibraryPanel({
  selectedSlot,
  className,
  speciesName,
  characterLevel,
  spellcastingInfo,
  spellSelections,
  allSpells,
  spellsLoading,
  spellLevelByName,
  onAddSpell,
  onRemoveSpell,
}: SpellLibraryPanelProps) {
  const {
    search,
    setSearch,
    selectionLevel,
    chosenAtLevel,
    speciesLineageAtLevel,
    isAtCapacity,
    levelLabel,
    capacityHint,
    disabledHint,
    selectedSectionLabel,
    alwaysPreparedAtLevel,
    bonusKnownAtLevel,
    optionalFeatureAtLevel,
    filterGrantBySearch,
    availableSpells,
    handleSelect,
    rpgbotSpellLookup,
    rpgbotSpellReady,
  } = useSpellLibraryPanelState({
    selectedSlot,
    className,
    characterLevel,
    spellcastingInfo,
    spellSelections,
    allSpells,
    spellLevelByName,
    onAddSpell,
  });

  return (
    <BuilderPanel
      title={
        <span className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5" aria-hidden />
          <span>Library — {levelLabel}</span>
          <span className="text-[11px] font-normal text-muted-foreground">
            {spellcastingInfo.sectionLabel} · {className}
            {spellcastingInfo.spellcastingAbility
              ? ` · ${spellcastingInfo.spellcastingAbility}`
              : ""}
          </span>
          {capacityHint && (
            <span
              className={cn(
                "ml-auto text-[11px] font-medium tabular-nums",
                isAtCapacity ? "text-rose-400" : "text-emerald-400",
              )}
            >
              {capacityHint}
            </span>
          )}
        </span>
      }
    >
      <div className="relative mb-2">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="text"
          placeholder="Search spell name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-8 pl-8 text-xs"
        />
      </div>

      <ScrollableWhenNeeded>
        {alwaysPreparedAtLevel.filter(filterGrantBySearch).length > 0 && (
          <div className="mb-3">
            <SectionLabel>
              Always prepared spells by subclass
              {spellcastingInfo.subclassName
                ? ` (${spellcastingInfo.subclassName})`
                : ""}
            </SectionLabel>
            {alwaysPreparedAtLevel.filter(filterGrantBySearch).map((grant) => (
              <SubclassGrantRow
                key={`prepared-${grant.name}`}
                grant={grant}
                spell={findSpellByName(allSpells, grant.name)}
                badge="Always prepared spells by subclass"
              />
            ))}
          </div>
        )}

        {bonusKnownAtLevel.filter(filterGrantBySearch).length > 0 && (
          <div className="mb-3">
            <SectionLabel>
              Bonus known spells by subclass
              {spellcastingInfo.subclassName
                ? ` (${spellcastingInfo.subclassName})`
                : ""}
            </SectionLabel>
            {bonusKnownAtLevel.filter(filterGrantBySearch).map((grant) => (
              <SubclassGrantRow
                key={`known-${grant.name}`}
                grant={grant}
                spell={findSpellByName(allSpells, grant.name)}
                badge="Bonus known spells by subclass"
              />
            ))}
          </div>
        )}

        {optionalFeatureAtLevel.filter(filterGrantBySearch).length > 0 && (
          <div className="mb-3">
            <SectionLabel>Granted by optional features</SectionLabel>
            {optionalFeatureAtLevel.filter(filterGrantBySearch).map((grant) => (
              <SubclassGrantRow
                key={`opt-${grant.name}`}
                grant={grant}
                spell={findSpellByName(allSpells, grant.name)}
                badge={
                  grant.grantType === "bonus-known"
                    ? "Bonus known (feature)"
                    : "Granted by feature"
                }
              />
            ))}
          </div>
        )}

        {speciesLineageAtLevel.length > 0 && (
          <div className="mb-3">
            <SectionLabel>
              Granted by species
              {speciesName ? ` (${speciesName})` : ""}
            </SectionLabel>
            {speciesLineageAtLevel.map((spell) => (
              <SelectedSpellRow
                key={spell.id}
                spell={spell}
                fullSpell={
                  allSpells.find((s) => s.id === spell.id) ??
                  findSpellByName(allSpells, spell.name)
                }
                removable={false}
              />
            ))}
          </div>
        )}

        {chosenAtLevel.length > 0 && (
          <div className="mb-3">
            <SectionLabel>{selectedSectionLabel}</SectionLabel>
            {chosenAtLevel.map((spell) => (
              <SelectedSpellRow
                key={spell.id}
                spell={spell}
                fullSpell={allSpells.find((s) => s.id === spell.id)}
                onRemove={() => onRemoveSpell(selectionLevel, spell.id)}
                removable={!isSpeciesLineageSpell(spell)}
              />
            ))}
          </div>
        )}

        {spellsLoading ? (
          <EmptyState text="Loading spells..." />
        ) : isAtCapacity ? (
          <EmptyState text={disabledHint} />
        ) : availableSpells.length === 0 && !search.trim() ? (
          <EmptyState text={`No spells of ${levelLabel} for ${className}.`} />
        ) : availableSpells.length === 0 && search.trim() ? (
          <EmptyState text="No results." />
        ) : (
          <>
            <SectionLabel>Available</SectionLabel>
            {availableSpells.map((spell) => (
              <AvailableSpellRow
                key={spell.id}
                spell={spell}
                disabled={false}
                rpgbotRating={
                  rpgbotSpellReady
                    ? (rpgbotSpellLookup?.(spell.name, spell.source) ?? null)
                    : null
                }
                onSelect={() => handleSelect(spell)}
              />
            ))}
          </>
        )}
      </ScrollableWhenNeeded>
    </BuilderPanel>
  );
}
