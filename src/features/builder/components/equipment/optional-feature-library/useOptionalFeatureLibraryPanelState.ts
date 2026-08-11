import { useCallback, useEffect, useMemo, useState } from "react";
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
import type { ListFilterSectionConfig, ListFilterValues } from "@/shared/components/list-filters";
import { getAllDndOptionalFeatures } from "@/features/dnd-optionalfeatures/services/dnd-optionalfeature.service";
import { getAllDndFeats } from "@/features/dnd-feats/services/dnd-feat.service";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import { useSourceCatalog } from "@/shared/hooks/useSourceCatalog";
import {
  collectOptionPoolRefs,
  dndFeatToCatalogItem,
  dndFeatToSelection,
  dndOptionalFeatureToSelection,
  featureChoiceToCatalogItem,
  featureChoiceToSelection,
  filterCatalogForProgression,
  filterFeatsForProgression,
  getOtherFightingStylePicks,
  getProgressionPicks,
  isFeatureChoiceProgression,
  isFightingStyleProgression,
  isWeaponMasteryProgression,
  optionalFeatureToCatalogItem,
  parseOptionalFeatureSlot,
  type OptionalFeatureCatalogItem,
  type ResolvedOptionalFeatureProgression,
} from "@/features/builder/utils/class-optional-features.utils";
import {
  getFeatPrerequisiteSummary,
  getPrerequisiteSummary,
} from "@/features/builder/utils/optional-feature-prerequisites.utils";
import {
  resolveOptionalFeatureRpgbotContext,
  sortByRpgbotRating,
} from "@/features/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/builder/hooks/useRpgbotRatingsLookup";
import {
  isMeleeOnlyWeaponMasteryClass,
  WEAPON_MASTERY_GROUPS,
  WEAPON_MASTERY_OPTIONS,
} from "@/features/builder/data/weapon-mastery.data";
import {
  asFilterString,
  asFilterStringArray,
  buildLibrarySourceFilterSections,
  dndFeatMatchesTypeFilter,
  FEAT_LIBRARY_FILTER_SECTIONS,
} from "@/features/builder/utils/builder-library-filters";
import { entityMatchesSourceFilter } from "@/shared/utils/compendium-source-filter.utils";
import {
  canAddOptionalFeature,
  isOptionalFeaturePicked,
  normalizeName,
} from "./optional-feature-library.utils";

export function useOptionalFeatureLibraryPanelState({
  selectedSlot,
  progressions,
  classData,
  subclass,
  level,
  selections,
  onSetSelections,
}: {
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
}) {
  const parsed = parseOptionalFeatureSlot(selectedSlot);
  const bookNames = useBookSourceNames();
  const catalog = useSourceCatalog();
  const [optionalCatalog, setOptionalCatalog] = useState<DndOptionalFeature[]>(
    [],
  );
  const [featCatalog, setFeatCatalog] = useState<DndFeat[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterValues, setFilterValues] = useState<ListFilterValues>({});
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
    setFilterValues({});
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

  const isWeaponMastery = activeProgression
    ? isWeaponMasteryProgression(activeProgression.progression)
    : false;

  const weaponMasteryOptionById = useMemo(
    () => new Map(WEAPON_MASTERY_OPTIONS.map((option) => [option.id, option])),
    [],
  );

  const meleeOnlyWeaponMastery = useMemo(() => {
    if (!classData) return false;
    const descriptions: string[] = [];
    for (const row of classData.progression) {
      for (const feature of row.features) {
        if (feature.name === "Weapon Mastery") {
          descriptions.push(...feature.description);
        }
      }
    }
    return isMeleeOnlyWeaponMasteryClass(descriptions);
  }, [classData]);

  const filteredWeaponMasteryGroups = useMemo(() => {
    if (!isWeaponMastery) return [];
    const query = search.trim().toLowerCase();
    if (!query) return WEAPON_MASTERY_GROUPS;

    return WEAPON_MASTERY_GROUPS.map((group) => ({
      ...group,
      weapons: group.weapons.filter(
        (weapon) =>
          group.mastery.toLowerCase().includes(query) ||
          group.description.toLowerCase().includes(query) ||
          weapon.name.toLowerCase().includes(query),
      ),
    })).filter((group) => group.weapons.length > 0);
  }, [isWeaponMastery, search]);

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
  const sourceFilter = asFilterStringArray(filterValues.src);
  const featTypeFilter = asFilterString(filterValues.filter);

  const filterSections = useMemo((): ListFilterSectionConfig[] => {
    const codes = new Set<string>();
    for (const item of catalogOptions) codes.add(item.source);
    const sections = buildLibrarySourceFilterSections(codes, catalog, bookNames);
    if (usesFeatCatalog) {
      return [...FEAT_LIBRARY_FILTER_SECTIONS, ...sections];
    }
    return sections;
  }, [catalogOptions, catalog, bookNames, usesFeatCatalog]);

  // Apply Sources defaults once options exist (catalog / book list load async).
  useEffect(() => {
    const srcSection = filterSections.find((section) => section.id === "src");
    const defaults = srcSection?.defaultValues;
    if (!defaults || defaults.length === 0) return;
    setFilterValues((prev) => {
      const src = prev.src;
      const hasSrc = Array.isArray(src) ? src.length > 0 : !!src;
      if (hasSrc) return prev;
      return { ...prev, src: [...defaults] };
    });
  }, [filterSections, selectedSlot]);

  const filteredOptions = useMemo(() => {
    const base = catalogOptions.filter((item) => {
      if (
        q &&
        !(
          item.name.toLowerCase().includes(q) ||
          item.entries.some((e) => e.toLowerCase().includes(q)) ||
          item.source.toLowerCase().includes(q)
        )
      ) {
        return false;
      }
      if (
        sourceFilter.length > 0 &&
        !entityMatchesSourceFilter(item, sourceFilter, catalog, bookNames)
      ) {
        return false;
      }
      if (usesFeatCatalog && featTypeFilter) {
        const feat = featCatalog.find((f) => f.id === item.id);
        if (feat && !dndFeatMatchesTypeFilter(feat, featTypeFilter)) {
          return false;
        }
      }
      return true;
    });

    return sortByRpgbotRating(
      base,
      (item) =>
        rpgbotOptionalReady
          ? (rpgbotOptionalLookup?.(item.name, item.source) ?? null)
          : null,
      (item) => item.name,
    );
  }, [
    catalogOptions,
    q,
    sourceFilter,
    catalog,
    bookNames,
    usesFeatCatalog,
    featTypeFilter,
    featCatalog,
    rpgbotOptionalLookup,
    rpgbotOptionalReady,
  ]);

  const isPicked = useCallback(
    (item: OptionalFeatureCatalogItem) =>
      isOptionalFeaturePicked(item, picked),
    [picked],
  );

  const canAdd = useCallback(
    (item: OptionalFeatureCatalogItem) => {
      if (!activeProgression || !parsed) return false;
      return canAddOptionalFeature(item, {
        isGrantAllFeatureChoice,
        isPicked: isPicked(item),
        atCapacity,
        optionalCatalog,
        otherFightingStylePicks,
        activeProgression,
        className: classData.name,
        level,
        picked,
        progressionId: parsed.progressionId,
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
          isPickOneFeatureChoice && slotCount <= 1
            ? [selection]
            : [...picked, selection],
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
      slotCount,
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

  const progressionLabel = activeProgression?.progression.name ?? "";

  return {
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
  };
}
