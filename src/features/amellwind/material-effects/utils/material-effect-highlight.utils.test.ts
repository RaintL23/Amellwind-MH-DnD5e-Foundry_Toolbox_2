import { describe, expect, it } from "vitest";
import type { MaterialEffect } from "@/shared/types";
import {
  buildMaterialEffectNameIndex,
  extractLeadingMaterialEffectName,
  getMaterialEffectTierForText,
  getMaterialEffectTiersForRune,
  runeMatchesMaterialEffectTierFilter,
  supplementIndexWithRuneEffectNames,
  splitMaterialEffectRefs,
  splitRuneEffectDisplayLines,
  findMatchingMaterialEffectNames,
} from "./material-effect-highlight.utils";
import { extractRuneEffectTags } from "@/features/amellwind/runes/mappers/tags/rune-effect-tags";
import type { Rune } from "@/shared/types";

function makeEffect(
  partial: Pick<MaterialEffect, "id" | "name" | "slot" | "rarity">,
): MaterialEffect {
  return {
    effect: "Catalog effect",
    summary: "Catalog effect",
    isReference: false,
    ...partial,
  };
}

function makeRune(partial: Partial<Rune> & Pick<Rune, "name">): Rune {
  return {
    monsterName: "Test Monster",
    monsterSource: "GTMH",
    monsterCr: "5",
    monsterCrs: ["5"],
    tier: 2,
    carveChance: "1-10",
    captureChance: "-",
    rolls: 3,
    slots: ["A", "W"],
    armorEffect: null,
    weaponEffect: null,
    otherEffect: null,
    tags: [],
    weaponTags: [],
    armorTags: [],
    ...partial,
  };
}

const emptyIndex = buildMaterialEffectNameIndex([]);

describe("splitRuneEffectDisplayLines", () => {
  const hirabamiWebbingArmor =
    "Honey Hunter+. Once per day, when you use an herbalist kit to gather plants, you gather 1d4 honey with it. Freezer Sac (Spellcaster Only) This armor has two runes that it regains daily at dawn. As an action you can expend one of these runes to coat your armor in magical ice, gaining 10 temporary hit points. If a creature hits you with a melee attack while you have these hit points, the creature takes 10 cold damage.";

  it("splits bundled named material effects on one line", () => {
    const lines = splitRuneEffectDisplayLines(hirabamiWebbingArmor);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatch(/^Honey Hunter\+\./);
    expect(lines[1]).toMatch(/^Freezer Sac \(Spellcaster Only\)/);
  });

  it("preserves explicit newline breaks", () => {
    expect(splitRuneEffectDisplayLines("Line one\nLine two")).toEqual([
      "Line one",
      "Line two",
    ]);
  });

  it("leaves single-effect text unchanged", () => {
    const text =
      "Expert Fisherman. When you catch fish, you instead catch two.";
    expect(splitRuneEffectDisplayLines(text)).toEqual([text]);
  });
});

describe("extractLeadingMaterialEffectName", () => {
  it("extracts short titled effects", () => {
    expect(
      extractLeadingMaterialEffectName(
        "Sovereign Wrath. You gain advantage on attack rolls.",
      ),
    ).toBe("Sovereign Wrath");
  });

  it("does not treat action sentences as material effect titles", () => {
    const text =
      "(Insect Glaive only) As an action you can hurl this weapon and speak this weapon's command word, it transforms into a bolt of lightning, forming a line 5 feet wide that extends out from you to a target within 120 feet. Each creature in the line excluding you and the target must make a DC 13 Dexterity saving throw.";
    expect(extractLeadingMaterialEffectName(text)).toBeNull();
  });

  it("strips leading restrictions before reading a real title", () => {
    expect(
      extractLeadingMaterialEffectName(
        "(Insect Glaive only) Thunder Lash. Your weapon deals an extra 1d6 lightning damage.",
      ),
    ).toBe("Thunder Lash");
  });
});

describe("material effect highlight — sentence false positives", () => {
  it("does not highlight an entire action paragraph as a discovered effect name", () => {
    const text =
      "(Insect Glaive only) As an action you can hurl this weapon and speak this weapon's command word, it transforms into a bolt of lightning, forming a line 5 feet wide that extends out from you to a target within 120 feet. Each creature in the line excluding you and the target must make a DC 13 Dexterity saving throw.";
    const rune = makeRune({
      name: "Test Scale",
      slots: ["W"],
      weaponEffect: text,
    });
    const index = supplementIndexWithRuneEffectNames(emptyIndex, [rune]);
    const candidates = findMatchingMaterialEffectNames(text, index.all);
    const segments = splitMaterialEffectRefs(text, candidates, index.byKey, "weapon");
    expect(segments.every((segment) => !segment.isMaterialEffect)).toBe(true);
  });
});

describe("getMaterialEffectTierForText — inline defenses", () => {
  it("assigns Rare to unnamed resistance text", () => {
    expect(
      getMaterialEffectTierForText(
        "You have resistance to lightning damage, while you wear this armor.",
        "armor",
        emptyIndex,
      ),
    ).toBe("Rare");
  });

  it("assigns Very Rare to unnamed immunity text", () => {
    expect(
      getMaterialEffectTierForText(
        "You are immune to fire damage while you wear this armor.",
        "armor",
        emptyIndex,
      ),
    ).toBe("Very Rare");
  });

  it("prefers a named catalog rarity over the inline defense fallback", () => {
    const index = buildMaterialEffectNameIndex([
      makeEffect({
        id: "armor-Common-ember-ward",
        name: "Ember Ward",
        slot: "armor",
        rarity: "Common",
      }),
    ]);

    expect(
      getMaterialEffectTierForText(
        "Ember Ward. You are immune to fire damage while you wear this armor.",
        "armor",
        index,
      ),
    ).toBe("Common");
  });
});

