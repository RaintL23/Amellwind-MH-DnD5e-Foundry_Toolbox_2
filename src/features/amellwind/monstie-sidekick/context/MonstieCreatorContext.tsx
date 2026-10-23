import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type {
  AbilityKey,
  Monster,
  MonstieClassFeature,
  MonstieDraft,
  MonstieSidekick,
  SkillKey,
} from "@/shared/types";
import { ABILITY_KEYS } from "@/shared/utils/ability-scores";
import { getAllMonsters } from "@/features/amellwind/monsters/services/monster.service";
import { getMonstieClassFeatures } from "../services/monstie-sidekick.service";
import { isMonstieEligible } from "../utils/monstie-eligibility";
import {
  pickDefaultBaseAttack,
  pickDefaultSignatureAttack,
} from "../utils/monstie-actions";
import {
  buildMonstieFromDraft,
  resolveMonstieChoices,
  type MonstieChoices,
} from "../utils/build-monstie";
import { MONSTIE_ABILITY_CAP, sumAbilityIncreases } from "../utils/monstie-stats";

const defaultDraft: MonstieDraft = {
  customName: "",
  level: 1,
  baseMonsterName: "",
  selectedSkills: [],
  baseAttackName: "",
  signatureAttackName: "",
  abilityIncreases: {},
  saveFallbackCondition: "",
  selectedTraits: [],
  selectedCreatureFeatures: [],
};

interface MonstieCreatorContextValue {
  loading: boolean;
  eligibleMonsters: Monster[];
  classFeatures: MonstieClassFeature[];
  draft: MonstieDraft;
  baseMonster: Monster | null;
  /** Options and slot limits derived from the draft (null until a monster is chosen). */
  choices: MonstieChoices | null;
  builtMonstie: MonstieSidekick | null;
  setDraft: (patch: Partial<MonstieDraft>) => void;
  setLevel: (level: number) => void;
  selectBaseMonster: (name: string) => void;
  toggleSkill: (skill: SkillKey) => void;
  toggleTrait: (name: string) => void;
  toggleCreatureFeature: (name: string) => void;
  changeAbilityIncrease: (ability: AbilityKey, delta: number) => void;
  generateRandom: () => void;
  resetDraft: () => void;
}

const MonstieCreatorContext = createContext<MonstieCreatorContextValue | null>(
  null,
);

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function pickRandom<T>(items: T[]): T | undefined {
  return items[Math.floor(Math.random() * items.length)];
}

/** Drops picks that no longer fit the draft's level / monster (keeps order). */
function normalizeDraft(draft: MonstieDraft, base: Monster): MonstieDraft {
  const choices = resolveMonstieChoices(draft, base);
  return {
    ...draft,
    level: choices.level,
    selectedSkills: choices.selectedSkills,
    selectedTraits: choices.selectedTraits,
    selectedCreatureFeatures: choices.selectedCreatureFeatures,
    abilityIncreases: choices.abilityIncreases,
    saveFallbackCondition: choices.conditionImmunityOptions.includes(
      draft.saveFallbackCondition,
    )
      ? draft.saveFallbackCondition
      : "",
  };
}

function createDraftForMonster(monster: Monster, level: number): MonstieDraft {
  return normalizeDraft(
    {
      ...defaultDraft,
      customName: `${monster.shortName ?? monster.name} Monstie`,
      level,
      baseMonsterName: monster.name,
      selectedSkills: resolveMonstieChoices(
        { ...defaultDraft, baseMonsterName: monster.name, level },
        monster,
      ).skillOptions,
      baseAttackName: pickDefaultBaseAttack(monster),
      signatureAttackName: pickDefaultSignatureAttack(monster),
    },
    monster,
  );
}

