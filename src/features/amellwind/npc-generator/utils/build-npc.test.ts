import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import type { NpcDraft, OptionalFeature } from "@/shared/types";
import { mapSpecies } from "@/features/amellwind/species/mappers/species.mapper";
import { mapBackground } from "@/features/amellwind/backgrounds/mappers/background.mapper";
import { mapWeapon } from "@/features/amellwind/weapons/mappers/weapon.mapper";
import { mapOptionalFeature } from "@/features/amellwind/weapons/mappers/optionalfeature.mapper";
import { getNpcTemplateById } from "../services/npc-generator.service";
import { NPC_TEMPLATES } from "../data/npc-templates.data";
import { buildNpcFromDraft } from "./build-npc";
import { assignAbilitiesFromArray } from "./npc-abilities";
import { rollAverage } from "./npc-attack.utils";
import { getHitDiceOptionsForTier } from "./npc-power-scaling";
import { getNpcHitPoints } from "./npc-stats";
import { toNpcFeatureText } from "./npc-feature-text.utils";

const supplement = JSON.parse(
  readFileSync(
    path.resolve(__dirname, "../../../../../public/data/gtmh-patreon/supplement.json"),
    "utf8",
  ),
) as Record<string, Record<string, unknown>[]>;

const species = [...supplement.race, ...supplement.subrace].map(mapSpecies);
const backgrounds = supplement.background.map(mapBackground);
const weapons = supplement.item.filter((i) => i.type === "HW").map(mapWeapon);
const featuresMap = new Map<string, OptionalFeature>();
for (const raw of supplement.optionalfeature) {
  const feature = mapOptionalFeature(raw);
  if (feature.name) featuresMap.set(feature.name.toLowerCase(), feature);
}
const weaponContext = { weapons, featuresMap };

function draftFor(templateId: string, patch: Partial<NpcDraft> = {}): NpcDraft {
  return {
    customName: "",
    gender: "female",
    templateId,
    speciesId: species[0].id,
    backgroundId: backgrounds[0]?.id ?? "",
    attributeArray: "standard",
    hitDiceCount: 4,
    hitDie: 8,
    hideFeatures: [],
    ...patch,
  };
}

describe("NPC Generator", () => {
  it("uses MM-style averages", () => {
    expect(rollAverage("1d8")).toBe(4);
    expect(rollAverage("2d6")).toBe(7);
    expect(getNpcHitPoints({ str: 10, dex: 10, con: 12, int: 10, wis: 10, cha: 10 }, 2, 8)).toEqual({
      average: 11,
      formula: "2d8 + 2",
    });
    expect(getNpcHitPoints({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }, 3, 6).formula).toBe("3d6");
  });

  it("puts the highest scores in the template's priority abilities", () => {
    const human = species.find((s) => s.name === "Human") ?? species[0];
    const noBonus = { ...human, abilityBonuses: [] };
    const abilities = assignAbilitiesFromArray(
      ["str", "con", "wis", "dex", "int", "cha"],
      [8, 10, 12, 13, 14, 15],
      noBonus,
    );
    expect(abilities).toEqual({ str: 15, con: 14, wis: 13, dex: 12, int: 10, cha: 8 });
  });

  it("rewrites second-person text without inventing words", () => {
    expect(toNpcFeatureText("You can hide yourself.", "Kael")).toBe("Kael can hide itself.");
    expect(
      toNpcFeatureText(
        "When you are falling and aren't incapacitated, you descend slowly. If you hit, you no longer have disadvantage. You can't fly.",
        "the human scout",
      ),
    ).toBe(
      "When the human scout is falling and isn't incapacitated, the human scout descends slowly. If the human scout hits, the human scout no longer has disadvantage. The human scout can't fly.",
    );
    expect(toNpcFeatureText("Attacks against you have advantage.", "Kael")).toBe(
      "Attacks against Kael have advantage.",
    );
  });

  it("builds every template across its hit dice without broken text", () => {
    for (const template of NPC_TEMPLATES) {
      for (const hitDiceCount of getHitDiceOptionsForTier(template.tier)) {
        for (const hitDie of [4, 6, 8, 10, 12, 20] as const) {
          const resolved = getNpcTemplateById(template.id)!;
          const npc = buildNpcFromDraft(
            draftFor(template.id, { hitDiceCount, hitDie, customName: "Kael" }),
            resolved,
            species[0],
            backgrounds[0] ?? null,
            [15, 14, 13, 12, 10, 8],
            weaponContext,
          );
          const text = JSON.stringify(npc);
          const label = `${template.id} ${hitDiceCount}HD d${hitDie}`;
          expect(text, label).not.toMatch(/NaN|undefined|\[object|\(Secondary\) \(Secondary\)|Kaelself|\{@/);
          expect(text, label).not.toMatch(/\bthe guild artillerist\b|\bthe war chanter\b/i);
          expect(npc.hp.average, label).toBeGreaterThan(0);
          expect(npc.armorClass[0].ac, label).toBeGreaterThanOrEqual(10);
          for (const action of npc.actions) {
            expect(action.entries.join(" "), `${label} ${action.name}`).not.toMatch(/range \d+\/\d+,/);
          }
        }
      }
    }
  });

  it("does not stack a template shield with the MH shield", () => {
    const militia = getNpcTemplateById("guild-militia")!;
    const shieldWeapons = weapons.map((w) =>
      w.name === "Sword and Shield"
        ? { ...w, acBonus: 1, includesShield: true, rarityRows: [] }
        : w,
    );
    const build = (context: typeof weaponContext) =>
      buildNpcFromDraft(
        draftFor("guild-militia"),
        militia,
        { ...species[0], traits: [] },
        null,
        [15, 14, 13, 12, 10, 8],
        context,
      ).armorClass[0];

    const plain = build({ weapons: [], featuresMap });
    const withShield = build({ weapons: shieldWeapons, featuresMap });
    expect(plain.ac).toBe(16);
    expect(withShield.ac).toBe(15);
    expect(withShield.from).toEqual(["chain shirt", "+1 MH shield"]);
  });
});
