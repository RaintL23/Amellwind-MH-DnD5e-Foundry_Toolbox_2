import { describe, expect, it } from "vitest";
import { extractRuneEffectTags } from "../mappers/rune.mapper";
import { buildSpellLevelLookup } from "../utils/spell-level-lookup.utils";
import type { Spell } from "@/shared/types";

function makeSpell(name: string, level: number): Spell {
  return {
    id: name,
    name,
    source: "XPHB",
    level,
    school: "V",
    schoolName: "Evocation",
    castingTime: "1 action",
    range: "Self",
    components: { v: true, s: false },
    duration: "Instantaneous",
    isRitual: false,
    isConcentration: false,
    classNames: [],
    classes: [],
    description: [],
    summary: "",
  };
}

const spellLevels = buildSpellLevelLookup([
  makeSpell("Light", 0),
  makeSpell("Shield", 1),
  makeSpell("Dimension Door", 4),
]);

describe("extractRuneEffectTags — mixed resistance and immunity", () => {
  it("tags both resistance and immunity for resistant-to + condition immunity", () => {
    const tags = extractRuneEffectTags(
      "You are resistant to poison damage and immune to the {@condition poisoned} condition while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:resistance",
        "mechanic:immunity",
        "mechanic:condition",
        "damage:poison",
        "type:defensive",
      ]),
    );
  });

  it("tags resistance for classic resistance-to wording", () => {
    const tags = extractRuneEffectTags(
      "You have resistance to lightning damage, while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:resistance",
        "damage:lightning",
        "type:defensive",
      ]),
    );
  });

  it("tags disease and poison shorthand immunity", () => {
    const tags = extractRuneEffectTags(
      "You are immune to poison and disease while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:immunity",
        "mechanic:disease",
        "damage:poison",
        "type:defensive",
      ]),
    );
  });

  it("tags cantrip casts without spell:lvl tags when looked up", () => {
    const tags = extractRuneEffectTags(
      "While holding this weapon, you can use an action to cast the {@spell light} cantrip from it. Once used, this property can't be used again until the next dawn.",
      spellLevels,
    );

    expect(tags).toContain("mechanic:cantrip");
    expect(tags.some((tag) => tag.startsWith("mechanic:spell:"))).toBe(false);
  });

  it("tags dimension door from the spell catalog as spell:lvl4", () => {
    const tags = extractRuneEffectTags(
      "While you are wearing this armor, you can cast the {@spell dimension door} spell as an action. Once you use this property, you can't use it again until the next dawn.",
      spellLevels,
    );

    expect(tags).toContain("mechanic:spell:lvl4");
    expect(tags).not.toContain("mechanic:spell:lvl1-2");
  });

  it("falls back to spell:lvl1-2 when the spell catalog has no match", () => {
    const tags = extractRuneEffectTags(
      "You can cast {@spell shield} from this weapon (1 rune).",
    );

    expect(tags).toContain("mechanic:spell:lvl1-2");
  });

  it("tags condition immunity without {@condition} markup", () => {
    const tags = extractRuneEffectTags(
      "You are immune to the poisoned condition while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:immunity", "mechanic:condition"]),
    );
  });

  it("tags specific skills from {@skill} markup", () => {
    const tags = extractRuneEffectTags(
      "You gain a +2 bonus on {@skill Insight} checks while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:skill-bonus",
        "mechanic:skill-insight",
      ]),
    );
  });

  it("tags bonus-to skills and multi-word skill names", () => {
    const tags = extractRuneEffectTags(
      "You have a +2 bonus to {@skill Animal Handling} checks while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:skill-bonus",
        "mechanic:skill-animal-handling",
      ]),
    );
  });

  it("tags skills granted via advantage without a numeric bonus", () => {
    const tags = extractRuneEffectTags(
      "You have advantage on Wisdom ({@skill Insight}) checks while you wear this armor.",
    );

    expect(tags).toContain("mechanic:skill-insight");
    expect(tags).not.toContain("mechanic:skill-bonus");
  });

  it("tags specific conditions from {@condition} markup", () => {
    const tags = extractRuneEffectTags(
      "You have advantage on saving throws against being {@condition stunned} while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:condition",
        "mechanic:condition-stunned",
        "mechanic:against-condition",
        "mechanic:advantage",
        "mechanic:saving-throw",
        "type:defensive",
      ]),
    );
  });

  it("tags named condition immunity without markup", () => {
    const tags = extractRuneEffectTags(
      "You are immune to the poisoned condition while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:condition",
        "mechanic:condition-poisoned",
        "mechanic:against-condition",
        "mechanic:immunity",
      ]),
    );
  });

  it("does not tag against-condition when a weapon inflicts a condition", () => {
    const tags = extractRuneEffectTags(
      "On a hit, the target must succeed on a Constitution saving throw or be {@condition stunned} until the end of its next turn.",
    );

    expect(tags).toContain("mechanic:condition-stunned");
    expect(tags).not.toContain("mechanic:against-condition");
  });

  it("tags roll-a-20 weapon effects as critical and offensive", () => {
    const tags = extractRuneEffectTags(
      "When you roll a 20 on your attack roll with this weapon, the target creature catches fire. Until someone takes an action to douse the flames, the creature takes {@damage 1d4} fire damage at the start of each of its turns.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:critical",
        "type:offensive",
        "damage:fire",
      ]),
    );
  });
});
