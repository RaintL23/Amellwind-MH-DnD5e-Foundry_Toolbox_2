import { useEffect, useMemo, useState } from "react";
import { ScrollText, Users } from "lucide-react";
import { useBookSourceNames } from "@/shared/hooks/useBookSourceNames";
import {
  getAllSpecies,
  getSpeciesById,
} from "@/features/species/services/species.service";
import {
  getBuilderListDndRaces,
  getDndRaceById,
  getDndRacesByName,
  getDndSubracesForParent,
} from "@/features/dnd-races/services/dnd-race.service";
import {
  getAllBackgrounds,
  getBackgroundById,
} from "@/features/backgrounds/services/background.service";
import {
  getDndBackgroundById,
  getDndBackgroundsByName,
  getListDndBackgrounds,
} from "@/features/dnd-backgrounds/services/dnd-background.service";
import { useCharacterBuilder } from "@/features/builder/context/CharacterBuilderContext";
import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";
import { useLibraryVariants } from "@/features/builder/hooks/useLibraryVariants";
import {
  entityToLibraryOption,
  prepareLibraryListOptions,
  type LibraryListOption,
  type SourceVariant,
} from "@/features/builder/utils/library-variant.utils";
import { resolveRpgbotContext } from "@/features/builder/data/rpgbot-ratings.utils";
import { useRpgbotRatingsLookup } from "@/features/builder/hooks/useRpgbotRatingsLookup";
import { RpgbotLoadingHint } from "@/features/builder/components/shared/RpgbotLoadingHint";
import type { IdentityDataSource } from "@/features/builder/components/shared/IdentitySourceBadgeGroup";
import type { NamedVariant } from "@/features/builder/components/shared/NamedVariantSwitcher";
import { LibraryList } from "@/features/builder/components/shared/LibraryList";
import type {
  Background,
  DndBackground,
  DndRace,
  Species,
} from "@/shared/types";
import type { DefenseGrant } from "@/shared/types/proficiency.types";
import { IdentityLibraryDetail } from "./IdentityLibraryDetail";
import { EmptyState } from "./shared/LibraryUi";

interface IdentityLibraryPanelProps {
  selectedSlot: BuilderSlotSelection;
  q: string;
  identitySource: IdentityDataSource;
  onIdentitySourceChange: (source: IdentityDataSource) => void;
}

function isLoadedSpecies(data: Species | Background | null): data is Species {
  return !!data && "traits" in data;
}

/**
 * Build the defenseGrants to apply for a DndRace, resolving named spell group
 * choices into fixed resistance grants when applicable.
 */
function resolveSpeciesDefenseGrants(
  base: DndRace,
  subrace: DndRace | null,
  groupChoice: string | null,
): DefenseGrant[] {
  const raceSource = { type: "species" as const, name: base.name };

  // If the species has named spell groups (e.g. Tiefling Fiendish Legacy)
  // and one is chosen, replace any "choose" resistance grant with a fixed one.
  if (base.namedSpellGroups && base.namedSpellGroups.length > 0 && groupChoice) {
    const chosen = base.namedSpellGroups.find(
      (g) => g.name.toLowerCase() === groupChoice.toLowerCase(),
    );
    if (chosen?.resistance) {
      const fixedGrant: DefenseGrant = {
        kind: "fixed",
        types: [chosen.resistance],
        defenseKind: "resistance",
        source: raceSource,
      };
      // Only use the fixed grant; drop the "choose" grant from base
      return [fixedGrant, ...(subrace?.defenseGrants ?? [])];
    }
  }

  return [
    ...base.defenseGrants,
    ...(subrace?.defenseGrants ?? []),
  ];
}

function isLoadedBackground(
  data: Species | Background | null,
): data is Background {
  return !!data && "proficiencies" in data;
}

