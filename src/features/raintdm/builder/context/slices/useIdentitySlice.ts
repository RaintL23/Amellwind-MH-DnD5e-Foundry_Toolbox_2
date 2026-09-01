/**
 * Identity slice: species, background, class/subclass, feats, multiclass, ASI
 * (Tasha / background), origin feats, backstory/personality. Loads catalog
 * entities by id and notifies other slices via onSpecies/Background/ClassChange.
 */
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
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
import { getBackgroundById } from "@/features/amellwind/backgrounds/services/background.service";
import { getClassById } from "@/features/dnd/classes/services/class.service";
import { resolveSpeciesParts } from "../../utils/species-resolution.utils";
import { formatAbilitySummary } from "@/features/dnd/races/mappers/dnd-race.mapper";
import { getDndBackgroundById } from "@/features/dnd/backgrounds/services/dnd-background.service";
import { resolveDndFeatForRef } from "@/features/dnd/feats/services/dnd-feat.service";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import {
  AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
  dndFeatToBuilderSelection,
  resolveOriginFeatChooseTarget,
} from "../../utils/origin-feat.constants";
import { reconcileOriginFeatSlots } from "../../utils/reconcile-origin-feat-slots.utils";
import { getFeatSlotLevels } from "../../utils/builder-class.utils";
import {
  createEmptyMulticlassEntry,
  getFeatSlotLevelsForBuild,
  getPrimaryClassLevel,
  buildClassLevelEntries,
  MAX_MULTICLASS_ENTRIES,
} from "../../utils/multiclass.utils";
import {
  EMPTY_BUILDER_PERSONALITY,
  loadBuilderBackstoryNotes,
  loadBuilderPersonality,
  persistBuilderBackstoryNotes,
  persistBuilderPersonality,
  type BuilderPersonality,
} from "../../storage/builder.storage";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useSyncStatus } from "@/shared/context/SyncContext";
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
  useAmellwindHomebrew: boolean;
}