function randomDraftForMonster(monster: Monster): MonstieDraft {
  const level = Math.floor(Math.random() * 20) + 1;
  let draft = createDraftForMonster(monster, level);
  const initial = resolveMonstieChoices(draft, monster);

  draft = {
    ...draft,
    selectedSkills: shuffle(initial.skillOptions).slice(0, initial.maxSkillSlots),
    baseAttackName:
      pickRandom(initial.baseAttackOptions)?.name ?? draft.baseAttackName,
    signatureAttackName:
      pickRandom(initial.signatureOptions)?.name ?? draft.signatureAttackName,
    selectedTraits: shuffle(initial.traitOptions)
      .slice(0, initial.maxTraitSlots)
      .map((t) => t.name),
  };

  // Creature options depend on the traits / attacks picked above.
  const afterTraits = resolveMonstieChoices(draft, monster);
  draft = {
    ...draft,
    selectedCreatureFeatures: shuffle(afterTraits.creatureOptions)
      .slice(0, afterTraits.maxCreatureSlots)
      .map((c) => c.name),
  };

  // Spend ability points on the highest scores first, one point at a time.
  const budget = resolveMonstieChoices(draft, monster);
  const increases: Partial<Record<AbilityKey, number>> = {};
  const ranked = [...ABILITY_KEYS].sort(
    (a, b) => budget.baseAbilities[b] - budget.baseAbilities[a],
  );
  let remaining = budget.abilityBudget;
  for (const key of ranked) {
    const room = MONSTIE_ABILITY_CAP - budget.baseAbilities[key];
    const spend = Math.min(room, remaining);
    if (spend > 0) increases[key] = spend;
    remaining -= spend;
    if (remaining <= 0) break;
  }

  return normalizeDraft({ ...draft, abilityIncreases: increases }, monster);
}

