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
  findMatchingMaterialEffectNames,
} from "./material-effect-highlight.utils";
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
    tags: [],
    weaponTags: [],
    armorTags: [],
    ...partial,
  };
}

const emptyIndex = buildMaterialEffectNameIndex([]);

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

  it("leaves bare darkness utility as Unknown", () => {
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
    ).toBe("Unknown");
  });
});

describe("getMaterialEffectTierForText — discovered named overlay", () => {
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
