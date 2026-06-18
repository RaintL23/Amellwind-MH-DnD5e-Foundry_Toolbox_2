import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCharacterBuilder } from "./CharacterBuilderContext";
import { useBuilderInventory } from "./BuilderInventoryContext";
import { useSelectedClass, useSelectedSubclass, useSelectedSpecies } from "../hooks/useBuilderSelections";
import { useSelectedDndBackground } from "../hooks/useSelectedDndBackground";
import { useOptionalFeatureSpellGrants } from "../hooks/useOptionalFeatureSpellGrants";
import { useCantripPools } from "../hooks/useCantripPools";
import { useSpellcasting } from "../hooks/useSpellcasting";
import {
  evaluateBuildCompleteness,
  type BuildCompletenessInput,
} from "../utils/build-completeness.utils";
import type {
  BuildCompletenessIssue,
  BuildCompletenessResult,
  BuildCompletenessSection,
} from "../utils/build-completeness.types";

interface BuildCompletenessContextValue {
  highlightActive: boolean;
  issues: BuildCompletenessIssue[];
  evaluate: () => BuildCompletenessResult;
  activateHighlight: () => void;
  clearHighlight: () => void;
}

const BuildCompletenessContext =
  createContext<BuildCompletenessContextValue | null>(null);

export function BuildCompletenessProvider({
  children,
}: Readonly<{ children: ReactNode }>) {
  const [highlightActive, setHighlightActive] = useState(false);
  const builder = useCharacterBuilder();
  const inventory = useBuilderInventory();
  const { classData } = useSelectedClass();
  const subclassData = useSelectedSubclass();
  const { species: speciesData } = useSelectedSpecies();
  const { dndBackground } = useSelectedDndBackground();
  const optionalFeatureSpellGrants = useOptionalFeatureSpellGrants(
    builder.optionalFeatureSelections ?? {},
    builder.character.level,
    classData,
    subclassData,
  );
  const { bonusPools: bonusCantripPools } = useCantripPools(
    builder.optionalFeatureSelections ?? {},
    classData,
    subclassData,
    builder.character.level,
    {
      speciesOriginFeat: builder.speciesOriginFeat,
      backgroundOriginFeat: builder.backgroundOriginFeat,
      speciesOriginFeatGrant: builder.speciesOriginFeatGrant,
      backgroundOriginFeatGrant: builder.backgroundOriginFeatGrant,
      featSelections: builder.featSelections,
    },
  );
  const spellcasting = useSpellcasting(
    classData,
    subclassData,
    builder.character.level,
    builder.character.abilities,
    builder.spellSelections ?? {},
    builder.optionalFeatureSelections ?? {},
    optionalFeatureSpellGrants,
    builder.faction,
    builder.character.level,
    undefined,
    bonusCantripPools,
  );

  const input = useMemo(
    (): BuildCompletenessInput => ({
      species: builder.species,
      background: builder.background,
      classSelection: builder.class,
      subclass: builder.subclass,
      level: builder.character.level,
      classData,
      subclassData,
      speciesData,
      dndBackground,
      speciesOriginFeatGrant: builder.speciesOriginFeatGrant,
      backgroundOriginFeatGrant: builder.backgroundOriginFeatGrant,
      speciesOriginFeat: builder.speciesOriginFeat,
      backgroundOriginFeat: builder.backgroundOriginFeat,
      featSelections: builder.featSelections,
      optionalFeatureOriginFeatSlots: builder.optionalFeatureOriginFeatSlots,
      optionalFeatureOriginFeats: builder.optionalFeatureOriginFeats,
      optionalFeatureSelections: builder.optionalFeatureSelections ?? {},
      allSkillGrants: builder.allSkillGrants,
      allExpertiseGrants: builder.allExpertiseGrants,
      allToolGrants: builder.allToolGrants,
      allLanguageGrants: builder.allLanguageGrants,
      allDefenseGrants: builder.allDefenseGrants,
      classSkillChoices: builder.classSkillChoices,
      backgroundSkillChoices: builder.backgroundSkillChoices,
      speciesSkillChoices: builder.speciesSkillChoices,
      featSkillChoices: builder.featSkillChoices,
      originFeatSkillChoices: builder.originFeatSkillChoices,
      optionalFeatureOriginFeatSkillChoices:
        builder.optionalFeatureOriginFeatSkillChoices,
      expertiseChoices: builder.expertiseChoices,
      classToolChoices: builder.classToolChoices,
      backgroundToolChoices: builder.backgroundToolChoices,
      speciesToolChoices: builder.speciesToolChoices,
      classLanguageChoices: builder.classLanguageChoices,
      backgroundLanguageChoices: builder.backgroundLanguageChoices,
      speciesLanguageChoices: builder.speciesLanguageChoices,
      speciesDefenseChoices: builder.speciesDefenseChoices,
      speciesAbilityChoices: builder.speciesAbilityChoices,
      backgroundAsiMode: builder.backgroundAsiMode,
      backgroundAsiPlus2: builder.backgroundAsiPlus2,
      backgroundAsiPlus1: builder.backgroundAsiPlus1,
      useTashaOrigin: builder.useTashaOrigin,
      tashaPlus2: builder.tashaPlus2,
      tashaPlus1: builder.tashaPlus1,
      mainHand: builder.mainHand,
      offHand: builder.offHand,
      armor: builder.armor,
      equippedShield: builder.equippedShield,
      inventoryItems: inventory.items,
      spellcasting,
    }),
    [builder, classData, subclassData, speciesData, dndBackground, inventory.items, spellcasting],
  );

  const currentResult = useMemo(
    () => evaluateBuildCompleteness(input),
    [input],
  );

  const issues = highlightActive ? currentResult.issues : [];

  const evaluate = useCallback(() => currentResult, [currentResult]);

  const activateHighlight = useCallback(() => {
    setHighlightActive(true);
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightActive(false);
  }, []);

  useEffect(() => {
    if (highlightActive && currentResult.issues.length === 0) {
      setHighlightActive(false);
    }
  }, [highlightActive, currentResult.issues.length]);

  const value = useMemo(
    () => ({
      highlightActive,
      issues,
      evaluate,
      activateHighlight,
      clearHighlight,
    }),
    [highlightActive, issues, evaluate, activateHighlight, clearHighlight],
  );

  return (
    <BuildCompletenessContext.Provider value={value}>
      {children}
    </BuildCompletenessContext.Provider>
  );
}

export function useBuildCompleteness(): BuildCompletenessContextValue {
  const ctx = useContext(BuildCompletenessContext);
  if (!ctx) {
    throw new Error(
      "useBuildCompleteness must be used inside BuildCompletenessProvider",
    );
  }
  return ctx;
}

export function useSectionCompletenessHighlight(
  section: BuildCompletenessSection,
  highlightKey?: string,
) {
  const { highlightActive, issues } = useBuildCompleteness();
  const sectionIssues = issues.filter((issue) => issue.section === section);
  const matchedIssues = highlightKey
    ? sectionIssues.filter(
        (issue) => !issue.highlightKey || issue.highlightKey === highlightKey,
      )
    : sectionIssues;

  return {
    highlighted: highlightActive && matchedIssues.length > 0,
    issues: matchedIssues,
  };
}

export function useSlotCompletenessHighlight(highlightKey: string) {
  const { highlightActive, issues } = useBuildCompleteness();
  const matchedIssues = issues.filter(
    (issue) => issue.highlightKey === highlightKey,
  );

  return {
    highlighted: highlightActive && matchedIssues.length > 0,
    issues: matchedIssues,
  };
}
