import { useState, useCallback, useEffect, useMemo } from "react";
import type {
  AbilityKey,
  SkillKey,
} from "@/shared/types";
import type { DamageType } from "@/shared/types";
import type {
  SkillProficiencyGrant,
  ExpertiseGrant,
  SkillAdvantageGrant,
  ProficiencySource,
  NamedProficiencyGrant,
  DefenseGrant,
  DefenseKind,
} from "@/shared/types/proficiency.types";
import {
  resolveFixedGrants,
  resolveFixedExpertiseGrants,
  computeCharacterProficiencies,
} from "../../utils/compute-character-proficiencies";
import { resolveFixedNamedGrants } from "@/shared/utils/named-proficiency.parser";
import { resolveFixedDefenseGrants } from "@/shared/utils/defense-grant.parser";
import {
  pruneChoicesByHierarchy,
  skillsFromHigherPriority,
} from "../../utils/skill-choice-hierarchy.utils";
import {
  ORIGIN_FEAT_SOURCE_NAME,
  formatInvocationOriginFeatSourceName,
} from "../../utils/origin-feat.constants";
import { ensureCommonLanguage } from "@/shared/utils/language-resolution.utils";
import type { OptionalFeatureOriginFeatSlot } from "../../utils/optional-feature-feat-grants.utils";
import type { Character } from "../../models/Character";

export interface ProficiencySliceInput {
  setCharacter: React.Dispatch<React.SetStateAction<Character>>;
  originFeatSkillChoices: SkillKey[];
  optionalFeatureOriginFeatSlots: OptionalFeatureOriginFeatSlot[];
  optionalFeatureOriginFeatSkillChoices: Record<number, SkillKey[]>;
}

function nextGrantList<T>(prev: T[], next: T[]): T[] {
  if (
    prev.length === next.length &&
    prev.every((item, index) => item === next[index])
  ) {
    return prev;
  }
  return next;
}

