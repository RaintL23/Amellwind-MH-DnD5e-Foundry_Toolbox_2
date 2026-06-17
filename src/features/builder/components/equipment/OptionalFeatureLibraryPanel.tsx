import { useCallback, useEffect, useMemo, useState } from "react";
import { Search, Swords, X } from "lucide-react";
import type {
  Class,
  DndFeat,
  DndOptionalFeature,
  Subclass,
} from "@/shared/types";
import type {
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
  BuilderOptionalFeatureSlot,
} from "@/shared/types";
import { BuilderPanel } from "../shared/BuilderPanel";
import { ScrollableWhenNeeded } from "../shared/ScrollableWhenNeeded";
import { cn } from "@/shared/utils/cn";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import { getAllDndFeats } from "@/features/dnd-feats/services/dnd-feat.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { resolveBookSourceName } from "@/features/spells/services/book-source.service";
import {
  collectOptionPoolRefs,
  dndFeatToCatalogItem,
  dndFeatToSelection,
  dndOptionalFeatureToSelection,
  featureChoiceToCatalogItem,
  featureChoiceToSelection,
  filterCatalogForProgression,
  filterFeatsForProgression,
  getFeatCategoryLabel,
  getOtherFightingStylePicks,
  getProgressionPicks,
  isFeatureChoiceProgression,
  isFightingStyleProgression,
  optionalFeatureToCatalogItem,
  parseOptionalFeatureSlot,
  type OptionalFeatureCatalogItem,
  type ResolvedOptionalFeatureProgression,
} from "../../utils/class-optional-features.utils";
import {
  getFeatPrerequisiteSummary,
  getPrerequisiteSummary,
  isFightingStyleFeatAvailable,
  isOptionalFeatureAvailable,
} from "../../utils/optional-feature-prerequisites.utils";
import {
  ItemRow,
  LibraryItemBadge,
  LibraryItemBadgeRow,
} from "./library/shared/LibraryUi";
import { OptionalFeatureLibraryDetail } from "./library/OptionalFeatureLibraryDetail";
import {
  resolveOptionalFeatureRpgbotContext,
  sortByRpgbotRating,
} from "@/features/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/builder/hooks/useRpgbotRatingsLookup";

