import { describe, expect, it } from "vitest";
import type { Class, EquippedArmor, Species } from "@/shared/types";
import { AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT } from "../origin-feat.constants";
import type { SpellcastingInfo } from "../../hooks/useSpellcasting";
import { evaluateBuildCompleteness } from "../build-completeness.utils";
import {
  createEmptyCompletenessInput,
  hasIssueId,
} from "./completeness-input.fixture";
import {
  countCompletenessProgress,
  getNextStep,
  groupCompletenessSteps,
} from "./group-completeness-steps.utils";

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

describe("evaluateBuildCompleteness — weapon and feat tool picks", () => {
  it("requires a feat weapon choice before the build is complete", () => {
    const open = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "rogue|xphb", name: "Rogue" },
        classData: minimalClass({ id: "rogue|xphb", name: "Rogue" }),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "soldier|xphb", name: "Soldier" },
        allWeaponGrants: [
          {
            kind: "any",
            count: 1,
            label: "Weapon",
            options: ["Heavy Crossbow"],
            source: { type: "feat", name: "Feat slot 1" },
          },
        ],
      }),
    );
    expect(hasIssueId(open.issues, "weapons-feat-0")).toBe(true);

    const filled = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "rogue|xphb", name: "Rogue" },
        classData: minimalClass({ id: "rogue|xphb", name: "Rogue" }),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "soldier|xphb", name: "Soldier" },
        allWeaponGrants: [
          {
            kind: "any",
            count: 1,
            label: "Weapon",
            options: ["Heavy Crossbow"],
            source: { type: "feat", name: "Feat slot 1" },
          },
        ],
        featWeaponChoices: { 0: ["Heavy Crossbow"] },
      }),
    );
    expect(hasIssueId(filled.issues, "weapons-feat-0")).toBe(false);
  });
});

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

describe("evaluateBuildCompleteness — pick messages", () => {
  it("says how many picks are left and where they come from", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "wizard|xphb", name: "Wizard" },
        classData: minimalClass({ id: "wizard|xphb", name: "Wizard" }),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "sage|xphb", name: "Sage" },
        allLanguageGrants: [
          {
            kind: "any",
            count: 2,
            label: "Language",
            options: ["Elvish", "Dwarvish", "Draconic"],
            source: { type: "background", name: "Sage" },
          },
        ],
        backgroundLanguageChoices: ["Elvish"],
      }),
    );
    expect(
      result.issues.find((issue) => issue.id === "languages-background")
        ?.message,
    ).toBe("Pick 1 language from your Sage background (1/2)");
  });
});

describe("evaluateBuildCompleteness — base ability scores", () => {
  const started = {
    classSelection: { id: "fighter|xphb", name: "Fighter" },
    classData: minimalClass(),
    species: { id: "human|xphb", name: "Human" },
    background: { id: "soldier|xphb", name: "Soldier" },
  };

  it("flags untouched manual scores (new-character 11s)", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput(started),
    );
    expect(hasIssueId(result.issues, "base-abilities")).toBe(true);
  });

  it("flags dice scores still at the post-reset 8s", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        ...started,
        abilityScoreMethod: "dice",
        baseAbilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      }),
    );
    expect(hasIssueId(result.issues, "base-abilities")).toBe(true);
  });

  it("accepts assigned manual scores", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        ...started,
        baseAbilities: { str: 16, dex: 12, con: 14, int: 8, wis: 10, cha: 10 },
      }),
    );
    expect(hasIssueId(result.issues, "base-abilities")).toBe(false);
  });

  it("requires every standard array value to be assigned", () => {
    const partial = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        ...started,
        abilityScoreMethod: "standard",
        baseAbilities: { str: 15, dex: 14, con: 8, int: 8, wis: 8, cha: 8 },
      }),
    );
    expect(hasIssueId(partial.issues, "base-abilities")).toBe(true);

    const full = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        ...started,
        abilityScoreMethod: "standard",
        baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      }),
    );
    expect(hasIssueId(full.issues, "base-abilities")).toBe(false);
  });

  it("requires the full point-buy budget to be spent", () => {
    const unspent = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        ...started,
        abilityScoreMethod: "pointbuy",
        baseAbilities: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
      }),
    );
    expect(
      unspent.issues.find((issue) => issue.id === "base-abilities")?.message,
    ).toMatch(/27/);

    const spent = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        ...started,
        abilityScoreMethod: "pointbuy",
        baseAbilities: { str: 15, dex: 14, con: 13, int: 12, wis: 10, cha: 8 },
      }),
    );
    expect(hasIssueId(spent.issues, "base-abilities")).toBe(false);
  });
});

