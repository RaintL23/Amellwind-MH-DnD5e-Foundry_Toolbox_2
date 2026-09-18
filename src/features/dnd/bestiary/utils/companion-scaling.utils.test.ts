import { describe, expect, it } from "vitest";
import {
  applyCompanionScaling,
  deriveCompanionStats,
  detectCompanionScaling,
  resolveAcSpecial,
  resolveHpSpecial,
  resolvePbBonusExpression,
} from "./companion-scaling.utils";
import type { BestiaryCreature } from "@/shared/types/bestiary-creature.types";

function baseCreature(
  overrides: Partial<BestiaryCreature> = {},
): BestiaryCreature {
  return {
    id: "Drake%20Companion_FTD",
    name: "Drake Companion",
    source: "FTD",
    size: "Small",
    type: { type: "dragon" },
    alignment: ["U"],
    armorClass: [{ ac: 0, special: "14 + PB (natural armor)" }],
    hp: {
      special:
        "5 + five times your ranger level (the drake has a number of Hit Dice [d10s] equal to your ranger level)",
    },
    speed: { walk: 40 },
    initiative: 1,
    proficiencyBonus: 2,
    pbNote: "equals your bonus",
    abilities: { str: 16, dex: 12, con: 15, int: 8, wis: 14, cha: 8 },
    savingThrows: { dex: "+1 + PB", wis: "+2 + PB" },
    skills: {},
    passivePerception: 12,
    senses: {},
    damageImmunities: [],
    damageResistances: [],
    damageVulnerabilities: [],
    conditionImmunities: [],
    languages: ["Draconic"],
    traits: [],
    actions: [
      {
        name: "Bite",
        entries: [
          "{@atk mw} {@hit 3} plus PB to hit, reach 5 ft., one target. {@h} {@damage 1d6} plus PB piercing damage.",
        ],
        content: [
          {
            type: "paragraph",
            text: "{@atk mw} {@hit 3} plus PB to hit, reach 5 ft., one target. {@h} {@damage 1d6} plus PB piercing damage.",
          },
        ],
      },
    ],
    reactions: [],
    cr: "0",
    crDisplay: "0",
    ...overrides,
  };
}

describe("companion scaling formulas", () => {
  it("resolves AC special with PB", () => {
    expect(resolveAcSpecial("14 + PB (natural armor)", 3)).toEqual({
      value: 17,
      label: "17 (natural armor)",
    });
  });

  it("resolves AC special with ability modifier", () => {
    expect(
      resolveAcSpecial("13 + your Charisma modifier", 2, 3),
    ).toEqual({ value: 16, label: "16" });
    expect(
      resolveAcSpecial("13 plus your Wisdom modifier", 2, 4),
    ).toEqual({ value: 17, label: "17" });
  });

  it("resolves HP special with owner level", () => {
    expect(
      resolveHpSpecial(
        "5 + five times your ranger level (the beast has Hit Dice)",
        5,
      ),
    ).toEqual({
      average: 30,
      label: "30 (the beast has Hit Dice)",
    });
  });

  it("resolves save expressions with PB", () => {
    expect(resolvePbBonusExpression("+1 + PB", 4)).toBe("+5");
    expect(resolvePbBonusExpression("PB", 3)).toBe("+3");
  });
});

describe("deriveCompanionStats", () => {
  it("derives modifier and spell attack from ability score + level", () => {
    expect(
      deriveCompanionStats({ ownerLevel: 5, abilityScore: 16 }),
    ).toEqual({
      proficiencyBonus: 3,
      abilityModifier: 3,
      spellAttackBonus: 6,
      spellSaveDc: 14,
    });
  });
});

describe("detectCompanionScaling", () => {
  it("flags pbNote companions and class/ability hints", () => {
    const detection = detectCompanionScaling(baseCreature());
    expect(detection.isScaled).toBe(true);
    expect(detection.needsOwnerLevel).toBe(true);
    expect(detection.ownerClassHint).toBe("ranger");
    expect(detection.abilityHint).toBe("wis");
    expect(detection.abilityLabel).toBe("Wisdom");
  });

  it("detects Charisma from prose", () => {
    const detection = detectCompanionScaling(
      baseCreature({
        armorClass: [{ ac: 0, special: "13 + your Charisma modifier" }],
        hp: { average: 10 },
        pbNote: "equals your bonus",
        actions: [
          {
            name: "Strike",
            entries: [
              "Bonus equals your spell attack modifier. Hit: plus your Charisma modifier.",
            ],
          },
        ],
      }),
    );
    expect(detection.abilityHint).toBe("cha");
    expect(detection.needsSpellAttack).toBe(true);
    expect(detection.needsAbilityModifier).toBe(true);
  });
});

describe("applyCompanionScaling", () => {
  it("fills AC, HP, saves, and action PB for a ranger companion", () => {
    const scaled = applyCompanionScaling(baseCreature(), {
      ownerLevel: 5,
    });
    expect(scaled.proficiencyBonus).toBe(3);
    expect(scaled.armorClass[0]?.ac).toBe(17);
    expect(scaled.armorClass[0]?.special).toBeUndefined();
    expect(scaled.hp.average).toBe(30);
    expect(scaled.savingThrows.dex).toBe("+4");
    expect(scaled.actions[0]?.content?.[0]).toMatchObject({
      type: "paragraph",
      text: expect.stringContaining("plus 3"),
    });
  });

  it("auto-calcs spell attack and ability mod from ability score", () => {
    const scaled = applyCompanionScaling(
      baseCreature({
        armorClass: [{ ac: 0, special: "13 + your Charisma modifier" }],
        actions: [
          {
            name: "Strike",
            entries: [],
            content: [
              {
                type: "paragraph",
                text: "{@hitYourSpellAttack} to hit. Damage equals your Charisma modifier.",
              },
            ],
          },
        ],
      }),
      {
        ownerLevel: 5,
        abilityScore: 16,
      },
    );
    expect(scaled.armorClass[0]?.ac).toBe(16);
    const text =
      scaled.actions[0]?.content?.[0]?.type === "paragraph"
        ? scaled.actions[0].content[0].text
        : "";
    expect(text).toContain("{@hit 6}");
    expect(text).toContain("+3");
    expect(text.toLowerCase()).not.toContain("charisma modifier");
  });
});