describe("getMaterialEffectTierForText — inline extra damage", () => {
  it("assigns Rare to unnamed 2d6 weapon extra damage", () => {
    expect(
      getMaterialEffectTierForText(
        "Your weapon deals an extra {@damage 2d6} necrotic damage.",
        "weapon",
        emptyIndex,
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon to unnamed 1d6 weapon extra damage", () => {
    expect(
      getMaterialEffectTierForText(
        "Your weapon deals an extra {@damage 1d6} lightning damage.",
        "weapon",
        emptyIndex,
      ),
    ).toBe("Uncommon");
  });

  it("assigns Very Rare to limited-use average-dice AoE (Zorah Magdaros)", () => {
    expect(
      getMaterialEffectTierForText(
        "(Melee Weapon Only) When you hit a creature with this weapon, it must succeed on a DC 17 Strength saving throw or be pushed back 10 feet. If the saving throw fails by 5 or more, it is also knocked prone. Additionally, when a creature fails its saving throw, you can speak the weapon's command word to create a wave of molten rock that erupts from the ground in a 30-foot cone in front you, dealing 22 (4d10) fire damage to each creature in the area. Once you use this property, you can't use it again until you finish a long rest.",
        "weapon",
        emptyIndex,
      ),
    ).toBe("Very Rare");
  });
});

describe("getMaterialEffectTierForText — spell tags when Unknown", () => {
  it("assigns Rare to dimension door (lvl4) when no other rarity applies", () => {
    expect(
      getMaterialEffectTierForText(
        "While you are wearing this armor, you can cast the {@spell dimension door} spell as an action.",
        "armor",
        emptyIndex,
        ["mechanic:spell:lvl4"],
      ),
    ).toBe("Rare");
  });

  it("assigns Common to cantrip casts", () => {
    expect(
      getMaterialEffectTierForText(
        "While holding this weapon, you can use an action to cast the {@spell light} cantrip from it.",
        "weapon",
        emptyIndex,
        ["mechanic:cantrip"],
      ),
    ).toBe("Common");
  });

  it("assigns Common to 1st-level plain cast tags", () => {
    expect(
      getMaterialEffectTierForText(
        "While attuned to this weapon you can cast the Earth Tremor spell once per long rest.",
        "weapon",
        emptyIndex,
        ["mechanic:spell:lvl1", "mechanic:spell:one-use"],
      ),
    ).toBe("Common");
  });

  it("does not override an inline defense rarity with spell tags", () => {
    expect(
      getMaterialEffectTierForText(
        "You have resistance to fire damage while you wear this armor. You can cast {@spell dimension door}.",
        "armor",
        emptyIndex,
        ["mechanic:resistance", "damage:fire", "mechanic:spell:lvl4"],
      ),
    ).toBe("Rare");
  });

  it("assigns Rare to 4th-level spell-slot recovery", () => {
    expect(
      getMaterialEffectTierForText(
        "You can use an action to speak this armor's command word and regain one expended spell slot of up to 4th level.",
        "armor",
        emptyIndex,
        ["mechanic:spell-slot:lvl4"],
      ),
    ).toBe("Rare");
  });
});

describe("getMaterialEffectTierForText — roll-20 utility when Unknown", () => {
  it("assigns Common to a nat-20 unarmed push with no damage", () => {
    expect(
      getMaterialEffectTierForText(
        "When you make an unarmed strike while attuned to this weapon, and roll a 20 for the attack roll, the target is pushed 5 feet away from you.",
        "weapon",
        emptyIndex,
        [
          "mechanic:roll-20",
          "mechanic:push",
          "mechanic:no-damage",
          "mechanic:unarmed",
        ],
      ),
    ).toBe("Common");
  });

  it("does not override extra-damage rarity with the roll-20 utility fallback", () => {
    expect(
      getMaterialEffectTierForText(
        "When you make an unarmed strike against a creature with this weapon, and roll a 20 for the attack roll, you deal an extra 1d4 damage and you can chose to push the creature up to 10 feet away.",
        "weapon",
        emptyIndex,
        [
          "mechanic:roll-20",
          "mechanic:push",
          "mechanic:extra-damage:minor",
          "mechanic:unarmed",
        ],
      ),
    ).toBe("Uncommon");
  });
});

describe("getMaterialEffectTierForText — reaction attack when Unknown", () => {
  it("assigns Uncommon to a reaction natural-weapon attack", () => {
    expect(
      getMaterialEffectTierForText(
        "(Race with natural weapons only.) When a hostile creature takes damage while within 5 feet of you, you can use your reaction to make an attack with your race's natural weapon against them.",
        "weapon",
        emptyIndex,
        [
          "mechanic:reaction",
          "mechanic:natural-weapon",
          "mechanic:active",
        ],
      ),
    ).toBe("Uncommon");
  });

  it("does not override extra-damage rarity with the reaction-attack fallback", () => {
    expect(
      getMaterialEffectTierForText(
        "When a creature within 5 feet of you hits you with an attack, you can use your reaction to make an unarmed strike. On a hit, the creature takes 1d8 bludgeoning damage.",
        "armor",
        emptyIndex,
        [
          "mechanic:reaction",
          "mechanic:unarmed",
          "mechanic:active",
        ],
      ),
    ).toBe("Rare");
  });
});

describe("getMaterialEffectTierForText — hold-breath underwater when Unknown", () => {
  it("assigns Common to extended hold breath underwater", () => {
    expect(
      getMaterialEffectTierForText(
        "You can hold breath underwater for twice as long as normal while you wear this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:hold-breath",
          "mechanic:underwater",
          "mechanic:passive",
        ],
      ),
    ).toBe("Common");
  });

  it("does not assign Common for water breathing without hold-breath", () => {
    expect(
      getMaterialEffectTierForText(
        "While you wear this armor, you have a swimming speed equal to your walking speed, you can breathe underwater, and you suffer no harm in water as cold as -20 degrees Fahrenheit.",
        "armor",
        emptyIndex,
        ["mechanic:underwater", "mechanic:passive"],
      ),
    ).toBe("Unknown");
  });
});

describe("getMaterialEffectTierForText — accelerated rest when Unknown", () => {
  it("assigns Uncommon to long rest in 4 hours instead of 8", () => {
    expect(
      getMaterialEffectTierForText(
        "You gain the benefits of a long rest after 4 hours instead of 8 while you are attuned to this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:accelerated-rest",
          "mechanic:long-rest",
          "mechanic:passive",
        ],
      ),
    ).toBe("Uncommon");
  });

  it("does not assign Uncommon for long-rest recharge alone", () => {
    expect(
      getMaterialEffectTierForText(
        "You can use this property once, regaining all uses when you finish a long rest.",
        "armor",
        emptyIndex,
        ["mechanic:long-rest", "mechanic:passive"],
      ),
    ).toBe("Unknown");
  });
});

describe("getMaterialEffectTierForText — mithral armor when Unknown", () => {
  it("assigns Uncommon to Mithral-style flexible armor", () => {
    expect(
      getMaterialEffectTierForText(
        "Your armor becomes light and flexible. If it is medium or light armor it can be worn under normal clothes. If the armor normally imposes disadvantage on Dexterity (Stealth) checks or has a Strength requirement, it no longer does.",
        "armor",
        emptyIndex,
        [
          "mechanic:mithral",
          "mechanic:skill-stealth",
          "mechanic:passive",
        ],
      ),
    ).toBe("Uncommon");
  });
});

