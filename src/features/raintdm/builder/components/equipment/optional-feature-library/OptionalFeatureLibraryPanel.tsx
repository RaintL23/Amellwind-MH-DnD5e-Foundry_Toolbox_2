import { Swords, X } from "lucide-react";
import type {
  Class,
  Subclass,
} from "@/shared/types";
import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  BuilderOptionalFeatureSlot,
} from "@/shared/types";
import type { ResolvedOptionalFeatureProgression } from "@/features/raintdm/builder/utils/class-optional-features.utils";
import { BuilderPanel } from "../../shared/BuilderPanel";
import { ScrollableWhenNeeded } from "../../shared/ScrollableWhenNeeded";
import { ListSearchWithFilters } from "@/shared/components/list-filters";
import { cn } from "@/shared/utils/cn";
import { OptionalFeatureLibraryDetail } from "../library/OptionalFeatureLibraryDetail";
import { OptionalFeatureCatalogList } from "./OptionalFeatureCatalogList";
import { OptionalFeatureWeaponMasteryList } from "./OptionalFeatureWeaponMasteryList";
import { useOptionalFeatureLibraryPanelState } from "./useOptionalFeatureLibraryPanelState";

export interface OptionalFeatureLibraryPanelProps {
  selectedSlot: BuilderOptionalFeatureSlot;
  progressions: ResolvedOptionalFeatureProgression[];
  classData: Class;
  subclass: Subclass | null;
  level: number;
  selections: BuilderOptionalFeatureSelections;
  onSetSelections: (
    progressionId: string,
    picks: BuilderOptionalFeatureSelection[],
  ) => void;
  weaponProficiencies: string[];
}

export function OptionalFeatureLibraryPanel({
  selectedSlot,
  progressions,
  classData,
  subclass,
  level,
  selections,
  onSetSelections,
  weaponProficiencies,
}: OptionalFeatureLibraryPanelProps) {
  const {
    parsed,
    activeProgression,
    bookNames,
    search,
    setSearch,
    filterValues,
    setFilterValues,
    filterSections,
    detailItem,
    setDetailItem,
    loading,
    picked,
    slotCount,
    atCapacity,
    isGrantAllFeatureChoice,
    isWeaponMastery,
    isFightingStyle,
    progressionLabel,
    filteredWeaponMasteryGroups,
    filteredOptions,
    weaponMasteryOptionById,
    meleeOnlyWeaponMastery,
    usesFeatCatalog,
    otherFightingStylePicks,
    isPicked,
    canAdd,
    handleToggle,
    handleRemove,
    handleClearAll,
    rpgbotOptionalLookup,
    rpgbotOptionalReady,
  } = useOptionalFeatureLibraryPanelState({
    selectedSlot,
    progressions,
    classData,
    subclass,
    level,
    selections,
    onSetSelections,
  });

  if (!parsed || !activeProgression) {
    return (
      <BuilderPanel title="Optional Features">
        <p className="text-xs italic text-muted-foreground">
          Select an optional feature slot.
        </p>
      </BuilderPanel>
    );
  }

  if (detailItem) {
    return (
      <BuilderPanel
        title={
          <>
            <Swords className="h-3.5 w-3.5" aria-hidden />
            {progressionLabel}
          </>
        }
        action={
          <button
            type="button"
            onClick={() => setDetailItem(null)}
            className="text-[11px] text-muted-foreground hover:text-foreground"
          >
            Back to list
          </button>
        }
      >
        <OptionalFeatureLibraryDetail item={detailItem} bookNames={bookNames} />
      </BuilderPanel>
    );
  }

  return (
    <BuilderPanel
      title={
        <>
          <Swords className="h-3.5 w-3.5" aria-hidden />
          {progressionLabel}
        </>
      }
      action={
        picked.length > 0 && !isGrantAllFeatureChoice ? (
          <button
            type="button"
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
            Remove all
          </button>
        ) : (
          <span className="text-[11px] text-muted-foreground">
            {picked.length}/{slotCount} selected
          </span>
        )
      }
    >
      <p className="mb-2 text-[11px] text-muted-foreground">
        <span
          className={cn(
            "font-medium tabular-nums",
            atCapacity ? "text-amber-300" : "text-emerald-400",
          )}
        >
          {picked.length}/{slotCount}
        </span>{" "}
        selected options
        {isGrantAllFeatureChoice ? (
          <span className="text-muted-foreground/80">
            {" "}
            · automatically granted abilities
          </span>
        ) : isWeaponMastery ? (
          <span className="text-muted-foreground/80">
            {" "}
            · click a weapon badge under each mastery property
          </span>
        ) : isFightingStyle ? (
          <span className="text-muted-foreground/80">
            {" "}
            · you can't select the same fighting style in another slot
          </span>
        ) : null}
      </p>

      {picked.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {picked.map((selection) => (
            <button
              key={selection.id}
              type="button"
              onClick={() => handleRemove(selection)}
              className="inline-flex items-center gap-1 rounded-md border border-amber-700/50 bg-amber-950/30 px-1.5 py-0.5 text-[10px] text-amber-200 hover:border-rose-600/50 hover:bg-rose-950/30 hover:text-rose-200"
              title="Remove"
            >
              {selection.name}
              <span className="text-amber-400/70">({selection.source})</span>
              <X className="h-2.5 w-2.5" />
            </button>
          ))}
        </div>
      )}

      <div className="mb-2">
        <ListSearchWithFilters
          compact
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder={
            isWeaponMastery
              ? "Search mastery or weapon…"
              : `Search ${progressionLabel.toLowerCase()}…`
          }
          sections={filterSections}
          filterValues={filterValues}
          onFiltersApply={setFilterValues}
          dialogTitle="Library Filters"
          dialogDescription="Filter optional feature options by source and type."
        />
      </div>

      <ScrollableWhenNeeded className="max-h-[1200px]">
        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Loading options…
          </p>
        ) : isWeaponMastery ? (
          <OptionalFeatureWeaponMasteryList
            groups={filteredWeaponMasteryGroups}
            weaponMasteryOptionById={weaponMasteryOptionById}
            weaponProficiencies={weaponProficiencies}
            meleeOnlyWeaponMastery={meleeOnlyWeaponMastery}
            atCapacity={atCapacity}
            isPicked={isPicked}
            canAdd={canAdd}
            onToggle={handleToggle}
          />
        ) : (
          <OptionalFeatureCatalogList
            items={filteredOptions}
            bookNames={bookNames}
            usesFeatCatalog={usesFeatCatalog}
            isFightingStyle={isFightingStyle}
            otherFightingStylePicks={otherFightingStylePicks}
            rpgbotOptionalLookup={rpgbotOptionalLookup}
            rpgbotOptionalReady={rpgbotOptionalReady}
            isPicked={isPicked}
            canAdd={canAdd}
            onToggle={handleToggle}
            onViewDetail={setDetailItem}
          />
        )}
      </ScrollableWhenNeeded>
    </BuilderPanel>
  );
}
