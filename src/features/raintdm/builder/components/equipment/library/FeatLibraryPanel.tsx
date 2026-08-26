import { useEffect, useMemo, useState } from "react";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import {
  getAllFeats,
  getFeatById,
} from "@/features/amellwind/feats/services/feat.service";
import {
  getDndFeatById,
  getDndFeatsByName,
  getListDndFeats,
} from "@/features/dnd/feats/services/dnd-feat.service";
import { useCharacterBuilder } from "@/features/raintdm/builder/context/CharacterBuilderContext";
import { useLibraryVariants } from "@/features/raintdm/builder/hooks/useLibraryVariants";
import type { BuilderSlotSelection } from "@/features/raintdm/builder/hooks/useBuilderSlotSelection";
import {
  ABILITY_SCORE_IMPROVEMENT,
  DEFAULT_ASI_CHOICES,
  isAsiFeatSelection,
  isFeatSlotSelection,
  isOptionalOriginFeatSlot,
  isOriginFeatSlot,
  parseFeatSlotIndex,
  parseOptionalOriginFeatSlotIndex,
} from "@/features/raintdm/builder/utils/builder-class.utils";
import {
  buildFeatAbilityIncreaseChoices,
  setFeatAbilityIncreaseChoiceAt,
} from "@/features/raintdm/builder/utils/feat-ability-increase-choices.utils";
import {
  resolveOriginFeatChooseTarget,
} from "@/features/raintdm/builder/utils/origin-feat.constants";
import {
  dedupeByNameToListOptions,
  entityToLibraryOption,
  filterLibraryOptions,
  prepareLibraryListOptions,
  type LibraryListOption,
  type SourceVariant,
} from "@/features/raintdm/builder/utils/library-variant.utils";
import { resolveRpgbotContext } from "@/features/raintdm/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/raintdm/builder/hooks/useRpgbotRatingsLookup";
import type {
  AbilityKey,
  BuilderFeatSelection,
  DndFeat,
  Feat,
} from "@/shared/types";
import type { ListFilterValues } from "@/shared/components/list-filters";
import {
  asFilterString,
  dndFeatMatchesTypeFilter,
  type FeatDataSource,
} from "@/features/raintdm/builder/utils/builder-library-filters";
import { AsiLibraryPanel } from "../AsiLibraryPanel";
import { FeatLibraryDetail } from "./FeatLibraryDetail";
import { FeatList } from "./shared/LibraryLists";
import { EmptyState } from "./shared/LibraryUi";

function isDnd2024Feat(feat: DndFeat): boolean {
  return (
    feat.source === "XPHB" ||
    feat.basicRules2024 === true ||
    feat.srd52 === true
  );
}

interface FeatLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;
  q: string;
  featSource: FeatDataSource;
  onShowAsiPanelChange?: (show: boolean) => void;
  onSearchHiddenChange?: (hidden: boolean) => void;
  listFilters?: ListFilterValues;
}

