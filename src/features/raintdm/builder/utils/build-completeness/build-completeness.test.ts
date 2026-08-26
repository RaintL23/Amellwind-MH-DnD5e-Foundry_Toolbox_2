import { describe, expect, it } from "vitest";
import type { Class } from "@/shared/types";
import { AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT } from "../origin-feat.constants";
import type { SpellcastingInfo } from "../../hooks/useSpellcasting";
import { evaluateBuildCompleteness } from "../build-completeness.utils";
import {
  createEmptyCompletenessInput,
  hasIssueId,
} from "./completeness-input.fixture";

function minimalClass(overrides: Partial<Class> = {}): Class {
  return {
    id: "fighter|xphb",
    name: "Fighter",
    source: "XPHB",
    hitDice: 10,
    proficiency: [],
    startingEquipment: [],
    multiclassing: undefined,
    classFeatures: [],
    subclassTitle: "Subclass",
    subclasses: [],
    progression: [],
    casterProgression: undefined,
    ...overrides,
  } as Class;
}

function spellcastingStub(
  overrides: Partial<SpellcastingInfo>,
): SpellcastingInfo {
  return {
    isSpellcaster: true,
    availableSpellLevels: [0, 1],
    cantripCount: 0,
    bonusCantripPools: [],
    maxPreparedOrKnown: 0,
    isPreparedCaster: true,
    spellcastingAbility: "Intelligence",
    sectionLabel: "Spellcasting",
    isPactMagic: false,
    usesUnifiedPactPool: false,
    pactMaxSpellLevel: 0,
    pactSlotCount: 0,
    selectedSpellCount: 0,
    selectedCantripCount: 0,
    classCantripsSelected: 0,
    availableSpellSlotLevels: [1],
    subclassAlwaysPrepared: [],
    subclassBonusKnown: [],
    optionalFeatureGranted: [],
    expandedSpellFilters: [],
    subclassName: null,
    subclassShortName: null,
    spellcastingFromSubclass: false,
    ...overrides,
  };
}

describe("evaluateBuildCompleteness", () => {
  it("reports no issues before the build has started", () => {
    const result = evaluateBuildCompleteness(createEmptyCompletenessInput());
    expect(result.hasStarted).toBe(false);
    expect(result.issues).toEqual([]);
    expect(result.shouldBlockExport).toBe(false);
  });

  it("requires species and background once a class is chosen", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
      }),
    );

    expect(result.hasStarted).toBe(true);
    expect(result.shouldBlockExport).toBe(true);
    expect(hasIssueId(result.issues, "identity-species")).toBe(true);
    expect(hasIssueId(result.issues, "identity-background")).toBe(true);
  });

  it("requires a class when species is set without one", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        species: { id: "human|xphb", name: "Human" },
      }),
    );

    expect(hasIssueId(result.issues, "identity-class")).toBe(true);
  });

  it("requires a subclass when the class progression unlocks one", () => {
    const classData = minimalClass({
      subclassTitle: "Martial Archetype",
      progression: [
        {
          level: 3,
          tableCells: [],
          features: [
            {
              uid: "fighter|martial-archetype|3",
              name: "Martial Archetype",
              displayName: "Martial Archetype",
              level: 3,
              source: "XPHB",
              content: [],
              description: [],
              gainSubclassFeature: true,
            },
          ],
        },
      ],
    });

    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        level: 3,
        classSelection: { id: classData.id, name: classData.name },
        classData,
        species: { id: "human|xphb", name: "Human" },
        background: { id: "soldier|xphb", name: "Soldier" },
        subclass: null,
      }),
    );

    expect(hasIssueId(result.issues, "identity-subclass")).toBe(true);
    expect(
      result.issues.find((issue) => issue.id === "identity-subclass")?.message,
    ).toMatch(/Martial Archetype/i);
  });

  it("requires an origin feat when Amellwind background grants choose-origin", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
        species: { id: "palico|agmh", name: "Palico" },
        background: { id: "hunters-initiate|agmh", name: "Hunter's Initiate" },
        backgroundOriginFeatGrant: AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
        speciesOriginFeat: null,
        backgroundOriginFeat: null,
      }),
    );

    expect(hasIssueId(result.issues, "origin-feat")).toBe(true);
    expect(result.shouldBlockExport).toBe(true);
  });

  it("clears the origin-feat issue once a background origin feat is selected", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
        species: { id: "palico|agmh", name: "Palico" },
        background: { id: "hunters-initiate|agmh", name: "Hunter's Initiate" },
        backgroundOriginFeatGrant: AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
        backgroundOriginFeat: {
          id: "alert|xphb",
          name: "Alert",
          source: "dnd2024",
        },
      }),
    );

    expect(hasIssueId(result.issues, "origin-feat")).toBe(false);
  });

  it("requires ability increase choices for feats like Piercer", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        level: 4,
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "soldier|xphb", name: "Soldier" },
        featSelections: [
          {
            id: "piercer|xphb",
            name: "Piercer",
            source: "dnd2024",
            abilityIncreaseChoices: [{ ability: null, amount: 1 }],
          },
        ],
      }),
    );

    expect(hasIssueId(result.issues, "feat-ability-0")).toBe(true);
  });

  it("clears feat ability increase issue once a score is chosen", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        level: 4,
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "soldier|xphb", name: "Soldier" },
        featSelections: [
          {
            id: "piercer|xphb",
            name: "Piercer",
            source: "dnd2024",
            abilityIncreaseChoices: [{ ability: "str", amount: 1 }],
          },
        ],
      }),
    );

    expect(hasIssueId(result.issues, "feat-ability-0")).toBe(false);
  });

  it("requires missing class cantrips for spellcasters", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "wizard|xphb", name: "Wizard" },
        classData: minimalClass({ id: "wizard|xphb", name: "Wizard" }),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "sage|xphb", name: "Sage" },
        spellcasting: spellcastingStub({
          cantripCount: 3,
          classCantripsSelected: 1,
        }),
      }),
    );

    expect(hasIssueId(result.issues, "spells-cantrips-class")).toBe(true);
  });

  it("does not flag class cantrips when the quota is filled", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "wizard|xphb", name: "Wizard" },
        classData: minimalClass({ id: "wizard|xphb", name: "Wizard" }),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "sage|xphb", name: "Sage" },
        spellcasting: spellcastingStub({
          cantripCount: 3,
          classCantripsSelected: 3,
          selectedCantripCount: 3,
        }),
      }),
    );

    expect(hasIssueId(result.issues, "spells-cantrips-class")).toBe(false);
  });
});