export function IdentityLibraryPanel({
  selectedSlot,
  q,
  identitySource,
  onIdentitySourceChange: _onIdentitySourceChange,
}: IdentityLibraryPanelProps) {
  const [identityLoading, setIdentityLoading] = useState(false);
  const [identityOptions, setIdentityOptions] = useState<LibraryListOption[]>(
    [],
  );
  const [identityDetail, setIdentityDetail] = useState<
    Species | Background | null
  >(null);
  const [identitySubraceDetail, setIdentitySubraceDetail] =
    useState<DndRace | null>(null);
  const [loadedDndRaceBase, setLoadedDndRaceBase] = useState<DndRace | null>(null);
  const [dndSubraceOptions, setDndSubraceOptions] = useState<NamedVariant[]>(
    [],
  );
  const [identityDetailLoading, setIdentityDetailLoading] = useState(false);

  const {
    species,
    background,
    class: classSelection,
    setSpecies,
    setBackground,
    applyIdentityGrants,
    speciesSpellGroupChoice,
    setSpeciesSpellGroupChoice,
  } = useCharacterBuilder();

  const identityBookNames = useBookSourceNames();

  const isSpeciesSlot = selectedSlot === "species";
  const isBackgroundSlot = selectedSlot === "background";

  useEffect(() => {
    if (!isSpeciesSlot && !isBackgroundSlot) return;
    setIdentityLoading(true);
    setIdentityOptions([]);

    let load: Promise<LibraryListOption[]>;
    if (isSpeciesSlot) {
      load =
        identitySource === "dnd"
          ? getBuilderListDndRaces().then((list) =>
              list.map(entityToLibraryOption),
            )
          : getAllSpecies().then((list) =>
              list.map((s) => ({ id: s.id, name: s.name })),
            );
    } else {
      load =
        identitySource === "dnd"
          ? getListDndBackgrounds().then((list) =>
              list.map(entityToLibraryOption),
            )
          : getAllBackgrounds().then((list) =>
              list.map((b) => ({ id: b.id, name: b.name })),
            );
    }

    load.then(setIdentityOptions).finally(() => setIdentityLoading(false));
  }, [isSpeciesSlot, isBackgroundSlot, selectedSlot, identitySource]);

  const rpgbotContext = useMemo(() => {
    if (identitySource !== "dnd") return null;
    return resolveRpgbotContext({
      className: classSelection?.name,
      guideKey: "class",
      category: isSpeciesSlot ? "species" : "background",
    });
  }, [identitySource, classSelection?.name, isSpeciesSlot]);

  const { lookup: rpgbotLookup, ready: rpgbotReady } = useRpgbotRatingsLookup(
    rpgbotContext,
  );

  const identityFiltered = useMemo(() => {
    if (!isSpeciesSlot && !isBackgroundSlot) return [];
    return prepareLibraryListOptions(
      identityOptions,
      q,
      rpgbotLookup,
      rpgbotReady,
    );
  }, [
    identityOptions,
    isSpeciesSlot,
    isBackgroundSlot,
    q,
    rpgbotLookup,
    rpgbotReady,
  ]);

  const selectedIdentity =
    selectedSlot === "species"
      ? species
      : selectedSlot === "background"
        ? background
        : null;

  const showIdentityDetail =
    (isSpeciesSlot || isBackgroundSlot) && !!selectedIdentity;

  const dndRaceSourceVariants = useLibraryVariants<DndRace>(
    identitySource === "dnd" && isSpeciesSlot && !!selectedIdentity?.name,
    selectedIdentity?.name,
    identitySource === "dnd" && isSpeciesSlot ? getDndRacesByName : null,
  );

  const dndBackgroundSourceVariants = useLibraryVariants<DndBackground>(
    identitySource === "dnd" && isBackgroundSlot && !!selectedIdentity?.name,
    selectedIdentity?.name,
    identitySource === "dnd" && isBackgroundSlot
      ? getDndBackgroundsByName
      : null,
  );

  const dndIdentitySourceVariants: SourceVariant[] = isSpeciesSlot
    ? dndRaceSourceVariants
    : dndBackgroundSourceVariants;

  useEffect(() => {
    if (!selectedIdentity) {
      setIdentityDetail(null);
      setIdentitySubraceDetail(null);
      setLoadedDndRaceBase(null);
      setDndSubraceOptions([]);
      setIdentityDetailLoading(false);
      if (isSpeciesSlot) {
        applyIdentityGrants({
          source: "species",
          skillGrants: [],
          skillAdvantages: [],
          toolGrants: [],
          languageGrants: [],
          defenseGrants: [],
        });
      } else if (isBackgroundSlot) {
        applyIdentityGrants({
          source: "background",
          skillGrants: [],
          toolGrants: [],
          languageGrants: [],
        });
      }
      return;
    }

    if (!isSpeciesSlot && !isBackgroundSlot) {
      setIdentityDetail(null);
      setIdentitySubraceDetail(null);
      setDndSubraceOptions([]);
      setIdentityDetailLoading(false);
      return;
    }

    if (isSpeciesSlot) {
      applyIdentityGrants({
        source: "species",
        skillGrants: [],
        skillAdvantages: [],
        toolGrants: [],
        languageGrants: [],
        defenseGrants: [],
      });
    } else {
      applyIdentityGrants({
        source: "background",
        skillGrants: [],
        toolGrants: [],
        languageGrants: [],
      });
    }

    let cancelled = false;
    setIdentityDetailLoading(true);
    setIdentityDetail(null);
    setIdentitySubraceDetail(null);
    setLoadedDndRaceBase(null);
    setDndSubraceOptions([]);

    async function loadIdentityDetail() {
      if (isSpeciesSlot && identitySource === "dnd") {
        const base = await getDndRaceById(selectedIdentity!.id);
        if (cancelled || !base) return;

        setIdentityDetail(base as unknown as Species);
        setLoadedDndRaceBase(base);

        const subraces = await getDndSubracesForParent(base.name, base.source);
        if (cancelled) return;

        setDndSubraceOptions(
          subraces.map((subrace) => ({ id: subrace.id, name: subrace.name })),
        );

        const selectedSubrace = selectedIdentity!.subraceId
          ? subraces.find(
              (subrace) => subrace.id === selectedIdentity!.subraceId,
            )
          : undefined;

        if (selectedIdentity!.subraceId && !selectedSubrace) {
          setSpecies({
            id: selectedIdentity!.id,
            name: selectedIdentity!.name,
            subraceId: null,
            subraceName: null,
          });
        }

        if (selectedSubrace) {
          setIdentitySubraceDetail(selectedSubrace);
        }

        applyIdentityGrants({
          source: "species",
          skillGrants: [
            ...base.skillGrants,
            ...(selectedSubrace?.skillGrants ?? []),
          ],
          skillAdvantages: [
            ...base.skillAdvantages,
            ...(selectedSubrace?.skillAdvantages ?? []),
          ],
          languageGrants: [
            ...base.languageGrants,
            ...(selectedSubrace?.languageGrants ?? []),
          ],
          defenseGrants: resolveSpeciesDefenseGrants(
            base,
            selectedSubrace ?? null,
            speciesSpellGroupChoice,
          ),
        });
        return;
      }

      const data = isSpeciesSlot
        ? await getSpeciesById(selectedIdentity!.id)
        : identitySource === "dnd"
          ? await getDndBackgroundById(selectedIdentity!.id)
          : await getBackgroundById(selectedIdentity!.id);

      if (cancelled || !data) return;

      setIdentityDetail(data as Species | Background);

      if ("skillGrants" in data) {
        if (isSpeciesSlot) {
          applyIdentityGrants({
            source: "species",
            skillGrants: data.skillGrants,
            skillAdvantages:
              "skillAdvantages" in data ? data.skillAdvantages : [],
            toolGrants: "toolGrants" in data ? data.toolGrants : [],
            languageGrants: "languageGrants" in data ? data.languageGrants : [],
            defenseGrants: "defenseGrants" in data ? data.defenseGrants : [],
          });
        } else {
          applyIdentityGrants({
            source: "background",
            skillGrants: data.skillGrants,
            toolGrants: "toolGrants" in data ? data.toolGrants : [],
            languageGrants: "languageGrants" in data ? data.languageGrants : [],
          });
        }
      }
    }

    void loadIdentityDetail().finally(() => {
      if (!cancelled) setIdentityDetailLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [
    selectedIdentity?.id,
    selectedIdentity?.subraceId,
    isSpeciesSlot,
    isBackgroundSlot,
    identitySource,
    applyIdentityGrants,
    setSpecies,
    speciesSpellGroupChoice,
  ]);

  // Re-apply defense grants when the legacy choice changes (species already loaded)
  useEffect(() => {
    if (!loadedDndRaceBase || !isSpeciesSlot) return;
    applyIdentityGrants({
      source: "species",
      skillGrants: [
        ...loadedDndRaceBase.skillGrants,
        ...(identitySubraceDetail?.skillGrants ?? []),
      ],
      skillAdvantages: [
        ...loadedDndRaceBase.skillAdvantages,
        ...(identitySubraceDetail?.skillAdvantages ?? []),
      ],
      languageGrants: [
        ...loadedDndRaceBase.languageGrants,
        ...(identitySubraceDetail?.languageGrants ?? []),
      ],
      defenseGrants: resolveSpeciesDefenseGrants(
        loadedDndRaceBase,
        identitySubraceDetail,
        speciesSpellGroupChoice,
      ),
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speciesSpellGroupChoice]);

  function handleSelectIdentity(id: string, name: string) {
    const ref = {
      id,
      name,
      subraceId: null,
      subraceName: null,
    };
    if (isSpeciesSlot) setSpecies(ref);
    else if (isBackgroundSlot) setBackground(ref);
  }

  function handleDndIdentitySourceSelect(id: string) {
    if (!selectedIdentity) return;

    if (isSpeciesSlot) {
      const variant = dndRaceSourceVariants.find((v) => v.id === id);
      if (!variant) return;
      setSpecies({
        id: variant.id,
        name: variant.name,
        subraceId: null,
        subraceName: null,
      });
      return;
    }

    if (isBackgroundSlot) {
      const variant = dndBackgroundSourceVariants.find((v) => v.id === id);
      if (!variant) return;
      setBackground({ id: variant.id, name: variant.name });
    }
  }

  function handleLegacySelect(groupName: string | null) {
    setSpeciesSpellGroupChoice(groupName);
  }

  function handleSubspeciesSelect(subraceId: string | null) {
    if (!selectedIdentity || !isSpeciesSlot) return;
    if (!subraceId) {
      setSpecies({
        id: selectedIdentity.id,
        name: selectedIdentity.name,
        subraceId: null,
        subraceName: null,
      });
      return;
    }
    const option = dndSubraceOptions.find((entry) => entry.id === subraceId);
    if (!option) return;
    setSpecies({
      id: selectedIdentity.id,
      name: selectedIdentity.name,
      subraceId: option.id,
      subraceName: option.name,
    });
  }

  if (!isSpeciesSlot && !isBackgroundSlot) return null;

  if (showIdentityDetail) {
    if (identityDetailLoading) {
      return <EmptyState text="Loading..." />;
    }

    if (isSpeciesSlot && isLoadedSpecies(identityDetail)) {
      const dndBase = loadedDndRaceBase;
      const legacyOptions = dndBase?.namedSpellGroups?.map((g) => ({
        id: g.name,
        name: g.name,
      }));
      return (
        <IdentityLibraryDetail
          species={identityDetail}
          sourceVariants={
            identitySource === "dnd" ? dndIdentitySourceVariants : undefined
          }
          activeSourceId={selectedIdentity?.id}
          onSourceSelect={
            identitySource === "dnd"
              ? handleDndIdentitySourceSelect
              : undefined
          }
          subspeciesOptions={
            identitySource === "dnd" ? dndSubraceOptions : undefined
          }
          activeSubspeciesId={selectedIdentity?.subraceId ?? null}
          onSubspeciesSelect={
            identitySource === "dnd" ? handleSubspeciesSelect : undefined
          }
          subspeciesTraits={identitySubraceDetail?.traits ?? []}
          subspeciesAbilitySummary={
            identitySubraceDetail?.abilitySummary ?? null
          }
          subspeciesLabel={selectedIdentity?.subraceName ?? null}
          bookNames={identityBookNames}
          namedSpellGroups={dndBase?.namedSpellGroups}
          namedSpellGroupsLabel={dndBase?.namedSpellGroupsLabel}
          universalCantrips={dndBase?.universalCantrips}
          activeLegacyId={speciesSpellGroupChoice}
          onLegacySelect={legacyOptions ? handleLegacySelect : undefined}
        />
      );
    }

    if (isBackgroundSlot && isLoadedBackground(identityDetail)) {
      return (
        <IdentityLibraryDetail
          background={identityDetail}
          startingEquipmentOffers={
            identitySource === "dnd" &&
            identityDetail &&
            "startingEquipmentOffers" in identityDetail
              ? (identityDetail as unknown as DndBackground)
                  .startingEquipmentOffers
              : undefined
          }
          startingEquipmentSource={
            identitySource === "dnd" && selectedIdentity
              ? {
                  type: "background",
                  id: selectedIdentity.id,
                  name: selectedIdentity.name,
                }
              : undefined
          }
          backgroundAbilitySummary={
            identitySource === "dnd" &&
            identityDetail &&
            "abilitySummary" in identityDetail &&
            typeof identityDetail.abilitySummary === "string"
              ? identityDetail.abilitySummary
              : null
          }
          backgroundFeatSummary={
            identitySource === "dnd" &&
            identityDetail &&
            "featSummary" in identityDetail &&
            typeof identityDetail.featSummary === "string"
              ? identityDetail.featSummary
              : identitySource === "amellwind" &&
                  identityDetail &&
                  "originFeatGrant" in identityDetail &&
                  identityDetail.originFeatGrant?.summary
                ? identityDetail.originFeatGrant.summary
                : null
          }
          sourceVariants={
            identitySource === "dnd" ? dndIdentitySourceVariants : undefined
          }
          activeSourceId={selectedIdentity?.id}
          onSourceSelect={
            identitySource === "dnd" ? handleDndIdentitySourceSelect : undefined
          }
          bookNames={identityBookNames}
        />
      );
    }

    return <EmptyState text="No se encontró la información." />;
  }

  return (
    <>
      {rpgbotContext && !rpgbotReady && <RpgbotLoadingHint />}
      <LibraryList
        loading={identityLoading}
        options={identityFiltered}
      selectedId={selectedIdentity?.id ?? null}
      selectedName={
        identitySource === "dnd" ? (selectedIdentity?.name ?? null) : null
      }
      icon={
        isSpeciesSlot ? (
          <Users className="h-3.5 w-3.5 text-sky-400" />
        ) : (
          <ScrollText className="h-3.5 w-3.5 text-violet-400" />
        )
      }
      onSelect={handleSelectIdentity}
    />
    </>
  );
}

export function isIdentityDetailVisible(
  selectedSlot: BuilderSlotSelection,
  species: { id: string } | null,
  background: { id: string } | null,
): boolean {
  if (selectedSlot === "species") return !!species;
  if (selectedSlot === "background") return !!background;
  return false;
}
