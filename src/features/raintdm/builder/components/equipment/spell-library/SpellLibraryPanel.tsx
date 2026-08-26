import { BookOpen } from "lucide-react";
import { Select } from "@/components/ui/select";
import type { Spell } from "@/shared/types";
import { useCharacterBuilder } from "@/features/raintdm/builder/context/CharacterBuilderContext";
import {
  applyFeatSpellListChoice,
  resolveFeatOwnerFromPoolId,
} from "@/features/raintdm/builder/utils/feat-spell-list.utils";
import type {
  BuilderSpellSelection,
  BuilderSpellSelections,
} from "@/shared/types";
import type {
  SpellLevelSlot,
  BuilderPactSpellSlot,
  BuilderBonusCantripSlot,
  BuilderBonusFeatSpellSlot,
} from "@/shared/types";
import type { SpellcastingInfo } from "@/features/raintdm/builder/hooks/useSpellcasting";
import { BuilderPanel } from "../../shared/BuilderPanel";
import { ScrollableWhenNeeded } from "../../shared/ScrollableWhenNeeded";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import { cn } from "@/shared/utils/cn";
import { EmptyState, SectionLabel } from "../library/shared/LibraryUi";
import { findSpellByName } from "@/features/raintdm/builder/utils/spell-selection.utils";
import { isSpeciesLineageSpell } from "@/features/raintdm/builder/utils/species-spell-grants.utils";
import { AvailableSpellRow } from "./AvailableSpellRow";
import { SelectedSpellRow } from "./SelectedSpellRow";
import { SubclassGrantRow } from "./SubclassGrantRow";
import { useSpellLibraryPanelState } from "./useSpellLibraryPanelState";

