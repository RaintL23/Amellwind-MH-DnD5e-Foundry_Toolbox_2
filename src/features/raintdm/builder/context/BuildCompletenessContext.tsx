import {
  createContext,
  useCallback,
  useContext,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useCharacterBuilder } from "./CharacterBuilderContext";
import { useBuilderInventory } from "./BuilderInventoryContext";
import { useSelectedClass, useSelectedSubclass, useSelectedSpecies } from "../hooks/useBuilderSelections";
import { useSelectedDndBackground } from "../hooks/useSelectedDndBackground";
import { useSpellcastingContext } from "./SpellcastingContext";
import {
  evaluateBuildCompleteness,
  type BuildCompletenessInput,
} from "../utils/build-completeness.utils";
import type {
  BuildCompletenessIssue,
  BuildCompletenessResult,
  BuildCompletenessSection,
} from "../utils/build-completeness.types";
import {
  countCompletenessProgress,
  groupCompletenessSteps,
  type CompletenessStep,
} from "../utils/build-completeness/group-completeness-steps.utils";

interface BuildCompletenessContextValue {
  highlightActive: boolean;
  issues: BuildCompletenessIssue[];
  /** Live completeness result (deferred) for the progress checklist. */
  liveResult: BuildCompletenessResult;
  liveSteps: CompletenessStep[];
  liveProgress: { completed: number; total: number; percent: number };
  evaluate: () => BuildCompletenessResult;
  activateHighlight: () => void;
  clearHighlight: () => void;
  /** Scroll to a builder section and optionally activate highlight. */
  goToSection: (section: BuildCompletenessSection) => void;
}

const BuildCompletenessContext =
  createContext<BuildCompletenessContextValue | null>(null);

const SECTION_TO_ANCHOR: Record<BuildCompletenessSection, string> = {
  identity: "identity",
  feats: "identity",
  "optional-features": "identity",
  "ability-scores": "ability-scores",
  skills: "skills",
  tools: "tools",
  languages: "languages",
  defenses: "defenses",
  "starting-equipment": "inventory",
  spells: "spells",
};

export function scrollToBuilderSection(section: BuildCompletenessSection) {
  const anchorId = SECTION_TO_ANCHOR[section] ?? section;
  const el = document.querySelector(
    `[data-builder-section="${anchorId}"]`,
  );
  if (el instanceof HTMLElement) {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    el.scrollIntoView({
      behavior: prefersReduced ? "auto" : "smooth",
      block: "start",
    });
  }
}

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
  const { spellcasting } = useSpellcastingContext();

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
      useAmellwindHomebrew: builder.useAmellwindHomebrew,
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

  const deferredInput = useDeferredValue(input);

  const liveResult = useMemo(
    () => evaluateBuildCompleteness(deferredInput),
    [deferredInput],
  );

  const liveSteps = useMemo(
    () =>
      groupCompletenessSteps(liveResult, {
        isSpellcaster: spellcasting?.isSpellcaster ?? false,
      }),
    [liveResult, spellcasting?.isSpellcaster],
  );

  const liveProgress = useMemo(
    () => countCompletenessProgress(liveSteps),
    [liveSteps],
  );

  const computeResult = useCallback(
    () => evaluateBuildCompleteness(input),
    [input],
  );

  // Highlight path: evaluate while highlight is active so banners stay live.
  const currentResult = useMemo(
    () => (highlightActive ? computeResult() : null),
    [highlightActive, computeResult],
  );

  const issues = currentResult ? currentResult.issues : [];

  const evaluate = useCallback(
    () => currentResult ?? computeResult(),
    [currentResult, computeResult],
  );

  const activateHighlight = useCallback(() => {
    setHighlightActive(true);
  }, []);

  const clearHighlight = useCallback(() => {
    setHighlightActive(false);
  }, []);

  const goToSection = useCallback(
    (section: BuildCompletenessSection) => {
      setHighlightActive(true);
      // Defer scroll so accordion open / highlight paint can run first.
      requestAnimationFrame(() => {
        scrollToBuilderSection(section);
      });
    },
    [],
  );

  useEffect(() => {
    if (highlightActive && currentResult && currentResult.issues.length === 0) {
      setHighlightActive(false);
    }
  }, [highlightActive, currentResult]);

  const value = useMemo(
    () => ({
      highlightActive,
      issues,
      liveResult,
      liveSteps,
      liveProgress,
      evaluate,
      activateHighlight,
      clearHighlight,
      goToSection,
    }),
    [
      highlightActive,
      issues,
      liveResult,
      liveSteps,
      liveProgress,
      evaluate,
      activateHighlight,
      clearHighlight,
      goToSection,
    ],
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
  const { highlightActive, issues, liveResult } = useBuildCompleteness();
  // Prefer live issues when highlight is off so accordions can still show pending badges.
  const sourceIssues = highlightActive ? issues : liveResult.issues;
  const sectionIssues = sourceIssues.filter((issue) => issue.section === section);
  const matchedIssues = highlightKey
    ? sectionIssues.filter(
        (issue) => !issue.highlightKey || issue.highlightKey === highlightKey,
      )
    : sectionIssues;

  return {
    highlighted: highlightActive && matchedIssues.length > 0,
    hasPending: matchedIssues.length > 0,
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
