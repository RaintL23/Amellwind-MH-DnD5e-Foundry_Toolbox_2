import { describe, expect, it } from "vitest";
import { mapDndFeat } from "@/features/dnd/feats/mappers/dnd-feat.mapper";
import type { AbilityKey, BuilderFeatSelection, Class, DndFeat } from "@/shared/types";
import {
  buildFeatSelectionsForLevel,
  orderAbilityTargets,
  pickFeatSpellListClass,
} from "./feat-randomizer.utils";

const ALL: AbilityKey[] = ["str", "dex", "con", "int", "wis", "cha"];

const asiFeat = mapDndFeat({
  name: "Ability Score Improvement",
  source: "XPHB",
  category: "G",
  prerequisite: [{ level: 4 }],
  ability: [
    { choose: { from: ALL, amount: 2 }, hidden: true },
    { choose: { from: ALL, count: 2 }, hidden: true },
  ],
  entries: ["ASI."],
});

const gwm = mapDndFeat({
  name: "Great Weapon Master",
  source: "XPHB",
  category: "G",
  prerequisite: [{ level: 4, ability: [{ str: 13 }] }],
  ability: [{ str: 1 }],
  entries: ["Heavy weapons."],
});

const sharpshooter = mapDndFeat({
  name: "Sharpshooter",
  source: "XPHB",
  category: "G",
  prerequisite: [{ level: 4, ability: [{ dex: 13 }] }],
  ability: [{ dex: 1 }],
  entries: ["Ranged."],
});

const athlete = mapDndFeat({
  name: "Athlete",
  source: "XPHB",
  category: "G",
  prerequisite: [{ level: 4 }],
  ability: [{ choose: { from: ["str", "dex"] } }],
  entries: ["Climb."],
});

const boon = mapDndFeat({
  name: "Boon of Combat Prowess",
  source: "XPHB",
  category: "EB",
  prerequisite: [{ level: 19 }],
  ability: [{ choose: { from: ALL } }],
  entries: ["Epic."],
});

const POOL: DndFeat[] = [asiFeat, gwm, sharpshooter, athlete, boon];
const fighter = { name: "Fighter" } as Pick<Class, "name">;
const STR_PRIORITY: AbilityKey[] = ["str", "con", "dex", "wis", "int", "cha"];

function finalScores(
  base: Record<AbilityKey, number>,
  picks: (BuilderFeatSelection | null)[],
): Record<AbilityKey, number> {
  const scores = { ...base };
  for (const pick of picks) {
    const asi = pick?.asiChoices;
    if (asi?.mode === "plus2" && asi.plus2) scores[asi.plus2] += 2;
    if (asi?.mode === "plus1plus1") {
      if (asi.plus1a) scores[asi.plus1a] += 1;
      if (asi.plus1b) scores[asi.plus1b] += 1;
    }
    for (const inc of pick?.abilityIncreaseChoices ?? []) {
      if (inc.ability) scores[inc.ability] += inc.amount;
    }
  }
  return scores;
}

const base = { str: 17, dex: 14, con: 14, int: 8, wis: 12, cha: 10 };

describe("buildFeatSelectionsForLevel (stat plan)", () => {
  it("odd primary: takes a half-feat that raises it (signature first)", () => {
    const [first] = buildFeatSelectionsForLevel({
      classData: fighter,
      level: 4,
      feats: POOL,
      rpgbotData: null,
      abilities: base,
      abilityPriority: STR_PRIORITY,
      archetype: "great-weapon",
    });
    expect(first?.name).toBe("Great Weapon Master");
  });

  it("never picks a feat that clashes with the archetype", () => {
    for (let i = 0; i < 20; i++) {
      const picks = buildFeatSelectionsForLevel({
        classData: fighter,
        level: 20,
        feats: POOL,
        rpgbotData: null,
        abilities: base,
        abilityPriority: STR_PRIORITY,
        archetype: "great-weapon",
      });
      expect(picks.some((pick) => pick?.name === "Sharpshooter")).toBe(false);
    }
  });

  it("even primary without signature feats: ASI +2 to the primary", () => {
    const [first] = buildFeatSelectionsForLevel({
      classData: fighter,
      level: 4,
      feats: [asiFeat, athlete],
      rpgbotData: null,
      abilities: { ...base, str: 16 },
      abilityPriority: STR_PRIORITY,
      archetype: "sword-board",
    });
    expect(first?.name).toBe("Ability Score Improvement");
    expect(first?.asiChoices).toEqual({
      mode: "plus2",
      plus2: "str",
      plus1a: null,
      plus1b: null,
    });
  });

  it("reaches 20 in the primary by level 8 and never goes past it", () => {
    const picks = buildFeatSelectionsForLevel({
      classData: fighter,
      level: 16,
      feats: POOL,
      rpgbotData: null,
      abilities: base,
      abilityPriority: STR_PRIORITY,
      archetype: "great-weapon",
    });
    const byLevel8 = finalScores(base, picks.slice(0, 3)); // Fighter slots 4, 6, 8
    expect(byLevel8.str).toBe(20);
    const all = finalScores(base, picks);
    expect(all.str).toBe(20);
    for (const ability of ALL) expect(all[ability]).toBeLessThanOrEqual(20);
  });

  it("takes an Epic Boon at level 19", () => {
    const picks = buildFeatSelectionsForLevel({
      classData: { name: "Wizard" },
      level: 19,
      feats: POOL,
      rpgbotData: null,
      abilities: { ...base, str: 20 },
      abilityPriority: STR_PRIORITY,
      archetype: "great-weapon",
    });
    expect(picks[picks.length - 1]?.name).toBe("Boon of Combat Prowess");
  });
});

describe("orderAbilityTargets", () => {
  it("prefers evening out an odd secondary over an even primary", () => {
    const scores = { str: 18, dex: 13, con: 14, int: 8, wis: 10, cha: 10 };
    expect(orderAbilityTargets(scores, ["str", "dex", "con"])[0]).toBe("dex");
  });

  it("skips abilities at the cap", () => {
    const scores = { str: 20, dex: 14, con: 14, int: 8, wis: 10, cha: 10 };
    expect(orderAbilityTargets(scores, ["str", "con", "dex"])).toEqual(["con", "dex"]);
  });
});

describe("pickFeatSpellListClass (Magic Initiate)", () => {
  const magicInitiate = {
    name: "Magic Initiate",
    additionalSpells: [
      { name: "Cleric Spells" },
      { name: "Druid Spells" },
      { name: "Wizard Spells" },
    ],
  } as DndFeat;

  it("picks a list other than the character's own class", () => {
    for (let i = 0; i < 30; i++) {
      const list = pickFeatSpellListClass(magicInitiate, "Wizard");
      expect(["Cleric", "Druid"]).toContain(list);
    }
  });

  it("returns null for feats with a single (or no) spell list", () => {
    expect(
      pickFeatSpellListClass(
        { ...magicInitiate, additionalSpells: [{ name: "Wizard Spells" }] } as DndFeat,
        "Fighter",
      ),
    ).toBeNull();
    expect(pickFeatSpellListClass(asiFeat, "Fighter")).toBeNull();
  });
});