export interface SpellLibraryPanelProps {
  selectedSlot:
    | SpellLevelSlot
    | BuilderPactSpellSlot
    | BuilderBonusCantripSlot
    | BuilderBonusFeatSpellSlot;
  className: string;
  speciesName?: string | null;
  characterLevel: number;
  spellcastingInfo: SpellcastingInfo;
  spellSelections: BuilderSpellSelections;
  allSpells: Spell[];
  spellsLoading: boolean;
  spellLevelByName: Map<string, number>;
  /** When false, only locked grants are shown (no Available pick list). */
  allowSpellPicks?: boolean;
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
  allowSpellPicks = true,
  onAddSpell,
  onRemoveSpell,
}: SpellLibraryPanelProps) {
  const {
    search,
    setSearch,
    filterValues,
    setFilterValues,
    filterSections,
    spellPool,
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
    activeBonusPool,
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

  const {
    speciesOriginFeat,
    backgroundOriginFeat,
    featSelections,
    setSpeciesOriginFeat,
    setBackgroundOriginFeat,
    setFeatAtIndex,
    clearBonusCantripSpellSelections,
  } = useCharacterBuilder();

  function handleSpellListClassChoice(className: string) {
    if (!activeBonusPool?.needsSpellListChoice) return;
    const owner = resolveFeatOwnerFromPoolId(activeBonusPool.poolId);
    if (!owner) return;

    const nextSelection = applyFeatSpellListChoice(owner, className, {
      speciesOriginFeat,
      backgroundOriginFeat,
      featSelections,
    });
    if (!nextSelection) return;

    clearBonusCantripSpellSelections();
    switch (owner.kind) {
      case "species-origin":
        setSpeciesOriginFeat(nextSelection);
        break;
      case "background-origin":
        setBackgroundOriginFeat(nextSelection);
        break;
      case "feat-slot":
        setFeatAtIndex(owner.index, nextSelection);
        break;
    }
  }

  const selectedSpellListClassChoice =
    activeBonusPool?.needsSpellListChoice
      ? (() => {
          const owner = resolveFeatOwnerFromPoolId(activeBonusPool.poolId);
          if (!owner) return null;
          switch (owner.kind) {
            case "species-origin":
              return speciesOriginFeat?.spellListClassChoice ?? null;
            case "background-origin":
              return backgroundOriginFeat?.spellListClassChoice ?? null;
            case "feat-slot":
              return featSelections[owner.index]?.spellListClassChoice ?? null;
          }
        })()
      : null;

  const hasActiveQueryOrFilters =
    !!search.trim() ||
    Object.values(filterValues).some((v) =>
      Array.isArray(v) ? v.length > 0 : !!v,
    );

  const filteredSpeciesLineage = speciesLineageAtLevel.filter(
    (spell) =>
      !search.trim() ||
      spell.name.toLowerCase().includes(search.toLowerCase().trim()),
  );

  const hasLockedGrantSections =
    alwaysPreparedAtLevel.filter(filterGrantBySearch).length > 0 ||
    bonusKnownAtLevel.filter(filterGrantBySearch).length > 0 ||
    optionalFeatureAtLevel.filter(filterGrantBySearch).length > 0 ||
    filteredSpeciesLineage.length > 0;

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
          {capacityHint && allowSpellPicks && (
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
      <div className="mb-2">
        {activeBonusPool?.needsSpellListChoice && (
          <div className="mb-3 space-y-2 rounded-md border border-border/60 bg-muted/20 p-2">
            <p className="text-[10px] font-medium text-foreground">
              Choose spell list for {activeBonusPool.label}
            </p>
            <Select
              value={selectedSpellListClassChoice ?? ""}
              onChange={(e) => {
                const value = e.target.value;
                if (value) handleSpellListClassChoice(value);
              }}
              className="h-8 w-full text-xs"
            >
              <option value="">Select Cleric, Druid, or Wizard…</option>
              {(activeBonusPool.spellListClassOptions ?? []).map((className) => (
                <option key={className} value={className}>
                  {className}
                </option>
              ))}
            </Select>
          </div>
        )}
        <ListSearchWithFilters
          compact
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search spell name..."
          sections={allowSpellPicks ? filterSections : []}
          filterValues={filterValues}
          onFiltersApply={setFilterValues}
          dialogTitle="Spell Filters"
          dialogDescription="Filter by school, components, damage, saves, cast time, sources, and more. Select Sources to include UA and partnered books."
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
                spell={findSpellByName(spellPool, grant.name)}
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
                spell={findSpellByName(spellPool, grant.name)}
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
                spell={findSpellByName(spellPool, grant.name)}
                badge={
                  grant.grantType === "bonus-known"
                    ? "Bonus known (feature)"
                    : "Granted by feature"
                }
              />
            ))}
          </div>
        )}

        {filteredSpeciesLineage.length > 0 && (
          <div className="mb-3">
            <SectionLabel>
              Spells granted by species
              {speciesName ? ` (${speciesName})` : ""}
            </SectionLabel>
            {filteredSpeciesLineage.map((spell) => (
              <SubclassGrantRow
                key={spell.id}
                grant={{
                  name: spell.name,
                  grantType: "always-prepared",
                  unlockedAtLevel: 1,
                }}
                spell={
                  spellPool.find((s) => s.id === spell.id) ??
                  findSpellByName(spellPool, spell.name)
                }
                badge="Spell granted by species"
              />
            ))}
          </div>
        )}

        {allowSpellPicks && chosenAtLevel.length > 0 && (
          <div className="mb-3">
            <SectionLabel>{selectedSectionLabel}</SectionLabel>
            {chosenAtLevel.map((spell) => (
              <SelectedSpellRow
                key={spell.id}
                spell={spell}
                fullSpell={spellPool.find((s) => s.id === spell.id)}
                onRemove={() => onRemoveSpell(selectionLevel, spell.id)}
                removable={!isSpeciesLineageSpell(spell)}
              />
            ))}
          </div>
        )}

        {allowSpellPicks &&
          (spellsLoading ? (
            <EmptyState text="Loading spells..." />
          ) : isAtCapacity ? (
            <EmptyState text={disabledHint} />
          ) : availableSpells.length === 0 && !hasActiveQueryOrFilters ? (
            <EmptyState text={`No spells of ${levelLabel} for ${className}.`} />
          ) : availableSpells.length === 0 && hasActiveQueryOrFilters ? (
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
          ))}

        {!allowSpellPicks &&
          !hasLockedGrantSections &&
          hasActiveQueryOrFilters && <EmptyState text="No results." />}
      </ScrollableWhenNeeded>
    </BuilderPanel>
  );
}
