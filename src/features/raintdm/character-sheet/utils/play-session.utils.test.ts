import { describe, expect, it } from "vitest";
import {
  parseDiceExpression,
  rollExpression,
} from "@/shared/utils/dice.utils";
import {
  deriveActionLocks,
  exhaustionLevelSummary,
} from "./condition-effects.data";
import { previewRest, applyRest, summarizeRestRecovery } from "./rest.utils";
import { playSessionReducer } from "./play-session-reducer";
import {
  createInitialSession,
  type PlayCharacterCompiled,
} from "./play-character.types";
import { getEncumbrance } from "./encumbrance.utils";
import {
  applyEquipExclusivity,
  getEffectiveArmorClass,
} from "./effective-armor-class";
import { resolveEffectiveRollMode } from "./derive-action-locks";
import type { PlayInventoryItem } from "./play-character.types";

function stubCompiled(
  over: Partial<PlayCharacterCompiled> = {},
): PlayCharacterCompiled {
  return {
    name: "Test",
    species: "Human",
    background: "Soldier",
    className: "Fighter",
    subclass: "",
    level: 5,
    size: "M",
    speedDisplay: "30 ft.",
    speedFt: 30,
    initiativeMod: 2,
    passivePerception: 12,
    proficiencyBonus: 3,
    armorClass: 16,
    hpMax: 40,
    hitDice: [{ die: "d10", max: 5 }],
    abilities: {
      str: { score: 16, mod: 3 },
      dex: { score: 14, mod: 2 },
      con: { score: 14, mod: 2 },
      int: { score: 10, mod: 0 },
      wis: { score: 12, mod: 1 },
      cha: { score: 8, mod: -1 },
    },
    abilityScores: {
      str: 16,
      dex: 14,
      con: 14,
      int: 10,
      wis: 12,
      cha: 8,
    },
    savingThrows: {
      str: 6,
      dex: 2,
      con: 5,
      int: 0,
      wis: 1,
      cha: -1,
    },
    saveProficiencies: ["str", "con"],
    skills: {
      acr: 2,
      ani: 1,
      arc: 0,
      ath: 6,
      dec: -1,
      his: 0,
      ins: 1,
      itm: -1,
      inv: 0,
      med: 1,
      nat: 0,
      prc: 1,
      prf: -1,
      per: -1,
      rel: 0,
      slt: 2,
      ste: 2,
      sur: 1,
    },
    skillProficiencies: { ath: 1 },
    languages: ["Common"],
    weaponProficiencies: [],
    armorProficiencies: [],
    toolProficiencies: [],
    features: [
      {
        id: "second-wind",
        name: "Second Wind",
        sourceKind: "class",
        sourceLabel: "Fighter",
        description: "As a Bonus Action…",
        activation: "bonus",
        bucket: "bonus",
        uses: { max: 1, recovery: "sr" },
      },
      {
        id: "action-surge",
        name: "Action Surge",
        sourceKind: "class",
        sourceLabel: "Fighter",
        description: "…",
        activation: "special",
        bucket: "other",
        uses: { max: 1, recovery: "sr" },
      },
    ],
    attacks: [],
    spellcasting: null,
    resources: [],
    carryingCapacityLb: 240,
    attunementMax: 3,
    rulesEdition: "2024",
    ...over,
  };
}

describe("parseDiceExpression", () => {
  it("parses NdS+mod", () => {
    const p = parseDiceExpression("2d6+3");
    expect(p?.terms).toEqual([{ count: 2, sides: 6 }]);
    expect(p?.modifier).toBe(3);
  });
});

describe("rollExpression", () => {
  it("returns a total for flat modifier", () => {
    const r = rollExpression("0d0+5");
    // may parse oddly — use 1d1
    const r2 = rollExpression("1d1+4");
    expect(r2.total).toBeGreaterThanOrEqual(5);
    expect(r2.total).toBeLessThanOrEqual(5);
    void r;
  });
});