describe("groupCompletenessSteps", () => {
  it("orders steps class → origin → ability scores", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        species: { id: "human|xphb", name: "Human" },
      }),
    );
    const steps = groupCompletenessSteps(result, { hasClass: false });
    expect(steps.slice(0, 3).map((s) => s.id)).toEqual([
      "class",
      "origin",
      "ability-scores",
    ]);
    expect(steps[0]?.issues.some((i) => i.id === "identity-class")).toBe(true);
  });

  it("keeps species and background under origin once a class is chosen", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
      }),
    );
    const steps = groupCompletenessSteps(result);

    const origin = steps.find((s) => s.id === "origin");
    const classStep = steps.find((s) => s.id === "class");
    expect(origin?.complete).toBe(false);
    expect(origin?.issues.some((i) => i.id === "identity-species")).toBe(true);
    expect(origin?.issues.some((i) => i.id === "identity-background")).toBe(
      true,
    );
    expect(classStep?.complete).toBe(true);
  });

  it("locks class-dependent steps instead of marking them complete", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        species: { id: "human|xphb", name: "Human" },
      }),
    );
    const steps = groupCompletenessSteps(result, { hasClass: false });
    const equipment = steps.find((s) => s.id === "equipment");
    expect(equipment?.status).toBe("locked");
    expect(equipment?.complete).toBe(false);
    expect(countCompletenessProgress(steps).completed).toBe(0);
  });

  it("files origin feats under origin and level feats under feats", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        level: 4,
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
        species: { id: "palico|agmh", name: "Palico" },
        background: { id: "hunters-initiate|agmh", name: "Hunter's Initiate" },
        backgroundOriginFeatGrant: AMELLWIND_BACKGROUND_ORIGIN_FEAT_GRANT,
      }),
    );
    const steps = groupCompletenessSteps(result, { hasFeatSlots: true });
    const origin = steps.find((s) => s.id === "origin");
    const feats = steps.find((s) => s.id === "feats");
    expect(origin?.issues.some((i) => i.id === "origin-feat")).toBe(true);
    expect(feats?.issues.some((i) => i.id === "feat-slot-0")).toBe(true);
  });

  it("omits spells step when not a caster and no spell issues", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "soldier|xphb", name: "Soldier" },
      }),
    );
    const steps = groupCompletenessSteps(result, { isSpellcaster: false });
    expect(steps.some((s) => s.id === "spells")).toBe(false);
  });

  it("includes spells step for casters even with no spell issues yet", () => {
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
    const steps = groupCompletenessSteps(result, { isSpellcaster: true });
    expect(steps.some((s) => s.id === "spells")).toBe(true);
    const progress = countCompletenessProgress(steps);
    expect(progress.total).toBeGreaterThan(0);
    expect(progress.completed).toBeLessThanOrEqual(progress.total);
  });
});

describe("getNextStep", () => {
  it("points at the class first", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        species: { id: "human|xphb", name: "Human" },
      }),
    );
    const next = getNextStep(groupCompletenessSteps(result, { hasClass: false }));
    expect(next?.step.id).toBe("class");
    expect(next?.position).toBe(1);
    expect(next?.issue.slot).toBe("class");
  });

  it("moves on to ability scores once class and origin are done", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "soldier|xphb", name: "Soldier" },
      }),
    );
    const next = getNextStep(groupCompletenessSteps(result));
    expect(next?.step.id).toBe("ability-scores");
    expect(next?.issue.id).toBe("base-abilities");
  });

  it("returns null when every step is complete", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        classSelection: { id: "fighter|xphb", name: "Fighter" },
        classData: minimalClass(),
        species: { id: "human|xphb", name: "Human" },
        background: { id: "soldier|xphb", name: "Soldier" },
        baseAbilities: { str: 15, dex: 13, con: 14, int: 8, wis: 12, cha: 10 },
      }),
    );
    expect(getNextStep(groupCompletenessSteps(result))).toBeNull();
  });
});

describe("evaluateBuildCompleteness — Amellwind species and gear", () => {
  const speciesWithChoice = {
    name: "Dragonborn (Alatreon)",
    abilityBonuses: [
      { kind: "fixed", bonuses: { str: 2 } },
      { kind: "choose", from: ["int", "wis", "cha"], amount: 1 },
    ],
    traits: [],
  } as unknown as Species;

  it("does not require species ASI picks while Tasha's origin is used", () => {
    const base = {
      species: { id: "dragonborn|phb", name: "Elder Dragonborn" },
      speciesData: speciesWithChoice,
    };
    const withoutTasha = evaluateBuildCompleteness(
      createEmptyCompletenessInput(base),
    );
    expect(hasIssueId(withoutTasha.issues, "species-asi-0")).toBe(true);

    const withTasha = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        ...base,
        useTashaOrigin: true,
        tashaPlus2: "str",
        tashaPlus1: "con",
      }),
    );
    expect(hasIssueId(withTasha.issues, "species-asi-0")).toBe(false);
  });

  it("asks for a subspecies when the species requires one", () => {
    const result = evaluateBuildCompleteness(
      createEmptyCompletenessInput({
        species: { id: "lynian|agmh", name: "Lynian" },
        speciesSubraceMissing: true,
      }),
    );
    expect(hasIssueId(result.issues, "identity-subspecies")).toBe(true);
  });

  it("requires a property for each Rare+ armor step in Amellwind mode", () => {
    const armor: EquippedArmor = {
      armor: { name: "Chain Mail", category: "heavy", baseAC: 16 } as EquippedArmor["armor"],
      rarity: "Very Rare",
      runeSlots: 4,
      runes: [],
      rarityProperties: [{ kind: "ac" }, null],
    };
    const amellwind = evaluateBuildCompleteness(
      createEmptyCompletenessInput({ armor, useAmellwindHomebrew: true }),
    );
    expect(hasIssueId(amellwind.issues, "armor-rarity-property-0")).toBe(false);
    expect(hasIssueId(amellwind.issues, "armor-rarity-property-1")).toBe(true);

    const dnd = evaluateBuildCompleteness(
      createEmptyCompletenessInput({ armor, useAmellwindHomebrew: false }),
    );
    expect(hasIssueId(dnd.issues, "armor-rarity-property-1")).toBe(false);
  });
});
