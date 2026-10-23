import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { Monster, MonstieDraft } from "@/shared/types";
import { mapMonster } from "@/features/amellwind/monsters/mappers/monster.mapper";
import { buildMonstieFromDraft, resolveMonstieChoices } from "./build-monstie";
import { isMonstieEligible } from "./monstie-eligibility";
import { getMonstieHitPoints, resolveExtraAttack } from "./monstie-stats";

const supplement = JSON.parse(
  readFileSync(
    path.resolve(__dirname, "../../../../../public/data/mhmm-patreon-2.0/supplement.json"),
    "utf8",
  ),
) as { monster: unknown[] };

const monsters: Monster[] = supplement.monster.map(mapMonster);

function findMonster(name: string): Monster {
  const monster = monsters.find((m) => m.name === name);
  if (!monster) throw new Error(`Missing ${name}`);
  return monster;
}

function draftFor(base: Monster, patch: Partial<MonstieDraft> = {}): MonstieDraft {
  return {
    customName: "",
    level: 1,
    baseMonsterName: base.name,
    selectedSkills: [],
    baseAttackName: "",
    signatureAttackName: "",
    abilityIncreases: {},
    saveFallbackCondition: "",
    selectedTraits: [],
    selectedCreatureFeatures: [],
    ...patch,
  };
}

function actionText(monstie: Monster, name: string): string {
  const action = monstie.actions.find((a) => a.name.startsWith(name));
  if (!action) throw new Error(`Missing action ${name}`);
  return action.entries.join(" ");
}

describe("Monstie Sidekick builder", () => {
  it("matches the AGMH level 1 Rajang example", () => {
    const rajang = findMonster("Rajang");
    const monstie = buildMonstieFromDraft(
      draftFor(rajang, {
        selectedSkills: ["ath", "prc"],
        baseAttackName: "Fist",
        signatureAttackName: "Lighting Breath (Recharge 5-6)",
      }),
      rajang,
      [],
    );

    expect(monstie.abilities).toEqual({
      str: 15,
      dex: 12,
      con: 14,
      int: 10,
      wis: 13,
      cha: 8,
    });
    expect(monstie.size).toBe("Small");
    expect(monstie.armorClass[0].ac).toBe(13);
    expect(monstie.skills).toEqual({ ath: 4, prc: 3 });
    expect(monstie.passivePerception).toBe(13);
    expect(monstie.savingThrows).toEqual({});
    expect(monstie.damageResistances).toEqual([]);

    expect(actionText(monstie, "Fist")).toBe(
      "Melee Weapon Attack: +4 to hit, reach 5 ft., one target. Hit: 6 (1d8 + 2) bludgeoning damage.",
    );

    const breath = monstie.actions.find((a) => a.name.startsWith("Lighting Breath"));
    expect(breath?.name).toBe("Lighting Breath (2/Long Rest) (Signature)");
    const breathText = breath?.entries.join(" ") ?? "";
    expect(breathText).toContain("30-foot line that is 5 feet wide");
    expect(breathText).toContain("DC 12 Dexterity");
    expect(breathText).toContain("9 (2d8) lightning damage");
  });

  it("maps raw skill names and caps picks by level", () => {
    const rajang = findMonster("Rajang");
    const choices = resolveMonstieChoices(
      draftFor(rajang, { selectedSkills: ["ath", "prc", "ste"] }),
      rajang,
    );
    expect(choices.skillOptions).toEqual(["ath", "prc"]);
    expect(choices.selectedSkills).toEqual(["ath", "prc"]);
  });

  it("drops trait and creature picks when the level goes down", () => {
    const rajang = findMonster("Rajang");
    const choices = resolveMonstieChoices(
      draftFor(rajang, {
        level: 1,
        selectedTraits: ["Standing Leap"],
        selectedCreatureFeatures: ["Kick"],
      }),
      rajang,
    );
    expect(choices.selectedTraits).toEqual([]);
    expect(choices.selectedCreatureFeatures).toEqual([]);
  });

  it("grants saving throws from 7th level and ASI points", () => {
    const rajang = findMonster("Rajang");
    const monstie = buildMonstieFromDraft(
      draftFor(rajang, { level: 8, abilityIncreases: { str: 4, dex: 9 } }),
      rajang,
      [],
    );
    // Two ASIs (4th, 8th) = 4 points, all spent on Strength first.
    expect(monstie.abilities.str).toBe(19);
    expect(monstie.abilities.dex).toBe(12);
    expect(Object.keys(monstie.savingThrows).sort()).toEqual(["dex", "str", "wis"]);
    expect(monstie.savingThrows.str).toBe("+7");
  });

  it("uses Extra Attack within the original multiattack, else extra dice", () => {
    expect(resolveExtraAttack(6, 2)).toEqual({ attacks: 2, extraDice: 0 });
    expect(resolveExtraAttack(15, 2)).toEqual({ attacks: 2, extraDice: 1 });
    expect(resolveExtraAttack(15, 3)).toEqual({ attacks: 3, extraDice: 0 });
    expect(resolveExtraAttack(15, 0)).toEqual({ attacks: 1, extraDice: 2 });
  });

  it("computes hit points with the 15th-level size bonus", () => {
    const abilities = { str: 10, dex: 10, con: 14, int: 10, wis: 10, cha: 10 };
    expect(getMonstieHitPoints(abilities, 1)).toEqual({ average: 12, formula: undefined });
    expect(getMonstieHitPoints(abilities, 15).average).toBe(
      Math.floor(14 * 4.5) + 10 + 15 * 2 + 15,
    );
  });

  it("builds every eligible monster at levels 1, 7 and 20 without broken numbers", () => {
    for (const base of monsters.filter(isMonstieEligible)) {
      for (const level of [1, 7, 20]) {
        const seed = resolveMonstieChoices(draftFor(base, { level }), base);
        const draft = draftFor(base, {
          level,
          selectedSkills: seed.skillOptions,
          baseAttackName: seed.baseAttackOptions[0]?.name ?? "",
          signatureAttackName: seed.signatureOptions[0]?.name ?? "",
          selectedTraits: seed.traitOptions.map((t) => t.name),
        });
        const withCreature = resolveMonstieChoices(draft, base);
        const monstie = buildMonstieFromDraft(
          {
            ...draft,
            selectedCreatureFeatures: withCreature.creatureOptions.map((c) => c.name),
          },
          base,
          [],
        );
        const text = JSON.stringify(monstie);
        expect(text, `${base.name} @${level}`).not.toMatch(/NaN|undefined|\[object/);
        expect(monstie.hp.average, base.name).toBeGreaterThan(0);
      }
    }
  });

  it("excludes elder dragons, tempered versions and templates", () => {
    const names = (pred: (m: Monster) => boolean) =>
      monsters.filter(pred).map((m) => m.name);
    expect(names((m) => isMonstieEligible(m) && /^tempered /i.test(m.name))).toEqual([]);
    expect(isMonstieEligible(findMonster("Shagaru Magala"))).toBe(false);
    expect(isMonstieEligible(findMonster("Guardian Template"))).toBe(false);
    expect(isMonstieEligible(findMonster("Rajang"))).toBe(true);
  });
});