interface OptionalFeatureLibraryPanelProps {
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
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function OptionalFeatureLibraryPanel({
  selectedSlot,
  progressions,
  classData,
  subclass,
  level,
  selections,
  onSetSelections,
}: OptionalFeatureLibraryPanelProps) {
  const parsed = parseOptionalFeatureSlot(selectedSlot);
  const bookNames = useBookSourceNames();
  const [optionalCatalog, setOptionalCatalog] = useState<DndOptionalFeature[]>(
    [],
  );
  const [featCatalog, setFeatCatalog] = useState<DndFeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [detailItem, setDetailItem] =
    useState<OptionalFeatureCatalogItem | null>(null);

  const activeProgression = useMemo(() => {
    if (!parsed) return null;
    return (
      progressions.find((p) => p.progression.id === parsed.progressionId) ??
      null
    );
  }, [parsed, progressions]);

  const usesFeatCatalog = activeProgression?.progression.catalog === "feat";
  const isFeatureChoice = activeProgression
    ? isFeatureChoiceProgression(activeProgression.progression)
    : false;
  const isPickOneFeatureChoice =
    isFeatureChoice && activeProgression?.progression.pickMode === "one";
  const isGrantAllFeatureChoice =
    isFeatureChoice && activeProgression?.progression.pickMode === "all";

  useEffect(() => {
    setSearch("");
    setDetailItem(null);
  }, [selectedSlot]);

  useEffect(() => {
    if (isFeatureChoice) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const loaders: Promise<void>[] = [
      getAllDndOptionalFeatures()
        .then(setOptionalCatalog)
        .then(() => undefined),
    ];
    if (usesFeatCatalog) {
      loaders.push(
        getAllDndFeats()
          .then(setFeatCatalog)
          .then(() => undefined),
      );
    }
    Promise.all(loaders).finally(() => setLoading(false));
  }, [usesFeatCatalog, isFeatureChoice]);

  const picked = useMemo(() => {
    if (!parsed) return [];
    return getProgressionPicks(selections, parsed.progressionId);
  }, [parsed, selections]);

  const otherFightingStylePicks = useMemo(() => {
    if (!parsed || !activeProgression) return [];
    if (!isFightingStyleProgression(activeProgression.progression)) return [];
    return getOtherFightingStylePicks(
      selections,
      progressions,
      parsed.progressionId,
    );
  }, [parsed, activeProgression, selections, progressions]);

  const slotCount = activeProgression?.slotCount ?? 0;
  const atCapacity = picked.length >= slotCount;

  const catalogOptions = useMemo((): OptionalFeatureCatalogItem[] => {
    if (!activeProgression || !parsed) return [];

    const progression = activeProgression.progression;

    if (progression.catalog === "feature-choice") {
      return (progression.choiceOptions ?? []).map(featureChoiceToCatalogItem);
    }

    const poolRefs = collectOptionPoolRefs(
      classData,
      subclass,
      level,
      progression.catalog ?? "optionalfeature",
    );

    if (progression.catalog === "feat") {
      const feats = filterFeatsForProgression(
        featCatalog,
        poolRefs,
        progression.featCategories ?? ["FS"],
      );
      return feats.map((feat) =>
        dndFeatToCatalogItem(feat, getFeatPrerequisiteSummary(feat)),
      );
    }

    const options = filterCatalogForProgression(
      optionalCatalog,
      poolRefs,
      progression.featureTypes,
    );
    return options.map((feature) =>
      optionalFeatureToCatalogItem(feature, getPrerequisiteSummary(feature)),
    );
  }, [
    activeProgression,
    parsed,
    optionalCatalog,
    featCatalog,
    classData,
    subclass,
    level,
  ]);

  const isFightingStyle = activeProgression
    ? isFightingStyleProgression(activeProgression.progression)
    : false;

  const rpgbotOptionalContext = useMemo(() => {
    if (!activeProgression) return null;
    return resolveOptionalFeatureRpgbotContext({
      className: classData.name,
      progressionName: activeProgression.progression.name,
      featureTypes: activeProgression.progression.featureTypes,
      catalog: activeProgression.progression.catalog,
      isFightingStyle,
    });
  }, [activeProgression, classData.name, isFightingStyle]);

  const { lookup: rpgbotOptionalLookup, ready: rpgbotOptionalReady } =
    useRpgbotRatingsLookup(rpgbotOptionalContext);

  const q = search.trim().toLowerCase();
  const filteredOptions = useMemo(() => {
    const base = !q
      ? catalogOptions
      : catalogOptions.filter(
          (item) =>
            item.name.toLowerCase().includes(q) ||
            item.entries.some((e) => e.toLowerCase().includes(q)) ||
            item.source.toLowerCase().includes(q),
        );

    return sortByRpgbotRating(
      base,
      (item) =>
        rpgbotOptionalReady
          ? (rpgbotOptionalLookup?.(item.name, item.source) ?? null)
          : null,
      (item) => item.name,
    );
  }, [catalogOptions, q, rpgbotOptionalLookup, rpgbotOptionalReady]);

  const isPicked = useCallback(
    (item: OptionalFeatureCatalogItem) =>
      picked.some((p) => normalizeName(p.name) === normalizeName(item.name)),
    [picked],
  );

  const canAdd = useCallback(
    (item: OptionalFeatureCatalogItem) => {
      if (isGrantAllFeatureChoice) return false;
      if (isPicked(item)) return true;
      if (atCapacity) return false;

      if (item.catalog === "feature-choice") {
        return true;
      }

      if (item.catalog === "feat") {
        return isFightingStyleFeatAvailable(
          { name: item.name } as DndFeat,
          otherFightingStylePicks,
        );
      }

      const feature = optionalCatalog.find((f) => f.id === item.id);
      if (!feature) return false;

      if (
        isFightingStyleProgression(activeProgression!.progression) &&
        otherFightingStylePicks.some(
          (p) => normalizeName(p.name) === normalizeName(item.name),
        )
      ) {
        return false;
      }

      return isOptionalFeatureAvailable(feature, {
        className: classData.name,
        classLevel: level,
        selectedFeatures: picked,
        progressionId: parsed!.progressionId,
      });
    },
    [
      isPicked,
      atCapacity,
      isGrantAllFeatureChoice,
      optionalCatalog,
      otherFightingStylePicks,
      activeProgression,
      classData.name,
      level,
      picked,
      parsed,
    ],
  );

  const handleToggle = useCallback(
    (item: OptionalFeatureCatalogItem) => {
      if (!parsed) return;

      if (isPicked(item)) {
        onSetSelections(
          parsed.progressionId,
          picked.filter(
            (p) => normalizeName(p.name) !== normalizeName(item.name),
          ),
        );
        return;
      }

      if (!canAdd(item)) return;

      if (item.catalog === "feature-choice") {
        const option = activeProgression!.progression.choiceOptions?.find(
          (o) => o.id === item.id,
        );
        if (!option) return;
        const selection = featureChoiceToSelection(
          option,
          parsed.progressionId,
        );
        onSetSelections(
          parsed.progressionId,
          isPickOneFeatureChoice ? [selection] : [...picked, selection],
        );
        return;
      }

      const selection =
        item.catalog === "feat"
          ? dndFeatToSelection(
              featCatalog.find((f) => f.id === item.id)!,
              parsed.progressionId,
            )
          : dndOptionalFeatureToSelection(
              optionalCatalog.find((f) => f.id === item.id)!,
              parsed.progressionId,
            );

      onSetSelections(parsed.progressionId, [...picked, selection]);
    },
    [
      parsed,
      isPicked,
      canAdd,
      picked,
      onSetSelections,
      featCatalog,
      optionalCatalog,
      activeProgression,
      isPickOneFeatureChoice,
    ],
  );

  const handleRemove = useCallback(
    (selection: BuilderOptionalFeatureSelection) => {
      if (!parsed || isGrantAllFeatureChoice) return;
      onSetSelections(
        parsed.progressionId,
        picked.filter((p) => p.id !== selection.id),
      );
    },
    [parsed, picked, onSetSelections, isGrantAllFeatureChoice],
  );

  const handleClearAll = useCallback(() => {
    if (!parsed || isGrantAllFeatureChoice) return;
    onSetSelections(parsed.progressionId, []);
  }, [parsed, onSetSelections, isGrantAllFeatureChoice]);

  if (!parsed || !activeProgression) {
    return (
      <BuilderPanel title="Optional Features">
        <p className="text-xs italic text-muted-foreground">
          Selecciona un slot de optional feature.
        </p>
      </BuilderPanel>
    );
  }

  const progressionLabel = activeProgression.progression.name;

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

      <div className="relative mb-2">
        <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={`Buscar ${progressionLabel.toLowerCase()}…`}
          className="h-8 w-full rounded-md border border-border/70 bg-background/60 pl-7 pr-2 text-xs"
        />
      </div>

      <ScrollableWhenNeeded className="max-h-[1200px]">
        {loading ? (
          <p className="py-4 text-center text-xs text-muted-foreground">
            Loading options…
          </p>
        ) : filteredOptions.length === 0 ? (
          <p className="py-4 text-center text-xs italic text-muted-foreground">
            No options in the catalog for this progression.
          </p>
        ) : (
          <ul className="space-y-0.5">
            {filteredOptions.map((item) => {
              const selected = isPicked(item);
              const addable = canAdd(item);
              const sourceBadge = {
                code: item.source,
                title: resolveBookSourceName(bookNames, item.source),
              };
              const categoryLabel =
                item.catalog === "feat"
                  ? getFeatCategoryLabel(item.category)
                  : item.featureTypes[0];
              const rpgbotRating = rpgbotOptionalReady
                ? (rpgbotOptionalLookup?.(item.name, item.source) ?? null)
                : null;

              return (
                <li key={item.id}>
                  <ItemRow
                    icon={
                      <Swords
                        className={cn(
                          "h-3.5 w-3.5",
                          selected ? "text-amber-400" : "text-muted-foreground",
                        )}
                      />
                    }
                    name={item.name}
                    rpgbotRating={rpgbotRating}
                    source={sourceBadge}
                    equipped={selected}
                    disabled={!selected && !addable}
                    disabledHint={
                      !addable && !selected
                        ? isFightingStyle &&
                          otherFightingStylePicks.some(
                            (p) =>
                              normalizeName(p.name) ===
                              normalizeName(item.name),
                          )
                          ? "You already selected this fighting style in another slot"
                          : "Not available"
                        : undefined
                    }
                    onClick={() => handleToggle(item)}
                    meta={
                      <LibraryItemBadgeRow>
                        {categoryLabel && (
                          <LibraryItemBadge variant="category">
                            {categoryLabel}
                          </LibraryItemBadge>
                        )}
                        {item.consumes && (
                          <LibraryItemBadge>{item.consumes}</LibraryItemBadge>
                        )}
                        {item.isRepeatable && (
                          <LibraryItemBadge>Repeatable</LibraryItemBadge>
                        )}
                        {usesFeatCatalog ? (
                          <LibraryItemBadge variant="category">
                            Feat
                          </LibraryItemBadge>
                        ) : item.catalog === "feature-choice" ? (
                          <LibraryItemBadge variant="category">
                            Class Feature
                          </LibraryItemBadge>
                        ) : (
                          <LibraryItemBadge variant="category">
                            Optional Feature
                          </LibraryItemBadge>
                        )}
                      </LibraryItemBadgeRow>
                    }
                    trailing={selected ? "Selected" : undefined}
                  />
                  <button
                    type="button"
                    onClick={() => setDetailItem(item)}
                    className="mb-1 ml-5 text-[10px] text-muted-foreground hover:text-foreground"
                  >
                    View detail
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </ScrollableWhenNeeded>
    </BuilderPanel>
  );
}
