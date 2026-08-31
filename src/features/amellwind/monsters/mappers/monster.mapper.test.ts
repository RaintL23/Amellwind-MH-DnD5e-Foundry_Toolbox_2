import { describe, expect, it } from "vitest";
import {
  mapMonster,
  partitionMonsterBonusActions,
  partitionMonsterMythicActions,
} from "./monster.mapper";

describe("partitionMonsterBonusActions", () => {
  it("prefers raw.bonus and strips prefixed action duplicates", () => {
    const result = partitionMonsterBonusActions(
      [
        { name: "Bite", entries: ["Melee attack."] },
        {
          name: "Bonus Action: Aggressive",
          entries: ["Moves toward an enemy."],
        },
      ],
      [{ name: "Aggressive", entries: ["Moves toward an enemy."] }],
    );

    expect(result.actions.map((a) => a.name)).toEqual(["Bite"]);
    expect(result.bonusActions).toEqual([
      { name: "Aggressive", entries: ["Moves toward an enemy."] },
    ]);
  });

  it("lifts Bonus Action names from actions when bonus field is empty", () => {
    const result = partitionMonsterBonusActions(
      [
        { name: "Bite", entries: ["Melee."] },
        {
          name: "Bonus Action Nimble Escape",
          entries: ["Dash or Disengage."],
        },
      ],
      [],
    );

    expect(result.actions.map((a) => a.name)).toEqual(["Bite"]);
    expect(result.bonusActions).toEqual([
      { name: "Nimble Escape", entries: ["Dash or Disengage."] },
    ]);
  });
});

describe("partitionMonsterMythicActions", () => {
  it("prefers raw.mythic and strips prefixed legendary duplicates", () => {
    const result = partitionMonsterMythicActions(
      [
        { name: "Fly", entries: ["Flies."] },
        {
          name: "Mythic: Dragon Rush",
          entries: ["Charges forward."],
        },
      ],
      [{ name: "Dragon Rush", entries: ["Charges forward."] }],
    );

    expect(result.legendaryActions.map((a) => a.name)).toEqual(["Fly"]);
    expect(result.mythicActions).toEqual([
      { name: "Dragon Rush", entries: ["Charges forward."] },
    ]);
  });

  it("lifts Mythic-prefixed legendary entries when mythic field is empty", () => {
    const result = partitionMonsterMythicActions(
      [
        { name: "Fly", entries: ["Flies."] },
        {
          name: "Mythic: Fireball",
          entries: ["Boom."],
        },
      ],
      [],
    );

    expect(result.legendaryActions.map((a) => a.name)).toEqual(["Fly"]);
    expect(result.mythicActions).toEqual([
      { name: "Fireball", entries: ["Boom."] },
    ]);
  });
});

describe("mapMonster", () => {
  it("maps bonus into a dedicated section and cleans actions", () => {
    const monster = mapMonster({
      name: "Iodrome",
      source: "MHMM-Patreon-2.0",
      size: "M",
      type: "beast",
      alignment: ["U"],
      ac: [{ ac: 13 }],
      hp: { average: 45, formula: "6d10 + 12" },
      speed: { walk: 40 },
      str: 14,
      dex: 14,
      con: 14,
      int: 4,
      wis: 10,
      cha: 8,
      cr: "1",
      action: [
        { name: "Bite", entries: ["Bite text."] },
        { name: "Poison Spit", entries: ["Spit text."] },
        {
          name: "Bonus Action: Aggressive",
          entries: ["Moves toward an enemy."],
        },
      ],
      bonus: [{ name: "Aggressive", entries: ["Moves toward an enemy."] }],
    });

    expect(monster.actions.map((a) => a.name)).toEqual(["Bite", "Poison Spit"]);
    expect(monster.bonusActions?.map((a) => a.name)).toEqual(["Aggressive"]);
  });

  it("maps mythic into a dedicated section and cleans legendary", () => {
    const monster = mapMonster({
      name: "Tempered Alatreon (MHW)",
      source: "MHMM-Patreon",
      size: "G",
      type: "dragon",
      alignment: ["U"],
      ac: [{ ac: 25 }],
      hp: { average: 546, formula: "28d20 + 252" },
      speed: { walk: 40, fly: 120 },
      str: 30,
      dex: 18,
      con: 28,
      int: 20,
      wis: 22,
      cha: 24,
      cr: "30",
      legendary: [
        { name: "Fly", entries: ["Flies."] },
        { name: "Mythic: Fireball", entries: ["Boom."] },
      ],
      mythic: [{ name: "Fireball", entries: ["Boom."] }],
    });

    expect(monster.legendaryActions?.map((a) => a.name)).toEqual(["Fly"]);
    expect(monster.mythicActions?.map((a) => a.name)).toEqual(["Fireball"]);
  });
});