export function useIdentitySlice({
  onSpeciesChange,
  onBackgroundChange,
  onClassChange,
  clearSubclassOptionalFeatures,
  useAmellwindHomebrew,
}: IdentitySliceInput) {
  // ─── Selection state ───────────────────────────────────────────────────────

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
  const [speciesSpellGroupChoice, setSpeciesSpellGroupChoiceState] = useState<string | null>(null);
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
  const [speciesOriginFeatGrantReady, setSpeciesOriginFeatGrantReady] =
    useState(true);
  const [backgroundOriginFeatGrantReady, setBackgroundOriginFeatGrantReady] =
    useState(true);

  const originFeatGrantsReady =
    speciesOriginFeatGrantReady && backgroundOriginFeatGrantReady;

  const canPickOriginFeat =
    originFeatGrantsReady ||
    backgroundOriginFeatGrant?.kind === "choose" ||
    speciesOriginFeatGrant?.kind === "choose" ||
    (useAmellwindHomebrew && backgroundRef !== null);

  const { syncing } = useSyncStatus();
  const speciesIdRef = useRef<string | null>(null);
  const backgroundIdRef = useRef<string | null>(null);
  /** Explicit user pick — loaders/reconcile must not wipe this unless identity changes. */
  const userOriginFeatRef = useRef<BuilderFeatSelection | null>(null);
  const latestOriginFeatsRef = useRef({
    species: null as BuilderFeatSelection | null,
    background: null as BuilderFeatSelection | null,
  });
  latestOriginFeatsRef.current = {
    species: speciesOriginFeat,
    background: backgroundOriginFeat,
  };

  // Persist backstory/personality with a debounce instead of on every keystroke;
  // a final flush on unmount avoids dropping the last edit during fast navigation.
  const debouncedBackstoryNotes = useDebouncedValue(backstoryNotes, 500);
  useEffect(() => {
    persistBuilderBackstoryNotes(debouncedBackstoryNotes);
  }, [debouncedBackstoryNotes]);

  const debouncedPersonality = useDebouncedValue(personality, 500);
  useEffect(() => {
    persistBuilderPersonality(debouncedPersonality);
  }, [debouncedPersonality]);

  const latestIdentityNotesRef = useRef({ backstoryNotes, personality });
  useEffect(() => {
    latestIdentityNotesRef.current = { backstoryNotes, personality };
  }, [backstoryNotes, personality]);
  useEffect(
    () => () => {
      persistBuilderBackstoryNotes(
        latestIdentityNotesRef.current.backstoryNotes,
      );
      persistBuilderPersonality(latestIdentityNotesRef.current.personality);
    },
    [],
  );

  // ─── Setters (species / background / class / feats) ─────────────────────────

  const setBackstoryNotes = useCallback(
    (value: string | ((current: string) => string)) => {
      setBackstoryNotesState(value);
    },
    [],
  );

  const restoreUserOriginFeatChoice = useCallback(
    (
      speciesGrant: OriginFeatGrant | null,
      backgroundGrant: OriginFeatGrant | null,
    ) => {
      const saved = userOriginFeatRef.current;
      if (!saved) return;

      const target = resolveOriginFeatChooseTarget(
        speciesGrant,
        backgroundGrant,
        useAmellwindHomebrew,
      );
      if (!target) return;

      if (target === "background") {
        setBackgroundOriginFeatState(saved);
        setSpeciesOriginFeatState(null);
      } else {
        setSpeciesOriginFeatState(saved);
        setBackgroundOriginFeatState(null);
      }
    },
    [useAmellwindHomebrew],
  );

  const setBackground = useCallback((selection: CharacterSelectionRef | null) => {
    const sameBackgroundId =
      backgroundIdRef.current !== null &&
      backgroundIdRef.current === selection?.id &&
      selection !== null;

    backgroundIdRef.current = selection?.id ?? null;
    setBackgroundRef(selection);

    if (sameBackgroundId) return;

    userOriginFeatRef.current = null;
    setBackgroundAsiMode(null);
    setBackgroundAsiPlus2(null);
    setBackgroundAsiPlus1(null);
    setBackgroundOriginFeatState(null);
    if (selection && useAmellwindHomebrew) {
      setBackgroundOriginFeatGrant(AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT);
      setBackgroundOriginFeatGrantReady(true);
    } else {
      setBackgroundOriginFeatGrant(null);
      setBackgroundOriginFeatGrantReady(!selection);
    }
    if (!selection) {
      setFactionState(null);
    }
    onBackgroundChange();
  }, [onBackgroundChange, useAmellwindHomebrew]);

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

  const setSpeciesSpellGroupChoice = useCallback((name: string | null) => {
    setSpeciesSpellGroupChoiceState(name);
  }, []);

  const setSpecies = useCallback((selection: CharacterSelectionRef | null) => {
    const sameSpeciesId =
      speciesIdRef.current !== null &&
      speciesIdRef.current === selection?.id &&
      selection !== null;

    speciesIdRef.current = selection?.id ?? null;
    setSpeciesState(selection);
    setSpeciesData(null);
    setSpeciesAbilityChoices([]);
    setSpeciesSpellGroupChoiceState(null);

    if (sameSpeciesId) {
      setSpeciesOriginFeatGrantReady(false);
      onSpeciesChange();
      return;
    }

    userOriginFeatRef.current = null;
    setSpeciesOriginFeatGrant(null);
    setSpeciesOriginFeatState(null);
    setSpeciesOriginFeatGrantReady(!selection);
    setOriginFeatSkillChoicesState([]);
    onSpeciesChange();
    if (!selection) {
      setUseTashaOrigin(false);
      setTashaPlus2(null);
      setTashaPlus1(null);
    }
  }, [onSpeciesChange]);

  /** Clears an invalid subrace without wiping origin feats or other identity picks. */
  const clearInvalidSpeciesSubrace = useCallback(() => {
    setSpeciesState((prev) => {
      if (!prev) return prev;
      return {
        id: prev.id,
        name: prev.name,
        subraceId: null,
        subraceName: null,
      };
    });
    setSpeciesData(null);
    setSpeciesAbilityChoices([]);
    setSpeciesOriginFeatGrantReady(false);
    setSpeciesSpellGroupChoiceState(null);
    onSpeciesChange();
  }, [onSpeciesChange]);

  const setSpeciesOriginFeat = useCallback((selection: BuilderFeatSelection | null) => {
    userOriginFeatRef.current = selection;
    setSpeciesOriginFeatState(selection);
    if (selection) setBackgroundOriginFeatState(null);
    if (!selection) setOriginFeatSkillChoicesState([]);
  }, []);

  const setBackgroundOriginFeat = useCallback(
    (selection: BuilderFeatSelection | null) => {
      userOriginFeatRef.current = selection;
      setBackgroundOriginFeatState(selection);
      if (selection) setSpeciesOriginFeatState(null);
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

  // ─── Multiclass ─────────────────────────────────────────────────────────────

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

  // ─── Catalog loads (class / multiclass class data) ──────────────────────────

  const multiclassClassIdsKey = multiclassEntries
    .map((e) => e.classRef?.id ?? "")
    .join("|");

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
  }, [multiclassClassIdsKey]);

  /** Re-fetch class payloads after on-demand brew sources are merged into the catalog. */
  const reloadClassData = useCallback(async () => {
    const primaryId = classRef?.id;
    const multiclassIds = multiclassEntries.map((e) => e.classRef?.id ?? null);

    if (primaryId) {
      setClassDataLoading(true);
      try {
        const data = await getClassById(primaryId);
        setClassData(data ?? null);
      } catch {
        setClassData(null);
      } finally {
        setClassDataLoading(false);
      }
    }

    if (multiclassIds.some(Boolean)) {
      try {
        const results = await Promise.all(
          multiclassIds.map((id) =>
            id ? getClassById(id).then((cls) => cls ?? null) : Promise.resolve(null),
          ),
        );
        setMulticlassClassData(results);
      } catch {
        setMulticlassClassData(multiclassIds.map(() => null));
      }
    }
  }, [classRef?.id, multiclassClassIdsKey]);

  useEffect(() => {
    if (!species) {
      setSpeciesData(null);
      setSpeciesDataLoading(false);
      return;
    }

    let cancelled = false;
    setSpeciesDataLoading(true);

    resolveSpeciesParts(species)
      .then(({ base, dndSubrace, mhSubrace }) => {
        if (cancelled) return;

        if (!base) {
          setSpeciesData(null);
          return;
        }

        const subrace = mhSubrace ?? dndSubrace;
        const abilityBonuses = [
          ...base.abilityBonuses,
          ...(subrace?.abilityBonuses ?? []),
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
      setSpeciesOriginFeatGrantReady(true);
      userOriginFeatRef.current = null;
      setSpeciesOriginFeatState(null);
      setOriginFeatSkillChoicesState([]);
      return;
    }

    let cancelled = false;
    setSpeciesOriginFeatGrantReady(false);

    async function loadOriginFeatGrant() {
      const { base, dndSubrace, mhSubrace } = await resolveSpeciesParts(species!);
      if (cancelled) return;

      if (!base) {
        setSpeciesOriginFeatGrant(null);
        setSpeciesOriginFeatGrantReady(true);
        return;
      }

      const grant =
        base?.originFeatGrant ?? dndSubrace?.originFeatGrant ?? mhSubrace?.originFeatGrant ?? null;
      setSpeciesOriginFeatGrant(grant);

      if (!grant) {
        setSpeciesOriginFeatGrantReady(true);
        return;
      }

      // AGMH: background owns the origin-feat pick; never overwrite it from species data.
      if (useAmellwindHomebrew && backgroundRef) {
        setSpeciesOriginFeatGrantReady(true);
        restoreUserOriginFeatChoice(
          grant,
          backgroundOriginFeatGrant ?? AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
        );
        return;
      }

      if (grant.kind === "fixed" && grant.featRefs[0]) {
        const feat = await resolveDndFeatForRef(grant.featRefs[0]);
        if (cancelled || !feat) return;
        const fixed = dndFeatToBuilderSelection(feat);
        userOriginFeatRef.current = fixed;
        setSpeciesOriginFeatState(fixed);
        setBackgroundOriginFeatState(null);
        setSpeciesOriginFeatGrantReady(true);
        return;
      }
      setSpeciesOriginFeatGrantReady(true);
      restoreUserOriginFeatChoice(grant, backgroundOriginFeatGrant);
    }

    void loadOriginFeatGrant();

    return () => {
      cancelled = true;
    };
  }, [
    species?.id,
    species?.subraceId,
    syncing,
    useAmellwindHomebrew,
    backgroundRef,
    restoreUserOriginFeatChoice,
    backgroundOriginFeatGrant,
  ]);

  useEffect(() => {
    if (!backgroundRef) {
      setBackgroundOriginFeatGrant(null);
      setBackgroundOriginFeatGrantReady(true);
      userOriginFeatRef.current = null;
      setBackgroundOriginFeatState(null);
      return;
    }

    let cancelled = false;
    setBackgroundOriginFeatGrantReady(false);

    async function loadBackgroundOriginFeat() {
      const [dndBackground, mhBackground] = await Promise.all([
        getDndBackgroundById(backgroundRef!.id),
        getBackgroundById(backgroundRef!.id),
      ]);
      if (cancelled) return;

      if (!dndBackground && !mhBackground) {
        if (useAmellwindHomebrew) {
          setBackgroundOriginFeatGrant(AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT);
        }
        setBackgroundOriginFeatGrantReady(true);
        restoreUserOriginFeatChoice(
          speciesOriginFeatGrant,
          useAmellwindHomebrew ? AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT : null,
        );
        return;
      }

      if (mhBackground?.faction) {
        setFactionState(mhBackground.faction);
      }

      const isAmellwindBackground =
        !!mhBackground && (await isAmellwindBackgroundSelection(backgroundRef!));
      const grant =
        dndBackground?.originFeatGrant ??
        mhBackground?.originFeatGrant ??
        (isAmellwindBackground ? AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT : null);
      setBackgroundOriginFeatGrant(grant);

      if (!grant) {
        if (dndBackground || mhBackground) {
          userOriginFeatRef.current = null;
          setBackgroundOriginFeatState(null);
        }
        setBackgroundOriginFeatGrantReady(true);
        return;
      }

      if (grant.kind === "fixed" && grant.featRefs[0]) {
        const feat = await resolveDndFeatForRef(grant.featRefs[0]);
        if (cancelled || !feat) return;
        const fixed = {
          ...dndFeatToBuilderSelection(feat),
          name: grant.featRefs[0].displayLabel,
        };
        userOriginFeatRef.current = fixed;
        setBackgroundOriginFeatState(fixed);
        setSpeciesOriginFeatState(null);
        setBackgroundOriginFeatGrantReady(true);
        return;
      }
      setBackgroundOriginFeatGrantReady(true);
      restoreUserOriginFeatChoice(speciesOriginFeatGrant, grant);
    }

    void loadBackgroundOriginFeat();

    return () => {
      cancelled = true;
    };
  }, [
    backgroundRef?.id,
    syncing,
    useAmellwindHomebrew,
    restoreUserOriginFeatChoice,
    speciesOriginFeatGrant,
  ]);

  useEffect(() => {
    const saved = userOriginFeatRef.current;
    if (!originFeatGrantsReady && !saved) return;

    const { species, background } = latestOriginFeatsRef.current;
    const reconciled = reconcileOriginFeatSlots({
      speciesGrant: speciesOriginFeatGrant,
      backgroundGrant: backgroundOriginFeatGrant,
      speciesOriginFeat: species,
      backgroundOriginFeat: background,
      preferBackgroundChoose: useAmellwindHomebrew,
      savedUserPick: saved,
    });

    const speciesChanged = reconciled.speciesOriginFeat !== species;
    const backgroundChanged = reconciled.backgroundOriginFeat !== background;
    if (!speciesChanged && !backgroundChanged) return;

    // Use the direct state setters so the reconcile does not clear
    // originFeatSkillChoices as a side effect when migrating a feat between
    // slots (the public callbacks call setOriginFeatSkillChoicesState([])).
    if (speciesChanged) setSpeciesOriginFeatState(reconciled.speciesOriginFeat);
    if (backgroundChanged)
      setBackgroundOriginFeatState(reconciled.backgroundOriginFeat);

    const chosen =
      reconciled.speciesOriginFeat ?? reconciled.backgroundOriginFeat;
    if (chosen) {
      userOriginFeatRef.current = chosen;
    } else {
      // Both slots were cleared — the feat was genuinely removed.
      userOriginFeatRef.current = null;
      setOriginFeatSkillChoicesState([]);
    }
  }, [
    originFeatGrantsReady,
    speciesOriginFeatGrant,
    backgroundOriginFeatGrant,
    useAmellwindHomebrew,
  ]);

  // ─── Homebrew cleanup + full reset ──────────────────────────────────────────

  const clearAmellwindIdentity = useCallback(async () => {
    userOriginFeatRef.current = null;
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
      setSpeciesSpellGroupChoiceState(null);
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
    speciesIdRef.current = null;
    backgroundIdRef.current = null;
    userOriginFeatRef.current = null;
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
    setSpeciesOriginFeatGrantReady(true);
    setBackgroundOriginFeatGrantReady(true);
    setSpeciesSpellGroupChoiceState(null);
  }, []);

  return useMemo(
    () => ({
      species,
      background: backgroundRef,
      class: classRef,
      subclass,
      featSelections,
      classData,
      classDataLoading,
      reloadClassData,
      speciesData,
      speciesDataLoading,
      speciesOriginFeatGrant,
      speciesOriginFeat,
      backgroundOriginFeatGrant,
      backgroundOriginFeat,
      originFeatGrantsReady,
      canPickOriginFeat,
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
      clearInvalidSpeciesSubrace,
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
      speciesSpellGroupChoice,
      setSpeciesSpellGroupChoice,
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
    }),
    [
      species,
      backgroundRef,
      classRef,
      subclass,
      featSelections,
      classData,
      classDataLoading,
      reloadClassData,
      speciesData,
      speciesDataLoading,
      speciesOriginFeatGrant,
      speciesOriginFeat,
      backgroundOriginFeatGrant,
      backgroundOriginFeat,
      originFeatGrantsReady,
      canPickOriginFeat,
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
      clearInvalidSpeciesSubrace,
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
      speciesSpellGroupChoice,
      setSpeciesSpellGroupChoice,
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
      clearInvalidSpeciesSubrace,
    ],
  );
}