export function useProficiencySlice({
  setCharacter,
  originFeatSkillChoices,
  optionalFeatureOriginFeatSlots,
  optionalFeatureOriginFeatSkillChoices,
}: ProficiencySliceInput) {
  const [classSkillGrants, setClassSkillGrants] = useState<SkillProficiencyGrant[]>([]);
  const [bgSkillGrants, setBgSkillGrants] = useState<SkillProficiencyGrant[]>([]);
  const [speciesSkillGrants, setSpeciesSkillGrants] = useState<SkillProficiencyGrant[]>([]);
  const [featGrantsList, setFeatGrantsList] = useState<SkillProficiencyGrant[]>([]);

  const [classToolGrants, setClassToolGrants] = useState<NamedProficiencyGrant[]>([]);
  const [classArmorGrants, setClassArmorGrants] = useState<NamedProficiencyGrant[]>([]);
  const [classWeaponGrants, setClassWeaponGrants] = useState<NamedProficiencyGrant[]>([]);
  const [bgToolGrants, setBgToolGrants] = useState<NamedProficiencyGrant[]>([]);
  const [speciesToolGrants, setSpeciesToolGrants] = useState<NamedProficiencyGrant[]>([]);
  const [classLanguageGrants, setClassLanguageGrants] = useState<NamedProficiencyGrant[]>([]);
  const [bgLanguageGrants, setBgLanguageGrants] = useState<NamedProficiencyGrant[]>([]);
  const [speciesLanguageGrants, setSpeciesLanguageGrants] = useState<NamedProficiencyGrant[]>([]);
  const [speciesDefenseGrants, setSpeciesDefenseGrants] = useState<DefenseGrant[]>([]);

  const [classExpertiseGrants, setClassExpertiseGrants] = useState<ExpertiseGrant[]>([]);
  const [featExpertiseGrants, setFeatExpertiseGrants] = useState<ExpertiseGrant[]>([]);

  const [allSkillAdvantages, setAllSkillAdvantages] = useState<SkillAdvantageGrant[]>([]);
  const [saveProficiencyAbilities, setSaveProficiencyAbilities] = useState<AbilityKey[]>([]);

  const allSkillGrants = useMemo(
    () => [...classSkillGrants, ...bgSkillGrants, ...speciesSkillGrants, ...featGrantsList],
    [classSkillGrants, bgSkillGrants, speciesSkillGrants, featGrantsList],
  );
  const allToolGrants = useMemo(
    () => [...classToolGrants, ...bgToolGrants, ...speciesToolGrants],
    [classToolGrants, bgToolGrants, speciesToolGrants],
  );
  const allLanguageGrants = useMemo(
    () => [...classLanguageGrants, ...bgLanguageGrants, ...speciesLanguageGrants],
    [classLanguageGrants, bgLanguageGrants, speciesLanguageGrants],
  );
  const allDefenseGrants = useMemo(
    () => [...speciesDefenseGrants],
    [speciesDefenseGrants],
  );
  const allExpertiseGrants = useMemo(
    () => [...classExpertiseGrants, ...featExpertiseGrants],
    [classExpertiseGrants, featExpertiseGrants],
  );

  const [classSkillChoices, setClassSkillChoicesState] = useState<
    Record<number, SkillKey[]>
  >({});
  const [backgroundSkillChoices, setBackgroundSkillChoices] = useState<SkillKey[]>([]);
  const [speciesSkillChoices, setSpeciesSkillChoices] = useState<SkillKey[]>([]);
  const [featSkillChoices, setFeatSkillChoicesState] = useState<Record<number, SkillKey[]>>({});
  const [expertiseChoices, setExpertiseChoicesState] = useState<Record<string, SkillKey[]>>({});

  const [classToolChoices, setClassToolChoicesState] = useState<Record<number, string[]>>({});
  const [backgroundToolChoices, setBackgroundToolChoices] = useState<string[]>([]);
  const [speciesToolChoices, setSpeciesToolChoices] = useState<string[]>([]);
  const [classLanguageChoices, setClassLanguageChoicesState] = useState<Record<number, string[]>>({});
  const [backgroundLanguageChoices, setBackgroundLanguageChoices] = useState<string[]>([]);
  const [speciesLanguageChoices, setSpeciesLanguageChoices] = useState<string[]>([]);
  const [speciesDefenseChoices, setSpeciesDefenseChoicesState] = useState<
    Record<number, DamageType[]>
  >({});

  const applyIdentityGrants = useCallback((payload: {
    skillGrants?: SkillProficiencyGrant[];
    expertiseGrants?: ExpertiseGrant[];
    skillAdvantages?: SkillAdvantageGrant[];
    saveProficiencies?: AbilityKey[];
    toolGrants?: NamedProficiencyGrant[];
    armorGrants?: NamedProficiencyGrant[];
    weaponGrants?: NamedProficiencyGrant[];
    languageGrants?: NamedProficiencyGrant[];
    defenseGrants?: DefenseGrant[];
    source: "class" | "background" | "species" | "feats";
  }) => {
    const { source } = payload;
    if (payload.skillGrants !== undefined) {
      const next = payload.skillGrants;
      if (source === "class") {
        setClassSkillGrants((prev) => nextGrantList(prev, next));
      } else if (source === "background") {
        setBgSkillGrants((prev) => nextGrantList(prev, next));
      } else if (source === "species") {
        setSpeciesSkillGrants((prev) => nextGrantList(prev, next));
      } else {
        setFeatGrantsList((prev) => nextGrantList(prev, next));
      }
    }
    if (payload.expertiseGrants !== undefined) {
      const next = payload.expertiseGrants;
      if (source === "class") {
        setClassExpertiseGrants((prev) => nextGrantList(prev, next));
      } else {
        setFeatExpertiseGrants((prev) => nextGrantList(prev, next));
      }
    }
    if (payload.skillAdvantages !== undefined) {
      setAllSkillAdvantages((prev) => nextGrantList(prev, payload.skillAdvantages!));
    }
    if (payload.saveProficiencies !== undefined) {
      setSaveProficiencyAbilities((prev) =>
        nextGrantList(prev, payload.saveProficiencies!),
      );
    }
    if (payload.toolGrants !== undefined) {
      const next = payload.toolGrants;
      if (source === "class") {
        setClassToolGrants((prev) => nextGrantList(prev, next));
      } else if (source === "background") {
        setBgToolGrants((prev) => nextGrantList(prev, next));
      } else if (source === "species") {
        setSpeciesToolGrants((prev) => nextGrantList(prev, next));
      }
    }
    if (payload.armorGrants !== undefined && source === "class") {
      setClassArmorGrants((prev) => nextGrantList(prev, payload.armorGrants!));
    }
    if (payload.weaponGrants !== undefined && source === "class") {
      setClassWeaponGrants((prev) => nextGrantList(prev, payload.weaponGrants!));
    }
    if (payload.languageGrants !== undefined) {
      const next = payload.languageGrants;
      if (source === "class") {
        setClassLanguageGrants((prev) => nextGrantList(prev, next));
      } else if (source === "background") {
        setBgLanguageGrants((prev) => nextGrantList(prev, next));
      } else if (source === "species") {
        setSpeciesLanguageGrants((prev) => nextGrantList(prev, next));
      }
    }
    if (payload.defenseGrants !== undefined && source === "species") {
      setSpeciesDefenseGrants((prev) => nextGrantList(prev, payload.defenseGrants!));
    }
  }, []);

  const setClassSkillChoicesAtIndex = useCallback(
    (grantIndex: number, choices: SkillKey[]) => {
      setClassSkillChoicesState((prev) => ({ ...prev, [grantIndex]: choices }));
    },
    [],
  );

  const setFeatSkillChoices = useCallback((slotIndex: number, choices: SkillKey[]) => {
    setFeatSkillChoicesState((prev) => ({ ...prev, [slotIndex]: choices }));
  }, []);

  const setExpertiseChoices = useCallback((grantId: string, choices: SkillKey[]) => {
    setExpertiseChoicesState((prev) => ({ ...prev, [grantId]: choices }));
  }, []);

  const setClassToolChoicesAtIndex = useCallback((grantIndex: number, choices: string[]) => {
    setClassToolChoicesState((prev) => ({ ...prev, [grantIndex]: choices }));
  }, []);

  const setClassLanguageChoicesAtIndex = useCallback(
    (grantIndex: number, choices: string[]) => {
      setClassLanguageChoicesState((prev) => ({ ...prev, [grantIndex]: choices }));
    },
    [],
  );

  const setSpeciesDefenseChoicesAtIndex = useCallback(
    (grantIndex: number, choices: DamageType[]) => {
      setSpeciesDefenseChoicesState((prev) => ({ ...prev, [grantIndex]: choices }));
    },
    [],
  );

  const resetOnSpeciesChange = useCallback(() => {
    setSpeciesSkillChoices([]);
    setSpeciesToolChoices([]);
    setSpeciesLanguageChoices([]);
    setSpeciesDefenseChoicesState({});
    setSpeciesSkillGrants([]);
    setSpeciesToolGrants([]);
    setSpeciesLanguageGrants([]);
    setSpeciesDefenseGrants([]);
    setAllSkillAdvantages([]);
  }, []);

  const resetOnBackgroundChange = useCallback(() => {
    setBackgroundSkillChoices([]);
    setBackgroundToolChoices([]);
    setBackgroundLanguageChoices([]);
    setBgSkillGrants([]);
    setBgToolGrants([]);
    setBgLanguageGrants([]);
  }, []);

  const resetOnClassChange = useCallback(() => {
    setClassSkillGrants([]);
    setClassExpertiseGrants([]);
    setSaveProficiencyAbilities([]);
    setClassToolGrants([]);
    setClassArmorGrants([]);
    setClassWeaponGrants([]);
    setClassLanguageGrants([]);
    setClassSkillChoicesState({});
    setExpertiseChoicesState({});
    setClassToolChoicesState({});
    setClassLanguageChoicesState({});
  }, []);

  const resetProficiencySlice = useCallback(() => {
    setClassSkillGrants([]);
    setBgSkillGrants([]);
    setSpeciesSkillGrants([]);
    setFeatGrantsList([]);
    setClassExpertiseGrants([]);
    setFeatExpertiseGrants([]);
    setAllSkillAdvantages([]);
    setSaveProficiencyAbilities([]);
    setClassSkillChoicesState({});
    setBackgroundSkillChoices([]);
    setSpeciesSkillChoices([]);
    setFeatSkillChoicesState({});
    setExpertiseChoicesState({});
    setClassToolGrants([]);
    setClassArmorGrants([]);
    setClassWeaponGrants([]);
    setBgToolGrants([]);
    setSpeciesToolGrants([]);
    setClassLanguageGrants([]);
    setBgLanguageGrants([]);
    setSpeciesLanguageGrants([]);
    setSpeciesDefenseGrants([]);
    setClassToolChoicesState({});
    setBackgroundToolChoices([]);
    setSpeciesToolChoices([]);
    setClassLanguageChoicesState({});
    setBackgroundLanguageChoices([]);
    setSpeciesLanguageChoices([]);
    setSpeciesDefenseChoicesState({});
  }, []);

  const higherThanBackground = useMemo(
    () =>
      skillsFromHigherPriority(
        "background",
        speciesSkillGrants,
        speciesSkillChoices,
        [],
        [],
        [],
        [],
      ),
    [speciesSkillGrants, speciesSkillChoices],
  );

  const higherThanClass = useMemo(
    () =>
      skillsFromHigherPriority(
        "class",
        speciesSkillGrants,
        speciesSkillChoices,
        bgSkillGrants,
        backgroundSkillChoices,
        [],
        [],
      ),
    [
      speciesSkillGrants,
      speciesSkillChoices,
      bgSkillGrants,
      backgroundSkillChoices,
    ],
  );

  useEffect(() => {
    const covered = new Set(Object.keys(higherThanBackground) as SkillKey[]);
    setBackgroundSkillChoices((prev) => {
      const next = pruneChoicesByHierarchy(prev, covered);
      if (next.length === prev.length && next.every((s, i) => s === prev[i])) {
        return prev;
      }
      return next;
    });
  }, [higherThanBackground]);

  useEffect(() => {
    const covered = new Set(Object.keys(higherThanClass) as SkillKey[]);
    setClassSkillChoicesState((prev) => {
      let changed = false;
      const next: Record<number, SkillKey[]> = {};
      for (const [idx, choices] of Object.entries(prev)) {
        const pruned = pruneChoicesByHierarchy(choices, covered);
        next[Number(idx)] = pruned;
        if (
          pruned.length !== choices.length ||
          pruned.some((s, i) => s !== choices[i])
        ) {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [higherThanClass]);

  const proficiencyResult = useMemo(() => {
    const fixedSkills = resolveFixedGrants(allSkillGrants);

    const classChooseGrants = allSkillGrants.filter(
      (g) => g.kind !== "fixed" && g.source.type === "class",
    );
    const chosenSkillsFromClass: Array<{ skill: SkillKey; source: ProficiencySource }> =
      Object.entries(classSkillChoices).flatMap(([idx, skills]) =>
        skills.map((sk) => ({
          skill: sk,
          source:
            classChooseGrants[Number(idx)]?.source ?? {
              type: "class" as const,
              name: "Class",
            },
        })),
      );
    const chosenSkillsFromBackground: Array<{ skill: SkillKey; source: ProficiencySource }> =
      backgroundSkillChoices.map((sk) => {
        const grant = allSkillGrants.find((g) => g.kind !== "fixed" && g.source.type === "background");
        return { skill: sk, source: grant?.source ?? { type: "background", name: "Background" } };
      });
    const chosenSkillsFromSpecies: Array<{ skill: SkillKey; source: ProficiencySource }> =
      speciesSkillChoices.map((sk) => {
        const grant = allSkillGrants.find((g) => g.kind !== "fixed" && g.source.type === "species");
        return { skill: sk, source: grant?.source ?? { type: "species", name: "Species" } };
      });
    const chosenSkillsFromFeats: Array<{ skill: SkillKey; source: ProficiencySource }> =
      Object.entries(featSkillChoices).flatMap(([idx, skills]) =>
        skills.map((sk) => ({
          skill: sk,
          source: { type: "feat" as const, name: `Feat slot ${Number(idx) + 1}` },
        })),
      );
    const chosenSkillsFromOriginFeat: Array<{ skill: SkillKey; source: ProficiencySource }> =
      originFeatSkillChoices.map((sk) => ({
        skill: sk,
        source: { type: "feat" as const, name: ORIGIN_FEAT_SOURCE_NAME },
      }));
    const chosenSkillsFromInvocationOriginFeats: Array<{
      skill: SkillKey;
      source: ProficiencySource;
    }> = Object.entries(optionalFeatureOriginFeatSkillChoices).flatMap(
      ([slotIndex, skills]) => {
        const slot = optionalFeatureOriginFeatSlots[Number(slotIndex)];
        const sourceName = slot
          ? formatInvocationOriginFeatSourceName(
              slot.sourceFeatureName,
              slot.duplicateIndex,
            )
          : ORIGIN_FEAT_SOURCE_NAME;
        return skills.map((sk) => ({
          skill: sk,
          source: { type: "feat" as const, name: sourceName },
        }));
      },
    );

    const resolvedSkillGrants = [
      ...fixedSkills,
      ...chosenSkillsFromClass,
      ...chosenSkillsFromBackground,
      ...chosenSkillsFromSpecies,
      ...chosenSkillsFromOriginFeat,
      ...chosenSkillsFromInvocationOriginFeats,
      ...chosenSkillsFromFeats,
    ];

    const fixedExpertise = resolveFixedExpertiseGrants(allExpertiseGrants);
    const chosenExpertise: Array<{ skill: SkillKey; source: ProficiencySource }> =
      Object.entries(expertiseChoices).flatMap(([grantId, skills]) =>
        skills.map((sk) => ({
          skill: sk,
          source: { type: "feature" as const, name: grantId },
        })),
      );
    const resolvedExpertiseGrants = [...fixedExpertise, ...chosenExpertise];

    return computeCharacterProficiencies(
      saveProficiencyAbilities,
      resolvedSkillGrants,
      resolvedExpertiseGrants,
      allSkillAdvantages,
    );
  }, [
    allSkillGrants, allExpertiseGrants, allSkillAdvantages, saveProficiencyAbilities,
    classSkillChoices, backgroundSkillChoices, speciesSkillChoices,
    originFeatSkillChoices, featSkillChoices, expertiseChoices,
    optionalFeatureOriginFeatSlots, optionalFeatureOriginFeatSkillChoices,
  ]);

  const identityGrantsResult = useMemo(() => {
    function resolveFixedGrantList(grants: NamedProficiencyGrant[]) {
      const fixed = resolveFixedNamedGrants(grants);
      const sources: Partial<Record<string, ProficiencySource[]>> = {};
      for (const { item, source } of fixed) {
        const key = item.toLowerCase();
        if (!sources[key]) sources[key] = [];
        if (!sources[key]!.some((s) => s.type === source.type && s.name === source.name)) {
          sources[key]!.push(source);
        }
      }
      const items = [...new Set(fixed.map((entry) => entry.item))];
      return { items, sources };
    }

    function resolveNamedWithChoices(
      grants: NamedProficiencyGrant[],
      classChoices: Record<number, string[]>,
      backgroundChoices: string[],
      speciesChoices: string[],
    ) {
      const fixed = resolveFixedNamedGrants(grants);
      const classChooseGrants = grants.filter(
        (g) => g.kind !== "fixed" && g.source.type === "class",
      );
      const fromClass = Object.entries(classChoices).flatMap(([idx, items]) =>
        items.map((item) => ({
          item,
          source:
            classChooseGrants[Number(idx)]?.source ?? {
              type: "class" as const,
              name: "Class",
            },
        })),
      );
      const bgGrant = grants.find((g) => g.kind !== "fixed" && g.source.type === "background");
      const fromBackground = backgroundChoices.map((item) => ({
        item,
        source: bgGrant?.source ?? { type: "background" as const, name: "Background" },
      }));
      const speciesGrant = grants.find((g) => g.kind !== "fixed" && g.source.type === "species");
      const fromSpecies = speciesChoices.map((item) => ({
        item,
        source: speciesGrant?.source ?? { type: "species" as const, name: "Species" },
      }));

      const all = [...fixed, ...fromClass, ...fromBackground, ...fromSpecies];
      const sources: Partial<Record<string, ProficiencySource[]>> = {};
      for (const { item, source } of all) {
        const key = item.toLowerCase();
        if (!sources[key]) sources[key] = [];
        if (!sources[key]!.some((s) => s.type === source.type && s.name === source.name)) {
          sources[key]!.push(source);
        }
      }
      const items = [...new Set(all.map((e) => e.item))];
      return { items, sources };
    }

    const tools = resolveNamedWithChoices(
      allToolGrants,
      classToolChoices,
      backgroundToolChoices,
      speciesToolChoices,
    );
    const armor = resolveFixedGrantList(classArmorGrants);
    const weapons = resolveFixedGrantList(classWeaponGrants);
    const languages = resolveNamedWithChoices(
      allLanguageGrants,
      classLanguageChoices,
      backgroundLanguageChoices,
      speciesLanguageChoices,
    );

    const fixedDefenses = resolveFixedDefenseGrants(allDefenseGrants);
    const chooseDefenseGrants = allDefenseGrants.filter((g) => g.kind === "choose");
    const chosenDefenses = Object.entries(speciesDefenseChoices).flatMap(([idx, types]) =>
      types.map((type) => ({
        type,
        defenseKind:
          chooseDefenseGrants[Number(idx)]?.defenseKind ?? ("resistance" as DefenseKind),
        source:
          chooseDefenseGrants[Number(idx)]?.source ?? {
            type: "species" as const,
            name: "Species",
          },
      })),
    );
    const allDefenses = [...fixedDefenses, ...chosenDefenses];
    const defenseSources: Partial<
      Record<string, Array<{ source: ProficiencySource; defenseKind: DefenseKind }>>
    > = {};
    for (const entry of allDefenses) {
      const key = entry.type;
      if (!defenseSources[key]) defenseSources[key] = [];
      defenseSources[key]!.push({
        source: entry.source,
        defenseKind: entry.defenseKind,
      });
    }

    return {
      tools: tools.items,
      toolSources: tools.sources,
      armor: armor.items,
      armorSources: armor.sources,
      weapons: weapons.items,
      weaponSources: weapons.sources,
      languages: languages.items,
      languageSources: languages.sources,
      resistances: allDefenses
        .filter((d) => d.defenseKind === "resistance")
        .map((d) => d.type),
      immunities: allDefenses
        .filter((d) => d.defenseKind === "immunity")
        .map((d) => d.type),
      defenseSources,
    };
  }, [
    allToolGrants,
    classArmorGrants,
    classWeaponGrants,
    allLanguageGrants,
    allDefenseGrants,
    classToolChoices,
    backgroundToolChoices,
    speciesToolChoices,
    classLanguageChoices,
    backgroundLanguageChoices,
    speciesLanguageChoices,
    speciesDefenseChoices,
  ]);

  useEffect(() => {
    setCharacter((prev) => {
      const languages = ensureCommonLanguage(identityGrantsResult.languages);

      const skillsUnchanged =
        prev.skills === proficiencyResult.skills ||
        (Object.keys(prev.skills).length ===
          Object.keys(proficiencyResult.skills).length &&
          (Object.keys(proficiencyResult.skills) as SkillKey[]).every(
            (key) => prev.skills[key] === proficiencyResult.skills[key],
          ));
      const savesUnchanged =
        prev.savingThrows === proficiencyResult.savingThrows ||
        (Object.keys(prev.savingThrows).length ===
          Object.keys(proficiencyResult.savingThrows).length &&
          (Object.keys(proficiencyResult.savingThrows) as AbilityKey[]).every(
            (key) => prev.savingThrows[key] === proficiencyResult.savingThrows[key],
          ));
      const languagesUnchanged =
        prev.languages.length === languages.length &&
        prev.languages.every((lang, index) => lang === languages[index]);
      const resistancesUnchanged =
        prev.damageResistances.length ===
          identityGrantsResult.resistances.length &&
        prev.damageResistances.every(
          (type, index) => type === identityGrantsResult.resistances[index],
        );
      const immunitiesUnchanged =
        prev.damageImmunities.length === identityGrantsResult.immunities.length &&
        prev.damageImmunities.every(
          (type, index) => type === identityGrantsResult.immunities[index],
        );
      const nextPassive = 10 + prev.getSkillModifier("prc");

      if (
        skillsUnchanged &&
        savesUnchanged &&
        languagesUnchanged &&
        resistancesUnchanged &&
        immunitiesUnchanged &&
        prev.passivePerception === nextPassive
      ) {
        return prev;
      }

      const next = Object.assign(
        Object.create(Object.getPrototypeOf(prev)) as Character,
        prev,
      );
      next.skills = proficiencyResult.skills;
      next.savingThrows = proficiencyResult.savingThrows;
      next.passivePerception = nextPassive;
      next.languages = languages;
      next.damageResistances = identityGrantsResult.resistances;
      next.damageImmunities = identityGrantsResult.immunities;
      return next;
    });
  }, [proficiencyResult, identityGrantsResult, setCharacter]);

  return {
    applyIdentityGrants,
    allSkillGrants,
    allExpertiseGrants,
    allSkillAdvantages,
    saveProficiencyAbilities,
    classSkillChoices,
    backgroundSkillChoices,
    speciesSkillChoices,
    featSkillChoices,
    expertiseChoices,
    setClassSkillChoicesAtIndex,
    setBackgroundSkillChoices,
    setSpeciesSkillChoices,
    setFeatSkillChoices,
    setExpertiseChoices,
    setClassToolChoicesAtIndex,
    setBackgroundToolChoices,
    setSpeciesToolChoices,
    setClassLanguageChoicesAtIndex,
    setBackgroundLanguageChoices,
    setSpeciesLanguageChoices,
    setSpeciesDefenseChoicesAtIndex,
    allToolGrants,
    allLanguageGrants,
    allDefenseGrants,
    classToolChoices,
    backgroundToolChoices,
    speciesToolChoices,
    classLanguageChoices,
    backgroundLanguageChoices,
    speciesLanguageChoices,
    speciesDefenseChoices,
    skillSources: proficiencyResult.skillSources,
    expertiseSources: proficiencyResult.expertiseSources,
    toolSources: identityGrantsResult.toolSources,
    languageSources: identityGrantsResult.languageSources,
    defenseSources: identityGrantsResult.defenseSources,
    resolvedToolItems: identityGrantsResult.tools,
    resolvedArmorItems: identityGrantsResult.armor,
    resolvedWeaponItems: identityGrantsResult.weapons,
    armorSources: identityGrantsResult.armorSources,
    weaponSources: identityGrantsResult.weaponSources,
    resolvedLanguageItems: identityGrantsResult.languages,
    resolvedResistances: identityGrantsResult.resistances,
    resolvedImmunities: identityGrantsResult.immunities,
    resetOnSpeciesChange,
    resetOnBackgroundChange,
    resetOnClassChange,
    resetProficiencySlice,
  };
}