describe("getMaterialEffectTierForText — spellcasting focus when Unknown", () => {
  it("assigns Common to weapon as spellcasting focus", () => {
    expect(
      getMaterialEffectTierForText(
        "While you are attuned to this weapon, you can use this weapon as your spellcasting focus.",
        "weapon",
        emptyIndex,
        ["mechanic:spellcasting-focus", "mechanic:passive"],
      ),
    ).toBe("Common");
  });
});

describe("getMaterialEffectTierForText — spell-buff when Unknown", () => {
  it("assigns Rare to always-on +2 spell attack and save DC", () => {
    expect(
      getMaterialEffectTierForText(
        "You gain a +2 bonus to your spell attack rolls and spell save DC while attuned to this weapon.",
        "weapon",
        emptyIndex,
        [
          "mechanic:spell-buff:damage",
          "mechanic:spell-buff:save",
          "mechanic:passive",
        ],
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon to always-on +1 spell attack", () => {
    expect(
      getMaterialEffectTierForText(
        "While attuned to this weapon, you gain a +1 bonus to your spell attack rolls when casting fire spells.",
        "weapon",
        emptyIndex,
        ["mechanic:spell-buff:damage", "mechanic:passive"],
      ),
    ).toBe("Uncommon");
  });
});

describe("getMaterialEffectTierForText — AC bonus when Unknown", () => {
  it("assigns Uncommon to always-on +1 AC", () => {
    expect(
      getMaterialEffectTierForText(
        "You have a +1 bonus to your AC while you wear this armor.",
        "armor",
        emptyIndex,
        ["mechanic:armor-class", "mechanic:passive", "type:defensive"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Common to reaction Shield +1 AC", () => {
    expect(
      getMaterialEffectTierForText(
        "While you are attuned to this armor and you use a reaction that would increase your AC, you gain an additional +1 bonus to your AC until the start of your next turn.",
        "armor",
        emptyIndex,
        ["mechanic:armor-class", "mechanic:reaction", "mechanic:active"],
      ),
    ).toBe("Common");
  });
});

describe("getMaterialEffectTierForText — gather resources when Unknown", () => {
  it("assigns Uncommon to Expert Fisherman (x2 catch)", () => {
    expect(
      getMaterialEffectTierForText(
        "Expert Fisherman. When you catch fish, you instead catch two.",
        "armor",
        emptyIndex,
        [
          "mechanic:gather-resources",
          "mechanic:fishing",
        ],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Rare to Pro Fisherman (extra 1d4)", () => {
    expect(
      getMaterialEffectTierForText(
        "Pro Fisherman. When you catch fish, you catch an extra 1d4 more.",
        "armor",
        emptyIndex,
        [
          "mechanic:gather-resources",
          "mechanic:gather-resources:major",
          "mechanic:fishing",
        ],
      ),
    ).toBe("Rare");
  });
});

describe("getMaterialEffectTierForText — class-resource recovery when Unknown", () => {
  it("assigns Uncommon to ki point recovery 1/long rest", () => {
    expect(
      getMaterialEffectTierForText(
        "(Monk Only) While you are attuned to this weapon, you may spend one minute contemplating the patterns etched on this weapon's surface and regain a number of expended ki points equal to half your proficiency modifier. Once you use this property, you cannot use it again until you finish a long rest.",
        "weapon",
        emptyIndex,
        [
          "class:monk",
          "mechanic:ki",
          "mechanic:class-resource",
          "mechanic:recover-class-resource",
          "mechanic:long-rest",
          "mechanic:active",
        ],
      ),
    ).toBe("Uncommon");
  });
});

describe("getMaterialEffectTierForText — attack-range when Unknown", () => {
  it("assigns Common to Deadeye (+20 ft)", () => {
    expect(
      getMaterialEffectTierForText(
        "(Ranged Weapon Only) Deadeye. Your weapon's normal attack range is increased by 20 feet.",
        "weapon",
        emptyIndex,
        [
          "weapon-type:ranged",
          "mechanic:attack-range",
          "mechanic:passive",
        ],
      ),
    ).toBe("Common");
  });

  it("assigns Uncommon to Deadeye+ (doubled)", () => {
    expect(
      getMaterialEffectTierForText(
        "(Ranged Weapon Only) Deadeye+. Your weapon's normal attack range is doubled.",
        "weapon",
        emptyIndex,
        [
          "weapon-type:ranged",
          "mechanic:attack-range",
          "mechanic:attack-range:major",
          "mechanic:passive",
        ],
      ),
    ).toBe("Uncommon");
  });
});

describe("getMaterialEffectTierForText — attack advantage when Unknown", () => {
  it("assigns Uncommon to Aim Booster (limited BA advantage)", () => {
    expect(
      getMaterialEffectTierForText(
        "(Ranged Weapon Only) Aim Booster. Before you make an attack with this weapon, you can use your bonus action to grant yourself advantage on the attack roll. You can use this property a number of times equal to half your proficiency modifier, regaining all expended uses when you finish a long rest.",
        "weapon",
        emptyIndex,
        [
          "weapon-type:ranged",
          "mechanic:bonus-action",
          "mechanic:advantage",
          "mechanic:attack-roll",
          "mechanic:long-rest",
          "mechanic:active",
          "type:offensive",
        ],
      ),
    ).toBe("Uncommon");
  });
});

describe("getMaterialEffectTierForText — movement when Unknown", () => {
  it("assigns Uncommon to burrowing speed 10 ft", () => {
    expect(
      getMaterialEffectTierForText(
        "You gain a burrowing speed of 10 feet while you wear this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:movement",
          "mechanic:burrowing",
          "mechanic:passive",
        ],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Common to Marathon Runner (+5 walk)", () => {
    expect(
      getMaterialEffectTierForText(
        "Marathon Runner. While wearing this armor, your walking speed increases by 5 feet.",
        "armor",
        emptyIndex,
        [
          "mechanic:movement",
          "mechanic:walking-speed",
          "mechanic:passive",
        ],
      ),
    ).toBe("Common");
  });

  it("assigns Uncommon to icy-surface Winterlands mobility", () => {
    expect(
      getMaterialEffectTierForText(
        "While wearing this armor, you can move across and climb icy surfaces without needing to make an ability check. Additionally, difficult terrain composed of ice or snow doesn't cost it extra moment.",
        "armor",
        emptyIndex,
        [
          "mechanic:movement",
          "mechanic:icy-surfaces",
          "mechanic:movement-climb",
          "mechanic:difficult-terrain",
          "mechanic:ignore-difficult-terrain",
          "mechanic:passive",
        ],
      ),
    ).toBe("Uncommon");
  });
});

describe("getMaterialEffectTierForText — condition defense when Unknown", () => {
  it("assigns Common to advantage against the poisoned condition", () => {
    expect(
      getMaterialEffectTierForText(
        "You have advantage on saving throws against the poisoned condition while you wear this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:against-condition",
          "mechanic:advantage",
          "mechanic:condition",
          "mechanic:condition-poisoned",
          "mechanic:saving-throw",
          "mechanic:passive",
          "type:defensive",
        ],
      ),
    ).toBe("Common");
  });

  it("assigns Common to a +2 save bonus vs knocked prone", () => {
    expect(
      getMaterialEffectTierForText(
        "Whenever you must succeed on a saving throw or be knocked prone, you do so with a +2 bonus.",
        "armor",
        emptyIndex,
        [
          "mechanic:against-condition",
          "mechanic:save-bonus",
          "mechanic:condition",
          "mechanic:condition-prone",
          "mechanic:saving-throw",
          "mechanic:passive",
          "type:defensive",
        ],
      ),
    ).toBe("Common");
  });

  it("does not assign Common when condition immunity is also present", () => {
    expect(
      getMaterialEffectTierForText(
        "You are immune to the poisoned condition while you wear this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:immunity",
          "mechanic:condition",
          "mechanic:condition-poisoned",
          "mechanic:passive",
          "type:defensive",
        ],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Uncommon to 'cannot be knocked prone' immunity", () => {
    expect(
      getMaterialEffectTierForText(
        "While you are wearing this armor, you cannot be knocked prone.",
        "armor",
        emptyIndex,
        [
          "mechanic:immunity",
          "mechanic:condition",
          "mechanic:condition-prone",
          "mechanic:passive",
          "type:defensive",
        ],
      ),
    ).toBe("Uncommon");
  });
});

describe("getMaterialEffectTierForText — skill utility when Unknown", () => {
  it("assigns Common to disarm advantage + Climb bonus", () => {
    expect(
      getMaterialEffectTierForText(
        "While attuned to this weapon you have advantage on checks against being disarmed and a +2 bonus to Climb checks.",
        "weapon",
        emptyIndex,
        [
          "mechanic:advantage",
          "mechanic:disarm",
          "mechanic:skill-bonus",
          "mechanic:skill-athletics",
          "mechanic:passive",
          "type:defensive",
        ],
      ),
    ).toBe("Common");
  });
});

describe("getMaterialEffectTierForText — light / darkness when Unknown", () => {
  it("assigns Common to Moon-touched–style light in darkness", () => {
    expect(
      getMaterialEffectTierForText(
        "While holding this weapon in darkness, it sheds moonlight, creating bright light in a 15-foot radius and dim light for an additional 15 feet.",
        "weapon",
        emptyIndex,
        [
          "mechanic:light",
          "mechanic:darkness",
          "mechanic:nonmagical-darkness",
          "mechanic:passive",
        ],
      ),
    ).toBe("Common");
  });

  it("assigns Uncommon to darkvision grants", () => {
    expect(
      getMaterialEffectTierForText(
        "While wearing this armor, you have darkvision out to a range of 60 feet.",
        "armor",
        emptyIndex,
        ["mechanic:darkvision", "mechanic:passive"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Rare to magical-darkness sight", () => {
    expect(
      getMaterialEffectTierForText(
        "You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet while you wear this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:darkness",
          "mechanic:magical-darkness",
          "mechanic:nonmagical-darkness",
          "mechanic:passive",
        ],
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon to Hide-in-darkness bonus-action utility", () => {
    expect(
      getMaterialEffectTierForText(
        "While in dim light or darkness, you can take the Hide action as a bonus action.",
        "armor",
        emptyIndex,
        [
          "mechanic:darkness",
          "mechanic:nonmagical-darkness",
          "mechanic:bonus-action",
          "mechanic:active",
        ],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Common to light-snuffing weapons", () => {
    expect(
      getMaterialEffectTierForText(
        "When held, this weapon draws in light, snuffing all nonmagical flames within 20 feet out. It turns dim light into darkness and bright light into dim light.",
        "weapon",
        emptyIndex,
        [
          "mechanic:darkness",
          "mechanic:nonmagical-darkness",
          "mechanic:light-suppression",
          "mechanic:area",
          "type:utility",
        ],
      ),
    ).toBe("Common");
  });

  it("assigns Uncommon to hill-giant-strength potion replication", () => {
    expect(
      getMaterialEffectTierForText(
        "While you are attuned to this weapon, you can use an action to gain the same benefits as a potion of hill giants strength for 1 hour. Once you use this property, you cannot use it again for 3 days.",
        "weapon",
        emptyIndex,
        [
          "mechanic:potion-effect",
          "mechanic:recharge-extended",
          "mechanic:active",
          "type:utility",
        ],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Rare to base AC 14 + Dex unarmored defense", () => {
    expect(
      getMaterialEffectTierForText(
        "If you aren't wearing light, medium, or heavy armor; your base Armor Class is 14 + your Dexterity modifier.",
        "armor",
        emptyIndex,
        [
          "mechanic:armor-class",
          "mechanic:base-ac",
          "type:defensive",
          "type:utility",
        ],
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon to extra-limb bonus-action unarmed package", () => {
    expect(
      getMaterialEffectTierForText(
        "While attuned to this armor, you grow two additional arms. As a bonus action you can have the arms make two unarmed strikes. The strikes can only deal 1 + your strength modifier.",
        "weapon",
        emptyIndex,
        [
          "mechanic:extra-limbs",
          "mechanic:unarmed",
          "mechanic:bonus-action",
          "mechanic:active",
          "type:offensive",
        ],
      ),
    ).toBe("Uncommon");
  });
});

describe("getMaterialEffectTierForText — temperature tolerance when Unknown", () => {
  it("assigns Common to basic -20 °F cold tolerance", () => {
    expect(
      getMaterialEffectTierForText(
        "You suffer no harm in temperature as cold as -20 degrees Fahrenheit while you wear this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:temperature-tolerance",
          "damage:cold",
          "mechanic:passive",
          "type:utility",
        ],
      ),
    ).toBe("Common");
  });

  it("assigns Common to 120 °F heat tolerance", () => {
    expect(
      getMaterialEffectTierForText(
        "You suffer no harm from temperatures as warm as 120 degrees Fahrenheit while you wear this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:temperature-tolerance",
          "damage:fire",
          "mechanic:passive",
          "type:utility",
        ],
      ),
    ).toBe("Common");
  });

  it("assigns Uncommon to Hot Drink–tier cold tolerance", () => {
    expect(
      getMaterialEffectTierForText(
        "While you wear this armor, you can tolerate temperatures as low as -50 degrees Fahrenheit without any additional protection. If you wear heavy clothes, you can tolerate temperatures as low as -100 degrees Fahrenheit.",
        "armor",
        emptyIndex,
        ["mechanic:temperature-tolerance", "damage:cold", "type:utility"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Rare to dual hot + cold tolerance", () => {
    expect(
      getMaterialEffectTierForText(
        "Adaptability. You are always under the effects of both a Cool Drink and a Hot Drink while you are wearing this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:temperature-tolerance",
          "damage:cold",
          "damage:fire",
          "type:utility",
        ],
      ),
    ).toBe("Rare");
  });
});

describe("getMaterialEffectTierForText — special mechanics when Unknown", () => {
  it("assigns Uncommon to ranged pull on hit", () => {
    expect(
      getMaterialEffectTierForText(
        "Whenever you hit a creature with a range weapon attack, you can use a bonus action to pull the creature 10 feet towards you.",
        "weapon",
        emptyIndex,
        [
          "mechanic:forced-movement",
          "weapon-type:ranged",
          "mechanic:bonus-action",
          "type:offensive",
        ],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Common to jump-and-grab movement", () => {
    expect(
      getMaterialEffectTierForText(
        "While you are attuned to this armor, when you jump and grab onto an object or surface with your hand(s), the distance traveled does not count against your movement for the turn.",
        "armor",
        emptyIndex,
        ["mechanic:jump-movement", "type:utility", "mechanic:passive"],
      ),
    ).toBe("Common");
  });

  it("assigns Rare to partial exhaustion mitigation", () => {
    expect(
      getMaterialEffectTierForText(
        "While you are attuned to this armor, you ignore the effects of the first 2 levels of exhaustion unless your exhaustion level is 3 or higher.",
        "armor",
        emptyIndex,
        [
          "mechanic:exhaustion-mitigation",
          "mechanic:condition-exhaustion",
          "type:defensive",
        ],
      ),
    ).toBe("Rare");
  });

  it("assigns Rare to magic resistance vs spells", () => {
    expect(
      getMaterialEffectTierForText(
        "You have advantage on saving throws against spells while you wear this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:magic-resistance",
          "mechanic:advantage",
          "type:defensive",
        ],
      ),
    ).toBe("Rare");
  });

  it("assigns Rare to reaction halve damage with limited uses", () => {
    expect(
      getMaterialEffectTierForText(
        "While you are wearing this armor and an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you. You can use this property a number of times equal to half your proficiency bonus (rounded down), regaining all expended uses when you finish a long rest.",
        "armor",
        emptyIndex,
        ["mechanic:damage-reduction", "mechanic:reaction", "type:defensive"],
      ),
    ).toBe("Rare");
  });

  it("assigns Rare to crit negation", () => {
    expect(
      getMaterialEffectTierForText(
        "While wearing this armor, any critical hit against you becomes a normal hit.",
        "armor",
        emptyIndex,
        ["mechanic:crit-negation", "type:defensive", "mechanic:passive"],
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon to Elemental Atk Up extra die", () => {
    expect(
      getMaterialEffectTierForText(
        "Elemental Atk Up. If your weapon deals cold, fire, lightning, or necrotic damage and you hit a creature with this weapon; roll one additional damage die for the elemental damage.",
        "weapon",
        emptyIndex,
        ["mechanic:extra-damage-die", "type:offensive", "damage:fire"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Common to flavor-only cosmetic effects", () => {
    expect(
      getMaterialEffectTierForText(
        "This weapon is so finely constructed it never needs maintenance, cannot rust or tarnish.",
        "weapon",
        emptyIndex,
        ["type:cosmetic", "mechanic:maintenance-free"],
      ),
    ).toBe("Common");
  });

  it("uses highest rarity for save bonus plus plane shift", () => {
    expect(
      getMaterialEffectTierForText(
        "You gain a +1 bonus to saving throws while you wear this armor. You can use an action to enter the Elemental Plane of fire along with everything you are wearing and carrying. You remain there until you use an action to return to the plane you were on.",
        "armor",
        emptyIndex,
        [
          "mechanic:save-bonus",
          "mechanic:plane-shift",
          "type:defensive",
          "mechanic:active",
        ],
      ),
    ).toBe("Very Rare");
  });

  it("assigns Common to Rapid Morph weapon mode switch", () => {
    expect(
      getMaterialEffectTierForText(
        "Rapid Morph. While attuned to this weapon, you can switch its modes as a free action.",
        "weapon",
        emptyIndex,
        ["mechanic:weapon-mode", "type:utility", "mechanic:passive"],
      ),
    ).toBe("Common");
  });

  it("assigns Rare to degrading mud AC", () => {
    expect(
      getMaterialEffectTierForText(
        "Your armor is caked in a mud like substance increasing your AC by 3. Each time you are hit, some of the mud breaks off reducing the bonus by 1. The mud reforms on your armor when you finish a long rest.",
        "armor",
        emptyIndex,
        [
          "mechanic:degrading-ac",
          "mechanic:armor-class",
          "type:defensive",
        ],
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon to Palamute Rally", () => {
    expect(
      getMaterialEffectTierForText(
        "Palamute Rally. NPC allies within 10 feet of you gain a +1 bonus to their AC and attack rolls while you are attuned to this armor.",
        "armor",
        emptyIndex,
        ["mechanic:ally-aura", "type:support"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Very Rare to dragonpiercer +3 uses", () => {
    expect(
      getMaterialEffectTierForText(
        "Bow Charge Plus++. While attuned to this weapon, you can use your dragonpiercer three additional times between rests and it recharges after a Short or Long rest.",
        "weapon",
        emptyIndex,
        ["mechanic:dragonpiercer", "type:utility"],
      ),
    ).toBe("Very Rare");
  });

  it("assigns Very Rare to conditional +4 AC below half HP", () => {
    expect(
      getMaterialEffectTierForText(
        "When you are below half of your maximum hit points, you can use your bonus action to increase your AC by 4 for 1 minute. Once you use this feature, you cannot use it again until you complete a short or long rest.",
        "armor",
        emptyIndex,
        [
          "mechanic:conditional-ac",
          "mechanic:bonus-action",
          "mechanic:active",
        ],
      ),
    ).toBe("Very Rare");
  });

  it("assigns Rare to Mind's Eye resistance bypass", () => {
    expect(
      getMaterialEffectTierForText(
        "Mind's Eye. Your attacks with this weapon bypass the damage resistances of any creature.",
        "weapon",
        emptyIndex,
        ["mechanic:resistance-bypass", "type:offensive"],
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon to Hasten Recovery", () => {
    expect(
      getMaterialEffectTierForText(
        "Hasten Recovery. When you regain hit points from magical healing, you can reroll any 1s or 2s on the healing dice.",
        "armor",
        emptyIndex,
        ["mechanic:healing-reroll", "type:defensive"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Legendary to Strength 29 floor", () => {
    expect(
      getMaterialEffectTierForText(
        "Your Strength score is 29 while you are attuned to this weapon.",
        "weapon",
        emptyIndex,
        ["mechanic:ability-score-set"],
      ),
    ).toBe("Legendary");
  });

  it("assigns Rare to Psychic Vision", () => {
    expect(
      getMaterialEffectTierForText(
        "Psychic Vision. While you are attuned to this armor, you know the location of all creatures within 60 feet of you, but you are vulnerable to psychic damage.",
        "armor",
        emptyIndex,
        ["mechanic:creature-sense", "mechanic:vulnerability"],
      ),
    ).toBe("Rare");
  });

  it("assigns Common to muddy terrain immunity", () => {
    expect(
      getMaterialEffectTierForText(
        "You do not suffer from difficult terrain in muddy or swamp terrain while wearing this armor.",
        "armor",
        emptyIndex,
        [
          "mechanic:ignore-difficult-terrain",
          "mechanic:movement",
          "type:utility",
        ],
      ),
    ).toBe("Common");
  });

  it("assigns tiers for common inline MHMM effect patterns", () => {
    expect(
      getMaterialEffectTierForText(
        "(Hammer & Lance Only) You gain a +1 bonus to your attack rolls if you move 20 feet in a straight line towards a creature without taking damage.",
        "weapon",
        emptyIndex,
        extractRuneEffectTags(
          "(Hammer & Lance Only) You gain a +1 bonus to your attack rolls if you move 20 feet in a straight line towards a creature without taking damage.",
        ),
      ),
    ).toBe("Uncommon");

    expect(
      getMaterialEffectTierForText(
        "You have advantage on checks to find a fishing spot and to catch any fish while you wear this armor.",
        "weapon",
        emptyIndex,
        extractRuneEffectTags(
          "You have advantage on checks to find a fishing spot and to catch any fish while you wear this armor.",
        ),
      ),
    ).toBe("Common");

    expect(
      getMaterialEffectTierForText(
        "While you wear this armor, your eye's glow red at night, much like the nargacuga's.",
        "armor",
        emptyIndex,
        extractRuneEffectTags(
          "While you wear this armor, your eye's glow red at night, much like the nargacuga's.",
        ),
      ),
    ).toBe("Common");

    expect(
      getMaterialEffectTierForText(
        "Your Strength score is 19 while attuned to this weapon. It has no effect on you if your Strength is already 19 or higher.",
        "weapon",
        emptyIndex,
        extractRuneEffectTags(
          "Your Strength score is 19 while attuned to this weapon. It has no effect on you if your Strength is already 19 or higher.",
        ),
      ),
    ).toBe("Rare");

    expect(
      getMaterialEffectTierForText(
        "While wearing this armor, you regain 1d6 Hit Points every 10 minutes, provided that you have at least 1 hit point. If you lose a body part, the armor causes the missing part to regrow and return to full functionality after 1d6 + 1 days if you have at least 1 hit point the whole time.",
        "armor",
        emptyIndex,
        extractRuneEffectTags(
          "While wearing this armor, you regain 1d6 Hit Points every 10 minutes, provided that you have at least 1 hit point. If you lose a body part, the armor causes the missing part to regrow and return to full functionality after 1d6 + 1 days if you have at least 1 hit point the whole time.",
        ),
      ),
    ).toBe("Very Rare");
  });
});

describe("getMaterialEffectTierForText — discovered named overlay", () => {
  it("assigns Common to MHMM cosmetic weapon effects", () => {
    expect(
      getMaterialEffectTierForText(
        "(Cosmetic) While attuned to this weapon, it seems to glow with an inner heat but is otherwise harmless.",
        "weapon",
        emptyIndex,
        ["type:cosmetic", "mechanic:passive"],
      ),
    ).toBe("Common");
  });

  it("assigns Common to Flexible Leathercraft", () => {
    const rune = makeRune({
      name: "Chatacabra Hide",
      slots: ["A"],
      armorEffect:
        "Flexible Leathercraft. While attuned to this armor you gain bonus to your carve checks equal to half your proficiency bonus.",
    });
    const index = supplementIndexWithRuneEffectNames(emptyIndex, [rune]);

    expect(
      getMaterialEffectTierForText(rune.armorEffect ?? "", "armor", index),
    ).toBe("Common");
  });

  it("assigns Rare to Recovery Level", () => {
    const rune = makeRune({
      name: "Khezu Hide",
      slots: ["A"],
      armorEffect:
        "Recovery Level. Whenever you suffer an effect that deals damage to you at the start of your turn your armor flashes white and ends the effect.",
    });
    const index = supplementIndexWithRuneEffectNames(emptyIndex, [rune]);

    expect(
      getMaterialEffectTierForText(rune.armorEffect ?? "", "armor", index),
    ).toBe("Rare");
  });

  it("assigns Rare from mechanic:end-dot tags when Unknown otherwise", () => {
    expect(
      getMaterialEffectTierForText(
        "Whenever you suffer an effect that deals damage to you at the start of your turn your armor flashes white and ends the effect.",
        "armor",
        emptyIndex,
        ["mechanic:end-dot", "mechanic:passive", "type:defensive"],
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon from mechanic:initiative tags", () => {
    expect(
      getMaterialEffectTierForText(
        "You have advantage on initiative rolls while you wear this armor.",
        "armor",
        emptyIndex,
        ["mechanic:initiative", "mechanic:advantage", "mechanic:passive"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Rare from mechanic:initiative:major tags", () => {
    expect(
      getMaterialEffectTierForText(
        "You add a d8 to your initiative and can become first in the initiative order.",
        "weapon",
        emptyIndex,
        ["mechanic:initiative", "mechanic:initiative:major"],
      ),
    ).toBe("Rare");
  });

  it("assigns Uncommon from heal-other:minor tags", () => {
    expect(
      getMaterialEffectTierForText(
        "Whenever you restore hit points to a creature, it regains additional hit points equal to the spell's level.",
        "weapon",
        emptyIndex,
        ["mechanic:heal-other:minor", "type:support"],
      ),
    ).toBe("Uncommon");
  });

  it("assigns Rare from heal-other:major tags", () => {
    expect(
      getMaterialEffectTierForText(
        "The creature regains additional hit points equal to double the spell's level.",
        "weapon",
        emptyIndex,
        ["mechanic:heal-other:major", "type:support"],
      ),
    ).toBe("Rare");
  });

  it("leaves unclassified discovered names as Unknown", () => {
    const rune = makeRune({
      name: "Mystery Scale",
      slots: ["A"],
      armorEffect:
        "Mystery Craft. While attuned to this armor you look fashionable.",
    });
    const index = supplementIndexWithRuneEffectNames(emptyIndex, [rune]);

    expect(
      getMaterialEffectTierForText(rune.armorEffect ?? "", "armor", index),
    ).toBe("Unknown");
  });
});

describe("getMaterialEffectTierForText — reviewed inline MHMM patterns", () => {
  it("assigns tiers for opportunity attacks, resistances, and save reroll", () => {
    const noOaText =
      "When you make a melee attack against a creature while wearing this armor, you don't provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not.";
    const noOaTags = extractRuneEffectTags(noOaText);
    expect(
      getMaterialEffectTierForText(noOaText, "armor", emptyIndex, noOaTags),
    ).toBe("Uncommon");

    const resistText =
      "You have resistances to fire, lightning, and necrotic damage while you wear this armor.";
    expect(getMaterialEffectTierForText(resistText, "armor", emptyIndex)).toBe(
      "Rare",
    );

    const saveRerollText =
      "While you wear this armor, you can pass a Dexterity saving throw you otherwise would have failed. Once used, this property can't be used again until you finish a long rest.";
    const saveRerollTags = extractRuneEffectTags(saveRerollText);
    expect(
      getMaterialEffectTierForText(
        saveRerollText,
        "armor",
        emptyIndex,
        saveRerollTags,
      ),
    ).toBe("Rare");
  });

  it("assigns tiers for web sense, poison margin KO, and Dereliction", () => {
    const webText =
      "While in contact with a web, you know the exact location of any other creature in contact with the same web.";
    const webTags = extractRuneEffectTags(webText);
    expect(
      getMaterialEffectTierForText(webText, "weapon", emptyIndex, webTags),
    ).toBe("Uncommon");

    const poisonText =
      "When you poison a creature and it fail the saving throw by 5 or more, the creature falls unconscious until it takes damage, are shaken awake, or the poison is removed.";
    const poisonTags = extractRuneEffectTags(poisonText);
    expect(
      getMaterialEffectTierForText(
        poisonText,
        "weapon",
        emptyIndex,
        poisonTags,
      ),
    ).toBe("Rare");

    const derelictionText =
      "Dereliction. While you are attuned to this weapon you can use your bonus action to roll a d20. Your hit point maximum is reduced by the roll and the next attack you hit with before the start of your next turn, deals extra damage equal to double the roll. The reduction lasts until you finish a long rest. You die if this effect reduces your hit point maximum to 0.";
    const derelictionTags = extractRuneEffectTags(derelictionText);
    expect(
      getMaterialEffectTierForText(
        derelictionText,
        "weapon",
        emptyIndex,
        derelictionTags,
      ),
    ).toBe("Rare");
  });
});

describe("getMaterialEffectTierForText — reviewed MHMM weapon/armor patterns", () => {
  it("assigns tiers for charm, peak performance, redirection, and dodge AC save", () => {
    const charmText =
      "When you hit a creature with this weapon, it must succeed on a DC 12 Wisdom saving throw or become charmed by you for 1 minute or until you or your companions do anything harmful to it. Once you use this property, you can't use it again until you finish a short or long rest.";
    const charmTags = extractRuneEffectTags(charmText);
    expect(
      getMaterialEffectTierForText(charmText, "weapon", emptyIndex, charmTags),
    ).toBe("Uncommon");

    const peakText =
      "Peak Performance. When your hit points are full and you roll a 1 or 2 on a damage die for an attack you make with a melee weapon, you can reroll the die and must use the new roll, even if the new roll is a 1 or a 2.";
    const peakTags = extractRuneEffectTags(peakText);
    expect(
      getMaterialEffectTierForText(peakText, "weapon", emptyIndex, peakTags),
    ).toBe("Uncommon");

    const redirectText =
      "Redirection. When you are the target of a melee attack, you can use your reaction to swap your position with another creature within 5 feet of you that is the same size or smaller than you. If the creature is unwilling, you must succeed on a Strength (Athletics) or Dexterity (Acrobatics) check contested by its Strength (Athletics) or Dexterity (Acrobatics) check or remain in your space. You can use this property a number of times equal to half of your proficiency bonus, regaining all expended uses when you finish a long rest.";
    const redirectTags = extractRuneEffectTags(redirectText);
    expect(
      getMaterialEffectTierForText(
        redirectText,
        "armor",
        emptyIndex,
        redirectTags,
      ),
    ).toBe("Rare");

    const dodgeAcText =
      "Uragaan Minor Protection. When you must make a saving throw while taking the dodge action, you can use your Armor Class in place of making the roll. Once used, you can't use this property again until you finish a long rest.";
    const dodgeAcTags = extractRuneEffectTags(dodgeAcText);
    expect(
      getMaterialEffectTierForText(
        dodgeAcText,
        "armor",
        emptyIndex,
        dodgeAcTags,
      ),
    ).toBe("Uncommon");
  });

  it("assigns tiers for heal boost, ammo buff, cord length, and blade dancer", () => {
    const healBoostText =
      "While you wear this armor, you gain 2 additional hit points whenever you regain hit points by magical or non-magical means, except when spending hit dice.";
    const healBoostTags = extractRuneEffectTags(healBoostText);
    expect(
      getMaterialEffectTierForText(
        healBoostText,
        "armor",
        emptyIndex,
        healBoostTags,
      ),
    ).toBe("Uncommon");

    const ammoBuffText =
      "(Light Bowgun Only) When you hit a creature with your demon ammo, its duration and effect are doubled.";
    const ammoBuffTags = extractRuneEffectTags(ammoBuffText);
    expect(
      getMaterialEffectTierForText(
        ammoBuffText,
        "weapon",
        emptyIndex,
        ammoBuffTags,
      ),
    ).toBe("Uncommon");

    const cordText =
      "(Hunting Horn Only) Your maximum cord length is increased by 1 when holding this weapon.";
    const cordTags = extractRuneEffectTags(cordText);
    expect(
      getMaterialEffectTierForText(cordText, "weapon", emptyIndex, cordTags),
    ).toBe("Common");

    const bladeText =
      "(One-Handed Melee Attacks Only) Blade Dancer. While you are attuned to this weapon, you can use your bonus action to make two attacks instead of one. You must meet the normal conditions to make the bonus action attack for this material to work. You can use this property a number of times equal to double your proficiency modifier, regaining all expended uses when you finish a long rest.";
    const bladeTags = extractRuneEffectTags(bladeText);
    expect(
      getMaterialEffectTierForText(bladeText, "weapon", emptyIndex, bladeTags),
    ).toBe("Rare");
  });
});

describe("getMaterialEffectTierForText — utility and environment effects", () => {
  it("assigns tiers for gliding, wind, feast, bloodrage, and invisibility", () => {
    const glideText =
      "When you place this material into your armor it gains a gliding membrane. As an action or reaction, you can extend your arms to reduce your fall speed to 10 feet per round.";
    const glideTags = extractRuneEffectTags(glideText);
    expect(
      getMaterialEffectTierForText(glideText, "armor", emptyIndex, glideTags),
    ).toBe("Uncommon");

    const windText =
      "Wind Resist. You and your equipment suffer no ill effects from Strong Winds (DMG p.110) while you wear this armor.";
    const windTags = extractRuneEffectTags(windText);
    expect(
      getMaterialEffectTierForText(windText, "armor", emptyIndex, windTags),
    ).toBe("Common");

    const feastText =
      "Whenever you finish a long rest, you gain the benefits of the Heroes' Feast spell.";
    const feastTags = extractRuneEffectTags(feastText);
    expect(
      getMaterialEffectTierForText(feastText, "armor", emptyIndex, feastTags),
    ).toBe("Very Rare");

    const bloodrageText =
      "Bloodrage. When you are reduced below half of your maximum hit points while raging, you can use your reaction to enter a bloodrage until your rage ends. When in a bloodrage, you gain the effects of the haste spell, but you do not need to concentrate on it.";
    const bloodrageTags = extractRuneEffectTags(bloodrageText);
    expect(
      getMaterialEffectTierForText(
        bloodrageText,
        "weapon",
        emptyIndex,
        bloodrageTags,
      ),
    ).toBe("Uncommon");

    const invisText =
      "While you are wearing this armor and you take damage, you can use your reaction to magically turn invisible until the start of your next turn.";
    const invisTags = extractRuneEffectTags(invisText);
    expect(
      getMaterialEffectTierForText(invisText, "armor", emptyIndex, invisTags),
    ).toBe("Rare");

    const staminaText =
      "Stamina Recovery. When you take a long rest, you reduce your exhaustion by 5 levels instead of 1.";
    const staminaTags = extractRuneEffectTags(staminaText);
    expect(
      getMaterialEffectTierForText(
        staminaText,
        "armor",
        emptyIndex,
        staminaTags,
      ),
    ).toBe("Very Rare");
  });
});

describe("getMaterialEffectTierForText — proficiency and utility patterns", () => {
  it("assigns Common to Athletic skill proficiency and extinguish utility", () => {
    const athleticsText =
      "You have proficiency in the Athletic skill while you are attuned to this armor.";
    const athleticsTags = extractRuneEffectTags(athleticsText);
    expect(
      getMaterialEffectTierForText(
        athleticsText,
        "armor",
        emptyIndex,
        athleticsTags,
      ),
    ).toBe("Common");

    const extinguishText =
      "While you are attuned to this weapon you can draw it, to extinguish all nonmagical flames within 30 feet of you. This property can be used no more than once per hour.";
    const extinguishTags = extractRuneEffectTags(extinguishText);
    expect(
      getMaterialEffectTierForText(
        extinguishText,
        "weapon",
        emptyIndex,
        extinguishTags,
      ),
    ).toBe("Common");
  });

  it("assigns Uncommon to expertise, inspiration, and conjure horns", () => {
    const hornText =
      "You gain proficiency with the Horn musical instruments. If you are already proficient, you double your proficiency bonus when using it.";
    const hornTags = extractRuneEffectTags(hornText);
    expect(
      getMaterialEffectTierForText(hornText, "weapon", emptyIndex, hornTags),
    ).toBe("Uncommon");

    const inspirationText =
      "Whenever you finish a long rest you can attempt a DC 15 Charisma (Performance) check using an instrument you are proficient with. On a success, you gain inspiration if you do not already have it.";
    const inspirationTags = extractRuneEffectTags(inspirationText);
    expect(
      getMaterialEffectTierForText(
        inspirationText,
        "armor",
        emptyIndex,
        inspirationTags,
      ),
    ).toBe("Uncommon");

    const conjureText =
      "While attuned to this armor, you can use an action to speak its command word and conjure an Armor Horn, Antidote Horn, Field Horn, or Health Horn into your hands.";
    const conjureTags = extractRuneEffectTags(conjureText);
    expect(
      getMaterialEffectTierForText(
        conjureText,
        "armor",
        emptyIndex,
        conjureTags,
      ),
    ).toBe("Uncommon");
  });

  it("assigns scaled rarity to poison DC boost and save DC boost", () => {
    const poisonText =
      "If you coat this weapon with poison, the poisons save DC is increased by 5.";
    const poisonTags = extractRuneEffectTags(poisonText);
    expect(
      getMaterialEffectTierForText(
        poisonText,
        "weapon",
        emptyIndex,
        poisonTags,
      ),
    ).toBe("Very Rare");

    const dreadqueenText =
      "Dreadqueen. While attuned to this armor, your save DC for condition causing effects, such as the sleep spell, or a material effect, is increased by 2.";
    const dreadqueenTags = extractRuneEffectTags(dreadqueenText);
    expect(
      getMaterialEffectTierForText(
        dreadqueenText,
        "armor",
        emptyIndex,
        dreadqueenTags,
      ),
    ).toBe("Rare");
  });

  it("assigns Legendary to nonmagical damage resistance package", () => {
    const text =
      "You have resistance to nonmagical damage while you wear this armor. Additionally, you can use an action to make yourself immune to nonmagical damage for 10 minutes or until you are no longer wearing the armor. Once this special action is used, it can't be used again until the next dawn.";
    const tags = extractRuneEffectTags(text);
    expect(
      getMaterialEffectTierForText(text, "armor", emptyIndex, tags),
    ).toBe("Legendary");
  });
});

describe("getMaterialEffectTiersForRune", () => {
  it("does not treat a missing effect side as Unknown", () => {
    const rune = makeRune({
      name: "Scale",
      slots: ["A"],
      armorEffect: "You have resistance to fire damage while you wear this armor.",
    });

    expect(getMaterialEffectTiersForRune(rune, emptyIndex)).toEqual(["Rare"]);
    expect(
      runeMatchesMaterialEffectTierFilter(rune, emptyIndex, ["Unknown"]),
    ).toBe(false);
    expect(
      runeMatchesMaterialEffectTierFilter(rune, emptyIndex, ["Rare"]),
    ).toBe(true);
  });
});