describe("deriveActionLocks", () => {
  it("incapacitated denies actions/bonus/reactions", () => {
    const locks = deriveActionLocks(
      [
        {
          id: "1",
          kind: "condition",
          source: "dnd",
          name: "Incapacitated",
        },
      ],
      0,
      "2024",
    );
    expect(locks.actions).toBe(true);
    expect(locks.bonusActions).toBe(true);
    expect(locks.reactions).toBe(true);
    expect(locks.attacks).toBe(true);
  });

  it("poisoned forces attack disadvantage", () => {
    const locks = deriveActionLocks(
      [
        {
          id: "1",
          kind: "condition",
          source: "dnd",
          name: "Poisoned",
        },
      ],
      0,
      "2024",
    );
    expect(locks.attackDisadvantage).toBe(true);
    expect(locks.actions).toBe(false);
  });

  it("2024 exhaustion scales D20 penalty and speed by level", () => {
    const l1 = deriveActionLocks([], 1, "2024");
    expect(l1.d20TestPenalty).toBe(2);
    expect(l1.speedReductionFt).toBe(5);
    expect(l1.d20TestDisadvantage).toBe(false);

    const l3 = deriveActionLocks([], 3, "2024");
    expect(l3.d20TestPenalty).toBe(6);
    expect(l3.speedReductionFt).toBe(15);

    const l6 = deriveActionLocks([], 6, "2024");
    expect(l6.actions).toBe(true);
    expect(l6.speedZero).toBe(true);
  });
});

describe("exhaustionLevelSummary", () => {
  it("describes each 2024 level", () => {
    expect(exhaustionLevelSummary(0, "2024")).toBeNull();
    expect(exhaustionLevelSummary(1, "2024")).toBe(
      "−2 to D20 Tests; Speed −5 ft.",
    );
    expect(exhaustionLevelSummary(2, "2024")).toBe(
      "−4 to D20 Tests; Speed −10 ft.",
    );
    expect(exhaustionLevelSummary(6, "2024")).toBe("Death.");
  });
});

describe("resolveEffectiveRollMode", () => {
  it("cancels advantage and disadvantage", () => {
    expect(resolveEffectiveRollMode("advantage", true)).toBe("normal");
  });
});

describe("rest + session reducer", () => {
  it("short rest clears SR feature uses", () => {
    const compiled = stubCompiled();
    let session = createInitialSession(compiled);
    session = {
      ...session,
      featureUsesSpent: { "second-wind": 1, "action-surge": 1 },
    };
    const next = applyRest(compiled, session, "short");
    expect(next.featureUsesSpent["second-wind"]).toBeUndefined();
    expect(next.featureUsesSpent["action-surge"]).toBeUndefined();
  });

  it("long rest restores HP and lowers exhaustion", () => {
    const compiled = stubCompiled();
    let session = createInitialSession(compiled);
    session = {
      ...session,
      hp: { current: 5, max: 40, temp: 3 },
      exhaustion: 2,
    };
    const preview = previewRest(compiled, session, "long");
    expect(preview.hpToMax).toBe(true);
    expect(preview.exhaustionDelta).toBe(-1);
    const next = applyRest(compiled, session, "long");
    expect(next.hp.current).toBe(40);
    expect(next.hp.temp).toBe(0);
    expect(next.exhaustion).toBe(1);
  });

  it("summarizeRestRecovery lists HP and exhaustion for long rest", () => {
    const compiled = stubCompiled();
    let session = createInitialSession(compiled);
    session = {
      ...session,
      hp: { current: 5, max: 40, temp: 3 },
      exhaustion: 2,
      featureUsesSpent: { "second-wind": 1 },
    };
    const summary = summarizeRestRecovery(compiled, session, "long");
    expect(summary.label).toBe("Long Rest");
    expect(summary.total).toBe(35);
    expect(summary.detail).toContain("HP 5 → 40");
    expect(summary.detail).toContain("exhaustion 2 → 1");
    expect(summary.detail).toMatch(/features|Second Wind/i);
  });

  it("SET_HP_DELTA heals and damages", () => {
    const compiled = stubCompiled();
    const session = createInitialSession(compiled);
    const damaged = playSessionReducer(compiled, session, {
      type: "SET_HP_DELTA",
      delta: -10,
    });
    expect(damaged.session.hp.current).toBe(30);
    const healed = playSessionReducer(compiled, damaged.session, {
      type: "SET_HP_DELTA",
      delta: 5,
    });
    expect(healed.session.hp.current).toBe(35);
  });
});