export function MonstieCreatorProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [allMonsters, setAllMonsters] = useState<Monster[]>([]);
  const [classFeatures, setClassFeatures] = useState<MonstieClassFeature[]>([]);
  const [draft, setDraftState] = useState<MonstieDraft>(defaultDraft);

  useEffect(() => {
    Promise.all([getAllMonsters(), getMonstieClassFeatures()])
      .then(([monsters, features]) => {
        setAllMonsters(monsters);
        setClassFeatures(features);
      })
      .catch(() => {
        setAllMonsters([]);
        setClassFeatures([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const eligibleMonsters = useMemo(() => {
    const seen = new Set<string>();
    return allMonsters
      .filter(isMonstieEligible)
      .filter((m) => {
        if (seen.has(m.name)) return false;
        seen.add(m.name);
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allMonsters]);

  const baseMonster = useMemo(
    () => eligibleMonsters.find((m) => m.name === draft.baseMonsterName) ?? null,
    [eligibleMonsters, draft.baseMonsterName],
  );

  const choices = useMemo(
    () => (baseMonster ? resolveMonstieChoices(draft, baseMonster) : null),
    [draft, baseMonster],
  );

  const builtMonstie = useMemo(() => {
    if (!baseMonster) return null;
    return buildMonstieFromDraft(draft, baseMonster, classFeatures);
  }, [draft, baseMonster, classFeatures]);

  /** Applies a patch and re-validates picks against the base monster. */
  const updateDraft = useCallback(
    (update: (prev: MonstieDraft) => MonstieDraft) => {
      setDraftState((prev) => {
        const next = update(prev);
        return baseMonster ? normalizeDraft(next, baseMonster) : next;
      });
    },
    [baseMonster],
  );

  const setDraft = useCallback(
    (patch: Partial<MonstieDraft>) => updateDraft((prev) => ({ ...prev, ...patch })),
    [updateDraft],
  );

  const setLevel = useCallback(
    (level: number) => updateDraft((prev) => ({ ...prev, level })),
    [updateDraft],
  );

  const selectBaseMonster = useCallback(
    (name: string) => {
      const monster = eligibleMonsters.find((m) => m.name === name);
      if (!monster) {
        setDraftState(defaultDraft);
        return;
      }
      setDraftState((prev) => createDraftForMonster(monster, prev.level));
    },
    [eligibleMonsters],
  );

  const toggleSkill = useCallback(
    (skill: SkillKey) => {
      updateDraft((prev) => {
        if (prev.selectedSkills.includes(skill)) {
          return {
            ...prev,
            selectedSkills: prev.selectedSkills.filter((s) => s !== skill),
          };
        }
        if (choices && prev.selectedSkills.length >= choices.maxSkillSlots) {
          return prev;
        }
        return { ...prev, selectedSkills: [...prev.selectedSkills, skill] };
      });
    },
    [updateDraft, choices],
  );

  const toggleTrait = useCallback(
    (name: string) => {
      updateDraft((prev) => {
        if (prev.selectedTraits.includes(name)) {
          return {
            ...prev,
            selectedTraits: prev.selectedTraits.filter((t) => t !== name),
          };
        }
        if (choices && prev.selectedTraits.length >= choices.maxTraitSlots) {
          return prev;
        }
        return {
          ...prev,
          selectedTraits: [...prev.selectedTraits, name],
          // A trait can't also be learned through Creature.
          selectedCreatureFeatures: prev.selectedCreatureFeatures.filter(
            (c) => c !== name,
          ),
        };
      });
    },
    [updateDraft, choices],
  );

  const toggleCreatureFeature = useCallback(
    (name: string) => {
      updateDraft((prev) => {
        if (prev.selectedCreatureFeatures.includes(name)) {
          return {
            ...prev,
            selectedCreatureFeatures: prev.selectedCreatureFeatures.filter(
              (t) => t !== name,
            ),
          };
        }
        if (
          choices &&
          prev.selectedCreatureFeatures.length >= choices.maxCreatureSlots
        ) {
          return prev;
        }
        return {
          ...prev,
          selectedCreatureFeatures: [...prev.selectedCreatureFeatures, name],
        };
      });
    },
    [updateDraft, choices],
  );

  const changeAbilityIncrease = useCallback(
    (ability: AbilityKey, delta: number) => {
      updateDraft((prev) => {
        const current = prev.abilityIncreases[ability] ?? 0;
        const nextValue = Math.max(0, current + delta);
        if (
          delta > 0 &&
          choices &&
          (sumAbilityIncreases(prev.abilityIncreases) >= choices.abilityBudget ||
            choices.baseAbilities[ability] + nextValue > MONSTIE_ABILITY_CAP)
        ) {
          return prev;
        }
        return {
          ...prev,
          abilityIncreases: { ...prev.abilityIncreases, [ability]: nextValue },
        };
      });
    },
    [updateDraft, choices],
  );

  const generateRandom = useCallback(() => {
    const monster = pickRandom(eligibleMonsters);
    if (!monster) return;
    setDraftState(randomDraftForMonster(monster));
  }, [eligibleMonsters]);

  const resetDraft = useCallback(() => setDraftState(defaultDraft), []);

  const value = useMemo<MonstieCreatorContextValue>(
    () => ({
      loading,
      eligibleMonsters,
      classFeatures,
      draft,
      baseMonster,
      choices,
      builtMonstie,
      setDraft,
      setLevel,
      selectBaseMonster,
      toggleSkill,
      toggleTrait,
      toggleCreatureFeature,
      changeAbilityIncrease,
      generateRandom,
      resetDraft,
    }),
    [
      loading,
      eligibleMonsters,
      classFeatures,
      draft,
      baseMonster,
      choices,
      builtMonstie,
      setDraft,
      setLevel,
      selectBaseMonster,
      toggleSkill,
      toggleTrait,
      toggleCreatureFeature,
      changeAbilityIncrease,
      generateRandom,
      resetDraft,
    ],
  );

  return (
    <MonstieCreatorContext.Provider value={value}>
      {children}
    </MonstieCreatorContext.Provider>
  );
}

export function useMonstieCreator() {
  const ctx = useContext(MonstieCreatorContext);
  if (!ctx) {
    throw new Error("useMonstieCreator must be used within MonstieCreatorProvider");
  }
  return ctx;
}
