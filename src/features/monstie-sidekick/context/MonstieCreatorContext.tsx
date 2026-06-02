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
  Monster,
  MonstieClassFeature,
  MonstieDraft,
  MonstieSidekick,
  SkillKey,
} from "@/shared/types";
import { getAllMonsters } from "@/features/monsters/services/monster.service";
import { getMonstieClassFeatures } from "../services/monstie-sidekick.service";
import { isMonstieEligible } from "../utils/monstie-eligibility";
import {
  getCreatureFeatureOptions,
  getTraitOptions,
  pickDefaultSignatureAttack,
} from "../utils/monstie-actions";
import { buildMonstieFromDraft } from "../utils/build-monstie";
import { getMaxSkillSlots, getTraitPickSlots, getCreatureFeatureSlots } from "../utils/monstie-stats";

const defaultDraft: MonstieDraft = {
  customName: "",
  level: 1,
  baseMonsterName: "",
  selectedSkills: [],
  signatureAttackName: "",
  selectedTraits: [],
  selectedCreatureFeatures: [],
};

interface MonstieCreatorContextValue {
  loading: boolean;
  eligibleMonsters: Monster[];
  allMonsters: Monster[];
  classFeatures: MonstieClassFeature[];
  draft: MonstieDraft;
  baseMonster: Monster | null;
  builtMonstie: MonstieSidekick | null;
  maxSkillSlots: number;
  maxTraitSlots: number;
  maxCreatureSlots: number;
  setDraft: (patch: Partial<MonstieDraft>) => void;
  selectBaseMonster: (name: string) => void;
  toggleSkill: (skill: SkillKey) => void;
  toggleTrait: (name: string) => void;
  toggleCreatureFeature: (name: string) => void;
  generateRandom: () => void;
  resetDraft: () => void;
}

const MonstieCreatorContext = createContext<MonstieCreatorContextValue | null>(
  null,
);

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
      .finally(() => setLoading(false));
  }, []);

  const eligibleMonsters = useMemo(
    () => allMonsters.filter(isMonstieEligible).sort((a, b) => a.name.localeCompare(b.name)),
    [allMonsters],
  );

  const baseMonster = useMemo(
    () => eligibleMonsters.find((m) => m.name === draft.baseMonsterName) ?? null,
    [eligibleMonsters, draft.baseMonsterName],
  );

  const maxSkillSlots = useMemo(
    () =>
      baseMonster
        ? getMaxSkillSlots(draft.level, Object.keys(baseMonster.skills).length)
        : 0,
    [baseMonster, draft.level],
  );

  const maxTraitSlots = useMemo(
    () => getTraitPickSlots(draft.level),
    [draft.level],
  );

  const maxCreatureSlots = useMemo(
    () => getCreatureFeatureSlots(draft.level),
    [draft.level],
  );

  const builtMonstie = useMemo(() => {
    if (!baseMonster) return null;
    return buildMonstieFromDraft(draft, baseMonster, classFeatures);
  }, [draft, baseMonster, classFeatures]);

  const setDraft = useCallback((patch: Partial<MonstieDraft>) => {
    setDraftState((prev) => ({ ...prev, ...patch }));
  }, []);

  const selectBaseMonster = useCallback(
    (name: string) => {
      const monster = eligibleMonsters.find((m) => m.name === name);
      if (!monster) return;

      const skillKeys = Object.keys(monster.skills) as SkillKey[];
      const defaultSkills = skillKeys.slice(0, 2);
      const signature = pickDefaultSignatureAttack(monster);

      setDraftState({
        customName: `${monster.shortName ?? monster.name} Monstie`,
        level: 1,
        baseMonsterName: name,
        selectedSkills: defaultSkills,
        signatureAttackName: signature,
        selectedTraits: [],
        selectedCreatureFeatures: [],
      });
    },
    [eligibleMonsters],
  );

  const toggleSkill = useCallback(
    (skill: SkillKey) => {
      setDraftState((prev) => {
        const has = prev.selectedSkills.includes(skill);
        if (has) {
          return {
            ...prev,
            selectedSkills: prev.selectedSkills.filter((s) => s !== skill),
          };
        }
        const max = baseMonster
          ? getMaxSkillSlots(prev.level, Object.keys(baseMonster.skills).length)
          : 0;
        if (prev.selectedSkills.length >= max) return prev;
        return { ...prev, selectedSkills: [...prev.selectedSkills, skill] };
      });
    },
    [baseMonster],
  );

  const toggleTrait = useCallback((name: string) => {
    setDraftState((prev) => {
      const has = prev.selectedTraits.includes(name);
      if (has) {
        return {
          ...prev,
          selectedTraits: prev.selectedTraits.filter((t) => t !== name),
        };
      }
      const max = getTraitPickSlots(prev.level);
      if (prev.selectedTraits.length >= max) return prev;
      return { ...prev, selectedTraits: [...prev.selectedTraits, name] };
    });
  }, []);

  const toggleCreatureFeature = useCallback((name: string) => {
    setDraftState((prev) => {
      const has = prev.selectedCreatureFeatures.includes(name);
      if (has) {
        return {
          ...prev,
          selectedCreatureFeatures: prev.selectedCreatureFeatures.filter(
            (t) => t !== name,
          ),
        };
      }
      const max = getCreatureFeatureSlots(prev.level);
      if (prev.selectedCreatureFeatures.length >= max) return prev;
      return {
        ...prev,
        selectedCreatureFeatures: [...prev.selectedCreatureFeatures, name],
      };
    });
  }, []);

  const generateRandom = useCallback(() => {
    if (eligibleMonsters.length === 0) return;
    const monster =
      eligibleMonsters[Math.floor(Math.random() * eligibleMonsters.length)];
    const level = Math.floor(Math.random() * 20) + 1;
    const skillKeys = Object.keys(monster.skills) as SkillKey[];
    const maxSkills = getMaxSkillSlots(level, skillKeys.length);
    const shuffled = [...skillKeys].sort(() => Math.random() - 0.5);
    const traits = getTraitOptions(monster);
    const creatures = getCreatureFeatureOptions(monster);
    const maxTraits = getTraitPickSlots(level);
    const maxCreature = getCreatureFeatureSlots(level);

    setDraftState({
      customName: `${monster.shortName ?? monster.name} Monstie`,
      level,
      baseMonsterName: monster.name,
      selectedSkills: shuffled.slice(0, maxSkills),
      signatureAttackName: pickDefaultSignatureAttack(monster),
      selectedTraits: traits
        .slice(0, maxTraits)
        .map((t) => t.name),
      selectedCreatureFeatures: creatures
        .slice(0, maxCreature)
        .map((c) => c.name),
    });
  }, [eligibleMonsters]);

  const resetDraft = useCallback(() => setDraftState(defaultDraft), []);

  const value: MonstieCreatorContextValue = {
    loading,
    eligibleMonsters,
    allMonsters,
    classFeatures,
    draft,
    baseMonster,
    builtMonstie,
    maxSkillSlots,
    maxTraitSlots,
    maxCreatureSlots,
    setDraft,
    selectBaseMonster,
    toggleSkill,
    toggleTrait,
    toggleCreatureFeature,
    generateRandom,
    resetDraft,
  };

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
