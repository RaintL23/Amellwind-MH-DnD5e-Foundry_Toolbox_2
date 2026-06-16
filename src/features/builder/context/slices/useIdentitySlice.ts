import { useState, useCallback, useEffect } from "react";
import type {
  AbilityKey,
  SkillKey,
  Class,
  Species,
  BackgroundAsiMode,
  BackgroundFaction,
  CharacterSelectionRef,
  BuilderFeatSelection,
  BuilderMulticlassEntry,
} from "@/shared/types";
import { getBackgroundById } from "@/features/backgrounds/services/background.service";
import { getClassById } from "@/features/classes/services/class.service";
import { getSpeciesById } from "@/features/species/services/species.service";
import { getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
import { formatAbilitySummary } from "@/features/dnd-races/mappers/dnd-race.mapper";
import { getDndBackgroundById } from "@/features/dnd-backgrounds/services/dnd-background.service";
import { resolveDndFeatForRef } from "@/features/dnd-feats/services/dnd-feat.service";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { dndFeatToBuilderSelection } from "../../utils/origin-feat.utils";
import {
  AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
} from "../../utils/origin-feat.constants";
import { getFeatSlotLevels } from "../../utils/builder-class.utils";
import {
  createEmptyMulticlassEntry,
  getFeatSlotLevelsForBuild,
  getPrimaryClassLevel,
  buildClassLevelEntries,
  MAX_MULTICLASS_ENTRIES,
} from "../../utils/multiclass.utils";
import {
  loadBuilderBackstoryNotes,
  persistBuilderBackstoryNotes,
} from "../../storage/builder-backstory.storage";
import {
  EMPTY_BUILDER_PERSONALITY,
  loadBuilderPersonality,
  persistBuilderPersonality,
  type BuilderPersonality,
} from "../../storage/builder-personality.storage";
import {
  clearAmellwindFeats,
  isAmellwindBackgroundSelection,
  isAmellwindSpeciesSelection,
} from "../../utils/homebrew-cleanup.utils";

export interface IdentitySliceInput {
  onSpeciesChange: () => void;
  onBackgroundChange: () => void;
  onClassChange: () => void;
  clearSubclassOptionalFeatures: () => void;
}

export function useIdentitySlice({
  onSpeciesChange,
  onBackgroundChange,
  onClassChange,
  clearSubclassOptionalFeatures,
}: IdentitySliceInput) {
  const [species, setSpeciesState] = useState<CharacterSelectionRef | null>(null);
  const [speciesData, setSpeciesData] = useState<Species | null>(null);
  const [speciesDataLoading, setSpeciesDataLoading] = useState(false);
  const [backgroundRef, setBackgroundRef] = useState<CharacterSelectionRef | null>(null);
  const [classRef, setClassState] = useState<CharacterSelectionRef | null>(null);
  const [classData, setClassData] = useState<Class | null>(null);
  const [classDataLoading, setClassDataLoading] = useState(false);
  const [subclass, setSubclassState] = useState<CharacterSelectionRef | null>(null);
  const [featSelections, setFeatSelections] = useState<
    (BuilderFeatSelection | null)[]
  >([]);
  const [multiclassEnabled, setMulticlassEnabledState] = useState(false);
  const [multiclassEntries, setMulticlassEntries] = useState<
    BuilderMulticlassEntry[]
  >([]);
  const [multiclassClassData, setMulticlassClassData] = useState<
    (Class | null)[]
  >([]);

  const [useTashaOrigin, setUseTashaOrigin] = useState(false);
  const [tashaPlus2, setTashaPlus2] = useState<AbilityKey | null>(null);
  const [tashaPlus1, setTashaPlus1] = useState<AbilityKey | null>(null);
  const [speciesAbilityChoices, setSpeciesAbilityChoices] = useState<
    (AbilityKey | null)[]
  >([]);
  const [backgroundAsiMode, setBackgroundAsiMode] =
    useState<BackgroundAsiMode | null>(null);
  const [backgroundAsiPlus2, setBackgroundAsiPlus2] =
    useState<AbilityKey | null>(null);
  const [backgroundAsiPlus1, setBackgroundAsiPlus1] =
    useState<AbilityKey | null>(null);
  const [backstoryNotes, setBackstoryNotesState] = useState(
    () => loadBuilderBackstoryNotes(),
  );
  const [personality, setPersonalityState] = useState<BuilderPersonality>(
    () => loadBuilderPersonality(),
  );
  const [faction, setFactionState] = useState<BackgroundFaction | null>(null);

  const [originFeatSkillChoices, setOriginFeatSkillChoicesState] = useState<SkillKey[]>([]);
  const [speciesOriginFeatGrant, setSpeciesOriginFeatGrant] =
    useState<OriginFeatGrant | null>(null);
  const [speciesOriginFeat, setSpeciesOriginFeatState] =
    useState<BuilderFeatSelection | null>(null);
  const [backgroundOriginFeatGrant, setBackgroundOriginFeatGrant] =
    useState<OriginFeatGrant | null>(null);
  const [backgroundOriginFeat, setBackgroundOriginFeatState] =
    useState<BuilderFeatSelection | null>(null);

  useEffect(() => {
    persistBuilderBackstoryNotes(backstoryNotes);
  }, [backstoryNotes]);

  useEffect(() => {
    persistBuilderPersonality(personality);
  }, [personality]);

  const setBackstoryNotes = useCallback(
    (value: string | ((current: string) => string)) => {
      setBackstoryNotesState(value);
    },
    [],
  );

  const setBackground = useCallback((selection: CharacterSelectionRef | null) => {
    setBackgroundRef(selection);
    setBackgroundAsiMode(null);
    setBackgroundAsiPlus2(null);
    setBackgroundAsiPlus1(null);
    setBackgroundOriginFeatGrant(null);
    setBackgroundOriginFeatState(null);
    if (!selection) {
      setFactionState(null);
    }
    onBackgroundChange();
  }, [onBackgroundChange]);

  const setFaction = useCallback((value: BackgroundFaction | null) => {
    setFactionState(value);
  }, []);

  const setPersonality = useCallback(
    (value: BuilderPersonality | ((current: BuilderPersonality) => BuilderPersonality)) => {
      setPersonalityState(value);
    },
    [],
  );

  const setPersonalityField = useCallback(
    (field: keyof BuilderPersonality, value: string) => {
      setPersonalityState((prev) => ({ ...prev, [field]: value }));
    },
    [],
  );

  const setSpecies = useCallback((selection: CharacterSelectionRef | null) => {
    setSpeciesState(selection);
    setSpeciesData(null);
    setSpeciesAbilityChoices([]);
    setSpeciesOriginFeatGrant(null);
    setSpeciesOriginFeatState(null);
    setOriginFeatSkillChoicesState([]);
    onSpeciesChange();
    if (!selection) {
      setUseTashaOrigin(false);
      setTashaPlus2(null);
      setTashaPlus1(null);
    }
  }, [onSpeciesChange]);

  const setSpeciesOriginFeat = useCallback((selection: BuilderFeatSelection | null) => {
    setSpeciesOriginFeatState(selection);
    if (!selection) setOriginFeatSkillChoicesState([]);
  }, []);

  const setBackgroundOriginFeat = useCallback(
    (selection: BuilderFeatSelection | null) => {
      setBackgroundOriginFeatState(selection);
      if (!selection) setOriginFeatSkillChoicesState([]);
    },
    [],
  );

  const setClass = useCallback((selection: CharacterSelectionRef | null) => {
    setClassState(selection);
    setClassData(null);
    setSubclassState(null);
    setFeatSelections([]);
    onClassChange();
  }, [onClassChange]);

  const setSubclass = useCallback((selection: CharacterSelectionRef | null) => {
    setSubclassState(selection);
    clearSubclassOptionalFeatures();
  }, [clearSubclassOptionalFeatures]);

  const setFeatAtIndex = useCallback(
    (index: number, selection: BuilderFeatSelection | null) => {
      setFeatSelections((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push(null);
        next[index] = selection;
        return next;
      });
    },
    [],
  );

  const trimFeatSelectionsForLevel = useCallback((level: number) => {
    setFeatSelections((prev) => {
      const maxSlots = multiclassEnabled
        ? getFeatSlotLevelsForBuild(
            buildClassLevelEntries(
              classRef,
              classData,
              getPrimaryClassLevel(level, multiclassEntries),
              subclass,
              multiclassEntries,
              multiclassClassData,
            ),
            level,
          ).length
        : getFeatSlotLevels(classRef?.name ?? "", level).length;
      return prev.slice(0, maxSlots);
    });
  }, [
    classRef?.name,
    classData,
    subclass,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
  ]);

  const setMulticlassEnabled = useCallback((enabled: boolean) => {
    setMulticlassEnabledState(enabled);
    if (!enabled) {
      setMulticlassEntries([]);
      setMulticlassClassData([]);
    }
  }, []);

  const addMulticlassEntry = useCallback(() => {
    setMulticlassEntries((prev) => {
      if (prev.length >= MAX_MULTICLASS_ENTRIES) return prev;
      return [...prev, createEmptyMulticlassEntry()];
    });
  }, []);

  const removeMulticlassEntry = useCallback((index: number) => {
    setMulticlassEntries((prev) => prev.filter((_, i) => i !== index));
    setMulticlassClassData((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const setMulticlassEntryClass = useCallback(
    (index: number, selection: CharacterSelectionRef | null) => {
      setMulticlassEntries((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        next[index] = {
          ...next[index],
          classRef: selection,
          subclass: null,
        };
        return next;
      });
      onClassChange();
    },
    [onClassChange],
  );

  const setMulticlassEntryLevel = useCallback(
    (index: number, level: number) => {
      setMulticlassEntries((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        next[index] = { ...next[index], level: Math.max(0, level) };
        return next;
      });
    },
    [],
  );

  const setMulticlassEntrySubclass = useCallback(
    (index: number, selection: CharacterSelectionRef | null) => {
      setMulticlassEntries((prev) => {
        const next = [...prev];
        if (!next[index]) return prev;
        next[index] = { ...next[index], subclass: selection };
        return next;
      });
      clearSubclassOptionalFeatures();
    },
    [clearSubclassOptionalFeatures],
  );

  const setPrimaryClassLevel = useCallback(
    (primaryLevel: number) => {
      const additional = multiclassEntries.reduce((s, e) => s + e.level, 0);
      return Math.min(20, Math.max(1 + additional, primaryLevel + additional));
    },
    [multiclassEntries],
  );

  const setSpeciesAbilityChoice = useCallback(
    (index: number, ability: AbilityKey | null) => {
      setSpeciesAbilityChoices((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push(null);
        next[index] = ability;
        return next;
      });
    },
    [],
  );

  const setOriginFeatSkillChoices = useCallback((choices: SkillKey[]) => {
    setOriginFeatSkillChoicesState(choices);
  }, []);

  useEffect(() => {
    if (!classRef) {
      setClassData(null);
      setClassDataLoading(false);
      return;
    }

    let cancelled = false;
    setClassDataLoading(true);

    getClassById(classRef.id)
      .then((data) => {
        if (!cancelled) setClassData(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setClassData(null);
      })
      .finally(() => {
        if (!cancelled) setClassDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [classRef?.id]);

  useEffect(() => {
    if (!multiclassEntries.length) {
      setMulticlassClassData([]);
      return;
    }

    let cancelled = false;

    Promise.all(
      multiclassEntries.map((entry) =>
        entry.classRef?.id
          ? getClassById(entry.classRef.id).then((cls) => cls ?? null)
          : Promise.resolve(null),
      ),
    )
      .then((results) => {
        if (!cancelled) setMulticlassClassData(results);
      })
      .catch(() => {
        if (!cancelled) setMulticlassClassData(multiclassEntries.map(() => null));
      });

    return () => {
      cancelled = true;
    };
  }, [multiclassEntries.map((e) => e.classRef?.id ?? "").join("|")]);

  useEffect(() => {
    if (!species) {
      setSpeciesData(null);
      setSpeciesDataLoading(false);
      return;
    }

    let cancelled = false;
    setSpeciesDataLoading(true);

    Promise.all([
      getSpeciesById(species.id),
      getDndRaceById(species.id),
      species.subraceId
        ? getDndRaceById(species.subraceId)
        : Promise.resolve(undefined),
    ])
      .then(([mhSpecies, dndRace, dndSubrace]) => {
        if (cancelled) return;

        const base = mhSpecies ?? dndRace;
        if (!base) {
          setSpeciesData(null);
          return;
        }

        const abilityBonuses = [
          ...base.abilityBonuses,
          ...(dndSubrace?.abilityBonuses ?? []),
        ];
        const displayName = species.subraceName
          ? `${base.name} (${species.subraceName})`
          : base.name;

        setSpeciesData({
          ...(base as Species),
          name: displayName,
          abilityBonuses,
          abilitySummary: formatAbilitySummary(abilityBonuses),
        });
      })
      .catch(() => {
        if (!cancelled) setSpeciesData(null);
      })
      .finally(() => {
        if (!cancelled) setSpeciesDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [species?.id, species?.subraceId, species?.subraceName]);

  useEffect(() => {
    if (!species) {
      setSpeciesOriginFeatGrant(null);
      setSpeciesOriginFeatState(null);
      setOriginFeatSkillChoicesState([]);
      return;
    }

    let cancelled = false;

    async function loadOriginFeatGrant() {
      const [mhSpecies, dndRace, dndSubrace] = await Promise.all([
        getSpeciesById(species!.id),
        getDndRaceById(species!.id),
        species!.subraceId
          ? getDndRaceById(species!.subraceId)
          : Promise.resolve(null),
      ]);
      if (cancelled) return;

      const base = mhSpecies ?? dndRace;
      const grant =
        base?.originFeatGrant ?? dndSubrace?.originFeatGrant ?? null;
      setSpeciesOriginFeatGrant(grant);

      if (!grant) {
        setSpeciesOriginFeatState(null);
        setOriginFeatSkillChoicesState([]);
        return;
      }

      if (grant.kind === "fixed" && grant.featRefs[0]) {
        const feat = await resolveDndFeatForRef(grant.featRefs[0]);
        if (cancelled || !feat) return;
        setSpeciesOriginFeatState(dndFeatToBuilderSelection(feat));
        return;
      }

      if (grant.kind === "choose") {
        setSpeciesOriginFeatState(null);
        setOriginFeatSkillChoicesState([]);
      }
    }

    void loadOriginFeatGrant();

    return () => {
      cancelled = true;
    };
  }, [species?.id, species?.subraceId]);

  useEffect(() => {
    if (!backgroundRef) {
      setBackgroundOriginFeatGrant(null);
      setBackgroundOriginFeatState(null);
      return;
    }

    let cancelled = false;

    async function loadBackgroundOriginFeat() {
      const [dndBackground, mhBackground] = await Promise.all([
        getDndBackgroundById(backgroundRef!.id),
        getBackgroundById(backgroundRef!.id),
      ]);
      if (cancelled) return;

      if (mhBackground?.faction) {
        setFactionState(mhBackground.faction);
      }

      const grant =
        dndBackground?.originFeatGrant ??
        mhBackground?.originFeatGrant ??
        (mhBackground ? AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT : null);
      setBackgroundOriginFeatGrant(grant);

      if (!grant) {
        setBackgroundOriginFeatState(null);
        return;
      }

      if (grant.kind === "fixed" && grant.featRefs[0]) {
        const feat = await resolveDndFeatForRef(grant.featRefs[0]);
        if (cancelled || !feat) return;
        setBackgroundOriginFeatState({
          ...dndFeatToBuilderSelection(feat),
          name: grant.featRefs[0].displayLabel,
        });
        return;
      }

      setBackgroundOriginFeatState(null);
    }

    void loadBackgroundOriginFeat();

    return () => {
      cancelled = true;
    };
  }, [backgroundRef?.id]);

  const clearAmellwindIdentity = useCallback(async () => {
    setFactionState(null);
    setFeatSelections((prev) => clearAmellwindFeats(prev));
    setSpeciesOriginFeatState((prev) =>
      prev?.source === "amellwind" ? null : prev,
    );
    setBackgroundOriginFeatState((prev) =>
      prev?.source === "amellwind" ? null : prev,
    );

    if (species && (await isAmellwindSpeciesSelection(species))) {
      setSpeciesState(null);
      setSpeciesData(null);
      setSpeciesAbilityChoices([]);
      setSpeciesOriginFeatGrant(null);
      setSpeciesOriginFeatState(null);
      setOriginFeatSkillChoicesState([]);
      setUseTashaOrigin(false);
      setTashaPlus2(null);
      setTashaPlus1(null);
    }

    if (backgroundRef && (await isAmellwindBackgroundSelection(backgroundRef))) {
      setBackgroundRef(null);
      setBackgroundAsiMode(null);
      setBackgroundAsiPlus2(null);
      setBackgroundAsiPlus1(null);
      setBackgroundOriginFeatGrant(null);
      setBackgroundOriginFeatState(null);
    }
  }, [species, backgroundRef]);

  const resetIdentitySlice = useCallback(() => {
    setSpeciesState(null);
    setSpeciesData(null);
    setSpeciesDataLoading(false);
    setBackgroundRef(null);
    setClassState(null);
    setClassData(null);
    setClassDataLoading(false);
    setSubclassState(null);
    setFeatSelections([]);
    setMulticlassEnabledState(false);
    setMulticlassEntries([]);
    setMulticlassClassData([]);
    setBackstoryNotesState("");
    setPersonalityState({ ...EMPTY_BUILDER_PERSONALITY });
    setFactionState(null);
    setUseTashaOrigin(false);
    setTashaPlus2(null);
    setTashaPlus1(null);
    setSpeciesAbilityChoices([]);
    setBackgroundAsiMode(null);
    setBackgroundAsiPlus2(null);
    setBackgroundAsiPlus1(null);
    setBackgroundOriginFeatGrant(null);
    setBackgroundOriginFeatState(null);
    setOriginFeatSkillChoicesState([]);
    setSpeciesOriginFeatGrant(null);
    setSpeciesOriginFeatState(null);
  }, []);

  return {
    species,
    background: backgroundRef,
    class: classRef,
    subclass,
    featSelections,
    classData,
    classDataLoading,
    speciesData,
    speciesDataLoading,
    speciesOriginFeatGrant,
    speciesOriginFeat,
    backgroundOriginFeatGrant,
    backgroundOriginFeat,
    originFeatSkillChoices,
    backstoryNotes,
    personality,
    faction,
    useTashaOrigin,
    tashaPlus2,
    tashaPlus1,
    speciesAbilityChoices,
    backgroundAsiMode,
    backgroundAsiPlus2,
    backgroundAsiPlus1,
    multiclassEnabled,
    multiclassEntries,
    multiclassClassData,
    setSpecies,
    setBackground,
    setClass,
    setSubclass,
    setFeatAtIndex,
    setSpeciesOriginFeat,
    setBackgroundOriginFeat,
    setBackstoryNotes,
    setPersonality,
    setPersonalityField,
    setFaction,
    setUseTashaOrigin,
    setTashaPlus2,
    setTashaPlus1,
    setSpeciesAbilityChoice,
    setBackgroundAsiMode,
    setBackgroundAsiPlus2,
    setBackgroundAsiPlus1,
    setOriginFeatSkillChoices,
    setMulticlassEnabled,
    addMulticlassEntry,
    removeMulticlassEntry,
    setMulticlassEntryClass,
    setMulticlassEntryLevel,
    setMulticlassEntrySubclass,
    setPrimaryClassLevel,
    trimFeatSelectionsForLevel,
    resetIdentitySlice,
    clearAmellwindIdentity,
  };
}
