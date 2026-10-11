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
  getNextStep,
  groupCompletenessSteps,
  type CompletenessStep,
  type NextCompletenessStep,
} from "../utils/build-completeness/group-completeness-steps.utils";
import { getFeatSlotLevels } from "../utils/builder-class.utils";
import { persistBuilderExportGate } from "../storage/builder-export-gate.storage";
import { useBuilderSlotSelection } from "../hooks/useBuilderSlotSelection";
import {
  SECTION_TO_MOBILE_TAB,
  useBuilderLayoutOptional,
} from "./BuilderLayoutContext";

interface BuildCompletenessContextValue {
  highlightActive: boolean;
  issues: BuildCompletenessIssue[];
  /** Live completeness result (deferred) for the progress checklist. */
  liveResult: BuildCompletenessResult;
  liveSteps: CompletenessStep[];
  liveProgress: { completed: number; total: number; percent: number };
  /** First pending step in canonical order (null when done or not started). */
  nextStep: NextCompletenessStep | null;
  evaluate: () => BuildCompletenessResult;
  activateHighlight: () => void;
  clearHighlight: () => void;
  /** Scroll to a builder section and optionally activate highlight. */
  goToSection: (section: BuildCompletenessSection) => void;
  /** Highlight, open the issue's slot editor and scroll to its section. */
  goToIssue: (issue: BuildCompletenessIssue) => void;
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
  const layout = useBuilderLayoutOptional();
  const isMobileLayout = layout?.isMobileLayout ?? false;
  const setActiveTab = layout?.setActiveTab;
  const { selectSlot } = useBuilderSlotSelection();

  const input = useMemo(
    (): BuildCompletenessInput => ({
      species: builder.species,
      background: builder.background,
      classSelection: builder.class,
      subclass: builder.subclass,
      level: builder.character.level,
      abilityScoreMethod: builder.abilityScoreMethod,
      baseAbilities: builder.character.abilities,
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
      allWeaponGrants: builder.allWeaponGrants,
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
      speciesWeaponChoices: builder.speciesWeaponChoices,
      classWeaponChoices: builder.classWeaponChoices,
      featWeaponChoices: builder.featWeaponChoices,
      featToolChoices: builder.featToolChoices,
      classLanguageChoices: builder.classLanguageChoices,
      backgroundLanguageChoices: builder.backgroundLanguageChoices,
      speciesLanguageChoices: builder.speciesLanguageChoices,
      speciesDefenseChoices: builder.speciesDefenseChoices,
      speciesAbilityChoices: builder.speciesAbilityChoices,
      speciesTraitChoices: builder.speciesTraitChoices ?? {},
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

  const deferredClassName = deferredInput.classSelection?.name ?? null;
  const hasFeatSlots =
    deferredInput.featSelections.length > 0 ||
    (deferredClassName !== null &&
      getFeatSlotLevels(deferredClassName, deferredInput.level).length > 0);

  const liveSteps = useMemo(
    () =>
      groupCompletenessSteps(liveResult, {
        isSpellcaster: spellcasting?.isSpellcaster ?? false,
        hasClass: deferredClassName !== null,
        hasFeatSlots,
      }),
    [liveResult, spellcasting?.isSpellcaster, deferredClassName, hasFeatSlots],
  );

  const liveProgress = useMemo(
    () => countCompletenessProgress(liveSteps),
    [liveSteps],
  );

  const nextStep = useMemo(() => getNextStep(liveSteps), [liveSteps]);

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
      if (isMobileLayout && setActiveTab) {
        // Mobile: reveal the owning tab, then wait one extra frame for it to mount.
        setActiveTab(SECTION_TO_MOBILE_TAB[section]);
        requestAnimationFrame(() =>
          requestAnimationFrame(() => scrollToBuilderSection(section)),
        );
        return;
      }
      // Defer scroll so accordion open / highlight paint can run first.
      requestAnimationFrame(() => {
        scrollToBuilderSection(section);
      });
    },
    [isMobileLayout, setActiveTab],
  );

  const goToIssue = useCallback(
    (issue: BuildCompletenessIssue) => {
      if (issue.slot) selectSlot(issue.slot);
      goToSection(issue.section);
    },
    [selectSlot, goToSection],
  );

  useEffect(() => {
    if (highlightActive && currentResult && currentResult.issues.length === 0) {
      setHighlightActive(false);
    }
  }, [highlightActive, currentResult]);

  // Non-deferred gate so Character Sheet "Load from Builder" matches export rules.
  useEffect(() => {
    const result = evaluateBuildCompleteness(input);
    persistBuilderExportGate({
      hasStarted: result.hasStarted,
      shouldBlockExport: result.shouldBlockExport,
      issueCount: result.issues.length,
    });
  }, [input]);

  const value = useMemo(
    () => ({
      highlightActive,
      issues,
      liveResult,
      liveSteps,
      liveProgress,
      nextStep,
      evaluate,
      activateHighlight,
      clearHighlight,
      goToSection,
      goToIssue,
    }),
    [
      highlightActive,
      issues,
      liveResult,
      liveSteps,
      liveProgress,
      nextStep,
      evaluate,
      activateHighlight,
      clearHighlight,
      goToSection,
      goToIssue,
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
  const { highlightActive, issues, nextStep } = useBuildCompleteness();
  const matchedIssues = issues.filter(
    (issue) => issue.highlightKey === highlightKey,
  );
  const highlighted = highlightActive && matchedIssues.length > 0;

  return {
    highlighted,
    // Guide the user to the next slot-driven choice before any export attempt.
    isNext:
      !highlighted &&
      !!nextStep?.issue.slot &&
      nextStep.issue.highlightKey === highlightKey,
    issues: matchedIssues,
  };
}
