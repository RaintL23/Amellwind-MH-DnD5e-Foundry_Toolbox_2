import { useEffect, useMemo, useState } from "react";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import {
  getAllFeats,
  getFeatById,
} from "@/features/feats/services/feat.service";
import {
  getDndFeatById,
  getDndFeatsByName,
  getListDndFeats,
} from "@/features/dnd-feats/services/dnd-feat.service";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import { useLibraryVariants } from "@/features/builder/hooks/useLibraryVariants";
import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";
import {
  ABILITY_SCORE_IMPROVEMENT,
  DEFAULT_ASI_CHOICES,
  isAsiFeatSelection,
  isFeatSlotSelection,
  isOptionalOriginFeatSlot,
  isOriginFeatSlot,
  parseFeatSlotIndex,
  parseOptionalOriginFeatSlotIndex,
} from "@/features/builder/utils/builder-class.utils";
import {
  dedupeByNameToListOptions,
  entityToLibraryOption,
  filterLibraryOptions,
  type LibraryListOption,
  type SourceVariant,
} from "@/features/builder/utils/library-variant.utils";
import type { FeatDataSource } from "@/features/builder/components/shared/FeatSourceBadgeGroup";
import type {
  BuilderFeatSelection,
  DndFeat,
  Feat,
} from "@/shared/types";
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
  onFeatSourceChange: (source: FeatDataSource) => void;
  onShowAsiPanelChange?: (show: boolean) => void;
  onSearchHiddenChange?: (hidden: boolean) => void;
}

export function FeatLibraryPanel({
  selectedSlot,
  q,
  featSource,
  onFeatSourceChange: _onFeatSourceChange,
  onShowAsiPanelChange,
  onSearchHiddenChange,
}: FeatLibraryPanelProps) {
  const [featDetail, setFeatDetail] = useState<Feat | DndFeat | null>(null);
  const [featDetailLoading, setFeatDetailLoading] = useState(false);
  const [showFeatList, setShowFeatList] = useState(true);
  const [amellwindFeats, setAmellwindFeats] = useState<Feat[]>([]);
  const [dndFeats, setDndFeats] = useState<DndFeat[]>([]);
  const [featsLoading, setFeatsLoading] = useState(false);

  const {
    featSelections,
    speciesOriginFeatGrant,
    backgroundOriginFeatGrant,
    speciesOriginFeat,
    backgroundOriginFeat,
    optionalFeatureOriginFeats,
    setFeatAtIndex,
    setSpeciesOriginFeat,
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
  const originFeatLocked =
    speciesOriginFeatGrant?.kind === "choose"
      ? false
      : backgroundOriginFeatGrant?.kind === "fixed" ||
        speciesOriginFeatGrant?.kind === "fixed";

  const isFeatPickerSlot = isFeatSlot || isAnyOriginFeatSlotSelected;

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

  const selectedFeat = isInvocationOriginFeatSlotSelected &&
    invocationOriginFeatIndex !== null
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
        speciesOriginFeatGrant?.kind === "choose"
          ? !speciesOriginFeat
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

  const featListOptions = useMemo((): LibraryListOption[] => {
    if (isAnyOriginFeatSlotSelected) {
      const originFeats = dndFeats.filter(
        (f) => isDnd2024Feat(f) && f.isOriginFeat,
      );
      const deduped = dedupeByNameToListOptions(originFeats, (group) =>
        group
          .flatMap((f) => [f.name, f.source, f.summary, ...f.prerequisites])
          .join(" ")
          .toLowerCase(),
      );
      return filterLibraryOptions(deduped, q);
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
        ? dndFeats.filter((f) => !isDnd2024Feat(f))
        : dndFeats.filter((f) => isDnd2024Feat(f));

    const deduped = dedupeByNameToListOptions(editionFeats, (group) =>
      group
        .flatMap((f) => [f.name, f.source, f.summary, ...f.prerequisites])
        .join(" ")
        .toLowerCase(),
    ).filter((f) => f.name !== ABILITY_SCORE_IMPROVEMENT.name);

    const filtered = filterLibraryOptions(deduped, q);

    if (featSource === "dnd2024" && dnd2024Asi) {
      return [entityToLibraryOption(dnd2024Asi), ...filtered];
    }

    return [asiOption, ...filtered];
  }, [
    isFeatSlot,
    isAnyOriginFeatSlotSelected,
    featSource,
    amellwindFeats,
    dndFeats,
    q,
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

    handleSelectFeat({ id, name, source });
  }

  function handleDndFeatSourceSelect(id: string) {
    const variant = dndFeatSourceVariants.find((v) => v.id === id);
    if (!variant || !selectedFeat) return;
    if (isInvocationOriginFeatSlotSelected && invocationOriginFeatIndex !== null) {
      setOptionalFeatureOriginFeatAtIndex(invocationOriginFeatIndex, {
        id: variant.id,
        name: selectedFeat.name,
        source: selectedFeat.source,
      });
      return;
    }
    if (isOriginFeatSlotSelected) {
      if (originFeatLocked) return;
      setSpeciesOriginFeat({
        id: variant.id,
        name: selectedFeat.name,
        source: selectedFeat.source,
      });
      return;
    }
    if (featSlotIndex === null) return;
    setFeatAtIndex(featSlotIndex, {
      id: variant.id,
      name: selectedFeat.name,
      source: selectedFeat.source,
    });
  }

  function handleSelectFeat(selection: BuilderFeatSelection) {
    if (isInvocationOriginFeatSlotSelected && invocationOriginFeatIndex !== null) {
      setOptionalFeatureOriginFeatAtIndex(invocationOriginFeatIndex, selection);
      setShowFeatList(false);
      return;
    }
    if (isOriginFeatSlotSelected) {
      if (originFeatLocked) return;
      setSpeciesOriginFeat(selection);
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
    handleSelectFeat({ id, name, source: "dnd2024" });
  }

  function handleUpdateAsiChoices(
    choices: NonNullable<BuilderFeatSelection["asiChoices"]>,
  ) {
    if (featSlotIndex === null || !selectedFeat) return;
    setFeatAtIndex(featSlotIndex, { ...selectedFeat, asiChoices: choices });
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
        <EmptyState text="El background y la specie no otorgan un Origin Feat." />
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
        selectedName={
          isDndFeatSelection ? (selectedFeat?.name ?? null) : null
        }
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
