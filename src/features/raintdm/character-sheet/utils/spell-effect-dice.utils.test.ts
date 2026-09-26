import { describe, expect, it } from "vitest";
import type { PlaySpell } from "./play-character.types";
import {
  combineDice,
  resolveSpellEffectRoll,
} from "./spell-effect-dice.utils";

function spell(partial: Partial<PlaySpell> & Pick<PlaySpell, "name">): PlaySpell {
  return {
    id: "test",
    level: 1,
    isConcentration: false,
    isRitual: false,
    bucket: "action",
    ...partial,
  };
}

describe("combineDice", () => {
  it("adds same-sided dice", () => {
    expect(combineDice("1d4", "1d4", 1)).toBe("2d4");
    expect(combineDice("8d6", "1d6", 2)).toBe("10d6");
  });

  it("no-ops when times is 0", () => {
    expect(combineDice("1d4", "1d4", 0)).toBe("1d4");
  });
});

describe("resolveSpellEffectRoll", () => {
  it("resolves Healing Word with spell mod and upcast", () => {
    const s = spell({
      name: "Healing Word",
      level: 1,
      bucket: "bonus",
      description:
        "A creature of your choice that you can see within range regains hit points equal to 1d4 + your spellcasting ability modifier. This spell has no effect on undead or constructs.",
      higherLevel:
        "When you cast this spell using a spell slot of 2nd level or higher, the healing increases by 1d4 for each slot level above 1st.",
    });

    const base = resolveSpellEffectRoll(s, {
      slotLevel: 1,
      spellMod: 3,
      characterLevel: 5,
    });
    expect(base).toEqual({
      expression: "1d4+3",
      kind: "heal",
      label: "Heal",
    });

    const up = resolveSpellEffectRoll(s, {
      slotLevel: 2,
      spellMod: 3,
      characterLevel: 5,
    });
    expect(up?.expression).toBe("2d4+3");
  });

  it("resolves 2024 Healing Word (2d4 base)", () => {
    const s = spell({
      name: "Healing Word",
      level: 1,
      bucket: "bonus",
      description:
        "A creature of your choice that you can see within range regains Hit Points equal to 2d4 plus your spellcasting ability modifier.",
      higherLevel:
        "The healing increases by 2d4 for each spell slot level above 1.",
    });
    expect(
      resolveSpellEffectRoll(s, {
        slotLevel: 3,
        spellMod: 4,
        characterLevel: 5,
      })?.expression,
    ).toBe("6d4+4");
  });

  it("resolves Fireball damage with upcast", () => {
    const s = spell({
      name: "Fireball",
      level: 3,
      description:
        "Each creature in a 20-foot-radius sphere centered on that point must make a Dexterity saving throw. A target takes 8d6 fire damage on a failed save, or half as much damage on a successful one.",
      higherLevel:
        "When you cast this spell using a spell slot of 4th level or higher, the damage increases by 1d6 for each slot level above 3rd.",
    });
    expect(
      resolveSpellEffectRoll(s, {
        slotLevel: 5,
        spellMod: 4,
        characterLevel: 9,
      }),
    ).toEqual({
      expression: "10d6",
      kind: "damage",
      label: "Damage",
    });
  });

  it("does not treat Bless buff dice as a cast-time effect", () => {
    const s = spell({
      name: "Bless",
      description:
        "You bless up to three creatures of your choice within range. Whenever a target makes an attack roll or a saving throw before the spell ends, the target can roll a d4 and add the number rolled to the attack roll or saving throw.",
      higherLevel:
        "When you cast this spell using a spell slot of 2nd level or higher, you can target one additional creature for each slot level above 1st.",
    });
    expect(
      resolveSpellEffectRoll(s, {
        slotLevel: 1,
        spellMod: 3,
        characterLevel: 5,
      }),
    ).toBeNull();
  });

  it("scales cantrip damage by character level", () => {
    const s = spell({
      name: "Sacred Flame",
      level: 0,
      description:
        "Flame-like radiance descends on a creature that you can see within range. The target must succeed on a Dexterity saving throw or take 1d8 radiant damage. The target gains no benefit from cover for this saving throw. The spell's damage increases by 1d8 when you reach 5th level (2d8), 11th level (3d8), and 17th level (4d8).",
    });
    expect(
      resolveSpellEffectRoll(s, {
        slotLevel: 0,
        spellMod: 3,
        characterLevel: 4,
      })?.expression,
    ).toBe("1d8");
    expect(
      resolveSpellEffectRoll(s, {
        slotLevel: 0,
        spellMod: 3,
        characterLevel: 5,
      })?.expression,
    ).toBe("2d8");
    expect(
      resolveSpellEffectRoll(s, {
        slotLevel: 0,
        spellMod: 3,
        characterLevel: 17,
      })?.expression,
    ).toBe("4d8");
  });

  it("includes flat bonus for Magic Missile darts", () => {
    const s = spell({
      name: "Magic Missile",
      description:
        "You create three glowing darts of magical force. Each dart hits a creature of your choice that you can see within range. A dart deals 1d4 + 1 force damage to its target.",
      higherLevel:
        "When you cast this spell using a spell slot of 2nd level or higher, the spell creates one more dart for each slot level above 1st.",
    });
    expect(
      resolveSpellEffectRoll(s, {
        slotLevel: 1,
        spellMod: 3,
        characterLevel: 5,
      })?.expression,
    ).toBe("1d4+1");
  });
});