export function FeatLibraryPanel({
  selectedSlot,
  q,
  featSource,
  onShowAsiPanelChange,
  onSearchHiddenChange,
  listFilters = {},
}: FeatLibraryPanelProps) {
  const [featDetail, setFeatDetail] = useState<Feat | DndFeat | null>(null);
  const [featDetailLoading, setFeatDetailLoading] = useState(false);
  const [showFeatList, setShowFeatList] = useState(true);
  const [amellwindFeats, setAmellwindFeats] = useState<Feat[]>([]);
  const [dndFeats, setDndFeats] = useState<DndFeat[]>([]);
  const [featsLoading, setFeatsLoading] = useState(false);

  const {
    featSelections,
    class: classSelection,
    speciesOriginFeatGrant,
    backgroundOriginFeatGrant,
    speciesOriginFeat,
    backgroundOriginFeat,
    optionalFeatureOriginFeats,
    setFeatAtIndex,
    setSpeciesOriginFeat,
    setBackgroundOriginFeat,
    setOptionalFeatureOriginFeatAtIndex,
  } = useCharacterBuilder();

  const identityBookNames = useBookSourceNames();

  const isOriginFeatSlotSelected =
    selectedSlot !== null && isOriginFeatSlot(selectedSlot);
  const isInvocationOriginFeatSlotSelected =
    selectedSlot !== null && isOptionalOriginFeatSlot(selectedSlot);
  const invocationOriginFeatIndex = isInvocationOriginFeatSlotSelected
    ? parseOptionalOriginFeatSlotIndex(selectedSlot)
    : null;
  const isFeatSlot = selectedSlot !== null && isFeatSlotSelection(selectedSlot);
  const featSlotIndex = isFeatSlot ? parseFeatSlotIndex(selectedSlot) : null;
  const isAnyOriginFeatSlotSelected =
    isOriginFeatSlotSelected || isInvocationOriginFeatSlotSelected;
  const originFeatChooseTarget = resolveOriginFeatChooseTarget(
    speciesOriginFeatGrant,
    backgroundOriginFeatGrant,
  );
  const originFeatLocked =
    originFeatChooseTarget !== null
      ? false
      : backgroundOriginFeatGrant?.kind === "fixed" ||
        speciesOriginFeatGrant?.kind === "fixed";

  const isFeatPickerSlot = isFeatSlot || isAnyOriginFeatSlotSelected;

  const rpgbotFeatContext = useMemo(() => {
    const useDnd2024 = isAnyOriginFeatSlotSelected || featSource === "dnd2024";
    if (!useDnd2024) return null;
    return resolveRpgbotContext({
      className: classSelection?.name,
      guideKey: "class",
      category: "feat",
    });
  }, [isAnyOriginFeatSlotSelected, featSource, classSelection?.name]);

  const { lookup: rpgbotFeatLookup, ready: rpgbotFeatReady } =
    useRpgbotRatingsLookup(rpgbotFeatContext);

  useEffect(() => {
    if (!isFeatPickerSlot) return;
    setFeatsLoading(true);
    Promise.all([getAllFeats(), getListDndFeats()])
      .then(([amellwind, dnd]) => {
        setAmellwindFeats(amellwind);
        setDndFeats(dnd);
      })
      .finally(() => setFeatsLoading(false));
  }, [isFeatPickerSlot, selectedSlot]);

  useEffect(() => {
    setShowFeatList(true);
  }, [selectedSlot]);

  const selectedFeat =
    isInvocationOriginFeatSlotSelected && invocationOriginFeatIndex !== null
      ? (optionalFeatureOriginFeats[invocationOriginFeatIndex] ?? null)
      : isOriginFeatSlotSelected
        ? (speciesOriginFeat ?? backgroundOriginFeat)
        : isFeatSlot && featSlotIndex !== null
          ? (featSelections[featSlotIndex] ?? null)
          : null;

  const showAsiPanel =
    isFeatSlot &&
    !!selectedFeat &&
    isAsiFeatSelection(selectedFeat) &&
    !showFeatList;

  useEffect(() => {
    if (!isFeatPickerSlot) return;
    if (isInvocationOriginFeatSlotSelected) {
      setShowFeatList(!selectedFeat);
      return;
    }
    if (isOriginFeatSlotSelected) {
      setShowFeatList(
        originFeatChooseTarget === "species"
          ? !speciesOriginFeat
          : originFeatChooseTarget === "background"
            ? !backgroundOriginFeat
            : !(speciesOriginFeat ?? backgroundOriginFeat) || originFeatLocked,
      );
      return;
    }
    const feat =
      featSlotIndex !== null ? (featSelections[featSlotIndex] ?? null) : null;
    setShowFeatList(!feat || !isAsiFeatSelection(feat));
  }, [
    isFeatPickerSlot,
    isOriginFeatSlotSelected,
    isInvocationOriginFeatSlotSelected,
    selectedFeat,
    originFeatLocked,
    originFeatChooseTarget,
    speciesOriginFeatGrant,
    speciesOriginFeat,
    backgroundOriginFeat,
    featSlotIndex,
    featSelections,
  ]);

  const showFeatDetail =
    isFeatPickerSlot &&
    !!selectedFeat &&
    !showAsiPanel &&
    !isAsiFeatSelection(selectedFeat) &&
    (isOriginFeatSlotSelected
      ? originFeatLocked || !showFeatList
      : isInvocationOriginFeatSlotSelected
        ? !showFeatList
        : true);

  useEffect(() => {
    onShowAsiPanelChange?.(showAsiPanel);
  }, [showAsiPanel, onShowAsiPanelChange]);

  useEffect(() => {
    onSearchHiddenChange?.(showAsiPanel || showFeatDetail);
  }, [showAsiPanel, showFeatDetail, onSearchHiddenChange]);

  const featTypeFilter = asFilterString(listFilters.filter);

  const featListOptions = useMemo((): LibraryListOption[] => {
    if (isAnyOriginFeatSlotSelected) {
      const originFeats = dndFeats.filter(
        (f) =>
          isDnd2024Feat(f) &&
          f.isOriginFeat &&
          dndFeatMatchesTypeFilter(f, featTypeFilter),
      );
      const deduped = dedupeByNameToListOptions(originFeats, (group) =>
        group
          .flatMap((f) => [f.name, f.source, f.summary, ...f.prerequisites])
          .join(" ")
          .toLowerCase(),
      );
      return prepareLibraryListOptions(
        deduped,
        q,
        rpgbotFeatLookup,
        rpgbotFeatReady,
      );
    }

    if (!isFeatSlot) return [];

    const asiOption: LibraryListOption = {
      id: ABILITY_SCORE_IMPROVEMENT.id,
      name: ABILITY_SCORE_IMPROVEMENT.name,
    };

    const dnd2024Asi = dndFeats.find(
      (f) => isDnd2024Feat(f) && f.name === ABILITY_SCORE_IMPROVEMENT.name,
    );

    if (featSource === "amellwind") {
      // Amellwind feats lack D&D feat-type facets; ignore type filter.
      const list = amellwindFeats
        .filter((f) => f.name !== ABILITY_SCORE_IMPROVEMENT.name)
        .map((f) => ({
          id: f.id,
          name: f.name,
          searchText: f.name.toLowerCase(),
        }));
      const filtered = filterLibraryOptions(list, q);
      return [asiOption, ...filtered];
    }

    const editionFeats =
      featSource === "dnd2014"
        ? dndFeats.filter(
            (f) =>
              !isDnd2024Feat(f) && dndFeatMatchesTypeFilter(f, featTypeFilter),
          )
        : dndFeats.filter(
            (f) =>
              isDnd2024Feat(f) && dndFeatMatchesTypeFilter(f, featTypeFilter),
          );

    const deduped = dedupeByNameToListOptions(editionFeats, (group) =>
      group
        .flatMap((f) => [f.name, f.source, f.summary, ...f.prerequisites])
        .join(" ")
        .toLowerCase(),
    ).filter((f) => f.name !== ABILITY_SCORE_IMPROVEMENT.name);

    const prepared = prepareLibraryListOptions(
      deduped,
      q,
      featSource === "dnd2024" ? rpgbotFeatLookup : null,
      rpgbotFeatReady,
    );

    if (featSource === "dnd2024" && dnd2024Asi) {
      return [entityToLibraryOption(dnd2024Asi), ...prepared];
    }

    return [asiOption, ...prepared];
  }, [
    isFeatSlot,
    isAnyOriginFeatSlotSelected,
    featSource,
    amellwindFeats,
    dndFeats,
    q,
    rpgbotFeatLookup,
    rpgbotFeatReady,
    featTypeFilter,
  ]);

  const isDndFeatSelection =
    selectedFeat?.source === "dnd2014" || selectedFeat?.source === "dnd2024";

  const dndFeatVariantsRaw = useLibraryVariants<DndFeat>(
    isDndFeatSelection && !!selectedFeat?.name,
    selectedFeat?.name,
    getDndFeatsByName,
  );

  const dndFeatSourceVariants = useMemo((): SourceVariant[] => {
    if (!isDndFeatSelection) return [];
    const filtered =
      selectedFeat?.source === "dnd2024"
        ? dndFeatVariantsRaw.filter(isDnd2024Feat)
        : dndFeatVariantsRaw.filter((f) => !isDnd2024Feat(f));
    return filtered;
  }, [dndFeatVariantsRaw, isDndFeatSelection, selectedFeat?.source]);

  useEffect(() => {
    if (!showFeatDetail || !selectedFeat) {
      setFeatDetail(null);
      setFeatDetailLoading(false);
      return;
    }

    let cancelled = false;
    setFeatDetailLoading(true);
    setFeatDetail(null);

    const load =
      selectedFeat.source === "amellwind"
        ? getFeatById(selectedFeat.id)
        : getDndFeatById(selectedFeat.id);

    load
      .then((data) => {
        if (!cancelled && data) setFeatDetail(data);
      })
      .finally(() => {
        if (!cancelled) setFeatDetailLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [showFeatDetail, selectedFeat?.id, selectedFeat?.source]);

  // Ensure ability-increase picks exist once the full feat is resolved.
  useEffect(() => {
    if (!featDetail || !selectedFeat || isAsiFeatSelection(selectedFeat)) return;
    if (featDetail.abilityIncreases.length === 0) return;

    const nextChoices = buildFeatAbilityIncreaseChoices(
      featDetail.abilityIncreases,
      { previous: selectedFeat.abilityIncreaseChoices },
    );
    const prev = selectedFeat.abilityIncreaseChoices;
    const unchanged =
      prev &&
      prev.length === nextChoices.length &&
      prev.every(
        (choice, i) =>
          choice.ability === nextChoices[i]?.ability &&
          choice.amount === nextChoices[i]?.amount,
      );
    if (unchanged) return;

    const nextSelection: BuilderFeatSelection = {
      ...selectedFeat,
      abilityIncreaseChoices: nextChoices,
    };

    if (
      isInvocationOriginFeatSlotSelected &&
      invocationOriginFeatIndex !== null
    ) {
      setOptionalFeatureOriginFeatAtIndex(
        invocationOriginFeatIndex,
        nextSelection,
      );
      return;
    }
    if (isOriginFeatSlotSelected) {
      if (originFeatLocked) return;
      if (originFeatChooseTarget === "background") {
        setBackgroundOriginFeat(nextSelection);
      } else {
        setSpeciesOriginFeat(nextSelection);
      }
      return;
    }
    if (featSlotIndex === null) return;
    setFeatAtIndex(featSlotIndex, nextSelection);
  }, [
    featDetail,
    selectedFeat,
    isInvocationOriginFeatSlotSelected,
    invocationOriginFeatIndex,
    isOriginFeatSlotSelected,
    originFeatLocked,
    originFeatChooseTarget,
    featSlotIndex,
    setOptionalFeatureOriginFeatAtIndex,
    setBackgroundOriginFeat,
    setSpeciesOriginFeat,
    setFeatAtIndex,
  ]);

  function withAbilityIncreaseChoices(
    selection: BuilderFeatSelection,
    feat: Feat | DndFeat | undefined,
  ): BuilderFeatSelection {
    if (isAsiFeatSelection(selection) || !feat?.abilityIncreases.length) {
      return selection;
    }
    return {
      ...selection,
      abilityIncreaseChoices: buildFeatAbilityIncreaseChoices(
        feat.abilityIncreases,
        { previous: selection.abilityIncreaseChoices },
      ),
    };
  }

  function findLoadedFeat(
    id: string,
    source: BuilderFeatSelection["source"],
  ): Feat | DndFeat | undefined {
    if (source === "amellwind") {
      return amellwindFeats.find((f) => f.id === id);
    }
    if (source === "dnd2014" || source === "dnd2024") {
      return dndFeats.find((f) => f.id === id);
    }
    return undefined;
  }

  function handleSelectFeatOption(id: string, name: string) {
    if (featSlotIndex === null) return;

    if (id === ABILITY_SCORE_IMPROVEMENT.id && featSource !== "dnd2024") {
      handleSelectFeat({
        id,
        name,
        source: "asi",
      });
      return;
    }

    const source =
      featSource === "amellwind"
        ? ("amellwind" as const)
        : featSource === "dnd2024"
          ? ("dnd2024" as const)
          : ("dnd2014" as const);

    handleSelectFeat(
      withAbilityIncreaseChoices({ id, name, source }, findLoadedFeat(id, source)),
    );
  }

  function setOriginFeatSelection(selection: BuilderFeatSelection | null) {
    if (originFeatChooseTarget === "background") {
      setBackgroundOriginFeat(selection);
      return;
    }
    setSpeciesOriginFeat(selection);
  }

  function handleDndFeatSourceSelect(id: string) {
    const variant = dndFeatSourceVariants.find((v) => v.id === id);
    if (!variant || !selectedFeat) return;
    const fullVariant =
      dndFeatVariantsRaw.find((f) => f.id === id) ??
      findLoadedFeat(id, selectedFeat.source);
    const next = withAbilityIncreaseChoices(
      {
        id: variant.id,
        name: selectedFeat.name,
        source: selectedFeat.source,
      },
      fullVariant,
    );
    if (
      isInvocationOriginFeatSlotSelected &&
      invocationOriginFeatIndex !== null
    ) {
      setOptionalFeatureOriginFeatAtIndex(invocationOriginFeatIndex, next);
      return;
    }
    if (isOriginFeatSlotSelected) {
      if (originFeatLocked) return;
      setOriginFeatSelection(next);
      return;
    }
    if (featSlotIndex === null) return;
    setFeatAtIndex(featSlotIndex, next);
  }

  function handleSelectFeat(selection: BuilderFeatSelection) {
    if (
      isInvocationOriginFeatSlotSelected &&
      invocationOriginFeatIndex !== null
    ) {
      setOptionalFeatureOriginFeatAtIndex(invocationOriginFeatIndex, selection);
      setShowFeatList(false);
      return;
    }
    if (isOriginFeatSlotSelected) {
      if (originFeatLocked) return;
      setOriginFeatSelection(selection);
      setShowFeatList(false);
      return;
    }
    if (featSlotIndex === null) return;
    const next: BuilderFeatSelection = isAsiFeatSelection(selection)
      ? {
          ...selection,
          asiChoices: selection.asiChoices ?? { ...DEFAULT_ASI_CHOICES },
        }
      : selection;
    setFeatAtIndex(featSlotIndex, next);
    if (isAsiFeatSelection(next)) {
      setShowFeatList(false);
    }
  }

  function handleSelectOriginFeatOption(id: string, name: string) {
    handleSelectFeat(
      withAbilityIncreaseChoices(
        { id, name, source: "dnd2024" },
        findLoadedFeat(id, "dnd2024"),
      ),
    );
  }

  function handleUpdateAsiChoices(
    choices: NonNullable<BuilderFeatSelection["asiChoices"]>,
  ) {
    if (featSlotIndex === null || !selectedFeat) return;
    setFeatAtIndex(featSlotIndex, { ...selectedFeat, asiChoices: choices });
  }

  function handleAbilityIncreaseChoiceChange(
    index: number,
    ability: AbilityKey | null,
  ) {
    if (!selectedFeat?.abilityIncreaseChoices) return;
    const nextSelection: BuilderFeatSelection = {
      ...selectedFeat,
      abilityIncreaseChoices: setFeatAbilityIncreaseChoiceAt(
        selectedFeat.abilityIncreaseChoices,
        index,
        ability,
      ),
    };

    if (
      isInvocationOriginFeatSlotSelected &&
      invocationOriginFeatIndex !== null
    ) {
      setOptionalFeatureOriginFeatAtIndex(
        invocationOriginFeatIndex,
        nextSelection,
      );
      return;
    }
    if (isOriginFeatSlotSelected) {
      if (originFeatLocked) return;
      setOriginFeatSelection(nextSelection);
      return;
    }
    if (featSlotIndex === null) return;
    setFeatAtIndex(featSlotIndex, nextSelection);
  }

  function renderFeatDetail(allowSourceSelect: boolean) {
    if (featDetailLoading) {
      return <EmptyState text="Loading..." />;
    }
    if (featDetail) {
      return (
        <FeatLibraryDetail
          feat={featDetail}
          sourceVariants={
            isDndFeatSelection ? dndFeatSourceVariants : undefined
          }
          activeSourceId={selectedFeat?.id}
          onSourceSelect={
            isDndFeatSelection && allowSourceSelect
              ? handleDndFeatSourceSelect
              : undefined
          }
          bookNames={identityBookNames}
          abilityIncreaseChoices={selectedFeat?.abilityIncreaseChoices}
          onAbilityIncreaseChoiceChange={
            selectedFeat && !isAsiFeatSelection(selectedFeat)
              ? handleAbilityIncreaseChoiceChange
              : undefined
          }
        />
      );
    }
    return <EmptyState text="Information not found." />;
  }

  if (!isFeatPickerSlot) return null;

  if (isInvocationOriginFeatSlotSelected) {
    if (showFeatDetail) {
      return renderFeatDetail(true);
    }
    if (featsLoading) {
      return <EmptyState text="Loading feats..." />;
    }
    return (
      <FeatList
        options={featListOptions}
        selectedId={selectedFeat?.id ?? null}
        selectedName={selectedFeat?.name ?? null}
        onSelect={handleSelectOriginFeatOption}
      />
    );
  }

  if (isOriginFeatSlotSelected) {
    if (!speciesOriginFeatGrant && !backgroundOriginFeatGrant) {
      return (
        <EmptyState text="The background and species do not grant an Origin Feat." />
      );
    }

    if (showFeatDetail) {
      return renderFeatDetail(!originFeatLocked);
    }

    if (featsLoading) {
      return <EmptyState text="Loading feats..." />;
    }

    return (
      <FeatList
        options={featListOptions}
        selectedId={selectedFeat?.id ?? null}
        selectedName={selectedFeat?.name ?? null}
        onSelect={handleSelectOriginFeatOption}
      />
    );
  }

  if (isFeatSlot) {
    if (showAsiPanel && selectedFeat) {
      return (
        <AsiLibraryPanel
          choices={selectedFeat.asiChoices ?? { ...DEFAULT_ASI_CHOICES }}
          onChange={handleUpdateAsiChoices}
          onBack={() => setShowFeatList(true)}
        />
      );
    }

    if (showFeatDetail) {
      return renderFeatDetail(true);
    }

    if (featsLoading) {
      return <EmptyState text="Loading feats..." />;
    }

    return (
      <FeatList
        options={featListOptions}
        selectedId={selectedFeat?.id ?? null}
        selectedName={isDndFeatSelection ? (selectedFeat?.name ?? null) : null}
        onSelect={handleSelectFeatOption}
      />
    );
  }

  return null;
}

export function isFeatPickerSlot(selectedSlot: BuilderSlotSelection): boolean {
  if (!selectedSlot) return false;
  return (
    isFeatSlotSelection(selectedSlot) ||
    isOriginFeatSlot(selectedSlot) ||
    isOptionalOriginFeatSlot(selectedSlot)
  );
}
