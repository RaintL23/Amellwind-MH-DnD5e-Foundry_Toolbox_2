import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  SkillKey,
  Class,
  CharacterSelectionRef,
  BuilderFeatSelection,
  BuilderSpellSelections,
  BuilderSpellSelection,
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
} from "@/shared/types";
import { getAllDndOptionalFeatures } from "@/features/dnd/optionalfeatures/services/dnd-optionalfeature.service";
import {
  resolveOptionalFeatureProgressions,
  getProgressionPicks,
  getAutoGrantSelections,
  type ResolvedOptionalFeatureProgression,
} from "../../utils/class-optional-features.utils";
import {
  resolveOptionalFeatureOriginFeatSlots,
  type OptionalFeatureOriginFeatSlot,
} from "../../utils/optional-feature-feat-grants.utils";
import { PACT_SPELL_POOL_LEVEL } from "../../utils/pact-magic.utils";
import { BONUS_CANTRIP_POOL_BASE } from "../../utils/cantrip-pools.utils";
import { clearAmellwindFeats } from "../../utils/homebrew-cleanup.utils";
import { isSpeciesLineageSpell } from "../../utils/species-spell-grants.utils";

export interface SpellSliceInput {
  classData: Class | null;
  subclass: CharacterSelectionRef | null;
  characterLevel: number;
  /**
   * Optional-feature progressions of additional classes. Their picks share
   * `optionalFeatureSelections` (progression ids are class-scoped), so primary
   * class resets must keep them.
   */
  multiclassProgressions: ResolvedOptionalFeatureProgression[];
  /** False while an additional class is still loading (its picks must not be pruned yet). */
  multiclassReady: boolean;
}