describe("encumbrance", () => {
  it("marks over when above capacity", () => {
    const compiled = stubCompiled({ carryingCapacityLb: 10 });
    const session = createInitialSession(compiled);
    session.inventory = [
      {
        id: "1",
        name: "Heavy",
        quantity: 1,
        weightLb: 50,
        equipped: false,
        attuned: false,
        requiresAttunement: false,
      },
    ];
    const enc = getEncumbrance(compiled, session);
    expect(enc.tier).toBe("over");
  });
});

describe("getEffectiveArmorClass", () => {
  function armorItem(
    over: Partial<PlayInventoryItem> = {},
  ): PlayInventoryItem {
    return {
      id: "armor",
      name: "Chain Shirt",
      quantity: 1,
      weightLb: 20,
      equipped: true,
      attuned: false,
      requiresAttunement: false,
      kind: "armor",
      armorAc: 13,
      armorMaxDex: 2,
      ...over,
    };
  }

  function shieldItem(
    over: Partial<PlayInventoryItem> = {},
  ): PlayInventoryItem {
    return {
      id: "shield",
      name: "Shield",
      quantity: 1,
      weightLb: 6,
      equipped: true,
      attuned: false,
      requiresAttunement: false,
      kind: "shield",
      shieldBonus: 2,
      ...over,
    };
  }

  it("uses unarmored floor from compiled when nothing equipped", () => {
    // stubCompiled has AC 16 and DEX +2 → max(16, 12) = 16
    const compiled = stubCompiled();
    const session = createInitialSession(compiled);
    expect(getEffectiveArmorClass(compiled, session)).toBe(16);
  });

  it("applies chain shirt with DEX capped at 2", () => {
    const compiled = stubCompiled({
      armorClass: 10,
      abilityScores: {
        str: 16,
        dex: 18,
        con: 14,
        int: 10,
        wis: 12,
        cha: 8,
      },
      abilities: {
        str: { score: 16, mod: 3 },
        dex: { score: 18, mod: 4 },
        con: { score: 14, mod: 2 },
        int: { score: 10, mod: 0 },
        wis: { score: 12, mod: 1 },
        cha: { score: 8, mod: -1 },
      },
    });
    const session = createInitialSession(compiled);
    session.inventory = [armorItem()];
    // 13 + min(4, 2) = 15
    expect(getEffectiveArmorClass(compiled, session)).toBe(15);
  });

  it("adds shield and acAdjust", () => {
    const compiled = stubCompiled({ armorClass: 10 });
    const session = createInitialSession(compiled);
    session.inventory = [armorItem({ armorAc: 13, armorMaxDex: 2 }), shieldItem()];
    session.acAdjust = 1;
    // 13 + min(2,2) + 2 + 1 = 18
    expect(getEffectiveArmorClass(compiled, session)).toBe(18);
  });

  it("unequips other armor when applying exclusivity", () => {
    const a = armorItem({ id: "a1", name: "Leather", armorAc: 11, armorMaxDex: null });
    const b = armorItem({
      id: "a2",
      name: "Chain Shirt",
      armorAc: 13,
      armorMaxDex: 2,
      equipped: false,
    });
    const next = applyEquipExclusivity([a, b], "a2", true);
    expect(next.find((i) => i.id === "a1")?.equipped).toBe(false);
    expect(next.find((i) => i.id === "a2")?.equipped).toBe(true);
  });
});
