import { describe, expect, it } from "vitest";
import {
  mapMonster,
  partitionMonsterBonusActions,
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
});