export function useSpellSlice({
  classData,
  subclass,
  characterLevel,
  multiclassProgressions,
  multiclassReady,
}: SpellSliceInput) {
  const multiclassProgressionIdsKey = multiclassProgressions
    .map(({ progression, slotCount }) => `${progression.id}:${slotCount}`)
    .join("|");
  const multiclassProgressionIds = useMemo(
    () => new Set(multiclassProgressions.map((r) => r.progression.id)),
    // Keyed by ids/slot counts so a new array per render does not re-run.
    [multiclassProgressionIdsKey],
  );

  /** Keeps only additional-class picks (used when the primary class changes). */
  const keepMulticlassPicks = useCallback(
    (prev: BuilderOptionalFeatureSelections): BuilderOptionalFeatureSelections => {
      const next: BuilderOptionalFeatureSelections = {};
      for (const [key, picks] of Object.entries(prev)) {
        if (multiclassProgressionIds.has(key)) next[key] = picks;
      }
      return next;
    },
    [multiclassProgressionIds],
  );

  const [spellSelections, setSpellSelections] = useState<BuilderSpellSelections>({});
  const [optionalFeatureSelections, setOptionalFeatureSelections] =
    useState<BuilderOptionalFeatureSelections>({});
  const [optionalFeatureOriginFeatSlots, setOptionalFeatureOriginFeatSlots] =
    useState<OptionalFeatureOriginFeatSlot[]>([]);
  const [optionalFeatureOriginFeats, setOptionalFeatureOriginFeats] = useState<
    (BuilderFeatSelection | null)[]
  >([]);
  const [optionalFeatureOriginFeatSkillChoices, setOptionalFeatureOriginFeatSkillChoicesState] =
    useState<Record<number, SkillKey[]>>({});

  const addSpell = useCallback((level: number, spell: BuilderSpellSelection) => {
    setSpellSelections((prev) => {
      const base = prev ?? {};
      const existing = base[level] ?? [];
      if (existing.some((s) => s.id === spell.id)) return base;
      return { ...base, [level]: [...existing, spell] };
    });
  }, []);

  const removeSpell = useCallback((level: number, spellId: string) => {
    setSpellSelections((prev) => {
      const base = prev ?? {};
      const existing = base[level] ?? [];
      const target = existing.find((s) => s.id === spellId);
      if (target && isSpeciesLineageSpell(target)) return base;
      const filtered = existing.filter((s) => s.id !== spellId);
      return { ...base, [level]: filtered };
    });
  }, []);

  const clearSpells = useCallback(() => {
    setSpellSelections({});
  }, []);

  const clearBonusCantripSpellSelections = useCallback(() => {
    setSpellSelections((prev) => {
      const base = prev ?? {};
      const next = { ...base };
      for (const key of Object.keys(next)) {
        const level = Number(key);
        if (Number.isFinite(level) && level <= BONUS_CANTRIP_POOL_BASE) {
          delete next[level];
        }
      }
      return next;
    });
  }, []);

  const setOptionalFeaturesForProgression = useCallback(
    (progressionId: string, picks: BuilderOptionalFeatureSelection[]) => {
      setOptionalFeatureSelections((prev) => ({
        ...prev,
        [progressionId]: picks,
      }));
    },
    [],
  );

  const clearOptionalFeatureProgression = useCallback((progressionId: string) => {
    setOptionalFeatureSelections((prev) => {
      if (!(progressionId in prev)) return prev;
      const next = { ...prev };
      delete next[progressionId];
      return next;
    });
  }, []);

  const setOptionalFeatureOriginFeatAtIndex = useCallback(
    (index: number, selection: BuilderFeatSelection | null) => {
      setOptionalFeatureOriginFeats((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push(null);
        next[index] = selection;
        return next;
      });
      if (!selection) {
        setOptionalFeatureOriginFeatSkillChoicesState((prev) => {
          if (!(index in prev)) return prev;
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }
    },
    [],
  );

  const setOptionalFeatureOriginFeatSkillChoicesAtIndex = useCallback(
    (slotIndex: number, choices: SkillKey[]) => {
      setOptionalFeatureOriginFeatSkillChoicesState((prev) => ({
        ...prev,
        [slotIndex]: choices,
      }));
    },
    [],
  );

  /** Primary subclass changed: drop its subclass picks, keep additional classes'. */
  const clearSubclassOptionalFeatures = useCallback(() => {
    setOptionalFeatureSelections((prev) => {
      const next: BuilderOptionalFeatureSelections = { ...prev };
      for (const key of Object.keys(next)) {
        if (multiclassProgressionIds.has(key)) continue;
        if (key.startsWith("subclass_") || key.startsWith("fc_subclass_")) {
          delete next[key];
        }
      }
      return next;
    });
  }, [multiclassProgressionIds]);

  const resetOnClassChange = useCallback(() => {
    setSpellSelections({});
    setOptionalFeatureSelections(keepMulticlassPicks);
  }, [keepMulticlassPicks]);

  const resetSpellSlice = useCallback(() => {
    setSpellSelections({});
    setOptionalFeatureSelections({});
    setOptionalFeatureOriginFeatSlots([]);
    setOptionalFeatureOriginFeats([]);
    setOptionalFeatureOriginFeatSkillChoicesState({});
  }, []);

  useEffect(() => {
    if (!classData || !multiclassReady) return;
    const subclassData = subclass
      ? (classData.subclasses.find((sc) => sc.id === subclass.id) ?? null)
      : null;
    const resolved = [
      ...resolveOptionalFeatureProgressions(
        classData,
        subclassData,
        characterLevel,
      ),
      ...multiclassProgressions,
    ];
    setOptionalFeatureSelections((prev) => {
      const next = { ...prev };
      let changed = false;
      const validIds = new Set(resolved.map((r) => r.progression.id));

      for (const key of Object.keys(next)) {
        if (!validIds.has(key)) {
          delete next[key];
          changed = true;
        }
      }

      for (const { progression, slotCount } of resolved) {
        const current = getProgressionPicks(next, progression.id);
        if (current.length > slotCount) {
          next[progression.id] = current.slice(0, slotCount);
          changed = true;
        }

        if (
          progression.catalog === "feature-choice" &&
          progression.pickMode === "all"
        ) {
          const auto = getAutoGrantSelections(progression);
          if (
            auto.length > 0 &&
            current.length < auto.length
          ) {
            next[progression.id] = auto;
            changed = true;
          }
        }
      }

      return changed ? next : prev;
    });
    // Multiclass progressions are keyed by ids/slot counts.
  }, [
    classData,
    subclass?.id,
    characterLevel,
    multiclassProgressionIdsKey,
    multiclassReady,
  ]);

  useEffect(() => {
    let cancelled = false;
    getAllDndOptionalFeatures().then((catalog) => {
      if (cancelled) return;
      const slots = resolveOptionalFeatureOriginFeatSlots(
        catalog,
        optionalFeatureSelections,
      );
      setOptionalFeatureOriginFeatSlots(slots);
      setOptionalFeatureOriginFeats((prev) => {
        if (prev.length === slots.length) return prev;
        if (prev.length > slots.length) return prev.slice(0, slots.length);
        return [
          ...prev,
          ...Array.from({ length: slots.length - prev.length }, () => null),
        ];
      });
      setOptionalFeatureOriginFeatSkillChoicesState((prev) => {
        const next: Record<number, SkillKey[]> = {};
        for (let i = 0; i < slots.length; i++) {
          if (prev[i]) next[i] = prev[i];
        }
        return next;
      });
    });
    return () => {
      cancelled = true;
    };
  }, [optionalFeatureSelections]);

  useEffect(() => {
    if (classData?.casterProgression !== "pact") return;
    setSpellSelections((prev) => {
      const existingPact = prev[PACT_SPELL_POOL_LEVEL] ?? [];
      let hasLegacy = false;
      const merged = [...existingPact];
      const seen = new Set(merged.map((s) => s.id));
      for (const [key, spells] of Object.entries(prev)) {
        const lvl = Number(key);
        if (lvl <= 0 || lvl === PACT_SPELL_POOL_LEVEL) continue;
        if ((spells?.length ?? 0) > 0) hasLegacy = true;
        for (const s of spells ?? []) {
          if (!seen.has(s.id)) {
            merged.push(s);
            seen.add(s.id);
          }
        }
      }
      if (!hasLegacy && existingPact.length === merged.length) return prev;
      const next: BuilderSpellSelections = {
        ...prev,
        [PACT_SPELL_POOL_LEVEL]: merged,
      };
      for (const key of Object.keys(next)) {
        const lvl = Number(key);
        if (lvl > 0) delete next[lvl];
      }
      return next;
    });
  }, [classData?.id, classData?.casterProgression]);

  const clearAmellwindOptionalOriginFeats = useCallback(() => {
    setOptionalFeatureOriginFeats((prev) => clearAmellwindFeats(prev));
  }, []);

  return useMemo(
    () => ({
      spellSelections,
      optionalFeatureSelections,
      optionalFeatureOriginFeatSlots,
      optionalFeatureOriginFeats,
      optionalFeatureOriginFeatSkillChoices,
      addSpell,
      removeSpell,
      clearSpells,
      clearBonusCantripSpellSelections,
      setOptionalFeaturesForProgression,
      clearOptionalFeatureProgression,
      setOptionalFeatureOriginFeatAtIndex,
      setOptionalFeatureOriginFeatSkillChoicesAtIndex,
      clearSubclassOptionalFeatures,
      resetOnClassChange,
      resetSpellSlice,
      clearAmellwindOptionalOriginFeats,
    }),
    [
      spellSelections,
      optionalFeatureSelections,
      optionalFeatureOriginFeatSlots,
      optionalFeatureOriginFeats,
      optionalFeatureOriginFeatSkillChoices,
      addSpell,
      removeSpell,
      clearSpells,
      clearBonusCantripSpellSelections,
      setOptionalFeaturesForProgression,
      clearOptionalFeatureProgression,
      setOptionalFeatureOriginFeatAtIndex,
      setOptionalFeatureOriginFeatSkillChoicesAtIndex,
      clearSubclassOptionalFeatures,
      resetOnClassChange,
      resetSpellSlice,
      clearAmellwindOptionalOriginFeats,
    ],
  );
}
