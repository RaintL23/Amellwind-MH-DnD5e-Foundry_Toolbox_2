import { describe, expect, it } from "vitest";
import {
  extractRuneEffectTags,
  isPlaceableRune,
  mapRunesFromMonster,
  backfillSharedOtherEffects,
  normalizeLootChance,
  stripMaterialQuantity,
} from "../mappers/rune.mapper";
import { buildSpellLevelLookup } from "../utils/spell-level-lookup.utils";

function makeSpell(name: string, level: number) {
  return { name, level };
}

const spellLevels = buildSpellLevelLookup([
  makeSpell("Light", 0),
  makeSpell("Shield", 1),
  makeSpell("Earth Tremor", 1),
  makeSpell("Ice Knife", 1),
  makeSpell("Dust Devil", 2),
  makeSpell("Call Lightning", 3),
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

  it("tags lightning immunity when MHMM typo uses lighting damage", () => {
    const tags = extractRuneEffectTags(
      "You are immune to lighting damage while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:immunity",
        "damage:lightning",
        "type:defensive",
        "mechanic:passive",
      ]),
    );
  });

  it("tags lightning and thunder for mixed lighting immunity + thunder resistance", () => {
    const tags = extractRuneEffectTags(
      "You have immunity to lighting damage and resistance to thunder damage while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:immunity",
        "mechanic:resistance",
        "damage:lightning",
        "damage:thunder",
        "type:defensive",
      ]),
    );
  });

  it("tags every elemental type in dual immunity armor effects", () => {
    const tags = extractRuneEffectTags(
      "You are immune to cold and fire damage while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "damage:cold",
        "damage:fire",
        "mechanic:immunity",
        "type:defensive",
      ]),
    );
  });

  it("tags all physical damage types in shared-suffix immunity lists", () => {
    const tags = extractRuneEffectTags(
      "You are immune to bludgeoning, piercing, and slashing damage from CR 2 or lower creatures while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "damage:bludgeoning",
        "damage:piercing",
        "damage:slashing",
        "mechanic:immunity",
        "type:defensive",
      ]),
    );
  });

  it("tags MHMM cosmetic weapon effects", () => {
    const tags = extractRuneEffectTags(
      "(Cosmetic) While attuned to this weapon, it seems to glow with an inner heat but is otherwise harmless.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["type:cosmetic", "mechanic:passive"]),
    );
    expect(tags).not.toContain("type:offensive");
    expect(tags).not.toContain("type:defensive");
  });

  it("tags cosmetic effects with slot restrictions in the prefix", () => {
    const tags = extractRuneEffectTags(
      "(Cosmetic; Shield Only) While attuned to this weapon, you can use your action to transform your shield's surface into a tray of frost.",
    );

    expect(tags).toContain("type:cosmetic");
    expect(tags).toContain("mechanic:active");
  });

  it("tags flat elemental damage reduction (Warm Pelt pattern)", () => {
    const tags = extractRuneEffectTags(
      "You reduce thunder damage you take by 2 while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "damage:thunder",
        "mechanic:damage-reduction",
        "type:defensive",
        "mechanic:passive",
      ]),
    );
  });

  it("tags ranged attack damage reduction (White Velociprey pattern)", () => {
    const tags = extractRuneEffectTags(
      "You reduce damage you take from ranged weapon and spell attacks by 2.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:damage-reduction",
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
    expect(tags).toContain("mechanic:spell:one-use");
    expect(tags.some((tag) => tag.startsWith("mechanic:spell:lvl"))).toBe(
      false,
    );
  });

  it("tags dimension door from the spell catalog as spell:lvl4", () => {
    const tags = extractRuneEffectTags(
      "While you are wearing this armor, you can cast the {@spell dimension door} spell as an action. Once you use this property, you can't use it again until the next dawn.",
      spellLevels,
    );

    expect(tags).toContain("mechanic:spell:lvl4");
    expect(tags).toContain("mechanic:spell:one-use");
    expect(tags).not.toContain("mechanic:spell:lvl1-2");
  });

  it("tags plain MHMM Earth Tremor as spell:lvl1 one-use", () => {
    const tags = extractRuneEffectTags(
      "(Bard, Druid, Sorcerer, & Wizard Only) While attuned to this weapon you can cast the Earth Tremor spell once per long rest, without expending a spell slot.",
      spellLevels,
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "class:bard",
        "class:druid",
        "class:sorcerer",
        "class:wizard",
        "mechanic:spell:lvl1",
        "mechanic:spell:one-use",
        "mechanic:long-rest",
      ]),
    );
    expect(tags).not.toContain("mechanic:spell:lvl1-2");
  });

  it("tags know-the-spell grants as leveled + prepared", () => {
    const tags = extractRuneEffectTags(
      "(Druid, Sorcerer, & Wizard Only) While attuned to this weapon you know the ice knife spell. If you have to prepare spells, you always have it prepared, and it doesn't count against the number of spells you can prepare each day.",
      spellLevels,
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "class:druid",
        "class:sorcerer",
        "class:wizard",
        "mechanic:spell:lvl1",
        "mechanic:spell:prepared",
        "mechanic:passive",
      ]),
    );
    expect(tags).not.toContain("mechanic:spell:one-use");
    expect(tags).not.toContain("mechanic:spell:lvl1-2");
  });

  it("tags know-the-cantrip grants from the catalog", () => {
    const tags = extractRuneEffectTags(
      "(Sorcerer & Wizard Only) While attuned to this weapon you know the ray of frost cantrip.",
      buildSpellLevelLookup([
        makeSpell("Ray of Frost", 0),
        makeSpell("Ice Knife", 1),
      ]),
    );

    expect(tags).toContain("mechanic:cantrip");
    expect(tags).toContain("class:sorcerer");
    expect(tags).toContain("class:wizard");
    expect(tags.some((tag) => tag.startsWith("mechanic:spell:lvl"))).toBe(
      false,
    );
  });

  it("tags multi-spell plain cast at 2nd level", () => {
    const tags = extractRuneEffectTags(
      "(Druid, Sorcerer, & Wizard Only) While attuned to this weapon you can cast the Earth Tremor and the Dust Devil spell at 2nd level once per day, without expending a spell slot.",
      spellLevels,
    );

    expect(tags).toContain("mechanic:spell:lvl2");
    expect(tags).toContain("mechanic:spell:one-use");
    expect(tags).not.toContain("mechanic:spell:lvl1");
  });

  it("does not tag at-will cantrips as one-use", () => {
    const tags = extractRuneEffectTags(
      "While attuned this weapon, you can cast the mold earth cantrip at will.",
      spellLevels,
    );

    expect(tags).toContain("mechanic:cantrip");
    expect(tags).not.toContain("mechanic:spell:one-use");
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

  it("tags plain Climb checks as athletics with disarm advantage", () => {
    const tags = extractRuneEffectTags(
      "While attuned to this weapon you have advantage on checks against being disarmed and a +2 bonus to Climb checks.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:advantage",
        "mechanic:disarm",
        "mechanic:skill-bonus",
        "mechanic:skill-athletics",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
  });

  it("tags plain Athletics check bonus without {@skill} markup", () => {
    const tags = extractRuneEffectTags(
      "You have a +2 bonus to Athletics checks while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:skill-bonus",
        "mechanic:skill-athletics",
        "mechanic:passive",
      ]),
    );
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
        "mechanic:passive",
        "type:defensive",
      ]),
    );
  });

  it("tags bare 'against the poisoned condition' without {@condition} markup", () => {
    const tags = extractRuneEffectTags(
      "You have advantage on saving throws against the poisoned condition while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:condition",
        "mechanic:condition-poisoned",
        "mechanic:against-condition",
        "mechanic:advantage",
        "mechanic:saving-throw",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
    expect(tags).not.toContain("mechanic:active");
  });

  it("tags named condition immunity without markup", () => {
    const tags = extractRuneEffectTags(
      "You are immune to the poisoned condition while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:condition",
        "mechanic:condition-poisoned",
        "mechanic:immunity",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
    expect(tags).not.toContain("mechanic:against-condition");
  });

  it("tags 'cannot be knocked prone' as condition immunity", () => {
    const tags = extractRuneEffectTags(
      "While you are wearing this armor, you cannot be knocked prone.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:immunity",
        "mechanic:condition",
        "mechanic:condition-prone",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
    expect(tags).not.toContain("mechanic:against-condition");
  });

  it("tags Tremor-Proof / Rock Steady prone lockouts as immunity", () => {
    const tremor = extractRuneEffectTags(
      "Tremor-Proof. You cannot be knocked prone while you wear this armor.",
    );
    const rockSteady = extractRuneEffectTags(
      "Rock Steady. While wearing this armor, you can't be unwillingly knocked prone and you ignore effects like the kushala daora and amatsu's wind barrier.",
    );

    for (const tags of [tremor, rockSteady]) {
      expect(tags).toEqual(
        expect.arrayContaining([
          "mechanic:immunity",
          "mechanic:condition-prone",
          "mechanic:condition",
        ]),
      );
      expect(tags).not.toContain("mechanic:against-condition");
    }
  });

  it("tags cannot-be lists and bare condition lockouts as immunity", () => {
    const paralyzed = extractRuneEffectTags(
      "You cannot be paralyzed while you wear this armor.",
    );
    const wellness = extractRuneEffectTags(
      "Wellness. While wearing this armor, you cannot be unwillingly put to sleep, poisoned, paralyzed, or stunned.",
    );
    const deadeye = extractRuneEffectTags(
      "Deadeye Soul X. While you are wearing this armor, you can't be stunned, and your critical range is increased by 1 when you are attacking a Huge or larger creature.",
    );

    expect(paralyzed).toEqual(
      expect.arrayContaining([
        "mechanic:immunity",
        "mechanic:condition-paralyzed",
      ]),
    );
    expect(wellness).toEqual(
      expect.arrayContaining([
        "mechanic:immunity",
        "mechanic:condition-poisoned",
        "mechanic:condition-paralyzed",
        "mechanic:condition-stunned",
      ]),
    );
    expect(deadeye).toEqual(
      expect.arrayContaining([
        "mechanic:immunity",
        "mechanic:condition-stunned",
      ]),
    );
  });

  it("does not treat 'can't be afflicted' or Guard push lockouts as immunity-only condition", () => {
    const afflicted = extractRuneEffectTags(
      "You are immune to lightning damage, and you can't be afflicted with thunderblight while you wear this armor.",
    );
    const guard = extractRuneEffectTags(
      "Guard. You cannot be pushed or knocked backwards while you wear this armor.",
    );

    // Damage immunity still applies; affliction stays against-condition only.
    expect(afflicted).toContain("mechanic:immunity");
    expect(afflicted).toContain("mechanic:against-condition");
    expect(afflicted).toContain("mechanic:condition-thunderblight");

    expect(guard).not.toContain("mechanic:immunity");
    expect(guard).not.toContain("mechanic:condition-prone");
  });

  it("tags Negate Poison cannot-be-poisoned as immunity", () => {
    const tags = extractRuneEffectTags(
      "Negate Poison. You have resistance to poison damage and cannot be poisoned while wearing this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:resistance",
        "mechanic:immunity",
        "mechanic:condition-poisoned",
        "damage:poison",
      ]),
    );
  });

  it("tags 'against being poisoned' without the word condition", () => {
    const tags = extractRuneEffectTags(
      "You have advantage on saving throws against being poisoned while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:condition",
        "mechanic:condition-poisoned",
        "mechanic:against-condition",
        "mechanic:advantage",
        "mechanic:passive",
      ]),
    );
  });

  it("tags paralysis as condition-paralyzed and against-condition", () => {
    const tags = extractRuneEffectTags(
      "You have advantage on saving throws against paralysis while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:condition-paralyzed",
        "mechanic:against-condition",
        "mechanic:advantage",
        "mechanic:passive",
      ]),
    );
  });

  it("tags MH blight names without {@condition} markup", () => {
    const tags = extractRuneEffectTags(
      "You have resistance to acid damage and immunity to the waterblight condition while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:condition-waterblight",
        "mechanic:immunity",
        "mechanic:resistance",
        "damage:acid",
        "mechanic:passive",
      ]),
    );
    expect(tags).not.toContain("mechanic:against-condition");
  });

  it("does not tag against-condition for earplugs vs thunder damage", () => {
    const tags = extractRuneEffectTags(
      "Earplugs. While you are attuned to this armor, you can use a bonus action to conjure two earplugs. While using these earplugs, you are considered deafened, and you have advantage on saving throws against thunder damage.",
    );

    expect(tags).toContain("mechanic:condition-deafened");
    expect(tags).toContain("mechanic:active");
    expect(tags).not.toContain("mechanic:against-condition");
  });

  it("tags bonus-action effects as active, not passive", () => {
    const tags = extractRuneEffectTags(
      "As a bonus action while you wear this armor, you gain resistance to fire damage for 1 minute.",
    );

    expect(tags).toContain("mechanic:active");
    expect(tags).toContain("mechanic:bonus-action");
    expect(tags).not.toContain("mechanic:passive");
  });

  it("does not tag against-condition when a weapon inflicts a condition", () => {
    const tags = extractRuneEffectTags(
      "On a hit, the target must succeed on a Constitution saving throw or be {@condition stunned} until the end of its next turn.",
    );

    expect(tags).toContain("mechanic:condition-stunned");
    expect(tags).not.toContain("mechanic:against-condition");
  });

  it("tags +2 save vs knocked prone as against-condition and save-bonus", () => {
    const tags = extractRuneEffectTags(
      "Whenever you must succeed on a saving throw or be knocked prone, you do so with a +2 bonus.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:against-condition",
        "mechanic:save-bonus",
        "mechanic:condition-prone",
        "mechanic:condition",
        "mechanic:saving-throw",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
    expect(tags).not.toContain("mechanic:advantage");
  });

  it("tags advantage vs knocked prone without {@condition} markup", () => {
    const tags = extractRuneEffectTags(
      "When you must succeed on a saving throw or be knocked prone, you do so with advantage.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:against-condition",
        "mechanic:advantage",
        "mechanic:condition-prone",
        "mechanic:saving-throw",
        "type:defensive",
      ]),
    );
  });

  it("tags roll-a-20 damage riders as roll-20 and offensive, not critical", () => {
    const tags = extractRuneEffectTags(
      "When you roll a 20 on your attack roll with this weapon, the target creature catches fire. Until someone takes an action to douse the flames, the creature takes {@damage 1d4} fire damage at the start of each of its turns.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:roll-20",
        "type:offensive",
        "damage:fire",
      ]),
    );
    expect(tags).not.toContain("mechanic:critical");
    expect(tags).not.toContain("mechanic:no-damage");
  });

  it("tags a nat-20 unarmed push with no damage as Common-style utility tags", () => {
    const tags = extractRuneEffectTags(
      "When you make an unarmed strike while attuned to this weapon, and roll a 20 for the attack roll, the target is pushed 5 feet away from you.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:roll-20",
        "mechanic:push",
        "mechanic:no-damage",
        "mechanic:unarmed",
      ]),
    );
    expect(tags).not.toContain("mechanic:critical");
    expect(tags).not.toContain("type:offensive");
  });

  it("tags MHMM 'pushed back' + average-dice AoE cone (Zorah Magdaros)", () => {
    const tags = extractRuneEffectTags(
      "(Melee Weapon Only) When you hit a creature with this weapon, it must succeed on a DC 17 Strength saving throw or be pushed back 10 feet. If the saving throw fails by 5 or more, it is also knocked prone. Additionally, when a creature fails its saving throw, you can speak the weapon's command word to create a wave of molten rock that erupts from the ground in a 30-foot cone in front you, dealing 22 (4d10) fire damage to each creature in the area. Once you use this property, you can't use it again until you finish a long rest.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "weapon-type:melee",
        "mechanic:push",
        "mechanic:area",
        "mechanic:saving-throw",
        "mechanic:condition",
        "mechanic:condition-prone",
        "mechanic:long-rest",
        "damage:fire",
        "type:offensive",
      ]),
    );
  });

  it("does not tag Guard 'cannot be pushed' as push", () => {
    const tags = extractRuneEffectTags(
      "Guard. You cannot be pushed or knocked backwards while you wear this armor.",
    );
    expect(tags).not.toContain("mechanic:push");
  });

  it("tags Recovery Level DoT cleanse as end-dot, passive, defensive", () => {
    const tags = extractRuneEffectTags(
      "Recovery Level. Whenever you suffer an effect that deals damage to you at the start of your turn your armor flashes white and ends the effect. This could include such effects as a bleeding wound, acid or poison that continues to damage you over time, being set on fire, etc. This armor has no effect on environmental effects, damage that you take from being in a given location or spell's area of effect or similar damage sources.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:end-dot",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
    expect(tags).not.toContain("damage:acid");
    expect(tags).not.toContain("damage:poison");
    expect(tags).not.toContain("mechanic:area");
  });

  it("tags always-on initiative advantage", () => {
    const tags = extractRuneEffectTags(
      "You have advantage on initiative rolls while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:initiative",
        "mechanic:advantage",
        "mechanic:passive",
      ]),
    );
    expect(tags).not.toContain("mechanic:initiative:major");
  });

  it("tags Safi-style initiative die + go-first as major", () => {
    const tags = extractRuneEffectTags(
      "While you are attuned to this weapon you add a d8 to your initiative at the start of every combat. Additionally, this weapon has one rune. You can expend this rune at the start of combat to become first in the initiative order, no matter what you roll.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:initiative",
        "mechanic:initiative:major",
      ]),
    );
  });

  it("does not tag FastCharge initiative triggers as initiative buffs", () => {
    const tags = extractRuneEffectTags(
      "FastCharge. When you roll for initiative, your greatsword, longsword, charge blade, or tonfas gains 1 charge, spirit, or phial charge.",
    );
    expect(tags).not.toContain("mechanic:initiative");
  });

  it("tags Astalos-style spell heal rider as heal-other minor", () => {
    const tags = extractRuneEffectTags(
      "(Cleric & Paladin Only) While you are attuned to this weapon, whenever you use a spell of 1st-level or higher to restore hit points to a creature, the creature regains additional hit points equal to the spell's level.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:heal-other:minor",
        "type:support",
        "class:cleric",
        "class:paladin",
      ]),
    );
  });

  it("tags Astalos+ double spell-level heal as heal-other major", () => {
    const tags = extractRuneEffectTags(
      "(Cleric & Paladin only) While you are attuned to this weapon, whenever you use a spell of 1st-level or higher to restore hit points to a creature, the creature regains additional hit points equal to double the spell's level.",
    );

    expect(tags).toContain("mechanic:heal-other:major");
  });

  it("tags Lay on Hands THP rider as heal-other", () => {
    const tags = extractRuneEffectTags(
      "(Paladin Only) Whenever you restore a creature's hit points with your Lay on Hands feature, it gains temporary hit points equal to the amount healed until the start of your next turn.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:heal-other:minor",
        "type:support",
        "class:paladin",
      ]),
    );
  });

  it("tags Malzeno HP-transfer heal as heal-other major", () => {
    const tags = extractRuneEffectTags(
      "This armor has three runes. As a bonus action you can expend 1 or more runes to lose 1d8 hit points for each rune expended and heal another creature you can see within 30 feet of you for double the amount of hit points you lost.",
    );

    expect(tags).toContain("mechanic:heal-other:major");
    expect(tags).toContain("type:support");
  });

  it("does not tag incoming unarmed-strike thorns as unarmed", () => {
    const tags = extractRuneEffectTags(
      "While you wear this armor, any creature that hits you with a melee weapon, an unarmed strike, or a natural melee weapon takes 1d6 fire damage.",
    );

    expect(tags).not.toContain("mechanic:unarmed");
    expect(tags).not.toContain("mechanic:natural-weapon");
  });

  it("tags a reaction attack with the race natural weapon", () => {
    const tags = extractRuneEffectTags(
      "(Race with natural weapons only.) When a hostile creature takes damage while within 5 feet of you, you can use your reaction to make an attack with your race's natural weapon against them.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:reaction",
        "mechanic:natural-weapon",
        "mechanic:active",
      ]),
    );
    expect(tags).not.toContain("mechanic:unarmed");
  });

  it("tags hold-breath underwater utility", () => {
    const tags = extractRuneEffectTags(
      "You can hold breath underwater for twice as long as normal while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:hold-breath",
        "mechanic:underwater",
        "mechanic:passive",
      ]),
    );
  });

  it("tags accelerated long rest (4 hours instead of 8)", () => {
    const tags = extractRuneEffectTags(
      "You gain the benefits of a long rest after 4 hours instead of 8 while you are attuned to this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:accelerated-rest",
        "mechanic:long-rest",
        "mechanic:passive",
      ]),
    );
  });

  it("does not tag accelerated-rest for long-rest recharge gates", () => {
    const tags = extractRuneEffectTags(
      "You can use this property once, regaining all uses when you finish a long rest.",
    );

    expect(tags).toContain("mechanic:long-rest");
    expect(tags).not.toContain("mechanic:accelerated-rest");
  });

  it("tags Mithral-style flexible armor package", () => {
    const tags = extractRuneEffectTags(
      "Your armor becomes light and flexible. If it is medium or light armor it can be worn under normal clothes. If the armor normally imposes disadvantage on Dexterity (Stealth) checks or has a Strength requirement, it no longer does.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:mithral",
        "mechanic:skill-stealth",
        "mechanic:passive",
      ]),
    );
  });

  it("tags Nightcloak Malfestio variant with 'a light and flexible'", () => {
    const tags = extractRuneEffectTags(
      "Your armor becomes a light and flexible. If it is medium or light armor it can be worn under normal clothes. If the armor normally imposes disadvantage on Dexterity (Stealth) checks or has a Strength requirement, it no longer does.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:mithral",
        "mechanic:skill-stealth",
        "mechanic:passive",
      ]),
    );
  });

  it("does not tag mithral for Strength requirement reduced by 1 alone", () => {
    const tags = extractRuneEffectTags(
      "This armor is 10% lighter than normal armor of this type. If it has a Strength requirement to use, it is reduced by 1.",
    );

    expect(tags).toContain("mechanic:passive");
    expect(tags).not.toContain("mechanic:mithral");
    expect(tags).not.toContain("mechanic:skill-stealth");
  });

  it("tags weapon as spellcasting focus", () => {
    const tags = extractRuneEffectTags(
      "While you are attuned to this weapon, you can use this weapon as your spellcasting focus.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:spellcasting-focus",
        "mechanic:passive",
      ]),
    );
    expect(tags).not.toContain("mechanic:focus-points");
  });

  it("tags spellcasting focus combined with fire-spell bypass", () => {
    const tags = extractRuneEffectTags(
      "While you are attuned to this weapon, you can use this weapon as your spellcasting focus, and your fire spells bypass a creature resistance and immunities.",
    );

    expect(tags).toContain("mechanic:spellcasting-focus");
    expect(tags).toContain("mechanic:passive");
  });

  it("tags Aim Booster with attack-roll and offensive", () => {
    const tags = extractRuneEffectTags(
      "(Ranged Weapon Only) Aim Booster. Before you make an attack with this weapon, you can use your bonus action to grant yourself advantage on the attack roll. You can use this property a number of times equal to half your proficiency modifier, regaining all expended uses when you finish a long rest.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "weapon-type:ranged",
        "mechanic:bonus-action",
        "mechanic:advantage",
        "mechanic:attack-roll",
        "mechanic:long-rest",
        "mechanic:active",
        "type:offensive",
      ]),
    );
  });

  it("tags burrowing speed as movement + burrowing", () => {
    const tags = extractRuneEffectTags(
      "You gain a burrowing speed of 10 feet while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:movement",
        "mechanic:burrowing",
        "mechanic:passive",
      ]),
    );
  });

  it("tags Marathon Runner+ as walking-speed major", () => {
    const tags = extractRuneEffectTags(
      "Marathon Runner+. While wearing this armor, your walking speed increases by 10 feet and you ignore difficult terrain if it was not created by a magical effect.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:movement",
        "mechanic:walking-speed",
        "mechanic:movement:major",
        "mechanic:difficult-terrain",
        "mechanic:ignore-difficult-terrain",
        "mechanic:passive",
      ]),
    );
  });

  it("tags icy-surface climb without checks", () => {
    const tags = extractRuneEffectTags(
      "While wearing this armor, you can move across and climb icy surfaces without needing to make an ability check. Additionally, difficult terrain composed of ice or snow doesn't cost it extra moment.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:movement",
        "mechanic:icy-surfaces",
        "mechanic:movement-climb",
        "mechanic:difficult-terrain",
        "mechanic:ignore-difficult-terrain",
        "mechanic:passive",
      ]),
    );
  });

  it("tags Evade Extender with save-bonus and defensive", () => {
    const tags = extractRuneEffectTags(
      "Evade Extender (S). You have a +1 bonus to Dexterity saving throws while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:save-bonus",
        "mechanic:save-dexterity",
        "mechanic:saving-throw",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
  });

  it("does not tag enemy Dexterity saves as save-dexterity", () => {
    const tags = extractRuneEffectTags(
      "Each creature in the line must make a DC 13 Dexterity saving throw, taking 3d6 lightning damage on a failed save.",
    );

    expect(tags).toContain("mechanic:saving-throw");
    expect(tags).not.toContain("mechanic:save-dexterity");
    expect(tags).not.toContain("mechanic:save-bonus");
  });

  it("tags ki recovery as class-resource recover", () => {
    const tags = extractRuneEffectTags(
      "(Monk Only) While you are attuned to this weapon, you may spend one minute contemplating the patterns etched on this weapon's surface and regain a number of expended ki points equal to half your proficiency modifier. Once you use this property, you cannot use it again until you finish a long rest.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "class:monk",
        "mechanic:ki",
        "mechanic:class-resource",
        "mechanic:recover-class-resource",
        "mechanic:long-rest",
        "mechanic:active",
      ]),
    );
    expect(tags).not.toContain("mechanic:passive");
  });

  it("tags Deadeye as attack-range (not major)", () => {
    const tags = extractRuneEffectTags(
      "(Ranged Weapon Only) Deadeye. Your weapon's normal attack range is increased by 20 feet.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "weapon-type:ranged",
        "mechanic:attack-range",
        "mechanic:passive",
      ]),
    );
    expect(tags).not.toContain("mechanic:attack-range:major");
  });

  it("tags Deadeye+ as attack-range major", () => {
    const tags = extractRuneEffectTags(
      "(Ranged Weapon Only) Deadeye+. Your weapon's normal attack range is doubled.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:attack-range",
        "mechanic:attack-range:major",
        "mechanic:passive",
      ]),
    );
  });

  it("does not tag Critical Eye as attack-range", () => {
    const tags = extractRuneEffectTags(
      "Critical Eye. Your weapon attacks critical hit range is increased by 1.",
    );

    expect(tags).not.toContain("mechanic:attack-range");
  });

  it("does not tag Tune-Up outside-range bonus as attack-range", () => {
    const tags = extractRuneEffectTags(
      "(Ranged Weapon Only) Tune-Up. You gain a +2 bonus to your attack rolls with this weapon if the target is outside of your normal attack range.",
    );

    expect(tags).not.toContain("mechanic:attack-range");
  });

  it("tags Channel Divinity extra use as class-resource without recover", () => {
    const tags = extractRuneEffectTags(
      "(Paladin & Cleric Only) You can use your channel divinity feature one additional time between rests.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:channel-divinity",
        "mechanic:class-resource",
      ]),
    );
    expect(tags).not.toContain("mechanic:recover-class-resource");
  });

  it("tags Expert Fisherman as gather-resources + fishing", () => {
    const tags = extractRuneEffectTags(
      "Expert Fisherman. When you catch fish, you instead catch two.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:gather-resources", "mechanic:fishing"]),
    );
    expect(tags).not.toContain("mechanic:gather-resources:major");
  });

  it("tags Botanist+ as major plant gather", () => {
    const tags = extractRuneEffectTags(
      "Botanist+. When you successfully gather a plant resource, you gather an extra 1d4 more.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:gather-resources",
        "mechanic:gather-resources:major",
        "mechanic:plant",
      ]),
    );
  });

  it("tags Geologist as mining gather without major", () => {
    const tags = extractRuneEffectTags(
      "Geologist. When you successfully gather a mining resource, you instead gather 2.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:gather-resources", "mechanic:mining"]),
    );
    expect(tags).not.toContain("mechanic:gather-resources:major");
  });

  it("does not tag Fortitude forage advantage as gather-resources", () => {
    const tags = extractRuneEffectTags(
      "Fortitude. You have advantage on survival skill checks to track, forage, or travel while you are attuned to this armor.",
    );

    expect(tags).not.toContain("mechanic:gather-resources");
    expect(tags).not.toContain("mechanic:foraging");
  });

  it("tags underwater without hold-breath for water breathing", () => {
    const tags = extractRuneEffectTags(
      "While you wear this armor, you have a swimming speed equal to your walking speed, you can breathe underwater, and you suffer no harm in water as cold as -20 degrees Fahrenheit.",
    );

    expect(tags).toContain("mechanic:underwater");
    expect(tags).not.toContain("mechanic:hold-breath");
    expect(tags).toContain("mechanic:temperature-tolerance");
    expect(tags).toContain("damage:cold");
    expect(tags).toContain("type:utility");
  });

  it("tags basic cold temperature tolerance on armor", () => {
    const tags = extractRuneEffectTags(
      "You suffer no harm in temperature as cold as -20 degrees Fahrenheit while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:temperature-tolerance",
        "damage:cold",
        "mechanic:passive",
        "type:utility",
      ]),
    );
    expect(tags).not.toContain("damage:fire");
  });

  it("tags heat temperature tolerance on armor", () => {
    const tags = extractRuneEffectTags(
      "You suffer no harm from temperatures as warm as 120 degrees Fahrenheit while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:temperature-tolerance",
        "damage:fire",
        "mechanic:passive",
        "type:utility",
      ]),
    );
    expect(tags).not.toContain("damage:cold");
  });

  it("tags extended cold tolerance (Hot Drink tier)", () => {
    const tags = extractRuneEffectTags(
      "While you wear this armor, you can tolerate temperatures as low as -50 degrees Fahrenheit without any additional protection. If you wear heavy clothes, you can tolerate temperatures as low as -100 degrees Fahrenheit.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:temperature-tolerance",
        "damage:cold",
        "type:utility",
      ]),
    );
  });

  it("tags dual hot and cold tolerance (Adaptability)", () => {
    const tags = extractRuneEffectTags(
      "Adaptability. You are always under the effects of both a Cool Drink and a Hot Drink while you are wearing this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:temperature-tolerance",
        "damage:cold",
        "damage:fire",
        "type:utility",
      ]),
    );
  });

  it("does not tag weapon freezing-temperature light shedding as temperature tolerance", () => {
    const tags = extractRuneEffectTags(
      "When you are in freezing temperatures, this weapon sheds bright light in a 10-foot radius and dim light for an additional 10 feet.",
    );

    expect(tags).not.toContain("mechanic:temperature-tolerance");
  });

  it("tags ranged pull on hit as forced-movement, ranged, bonus-action, offensive", () => {
    const tags = extractRuneEffectTags(
      "Whenever you hit a creature with a range weapon attack, you can use a bonus action to pull the creature 10 feet towards you.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:forced-movement",
        "weapon-type:ranged",
        "mechanic:bonus-action",
        "mechanic:active",
        "type:offensive",
      ]),
    );
  });

  it("tags jump-and-grab movement preservation", () => {
    const tags = extractRuneEffectTags(
      "While you are attuned to this armor, when you jump and grab onto an object or surface with your hand(s), the distance traveled does not count against your movement for the turn.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:jump-movement",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });

  it("tags partial exhaustion mitigation as defensive", () => {
    const tags = extractRuneEffectTags(
      "While you are attuned to this armor, you ignore the effects of the first 2 levels of exhaustion unless your exhaustion level is 3 or higher.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:exhaustion-mitigation",
        "mechanic:condition-exhaustion",
        "mechanic:condition",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
  });

  it("tags magic resistance on saves vs spells", () => {
    const tags = extractRuneEffectTags(
      "You have advantage on saving throws against spells while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:magic-resistance",
        "mechanic:saving-throw",
        "mechanic:advantage",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
  });

  it("tags reaction damage halving as damage-reduction and defensive", () => {
    const tags = extractRuneEffectTags(
      "While you are wearing this armor and an attacker that you can see hits you with an attack, you can use your reaction to halve the attack's damage against you. You can use this property a number of times equal to half your proficiency bonus (rounded down), regaining all expended uses when you finish a long rest.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:damage-reduction",
        "mechanic:reaction",
        "mechanic:long-rest",
        "mechanic:active",
        "type:defensive",
      ]),
    );
  });

  it("tags crit negation as defensive, not offensive", () => {
    const tags = extractRuneEffectTags(
      "While wearing this armor, any critical hit against you becomes a normal hit.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:crit-negation",
        "mechanic:critical",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
    expect(tags).not.toContain("type:offensive");
  });

  it("tags Elemental Atk Up with extra die and elemental damage types", () => {
    const tags = extractRuneEffectTags(
      "Elemental Atk Up. If your weapon deals cold, fire, lightning, or necrotic damage and you hit a creature with this weapon; roll one additional damage die for the elemental damage.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:extra-damage-die",
        "damage:cold",
        "damage:fire",
        "damage:lightning",
        "damage:necrotic",
        "type:offensive",
      ]),
    );
  });

  it("tags flavor-only dirty armor and maintenance-free weapons as cosmetic", () => {
    const armorTags = extractRuneEffectTags(
      "While wearing this armor, you are always dirty. You leave muddy footprints, your hands are always dirty, and shaking out your hair causes a small pile of dirt to form on the ground.",
    );
    const weaponTags = extractRuneEffectTags(
      "This weapon is so finely constructed it never needs maintenance, cannot rust or tarnish.",
    );

    expect(armorTags).toEqual(
      expect.arrayContaining(["type:cosmetic", "mechanic:passive"]),
    );
    expect(weaponTags).toEqual(
      expect.arrayContaining([
        "type:cosmetic",
        "mechanic:maintenance-free",
      ]),
    );
  });

  it("does not tag Protective Polish extra damage as cosmetic", () => {
    const tags = extractRuneEffectTags(
      "Protective Polish. This weapon is so finely constructed it never needs maintenance, cannot rust or tarnish, and deals an extra 1d6 weapon damage.",
    );

    expect(tags).not.toContain("type:cosmetic");
    expect(tags).toContain("mechanic:maintenance-free");
  });

  it("tags plane shift and generic save bonus together", () => {
    const tags = extractRuneEffectTags(
      "You gain a +1 bonus to saving throws while you wear this armor. You can use an action to enter the Elemental Plane of fire along with everything you are wearing and carrying. You remain there until you use an action to return to the plane you were on. You reappear in the last space you occupied, or if that space is occupied, the nearest unoccupied space. Once you use this property, you can't use it again until the next dawn.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:save-bonus",
        "mechanic:plane-shift",
        "mechanic:saving-throw",
        "mechanic:active",
        "type:defensive",
      ]),
    );
  });

  it("keeps named Critical Status as both critical and roll-20", () => {
    const tags = extractRuneEffectTags(
      "Critical Status (poison). When you make a weapon attack with this weapon, and roll a 20 for the attack roll, the target is poisoned until the end of its next turn.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:critical", "mechanic:roll-20"]),
    );
  });

  it("tags item-related effects from {@item} markup", () => {
    const tags = extractRuneEffectTags(
      "{@i Capture Novice.} While attuned to this armor, {@item tranq bomb|AGMH}s and {@item tranq ammo (1)|AGMH|tranq ammo} roll an extra 2d8 when they hit a creature.",
    );

    expect(tags).toContain("mechanic:item-related");
    expect(tags).not.toContain("mechanic:trap");
  });

  it("tags MH trap effects as item-related plus trap", () => {
    const tags = extractRuneEffectTags(
      "{@i Trap Master.} While you wear this armor, you can set {@item pitfall trap|AGMH}s or {@item shock trap|AGMH}s as a bonus action.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:item-related", "mechanic:trap"]),
    );
  });

  it("does not tag dungeon-detect wording as MH traps", () => {
    const tags = extractRuneEffectTags(
      "Your weapon has 3 runes. While holding it, you can use an action to expend 1 of its runes, and if a secret door or trap is within 30 feet of you, the weapon pulses and points at the one nearest to you.",
    );

    expect(tags).not.toContain("mechanic:trap");
    expect(tags).not.toContain("mechanic:item-related");
  });

  it("tags Pearl of Power–style 4th-level slot recovery", () => {
    const tags = extractRuneEffectTags(
      "You can use an action to speak this armor's command word and regain one expended spell slot of up to 4th level. Once you have used this effect, it can't be used again until the next dawn.",
    );

    expect(tags).toContain("mechanic:spell-slot:lvl4");
    expect(tags.some((tag) => tag.startsWith("mechanic:spell:"))).toBe(false);
    expect(tags.some((tag) => tag.startsWith("mechanic:healing"))).toBe(false);
  });

  it("tags 3rd-level slot recovery without treating it as a spell cast", () => {
    const tags = extractRuneEffectTags(
      "You can use an action to speak the command word and regain one expended spell slot of up to 3rd level. Once you have used this effect, it can't be used again until the next dawn.",
    );

    expect(tags).toContain("mechanic:spell-slot:lvl3");
    expect(tags).not.toContain("mechanic:spell-slot:lvl4");
  });

  it("tags unleveled Arcane Recovery boosts as generic spell-slot", () => {
    const tags = extractRuneEffectTags(
      "(Wizard Only) While attuned to this armor, you can recover spell slots with your arcane recovery that have a combined level that is equal to or less than half your Wizard level (rounded up) +1.",
    );

    expect(tags).toContain("mechanic:spell-slot");
    expect(tags.some((tag) => tag.startsWith("mechanic:spell-slot:lvl"))).toBe(
      false,
    );
  });

  it("does not tag casting without expending a slot as spell-slot recovery", () => {
    const tags = extractRuneEffectTags(
      "(Druids Only) While attuned to this weapon, you can use an action to cast the {@spell call lightning} spell from it twice per long rest, without expending a spell slot.",
      spellLevels,
    );

    expect(tags.some((tag) => tag.startsWith("mechanic:spell-slot"))).toBe(
      false,
    );
  });

  it("does not tag rune-charge upcasting as spell-slot recovery", () => {
    const tags = extractRuneEffectTags(
      "This weapon has 5 runes. You can increase the spell slot level by one for each additional rune you expend. This weapon regains 1d4 + 1 expended runes daily at dawn.",
    );

    expect(tags.some((tag) => tag.startsWith("mechanic:spell-slot"))).toBe(
      false,
    );
  });

  it("tags Moon-touched–style light shed in darkness", () => {
    const tags = extractRuneEffectTags(
      "While holding this weapon in darkness, it sheds moonlight, creating bright light in a 15-foot radius and dim light for an additional 15 feet.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:light",
        "mechanic:darkness",
        "mechanic:nonmagical-darkness",
        "mechanic:passive",
      ]),
    );
    expect(tags).not.toContain("mechanic:magical-darkness");
    expect(tags).not.toContain("mechanic:darkvision");
  });

  it("tags darkvision grants without magical-darkness", () => {
    const tags = extractRuneEffectTags(
      "While wearing this armor, you have darkvision out to a range of 60 feet. If you already have darkvision, your sight range increases by 60 feet.",
    );

    expect(tags).toContain("mechanic:darkvision");
    expect(tags).toContain("mechanic:passive");
    expect(tags).not.toContain("mechanic:darkness");
    expect(tags).not.toContain("mechanic:light");
  });

  it("tags magical and nonmagical darkness sight", () => {
    const tags = extractRuneEffectTags(
      "You can see normally in darkness, both magical and nonmagical, to a distance of 120 feet and you have advantage on Wisdom (Perception) checks that rely on sight while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:darkness",
        "mechanic:magical-darkness",
        "mechanic:nonmagical-darkness",
        "mechanic:advantage",
        "mechanic:passive",
      ]),
    );
    expect(tags).not.toContain("mechanic:darkvision");
  });

  it("tags Hide-in-dim-light darkness without producing light", () => {
    const tags = extractRuneEffectTags(
      "While in dim light or darkness, you can take the Hide action as a bonus action.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:darkness",
        "mechanic:nonmagical-darkness",
        "mechanic:bonus-action",
        "mechanic:active",
      ]),
    );
    expect(tags).not.toContain("mechanic:light");
    expect(tags).not.toContain("mechanic:magical-darkness");
  });

  it("tags light-snuffing weapons as darkness without light production", () => {
    const tags = extractRuneEffectTags(
      "When held, this weapon draws in light, snuffing all nonmagical flames within 30 feet out. It turns dim light into darkness and bright light into dim light.",
    );

    expect(tags).toContain("mechanic:darkness");
    expect(tags).toContain("mechanic:nonmagical-darkness");
    expect(tags).not.toContain("mechanic:light");
  });

  it("tags spell attack and save DC bonuses as spell-buff", () => {
    const tags = extractRuneEffectTags(
      "You gain a +2 bonus to your spell attack rolls and spell save DC while attuned to this weapon. This bonus increases to +4 when the spell you are casting deals fire damage.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:spell-buff:damage",
        "mechanic:spell-buff:save",
        "mechanic:passive",
        "type:offensive",
      ]),
    );
  });

  it("tags spaced + N and increase-by spell save wording", () => {
    const spaced = extractRuneEffectTags(
      "You gain a + 2 bonus to your spell attack rolls and spell save DC while attuned to this weapon.",
    );
    expect(spaced).toContain("mechanic:spell-buff:damage");
    expect(spaced).toContain("mechanic:spell-buff:save");

    const increaseOnly = extractRuneEffectTags(
      "When you cast a spell that deals fire damage, you increase the spell save DC by 1.",
    );
    expect(increaseOnly).toContain("mechanic:spell-buff:save");
    expect(increaseOnly).not.toContain("mechanic:spell-buff:damage");

    const gainPlus = extractRuneEffectTags(
      "You gain +3 to spell attack rolls and you ignore half cover when making a spell attack.",
    );
    expect(gainPlus).toContain("mechanic:spell-buff:damage");
    expect(gainPlus).not.toContain("mechanic:spell-buff:save");
  });

  it("does not tag rune-bank casting as spell-buff", () => {
    const tags = extractRuneEffectTags(
      "(Sorcerer & Wizard Only) The weapon has 10 runes. You can use an action to expend 1 or more of its runes to cast one of the following spells from it, using your spell save DC: cause fear (1 rune), ray of enfeeblement (2 runes). The weapon regains 1d6 + 4 expended runes daily at dawn.",
    );

    expect(tags).toContain("class:sorcerer");
    expect(tags).toContain("class:wizard");
    expect(tags.some((tag) => tag.startsWith("mechanic:spell-buff"))).toBe(
      false,
    );
  });

  it("tags armor AC bonuses", () => {
    const tags = extractRuneEffectTags(
      "You have a +1 bonus to your AC while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:armor-class",
        "mechanic:passive",
        "type:defensive",
      ]),
    );
  });

  it("tags Guard Up as save substitution without armor-class", () => {
    const tags = extractRuneEffectTags(
      "Guard Up When you fail a Dexterity or Strength saving throw, you can use your reaction to expend 1 of its runes to use your AC in place of your roll. You can use this property a number of times equal to your Constitution modifier, regaining all expended uses when you finish a long rest.",
    );

    expect(tags).toContain("mechanic:guard-up");
    expect(tags).toContain("mechanic:reaction");
    expect(tags).toContain("mechanic:saving-throw");
    expect(tags).not.toContain("mechanic:armor-class");
  });

  it("tags Coalescence attack-rolls + spell save DC as spell-buff:save", () => {
    const tags = extractRuneEffectTags(
      "Coalescence+. Whenever you succeed on a saving throw to end a condition, you gain a +2 bonus to your attack rolls and spell save DC, and your weapon or spell attacks deal an extra 1d8 cold damage until the end of your next turn.",
    );

    expect(tags).toContain("mechanic:spell-buff:save");
    expect(tags).toContain("mechanic:attack-roll");
  });

  it("tags hill-giant-strength potion replication", () => {
    const tags = extractRuneEffectTags(
      "While you are attuned to this weapon, you can use an action to gain the same benefits as a potion of hill giants strength for 1 hour. Once you use this property, you cannot use it again for 3 days.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:potion-effect",
        "mechanic:recharge-extended",
        "mechanic:active",
        "type:utility",
      ]),
    );
  });

  it("tags base AC unarmored defense", () => {
    const tags = extractRuneEffectTags(
      "If you aren't wearing light, medium, or heavy armor; your base Armor Class is 14 + your Dexterity modifier.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:armor-class",
        "mechanic:base-ac",
        "type:defensive",
        "type:utility",
      ]),
    );
  });

  it("tags extra-limb unarmed bonus-action package", () => {
    const tags = extractRuneEffectTags(
      "While attuned to this armor, you grow two additional arms. As a bonus action you can have the arms make two unarmed strikes. The strikes can only deal 1 + your strength modifier.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:extra-limbs",
        "mechanic:unarmed",
        "mechanic:bonus-action",
        "mechanic:active",
        "type:offensive",
      ]),
    );
  });

  it("tags light-snuffing with area and light-suppression", () => {
    const tags = extractRuneEffectTags(
      "When held, this weapon draws in light, snuffing all nonmagical flames within 20 feet out. It turns dim light into darkness and bright light into dim light.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:darkness",
        "mechanic:nonmagical-darkness",
        "mechanic:light-suppression",
        "mechanic:area",
        "type:utility",
      ]),
    );
    expect(tags).not.toContain("mechanic:light");
  });

  it("tags reaction halve damage with curly apostrophe in attack's", () => {
    const tags = extractRuneEffectTags(
      "While you are wearing this armor and an attacker that you can see hits you with an attack, you can use your reaction to halve the attack\u2019s damage against you. You can use this property a number of times equal to half your proficiency bonus (rounded down), regaining all expended uses when you finish a long rest.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:damage-reduction",
        "mechanic:reaction",
        "mechanic:long-rest",
        "type:defensive",
      ]),
    );
  });

  it("tags Rapid Morph weapon mode switch", () => {
    const tags = extractRuneEffectTags(
      "(Charge Blade & Switchaxe Only) Rapid Morph. While attuned to this weapon, you can switch its modes as a free action.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:weapon-mode",
        "weapon-type:charge-blade",
        "weapon-type:switchaxe",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });

  it("tags degrading mud AC coating", () => {
    const tags = extractRuneEffectTags(
      "Your armor is caked in a mud like substance increasing your AC by 3. Each time you are hit, some of the mud breaks off reducing the bonus by 1. The mud reforms on your armor when you finish a long rest.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:degrading-ac",
        "mechanic:armor-class",
        "mechanic:long-rest",
        "type:defensive",
        "mechanic:passive",
      ]),
    );
  });

  it("tags telescope transform utility", () => {
    const tags = extractRuneEffectTags(
      "While attuned to this weapon you can use an action to speak its commmand word, transforming it into a telescope for 10 minutes or a magnifying glass for 1 minute.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:item-transform",
        "mechanic:active",
        "type:utility",
      ]),
    );
  });

  it("tags Palamute Rally ally aura as support", () => {
    const tags = extractRuneEffectTags(
      "Palamute Rally. NPC allies within 10 feet of you gain a +1 bonus to their AC and attack rolls while you are attuned to this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:ally-aura",
        "mechanic:armor-class",
        "mechanic:attack-roll",
        "mechanic:area",
        "type:support",
        "type:defensive",
        "type:offensive",
        "mechanic:passive",
      ]),
    );
  });

  it("tags Dwarf Thrower ally throw", () => {
    const tags = extractRuneEffectTags(
      "Dwarf Thrower. While attuned to this armor you can use your Action to throw a willing ally that isn't grappled a number of feet equal to 5 times your Strength modifier. The ally lands as safely as possible in the space you throw them.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:ally-throw",
        "mechanic:condition-grappled",
        "mechanic:active",
        "type:support",
      ]),
    );
  });

  it("tags Powerhouse reaction AC rider", () => {
    const tags = extractRuneEffectTags(
      "Powerhouse. When you use a reaction that increases your AC and causes an attack that would hit to miss, the next attack with this weapon deals extra damage equal to your proficiency bonus.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:powerhouse",
        "mechanic:reaction",
        "mechanic:armor-class",
        "mechanic:active",
        "type:defensive",
      ]),
    );
  });

  it("tags extended summon shamos", () => {
    const tags = extractRuneEffectTags(
      "While holding this weapon, you can use an action to summon 1d4 shamos to your aid for 1 hour. They will act on your turn in the initiative and will flee if you or your allies attempt to harm either of them. One you use this property, you cannot use it again for 3 days.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:summon",
        "mechanic:recharge-extended",
        "mechanic:active",
        "type:utility",
      ]),
    );
  });

  it("tags fire damage type shift", () => {
    const tags = extractRuneEffectTags(
      "While you are holding this weapon, you can use an action to make this weapon deal fire damage instead of its normal damage type. This effect lasts one hour and cannot be used again until you have finished a long rest. You can use another action to end the effect before the duration expires.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:damage-type-shift",
        "damage:fire",
        "mechanic:long-rest",
        "mechanic:active",
      ]),
    );
  });

  it("tags dragonpiercer extra uses", () => {
    const tags = extractRuneEffectTags(
      "(Bow Only) Bow Charge Plus++. While attuned to this weapon, you can use your dragonpiercer three additional times between rests and it recharges after a Short or Long rest.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:dragonpiercer",
        "weapon-type:bow",
        "mechanic:short-rest",
        "mechanic:long-rest",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });

  it("tags conditional AC when below half hit points", () => {
    const tags = extractRuneEffectTags(
      "When you are below half of your maximum hit points, you can use your bonus action to increase your AC by 4 for 1 minute. Once you use this feature, you cannot use it again until you complete a short or long rest.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:conditional-ac",
        "mechanic:armor-class",
        "mechanic:bonus-action",
        "mechanic:short-rest",
        "mechanic:long-rest",
        "mechanic:active",
        "type:defensive",
      ]),
    );
  });

  it("tags crit no reactions without tagging terror wave fear", () => {
    const critTags = extractRuneEffectTags(
      "When you critically hit with this weapon, the target can't take reactions until the start of its next turn.",
    );
    const terrorTags = extractRuneEffectTags(
      "While holding it, you can use an action and expend 1 rune to release a wave of terror. Each creature of your choice in a 30-foot radius extending from you must succeed on a DC 19 Wisdom saving throw or become frightened of you for 1 minute. While it is frightened in this way, a creature must spend its turns trying to move as far away from you as it can, and it can't willingly move to a space within 30 feet of you. It also can't take reactions.",
    );

    expect(critTags).toEqual(
      expect.arrayContaining([
        "mechanic:crit-no-reactions",
        "mechanic:critical",
        "type:offensive",
      ]),
    );
    expect(terrorTags).not.toContain("mechanic:crit-no-reactions");
  });

  it("tags spell and attack resistance bypass variants", () => {
    const spellTags = extractRuneEffectTags(
      "While you are attuned to this weapon, your cold, fire, and lightning spells bypass a creatures resistance and immunities.",
    );
    const mindTags = extractRuneEffectTags(
      "Mind's Eye. Your attacks with this weapon bypass the damage resistances of any creature.",
    );
    const polishTags = extractRuneEffectTags(
      "Heavy Polish+. This weapon's attacks bypass a creature's immunity and resistance to slashing damage.",
    );

    expect(spellTags).toEqual(
      expect.arrayContaining([
        "mechanic:spell-bypass",
        "mechanic:resistance-bypass",
        "mechanic:immunity-bypass",
      ]),
    );
    expect(mindTags).toEqual(
      expect.arrayContaining(["mechanic:resistance-bypass"]),
    );
    expect(polishTags).toEqual(
      expect.arrayContaining([
        "mechanic:resistance-bypass",
        "mechanic:immunity-bypass",
        "damage:slashing",
      ]),
    );
  });

  it("tags Hasten Recovery healing dice reroll", () => {
    const tags = extractRuneEffectTags(
      "Hasten Recovery. When you regain hit points from magical healing, such as from the cure wounds spell or a potion of healing, you can reroll any 1s or 2s on the healing dice. You must use the new roll, even if it is a 1 or 2. If creatures other than you are targeted by the magical healing effect, they do not heal for the new value rolled.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:healing-reroll",
        "type:defensive",
        "mechanic:passive",
      ]),
    );
  });

  it("tags Flayer wound crit burst", () => {
    const tags = extractRuneEffectTags(
      "Flayer. When you score a critical hit against a target with a wound with this weapon, roll a d6. The target's wound closes, and it loses a number of hit points equal to the number rolled times the targets wound damage.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:wound-crit",
        "mechanic:critical",
        "type:offensive",
      ]),
    );
  });

  it("tags unarmed slashing upgrade package", () => {
    const tags = extractRuneEffectTags(
      "You are proficient in unarmed strikes while you are attuned to this weapon. Additionally, your unarmed strikes deal slashing damage instead of bludgeoning damage and you can use a d6 in place of the normal weapon damage dice with unarmed strikes.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:unarmed",
        "mechanic:unarmed-upgrade",
        "damage:slashing",
        "damage:bludgeoning",
        "mechanic:passive",
      ]),
    );
  });

  it("tags prehensile monkey tail utility", () => {
    const tags = extractRuneEffectTags(
      "While wearing this armor, you grow a monkey-like tail. You can use the tail to hold an object or stow or retrieve an item from your bags. The tail can't attack, activate magic items, or carry more than 15 pounds.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:prehensile-tail",
        "type:utility",
        "mechanic:passive",
      ]),
    );
  });

  it("tags Razor Sharp healing reduction and wound lock", () => {
    const tags = extractRuneEffectTags(
      "(Bladed Weapon Only) Razor Sharp. Once per turn, when you hit a creature with this weapon, anytime it would regain hit points before the end of its next turn, it regains half as many. Additionally, if the creature is afflicted with a wound, such as the odogaron's bloody wound, it can only be closed by magical healing for 1 minute.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:healing-reduction",
        "mechanic:wound-lock",
        "weapon-type:bladed",
        "type:offensive",
      ]),
    );
  });

  it("tags Combination Pro crafting max output", () => {
    const tags = extractRuneEffectTags(
      "Combination Pro. When you succeed on crafting an item while attuned to this weapon, you gain the maximum number possible.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:crafting-max",
        "type:utility",
        "mechanic:passive",
      ]),
    );
  });

  it("tags Filthy Rich gold doubling", () => {
    const tags = extractRuneEffectTags(
      "Filthy Rich. While attuned to this armor, the gold you receive as a reward magically doubles, but only if you were attuned to this armor for the duration of the hunt or quest.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:gold-double",
        "type:utility",
        "mechanic:passive",
      ]),
    );
  });

  it("tags ability score floor while attuned", () => {
    const tags = extractRuneEffectTags(
      "Your Strength score is 29 while you are attuned to this weapon. It has no effect on you if your Strength is already 29 or higher.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:ability-score-set",
        "mechanic:passive",
      ]),
    );
  });

  it("tags ability score floor with shortened attuned wording", () => {
    const tags = extractRuneEffectTags(
      "Your Strength score is 19 while attuned to this weapon. It has no effect on you if your Strength is already 19 or higher.",
    );

    expect(tags).toContain("mechanic:ability-score-set");
  });

  it("tags charge attack bonus for hammer and lance", () => {
    const tags = extractRuneEffectTags(
      "(Hammer & Lance Only) You gain a +1 bonus to your attack rolls if you move 20 feet in a straight line towards a creature without taking damage.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:charge-attack",
        "mechanic:attack-roll",
        "weapon-type:hammer",
        "weapon-type:lance",
        "type:offensive",
      ]),
    );
  });

  it("tags fishing advantage without gather-resources yield", () => {
    const tags = extractRuneEffectTags(
      "You have advantage on checks to find a fishing spot and to catch any fish while you wear this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:fishing", "mechanic:advantage"]),
    );
    expect(tags).not.toContain("mechanic:gather-resources");
  });

  it("tags cosmetic eye glow as flavor-only", () => {
    const tags = extractRuneEffectTags(
      "While you wear this armor, your eye's glow red at night, much like the nargacuga's.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["type:cosmetic", "mechanic:passive"]),
    );
  });

  it("tags gliding membrane and fall-control armor effects", () => {
    const tags = extractRuneEffectTags(
      "When you place this material into your armor it gains a gliding membrane, which extends from your forearms to your hindlegs. As an action or reaction, you can extend your arms to reduce your fall speed to 10 feet per round while traveling in a forward motion until you reach the ground, you are grappled, or you use your action to end the effect early.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:glide",
        "mechanic:reaction",
        "mechanic:condition-grappled",
        "mechanic:active",
        "type:utility",
      ]),
    );
  });

  it("tags Strong Winds immunity and steam flavor cosmetic", () => {
    expect(
      extractRuneEffectTags(
        "While you are attuned to this armor, you and your equipment suffer no ill effects from Strong Winds.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:wind-resist",
        "type:defensive",
        "mechanic:passive",
      ]),
    );

    expect(
      extractRuneEffectTags(
        "When you are agitated, angry, or annoyed while wearing this armor, steam radiates from it and creates minute explosions around you.",
      ),
    ).toEqual(
      expect.arrayContaining(["type:cosmetic", "mechanic:passive"]),
    );
  });

  it("tags spell replication, psychoserum extend, and Bloodrage haste", () => {
    expect(
      extractRuneEffectTags(
        "Whenever you finish a long rest, you gain the benefits of the Heroes' Feast spell.",
      ),
    ).toEqual(
      expect.arrayContaining(["mechanic:spell:lvl6", "mechanic:long-rest"]),
    );

    expect(
      extractRuneEffectTags(
        "Psychic. When you drink a psychoserum (AGtMH p.64), the effects last an additional 1d6 days.",
      ),
    ).toEqual(
      expect.arrayContaining(["mechanic:psychoserum-extend", "type:utility"]),
    );

    expect(
      extractRuneEffectTags(
        "(Barbarian only) Bloodrage. When you are reduced below half of your maximum hit points while raging, you can use your reaction to enter a bloodrage until your rage ends. When in a bloodrage, you gain the effects of the haste spell, but you do not need to concentrate on it.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "class:barbarian",
        "mechanic:spell:lvl3",
        "mechanic:reaction",
        "mechanic:active",
      ]),
    );
  });

  it("tags indigo marks, language command phrase, and anti-tracking", () => {
    expect(
      extractRuneEffectTags(
        "The bearer can use this weapon to make indigo colored marks on any surface. The marks will fade away in 24 hours.",
      ),
    ).toEqual(expect.arrayContaining(["type:cosmetic"]));

    expect(
      extractRuneEffectTags(
        'While touching this weapon you can speak its command phrase: "The limits of my language are the limits of my world" to gain proficiency in any language of your choice for 24 hours.',
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:proficiency-language",
        "type:utility",
      ]),
    );

    expect(
      extractRuneEffectTags(
        "While wearing this armor all creatures have disadvantage on skills checks when trying to track you.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:anti-tracking",
        "mechanic:disadvantage",
        "mechanic:skill-survival",
        "type:defensive",
      ]),
    );
  });

  it("tags Acrobatic skill alias, grapple contest, and conditional speed", () => {
    expect(
      extractRuneEffectTags(
        "You have advantage on Acrobatic checks while you wear this armor.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:skill-acrobatics",
        "mechanic:advantage",
        "mechanic:passive",
      ]),
    );

    expect(
      extractRuneEffectTags(
        "While you are attuned to this weapon, whenever a creature attempts to break a grapple with you, you make your skill check with advantage.",
      ),
    ).toEqual(
      expect.arrayContaining(["mechanic:grapple-contest", "mechanic:advantage"]),
    );

    expect(
      extractRuneEffectTags(
        "While attuned to this weapon, your movement speed is doubled whenever you use your movement to close the distance between you and the last creature you hit.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:conditional-speed",
        "mechanic:movement",
        "type:utility",
      ]),
    );
  });

  it("tags invisibility reaction, stamina recovery, and terrain damage shift", () => {
    expect(
      extractRuneEffectTags(
        "While you are wearing this armor and you take damage, you can use your reaction to magically turn invisible until the start of your next turn or until you attack, make a damage roll, or force someone to make a saving throw.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:invisibility-reaction",
        "mechanic:condition-invisible",
        "mechanic:reaction",
        "type:defensive",
      ]),
    );

    expect(
      extractRuneEffectTags(
        "Stamina Recovery. When you take a long rest, you reduce your exhaustion by 5 levels instead of 1.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:exhaustion-recovery",
        "mechanic:condition-exhaustion",
        "type:defensive",
      ]),
    );

    expect(
      extractRuneEffectTags(
        "While attuned to this weapon you can use your bonus action to scoop up a piece of the terrain you are on and coat your weapon with it. The coating lasts for 1 minute and changes the damage type your weapon deals based on the table found in the Chatacabra stat block.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:damage-type-shift",
        "mechanic:bonus-action",
        "type:offensive",
      ]),
    );
  });

  it("tags Kut-Ku horn deafened suppress and Xu Wu disengage-hide", () => {
    expect(
      extractRuneEffectTags(
        "As a bonus action, you can conjure a horn in the shape of the Kut-Ku's ear. When held up to your ear, this horn suppresses the effects of the deafened condition on you, allowing you to hear normally.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:condition-suppress",
        "mechanic:condition-deafened",
        "mechanic:bonus-action",
        "type:utility",
      ]),
    );

    expect(
      extractRuneEffectTags(
        "While attuned to this armor you can take the Disengage or Hide action as a bonus action. Once you use this property you can't use it again until you finish a long rest.",
      ),
    ).toEqual(
      expect.arrayContaining([
        "mechanic:disengage-hide",
        "mechanic:bonus-action",
        "type:utility",
      ]),
    );
  });

  it("tags help-action ally magic weapon buff", () => {
    const tags = extractRuneEffectTags(
      "Whenever the bearer of this weapon takes a help action in combat, the aided ally can treat its weapon as a +1 magic weapon until the end of its next turn.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:help-action", "type:support"]),
    );
  });

  it("tags buried material sense as activated mining utility", () => {
    const tags = extractRuneEffectTags(
      "While attuned to this weapon you can stab it into the ground to sense the presence of buried materials. Once you use this property, you can't use it again for 1 hour.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:material-sense",
        "mechanic:mining",
        "mechanic:gather-resources",
        "mechanic:recharge-hourly",
        "mechanic:active",
        "type:utility",
      ]),
    );
  });

  it("tags Strength (Athletic) mine ore skill bonus", () => {
    const tags = extractRuneEffectTags(
      "You gain a +2 bonus to Strength (Athletic) checks to mine ore.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:skill-bonus",
        "mechanic:skill-athletics",
        "mechanic:mining",
        "type:utility",
      ]),
    );
    expect(tags).not.toContain("mechanic:gather-resources");
  });

  it("tags spider-climb wording as climbing movement", () => {
    const tags = extractRuneEffectTags(
      "While you hold this weapon, you can move up, down, and across vertical surfaces and upside down along ceilings, while leaving your hands free.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:climbing",
        "mechanic:movement",
        "type:utility",
      ]),
    );
  });

  it("tags breathe-any-environment and gas save advantage", () => {
    const tags = extractRuneEffectTags(
      "While wearing this armor, you can breathe normally in any Environment, and you have advantage on saving throws made against harmful gases and vapors (such as cloudkill and stinking cloud effects, inhaled poisons, and the breath weapons of some dragons).",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:breathe-any-environment",
        "mechanic:against-condition",
        "mechanic:advantage",
        "type:defensive",
      ]),
    );
  });

  it("tags improvised weapon proficiency", () => {
    const tags = extractRuneEffectTags(
      "You are proficient with improvised weapons while attuned to this weapon.",
    );

    expect(tags).toContain("mechanic:proficiency-improvised");
  });

  it("tags ability score increase on armor", () => {
    const tags = extractRuneEffectTags(
      "Increase your Dexterity score by 1, to a maximum of 20 while you wear this armor.",
    );

    expect(tags).toContain("mechanic:ability-score-increase");
  });

  it("tags reckless barbarian extra attack", () => {
    const tags = extractRuneEffectTags(
      "(Barbarian only) After you make a weapon attack while attacking recklessly with this weapon, you may make another attack with the same weapon against a different creature that is within 5 feet of the original target that is within range of this weapon. You can use this property once per turn.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "class:barbarian",
        "mechanic:extra-attack",
        "type:offensive",
      ]),
    );
  });

  it("tags on-hit push as offensive", () => {
    const tags = extractRuneEffectTags(
      "When you hit a Huge or smaller creature with this weapon, it must succeed on a DC 17 Strength check or be pushed back 5 feet.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:push", "type:offensive"]),
    );
  });

  it("tags regeneration armor healing as major", () => {
    const tags = extractRuneEffectTags(
      "While wearing this armor, you regain 1d6 Hit Points every 10 minutes, provided that you have at least 1 hit point. If you lose a body part, the armor causes the missing part to regrow and return to full functionality after 1d6 + 1 days if you have at least 1 hit point the whole time.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:regeneration",
        "mechanic:healing:major",
      ]),
    );
  });

  it("tags Psychic Vision creature sense and vulnerability", () => {
    const tags = extractRuneEffectTags(
      "Psychic Vision. While you are attuned to this armor, you know the location of all creatures within 60 feet of you, but you are vulnerable to psychic damage.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:creature-sense",
        "mechanic:vulnerability",
        "mechanic:area",
        "damage:psychic",
        "type:utility",
        "mechanic:passive",
      ]),
    );
  });

  it("tags Everlasting consumable duration extension", () => {
    const tags = extractRuneEffectTags(
      "Everlasting. The duration of consumable items is doubled while you are attuned to this armor and you no longer need to concentrate on the effect if the consumable normally requires it.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:consumable-extend",
        "type:utility",
        "mechanic:passive",
      ]),
    );
  });

  it("tags lightning signal flare", () => {
    const tags = extractRuneEffectTags(
      "While holding this weapon, you can use an action to shoot a harmless spark of lightning into the air. In the open, this flare is visible for up to 1 mile.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:signal-flare",
        "mechanic:active",
        "type:utility",
      ]),
    );
  });

  it("tags ice reservoir difficult terrain", () => {
    const tags = extractRuneEffectTags(
      "This weapon has a reservoir of ice magic that can freeze the ground. While holding it, you can use a bonus action to plant the weapon in the ground, releasing the ice magic within, causing the ground in a 15-foot radius around the weapon to become icy and difficult terrain for the duration, or until you remove from the ground as a bonus action.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:ice-reservoir",
        "mechanic:difficult-terrain",
        "mechanic:bonus-action",
        "mechanic:area",
        "mechanic:movement",
        "type:utility",
      ]),
    );
  });

  it("tags blight swap by weapon type", () => {
    const tags = extractRuneEffectTags(
      "Depending on which weapon this material is placed into, it gains the following benefits: Bow. When you hit a creature with a poison coated arrow, you can inflict iceblight instead of the poisoned condition. Dual Repeaters. Your cryo ammo now inflicts iceblight instead of waterblight when empowered.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:blight-swap",
        "mechanic:condition-iceblight",
        "mechanic:condition-waterblight",
        "mechanic:condition-poisoned",
      ]),
    );
  });

  it("tags Cliffhanger climb speed and muddy terrain immunity", () => {
    const climbTags = extractRuneEffectTags(
      "Cliffhanger. While wearing this armor, you have a climb speed equal to your walking speed.",
    );
    const mudTags = extractRuneEffectTags(
      "You do not suffer from difficult terrain in muddy or swamp terrain while wearing this armor.",
    );

    expect(climbTags).toEqual(
      expect.arrayContaining([
        "mechanic:climbing",
        "mechanic:movement",
        "type:utility",
        "mechanic:passive",
      ]),
    );
    expect(mudTags).toEqual(
      expect.arrayContaining([
        "mechanic:ignore-difficult-terrain",
        "mechanic:difficult-terrain",
        "mechanic:movement",
        "type:utility",
        "mechanic:passive",
      ]),
    );
  });

  it("tags Ammo Up capacity and coating", () => {
    const tags = extractRuneEffectTags(
      "(Range Weapon Only) Ammo Up. Your bowgun's normal ammo capacity doubles while you are attuned to this weapon. Additionally, when coating, you can coat up to 10 additional arrows.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:ammo-capacity",
        "weapon-type:ranged",
        "type:utility",
        "mechanic:passive",
      ]),
    );
  });
});

describe("extractRuneEffectTags — proficiency, utility, and defense patterns", () => {
  it("tags extinguish flames on draw with light-suppression and hourly recharge", () => {
    const tags = extractRuneEffectTags(
      "While you are attuned to this weapon you can draw it, to extinguish all nonmagical flames within 30 feet of you. This property can be used no more than once per hour.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:area",
        "mechanic:light-suppression",
        "mechanic:recharge-hourly",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });

  it("tags tool proficiency choice on attune", () => {
    const tags = extractRuneEffectTags(
      "When you attune to this armor, you gain proficiency with either alchemist's supplies or tinker's tools. You can change which tool you are proficient with daily at dawn.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:proficiency-tool",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });

  it("tags Athletic skill proficiency while attuned", () => {
    const tags = extractRuneEffectTags(
      "You have proficiency in the Athletic skill while you are attuned to this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:proficiency-skill",
        "mechanic:skill-athletics",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });

  it("tags instrument proficiency and expertise", () => {
    const tags = extractRuneEffectTags(
      "You gain proficiency with the Horn musical instruments. If you are already proficient, you double your proficiency bonus when using it.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:proficiency-instrument",
        "mechanic:expertise",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });

  it("tags long-rest inspiration via Performance", () => {
    const tags = extractRuneEffectTags(
      "Whenever you finish a long rest you can attempt a DC 15 Charisma (Performance) check using an instrument you are proficient with. On a success, you gain inspiration if you do not already have it.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:long-rest",
        "mechanic:skill-performance",
        "mechanic:inspiration",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });

  it("tags crystal cosmetic appearance", () => {
    const tags = extractRuneEffectTags(
      "When you attune to this weapon, a layer of crystals forms over it. The weapon glimmers in the light, with jagged edges that seem to catch and refract the surrounding light in a mesmerizing display.",
    );

    expect(tags).toEqual(expect.arrayContaining(["type:cosmetic"]));
  });

  it("tags Crystallography mining major gather", () => {
    const tags = extractRuneEffectTags(
      "Crystallography. When you roll for a mineral resource roll 2d6 and take the higher of the two as your result to determine what type of mineral you obtained and you gather two of that mineral instead of one.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:mining",
        "mechanic:gather-resources",
        "mechanic:gather-resources:major",
        "type:utility",
      ]),
    );
  });

  it("tags Hunting Horn Jingle miss trigger", () => {
    const tags = extractRuneEffectTags(
      "(Hunting Horn Only) Jingle. When you miss a hostile creature with this weapon, you can choose to elicit a number of notes equal to half of your hunting horn's cord length as a bonus action.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "weapon-type:hunting-horn",
        "mechanic:miss-trigger",
        "mechanic:bonus-action",
        "mechanic:active",
      ]),
    );
  });

  it("tags poison coat save DC boost", () => {
    const tags = extractRuneEffectTags(
      "If you coat this weapon with poison, the poisons save DC is increased by 5.",
    );

    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:poison-dc-boost"]),
    );
  });

  it("tags bowgun ammo unlock variant", () => {
    const tags = extractRuneEffectTags(
      "(Bowgun only) Depending on which weapon this material is placed into, it gains the following benefits: Light Bowgun. This weapon can now use the heavy bowgun's slicing ammo and wyvern ammo. Heavy Bowgun This weapon can now use the light bowgun's armor ammo and demon ammo.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "weapon-type:bowgun",
        "weapon-type:light-bowgun",
        "weapon-type:heavy-bowgun",
        "mechanic:weapon-variant",
        "mechanic:ammo-unlock",
        "type:utility",
      ]),
    );
  });

  it("tags forced movement reduction reaction", () => {
    const tags = extractRuneEffectTags(
      "While you wear this armor, if an effect moves you against your will along the ground, you can use your reaction to reduce the distance you are moved by up to 10 feet.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:reaction",
        "mechanic:forced-movement-reduction",
        "mechanic:active",
        "type:defensive",
      ]),
    );
  });

  it("tags conjure horns action", () => {
    const tags = extractRuneEffectTags(
      "While attuned to this armor, you can use an action to speak its command word and conjure an Armor Horn, Antidote Horn, Field Horn, or Health Horn into your hands. You do not need to be attuned to the horn to use it, and it does not occupy a trinket slot. The horn persists for 1 hour or until used, at which point it vanishes.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:conjure-item",
        "mechanic:item-related",
        "mechanic:active",
        "type:utility",
      ]),
    );
  });

  it("tags conditional fire save bonus", () => {
    const tags = extractRuneEffectTags(
      "Whenever you make a saving throw against an attack or spell that deals fire damage, you do so with a +2 bonus.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:saving-throw",
        "mechanic:save-bonus",
        "damage:fire",
        "type:defensive",
        "mechanic:passive",
      ]),
    );
  });

  it("tags nonmagical damage resistance and limited immunity", () => {
    const tags = extractRuneEffectTags(
      "You have resistance to nonmagical damage while you wear this armor. Additionally, you can use an action to make yourself immune to nonmagical damage for 10 minutes or until you are no longer wearing the armor. Once this special action is used, it can't be used again until the next dawn.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:resistance",
        "mechanic:immunity",
        "mechanic:nonmagical-damage-defense",
        "type:defensive",
        "mechanic:active",
      ]),
    );
  });

  it("tags Pro Herbology herb consumption", () => {
    const tags = extractRuneEffectTags(
      "Pro Herbology. Instead of rolling 1d4 when you eat an herb, you roll a die equal to your hit die while attuned to this armor.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:herb-consumption",
        "mechanic:plant",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });

  it("tags Dreadqueen save DC boost and consumable share", () => {
    const tags = extractRuneEffectTags(
      "Dreadqueen. While attuned to this armor, your save DC for condition causing effects, such as the sleep spell, or a material effect, is increased by 2. Additionally, when you use Herbs, Antidotes, Cool Drinks, Hot Drinks, Adamant Seeds, or Might Seeds; all other creatures within a 20-foot radius of you gain its effect.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:save-dc-boost",
        "mechanic:consumable-share",
        "mechanic:area",
        "type:support",
        "mechanic:passive",
      ]),
    );
  });
});

describe("isPlaceableRune", () => {
  it("accepts armor/weapon slot materials and rejects empty (O) slots", () => {
    expect(
      isPlaceableRune({
        slots: ["A"],
        armorEffect: "You have resistance to fire damage.",
        weaponEffect: null,
      }),
    ).toBe(true);
    expect(
      isPlaceableRune({
        slots: ["W"],
        armorEffect: null,
        weaponEffect: "Your weapon deals an extra 1d6 fire damage.",
      }),
    ).toBe(true);
    expect(
      isPlaceableRune({
        slots: ["A", "W"],
        armorEffect: "You have resistance to fire damage.",
        weaponEffect: "Your weapon deals an extra 1d6 fire damage.",
      }),
    ).toBe(true);
    expect(
      isPlaceableRune({ slots: [], armorEffect: null, weaponEffect: null }),
    ).toBe(false);
    expect(
      isPlaceableRune({
        slots: ["A"],
        armorEffect: null,
        weaponEffect: null,
      }),
    ).toBe(false);
  });
});

describe("normalizeLootChance", () => {
  it("collapses dash glyphs to ASCII hyphen", () => {
    expect(normalizeLootChance("—")).toBe("-");
    expect(normalizeLootChance("–")).toBe("-");
    expect(normalizeLootChance("-")).toBe("-");
    expect(normalizeLootChance("1-4")).toBe("1-4");
  });
});

describe("stripMaterialQuantity", () => {
  it("removes leading and trailing quantity multipliers", () => {
    expect(stripMaterialQuantity("B.Sleep Sac x2")).toBe("B.Sleep Sac");
    expect(stripMaterialQuantity("2x Paddock Oil")).toBe("Paddock Oil");
    expect(stripMaterialQuantity("Elder Dragon Blood X2")).toBe(
      "Elder Dragon Blood",
    );
    expect(stripMaterialQuantity("White Liver")).toBe("White Liver");
  });
});

describe("backfillSharedOtherEffects", () => {
  it("copies otherEffect onto O-slot materials missing a local description", () => {
    const filled = backfillSharedOtherEffects([
      {
        name: "White Liver",
        monsterName: "Anteka",
        monsterSource: "MHMM",
        monsterCr: "0",
        monsterCrs: ["0"],
        tier: 1,
        carveChance: "5-6",
        captureChance: "-",
        rolls: 1,
        slots: [],
        armorEffect: null,
        weaponEffect: null,
        otherEffect:
          "A white-colored liver, popular for its juicy texture. Sells for 100 gp.",
        tags: [],
        weaponTags: [],
        armorTags: [],
      },
      {
        name: "White Liver",
        monsterName: "Kelbi",
        monsterSource: "MHMM",
        monsterCr: "0",
        monsterCrs: ["0"],
        tier: 1,
        carveChance: "5-6",
        captureChance: "-",
        rolls: 1,
        slots: [],
        armorEffect: null,
        weaponEffect: null,
        otherEffect: null,
        tags: [],
        weaponTags: [],
        armorTags: [],
      },
    ]);

    expect(filled[1]?.otherEffect).toBe(
      "A white-colored liver, popular for its juicy texture. Sells for 100 gp.",
    );
  });

  it("matches quantity-suffixed loot names to a base otherEffect", () => {
    const filled = backfillSharedOtherEffects([
      {
        name: "Elder Dragon Blood",
        monsterName: "Kirin",
        monsterSource: "MHMM",
        monsterCr: "10",
        monsterCrs: ["10"],
        tier: 2,
        carveChance: "1",
        captureChance: "-",
        rolls: 3,
        slots: [],
        armorEffect: null,
        weaponEffect: null,
        otherEffect: "Any rarity weapon upgrade material.",
        tags: [],
        weaponTags: [],
        armorTags: [],
      },
      {
        name: "Elder Dragon Blood x2",
        monsterName: "Zorah Magdaros",
        monsterSource: "MHMM",
        monsterCr: "20",
        monsterCrs: ["20"],
        tier: 4,
        carveChance: "1",
        captureChance: "-",
        rolls: 3,
        slots: [],
        armorEffect: null,
        weaponEffect: null,
        otherEffect: null,
        tags: [],
        weaponTags: [],
        armorTags: [],
      },
    ]);

    expect(filled[1]?.otherEffect).toBe("Any rarity weapon upgrade material.");
  });
});

describe("mapRunesFromMonster — OTHER MATERIAL EFFECTS", () => {
  it("maps otherEffect from the OTHER MATERIAL EFFECTS list", () => {
    const runes = mapRunesFromMonster({
      name: "Kelbi",
      source: "MHMM",
      cr: "0",
      fluff: {
        entries: [
          {
            type: "inset",
            name: "Kelbi",
            entries: [
              {
                type: "table",
                rows: [["Challenge Rating", "0", "Carves", "1"]],
              },
              {
                type: "table",
                colLabels: ["Carve Chance", "Material", "Slots"],
                rows: [
                  ["1-4", "Raw Meat", "(O)"],
                  ["12-20", "Kelbi Horn", "(O)"],
                  ["7-11", "Warm Pelt", "(A)"],
                ],
              },
              {
                type: "list",
                name: "ARMOR MATERIAL EFFECTS",
                items: [
                  {
                    type: "entries",
                    name: "Warm Pelt",
                    entries: [
                      "You reduce thunder damage you take by 2 while you wear this armor.",
                    ],
                  },
                ],
              },
              {
                type: "list",
                name: "OTHER MATERIAL EFFECTS",
                items: [
                  {
                    type: "entries",
                    name: "Raw Meat",
                    entries: ["Provides 2 days rations when cooked."],
                  },
                  {
                    type: "entries",
                    name: "Kelbi Horn",
                    entries: [
                      "A crafting material that is ground up and combined with {@item mega nutrients|AGMH} to create {@item ancient potion|AGMH}s.",
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    const rawMeat = runes.find((r) => r.name === "Raw Meat");
    const horn = runes.find((r) => r.name === "Kelbi Horn");
    const pelt = runes.find((r) => r.name === "Warm Pelt");

    expect(rawMeat).toMatchObject({
      slots: [],
      armorEffect: null,
      weaponEffect: null,
      otherEffect: "Provides 2 days rations when cooked.",
    });
    expect(horn?.otherEffect).toContain("mega nutrients");
    expect(pelt).toMatchObject({
      slots: ["A"],
      otherEffect: null,
      armorEffect:
        "You reduce thunder damage you take by 2 while you wear this armor.",
    });
  });

  it("matches OTHER entries when loot name has a quantity suffix", () => {
    const runes = mapRunesFromMonster({
      name: "Great Baggi",
      source: "MHMM",
      cr: "2",
      fluff: {
        entries: [
          {
            type: "inset",
            name: "Great Baggi",
            entries: [
              {
                type: "table",
                rows: [["Challenge Rating", "2", "Carves", "2"]],
              },
              {
                type: "table",
                colLabels: [
                  "Carve Chance",
                  "Capture Chance",
                  "Material",
                  "Slots",
                ],
                rows: [["3-5", "1-5", "B.Sleep Sac x2", "(O)"]],
              },
              {
                type: "list",
                name: "OTHER MATERIAL EFFECTS",
                items: [
                  {
                    type: "item",
                    name: "B.Sleep Sac",
                    entries: [
                      "A Material that replaces the sleep herb when crafting tranq bombs or tranq ammo.",
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(runes[0]).toMatchObject({
      name: "B.Sleep Sac x2",
      slots: [],
      otherEffect:
        "A Material that replaces the sleep herb when crafting tranq bombs or tranq ammo.",
    });
  });

  it("matches armor effects when loot name uses a tier suffix variant", () => {
    const runes = mapRunesFromMonster({
      name: "Test",
      source: "MHMM",
      cr: "5",
      fluff: {
        entries: [
          {
            type: "inset",
            name: "Test",
            entries: [
              {
                type: "table",
                rows: [["Challenge Rating", "5", "Carves", "3"]],
              },
              {
                type: "table",
                colLabels: ["Carve Chance", "Material", "Slots"],
                rows: [["1-6", "Marathon Runner", "(A)"]],
              },
              {
                type: "list",
                name: "ARMOR MATERIAL EFFECTS",
                items: [
                  {
                    type: "entries",
                    name: "Marathon Runner+",
                    entries: [
                      "Marathon Runner+. While wearing this armor, your walking speed increases by 10 feet.",
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });

    expect(runes[0]?.armorEffect).toContain("walking speed increases by 10");
  });
});

describe("extractRuneEffectTags — reviewed inline MHMM patterns", () => {
  it("tags no-opportunity-attacks melee rider as defensive", () => {
    const tags = extractRuneEffectTags(
      "When you make a melee attack against a creature while wearing this armor, you don't provoke opportunity attacks from that creature for the rest of the turn, whether you hit or not.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:no-opportunity-attacks",
        "type:defensive",
        "mechanic:passive",
      ]),
    );
  });

  it("tags bonus-action charge movement toward an enemy", () => {
    const tags = extractRuneEffectTags(
      "While attuned to this weapon, you can use a bonus action to move up to half your movement speed towards an enemy creature.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:charge-movement",
        "mechanic:movement",
        "mechanic:bonus-action",
        "mechanic:active",
      ]),
    );
  });

  it("tags Intelligence (History) as a bonus-action skill", () => {
    const tags = extractRuneEffectTags(
      "While you are attuned to this armor, you can make Intelligence (History) checks as a bonus action.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:skill-history",
        "mechanic:skill-bonus-action",
        "mechanic:bonus-action",
      ]),
    );
  });

  it("tags plural resistances and all damage types", () => {
    const tags = extractRuneEffectTags(
      "You have resistances to fire, lightning, and necrotic damage while you wear this armor.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:resistance",
        "damage:fire",
        "damage:lightning",
        "damage:necrotic",
        "type:defensive",
      ]),
    );
  });

  it("tags cook's utensils proficiency as tool proficiency", () => {
    const tags = extractRuneEffectTags(
      "You have proficiency with cook's utensils while you are attuned to this armor.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:proficiency-tool", "type:utility"]),
    );
  });

  it("tags dull-tip spines as cosmetic flavor", () => {
    const tags = extractRuneEffectTags(
      "While attuned to this armor, it grows numerous dull tip spines which rise and move when agitated or in danger.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["type:cosmetic", "mechanic:passive"]),
    );
  });

  it("tags web-linked creature location sense", () => {
    const tags = extractRuneEffectTags(
      "While in contact with a web, you know the exact location of any other creature in contact with the same web.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:web-sense", "type:utility"]),
    );
  });

  it("tags poison save-failure-margin unconscious rider as offensive", () => {
    const tags = extractRuneEffectTags(
      "When you poison a creature and it fail the saving throw by 5 or more, the creature falls unconscious until it takes damage, are shaken awake, or the poison is removed.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:save-failure-margin",
        "mechanic:condition-unconscious",
        "type:offensive",
      ]),
    );
  });

  it("tags hidden door detection on penguin emblem weapons", () => {
    const tags = extractRuneEffectTags(
      "Your weapon is adorned with a penguin emblem when you place this material into it. While attuned to it, it emits a faint cooing sound when in the presence of hidden doors or passages.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:hidden-sense", "type:utility"]),
    );
  });

  it("tags extreme cold immunity and temperature tolerance", () => {
    const tags = extractRuneEffectTags(
      "The air around you is always unnaturally cold while you wear this armor. Your breath becomes visible, and frost continually forms on the surface of your hair, weapons, and armor. Additionally, you suffer no ill effect from being in extremely cold environments.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:temperature-tolerance",
        "damage:cold",
        "type:utility",
      ]),
    );
  });

  it("tags once-per-long-rest save reroll", () => {
    const tags = extractRuneEffectTags(
      "While you wear this armor, you can pass a Dexterity saving throw you otherwise would have failed. Once used, this property can't be used again until you finish a long rest.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:save-reroll",
        "mechanic:long-rest",
        "type:defensive",
      ]),
    );
  });

  it("tags composite material-effect stacking", () => {
    const tags = extractRuneEffectTags(
      "Rajang Will. While attuned to this weapon you gain the benefits of both the Rajang Apoplexy and Rajang Hardclaw weapon material effects.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:composite-effect"]),
    );
  });

  it("tags HP-threshold conditional flavor without mechanical payoff", () => {
    const tags = extractRuneEffectTags(
      "Your armor is covered in crystals formed by the energy from qurios. When you are reduced to half of your hit point maximum or less, the crystals shatter creating maroon flames in their place for 1 hour. The crystals reform on your armor when you finish a short or long rest.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:conditional-flavor",
        "mechanic:short-rest",
        "mechanic:long-rest",
      ]),
    );
  });

  it("tags always-on Archdemon Mode weapon class feature", () => {
    const tags = extractRuneEffectTags(
      "(Dual Blades Only). Your Archdemon Mode is always active when you are holding both blades and the damage die of your archdemon mode increases by 1.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:weapon-class-mode"]),
    );
  });

  it("tags Dereliction HP sacrifice damage rider", () => {
    const tags = extractRuneEffectTags(
      "Dereliction. While you are attuned to this weapon you can use your bonus action to roll a d20. Your hit point maximum is reduced by the roll and the next attack you hit with before the start of your next turn, deals extra damage equal to double the roll. The reduction lasts until you finish a long rest. You die if this effect reduces your hit point maximum to 0.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:hp-sacrifice",
        "mechanic:bonus-action",
        "type:offensive",
      ]),
    );
  });

  it("tags staunch wound DC reduction", () => {
    const tags = extractRuneEffectTags(
      "While you are wearing this armor, the DC to staunch a wound you have is reduced by 2.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["mechanic:wound-staunch", "type:utility"]),
    );
  });
});

describe("extractRuneEffectTags — weapon type mentions", () => {
  it("tags Dual Blades from restriction parenthetical", () => {
    const tags = extractRuneEffectTags(
      "(Dual Blades Only). Your Archdemon Mode is always active when you are holding both blades and the damage die of your archdemon mode increases by 1.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["weapon-type:dual-blades"]),
    );
  });

  it("tags every weapon listed in Power Prolonger variant text", () => {
    const tags = extractRuneEffectTags(
      "Power Prolonger. Depending on which weapon this material is placed into, it gains the following benefits:\n• Dual Blades. Demon/Archdemon Mode duration is increased by 30 seconds.\n• Great Sword. Guard grants a +4 AC bonus for the duration of the turn it is used.\n• Hunting Horn. Melodies duration is increased by 1 minute.\n• Insect Glaive. Kinsects Essence duration is increased by 1 minute.\n• Lance. Powerguard grants a +4 AC bonus for the duration of the turn it is used.\n• Switch Axe. You regain one extra expended charge when you hit a creature in axe mode.\n• Tonfas. Earth Style. weapon damage die is increased to a d10.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "weapon-type:dual-blades",
        "weapon-type:greatsword",
        "weapon-type:hunting-horn",
        "weapon-type:insect-glaive",
        "weapon-type:lance",
        "weapon-type:switchaxe",
        "weapon-type:tonfas",
        "mechanic:weapon-variant",
      ]),
    );
  });

  it("tags all weapons in Blast Coat variant lists", () => {
    const tags = extractRuneEffectTags(
      "Blast Coat. This material provides one of the following weapon properties depending on which weapon it is placed in: (Bow) Your blast coating deals an extra 1d6 fire damage. (Dual Repeaters) When you hit a creature with your empowered blaze ammo, it now ignites the terrain in a 5-foot line extending from you to the target. (Heavy Bowgun) Your cluster ammo deals an extra 2d6 fire damage. (Light Bowgun) Your flaming ammo now bypasses a creature's resistance to fire damage.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "weapon-type:bow",
        "weapon-type:dual-repeaters",
        "weapon-type:heavy-bowgun",
        "weapon-type:light-bowgun",
        "weapon-type:bowgun",
      ]),
    );
  });

  it("tags compound Bowgun and Dual Repeaters restriction", () => {
    const tags = extractRuneEffectTags(
      "(Bowgun & Dual Repeaters Only) Tetrad Shot+. If you make two or more attacks on your turn while attuned to this weapon, the last attack you make with it deals an extra 1d8 piercing damage.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "weapon-type:bowgun",
        "weapon-type:dual-repeaters",
      ]),
    );
  });

  it("tags Hammer from possessive mention in effect body", () => {
    const tags = extractRuneEffectTags(
      "(Hammer Only) Punish Draw+. A creatures hit by your hammer's mighty weapon make its saving throw at disadvantage.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["weapon-type:hammer"]),
    );
  });

  it("does not tag melee from generic melee weapon attack wording", () => {
    const tags = extractRuneEffectTags(
      "Whenever you hit a creature with a melee weapon attack using this weapon, you can engulf the target in flames.",
    );
    expect(tags).not.toContain("weapon-type:melee");
  });

  it("tags Shield Upgrade variant weapons including Sword & Shield", () => {
    const tags = extractRuneEffectTags(
      "Shield Upgrade. Depending on which weapon this material is placed into, it gains the following benefits:\n• Charge Blade. When you use your Elemental Guard, you increase your AC by half your proficiency bonus until the start of your next turn.\n• Gunlance. The Guard Reload weapon property now reloads all expended shells.\n• Lance. The first time you use your Powerguard in a round, it does not use up your reaction.\n• Sword & Shield. When a creature adjacent makes a Dexterity saving throw, you can use your reaction to grant that creature a bonus to its save equal to your shield's AC.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:weapon-variant",
        "weapon-type:charge-blade",
        "weapon-type:gunlance",
        "weapon-type:lance",
        "weapon-type:sword-and-shield",
      ]),
    );
  });

  it("tags Blast Coat placed-in variant phrasing", () => {
    const tags = extractRuneEffectTags(
      "Blast Coat. This material provides one of the following weapon properties depending on which weapon it is placed in: (Bow) Your blast coating deals an extra 1d6 fire damage. (Dual Repeaters) When you hit a creature with your empowered blaze ammo, it now ignites the terrain in a 5-foot line extending from you to the target.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:weapon-variant",
        "weapon-type:bow",
        "weapon-type:dual-repeaters",
      ]),
    );
  });

  it("tags Capacity Boost compound restriction on armor variant text", () => {
    const tags = extractRuneEffectTags(
      "(Charge Blade & Gunlance Only) Capacity Boost. This material provides one of the following armor properties depending on which weapon it is placed in: (Charge Blade) Your phial charge maximum is increased by 1. (Gunlance) Your gunlance can hold one extra shell.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:weapon-variant",
        "weapon-type:charge-blade",
        "weapon-type:gunlance",
      ]),
    );
  });

  it("tags Tune-Up nested bowgun options", () => {
    const tags = extractRuneEffectTags(
      "(Ranged Weapon Only) Tune-Up. When this material is placed into a weapon choose one of the following effects to gain: (Light Bowgun Only). If you miss an attack while hidden, your location is not revealed. (Heavy Bowgun Only). You gain a +1 bonus to your AC while wielding this weapon.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:weapon-variant",
        "weapon-type:ranged",
        "weapon-type:light-bowgun",
        "weapon-type:heavy-bowgun",
        "weapon-type:bowgun",
      ]),
    );
  });

  it("tags weapons from titleless depending-on-which-weapon list", () => {
    const tags = extractRuneEffectTags(
      "Depending on which weapon this material is placed into, it gains the following benefits:\n• Bow. When you hit a creature with a poison coated arrow, you can inflict iceblight instead of the poisoned condition.\n• Dual Repeaters. Your cryo ammo now inflicts iceblight instead of waterblight when empowered.\n• Heavy Bowgun. When you hit a creature with your poison ammo, you can inflict waterblight instead of the poisoned condition.\n• Light Bowgun. When you hit a creature with water ammo, its movement speed is reduced by 5 feet until the end of its next turn.",
    );
    expect(tags).toEqual(
      expect.arrayContaining([
        "mechanic:weapon-variant",
        "weapon-type:bow",
        "weapon-type:dual-repeaters",
        "weapon-type:heavy-bowgun",
        "weapon-type:light-bowgun",
      ]),
    );
  });

  it("tags hammer from placed-into-a-hammer wording", () => {
    const tags = extractRuneEffectTags(
      "(Hammer Only) KO+. When this material is placed into a hammer, it gains one addition use of its mighty weapon property.",
    );
    expect(tags).toEqual(
      expect.arrayContaining(["weapon-type:hammer"]),
    );
  });

  it("tags Slugger and word-number extra Mighty Weapon uses", () => {
    const tags = extractRuneEffectTags(
      "(Hammer Only) Slugger. While attuned to this weapon, you may use the Hammer's Mighty Weapon skill two additional times between rests.",
    );

    expect(tags).toEqual(
      expect.arrayContaining([
        "weapon-type:hammer",
        "mechanic:class-feature",
        "mechanic:class-feature-extra-use",
        "type:utility",
      ]),
    );
  });

  it("tags carve-check advantage and plural MH traps", () => {
    const carve = extractRuneEffectTags(
      "The first time you make a Carve check on a creature, you do so with advantage.",
    );
    const traps = extractRuneEffectTags(
      "You can set pitfall traps or shock traps as a bonus action while you wear this armor.",
    );

    expect(carve).toEqual(
      expect.arrayContaining([
        "mechanic:carve",
        "mechanic:advantage",
        "type:utility",
      ]),
    );
    expect(traps).toEqual(
      expect.arrayContaining([
        "mechanic:trap",
        "mechanic:item-related",
        "mechanic:bonus-action",
        "type:utility",
      ]),
    );
  });

  it("tags blindsight, creature proximity glow, and fire save advantage", () => {
    const blindsight = extractRuneEffectTags(
      "Your eyes look like snake eyes while you wear this armor, granting you blindsight out to 10 feet.",
    );
    const proximity = extractRuneEffectTags(
      "While you are attuned to this armor, it glows faintly when a rathian, malfestio, agnaktor, or zinogre is near (240 feet or less).",
    );
    const fireSave = extractRuneEffectTags(
      "Whenever you make a saving throw against an attack or spell that deals fire damage, you do so with advantage.",
    );

    expect(blindsight).toEqual(
      expect.arrayContaining(["mechanic:blindsight", "type:utility"]),
    );
    expect(proximity).toEqual(
      expect.arrayContaining(["mechanic:creature-proximity", "type:utility"]),
    );
    expect(fireSave).toEqual(
      expect.arrayContaining([
        "mechanic:against-damage",
        "damage:fire",
        "type:defensive",
      ]),
    );
  });

  it("tags limited truesight, fishing-pole transform, and displacement variants", () => {
    const truesight = extractRuneEffectTags(
      "While attuned to this armor you can use an action to speak the armor's command word and gain truesight out to 60 feet for 1 hour. Once used, you can't use this property again until you finish a long rest.",
    );
    const fishingPole = extractRuneEffectTags(
      "While holding your weapon, you can speak a command word and transform it into a fishing pole with a hook, a line, and a reel. Speaking the command word again changes the fishing pole back into the weapon.",
    );
    const illusion = extractRuneEffectTags(
      "While you wear this armor, it projects an illusion that makes you appear to be standing in a place near your actual location, causing any creature to have disadvantage on attack rolls against you. If you take damage, the property ceases to function until the start of your next turn. This property is suppressed while you are incapacitated, restrained, or otherwise unable to move.",
    );
    const shadows = extractRuneEffectTags(
      "While wearing this armor you are shrouded in shadows causing any creature to have disadvantage on attack rolls against you. If you take damage, the property ceases to function until the start of your next turn. This property is suppressed while you are incapacitated, restrained, or otherwise unable to move.",
    );

    expect(truesight).toEqual(
      expect.arrayContaining(["mechanic:truesight", "mechanic:active"]),
    );
    expect(fishingPole).toEqual(
      expect.arrayContaining([
        "mechanic:item-transform",
        "mechanic:fishing",
        "type:utility",
      ]),
    );
    for (const tags of [illusion, shadows]) {
      expect(tags).toEqual(
        expect.arrayContaining([
          "mechanic:displacement",
          "type:defensive",
          "mechanic:attack-roll",
        ]),
      );
    }
  });

  it("tags cosmetic flavor, cleric heal boost, ally reaction move, and swallow weapon", () => {
    const veins = extractRuneEffectTags(
      "While you are attuned to this armor your veins and armor turn bright red when you are angry and a frosty blue when you are calm.",
    );
    const healBoost = extractRuneEffectTags(
      "(Cleric & paladin Only) When you regain hit points from a spell while attuned to this armor, increase the regained amount by half your Cleric or paladin level.",
    );
    const readBooks = extractRuneEffectTags(
      "You can read books you are touching while sleeping.",
    );
    const allyMove = extractRuneEffectTags(
      "When you hit a creature with this weapon, you choose a friendly creature who can see or hear you. That creature can use its reaction to move up to half its speed without provoking opportunity attacks from the target of your attack. Once you use this property you can't use it again until you finish a short or long rest.",
    );
    const swallow = extractRuneEffectTags(
      "(1-Handed or Versatile Weapons Only) While attuned to this weapon, you can safely swallow it instead of sheathing it, and you can draw the weapon the same as any other.",
    );

    expect(veins).toEqual(
      expect.arrayContaining(["type:cosmetic", "mechanic:passive"]),
    );
    expect(healBoost).toEqual(
      expect.arrayContaining([
        "class:cleric",
        "class:paladin",
        "mechanic:heal-self-boost",
        "type:support",
      ]),
    );
    expect(readBooks).toEqual(
      expect.arrayContaining(["type:cosmetic", "mechanic:passive"]),
    );
    expect(allyMove).toEqual(
      expect.arrayContaining([
        "mechanic:ally-reaction-move",
        "mechanic:reaction",
        "type:support",
      ]),
    );
    expect(swallow).toEqual(
      expect.arrayContaining(["type:cosmetic", "mechanic:passive"]),
    );
  });
});

describe("extractRuneEffectTags — reviewed MHMM weapon/armor patterns", () => {
  it("tags on-hit charm, reaction shove, hammer charge, and heal boost", () => {
    const charm = extractRuneEffectTags(
      "When you hit a creature with this weapon, it must succeed on a DC 12 Wisdom saving throw or become charmed by you for 1 minute or until you or your companions do anything harmful to it. Once you use this property, you can't use it again until you finish a short or long rest.",
    );
    expect(charm).toEqual(
      expect.arrayContaining([
        "mechanic:on-hit",
        "mechanic:saving-throw",
        "mechanic:condition-charmed",
        "mechanic:condition",
        "mechanic:short-rest",
        "mechanic:long-rest",
        "mechanic:active",
        "type:offensive",
      ]),
    );

    const shove = extractRuneEffectTags(
      "When a creature hits you with a melee weapon attack while you wear this armor, you can use your reaction to take the shove action and push the attacker away from you.",
    );
    expect(shove).toEqual(
      expect.arrayContaining([
        "mechanic:reaction-shove",
        "mechanic:reaction",
        "mechanic:active",
        "type:defensive",
      ]),
    );

    const hammer = extractRuneEffectTags(
      "(Hammer only) While attuned to this weapon, your hammer's charge only requires you to move 10 feet in a straight line instead of 20 feet.",
    );
    expect(hammer).toEqual(
      expect.arrayContaining([
        "weapon-type:hammer",
        "mechanic:hammer-charge",
        "mechanic:movement",
        "mechanic:passive",
      ]),
    );

    const healBoost = extractRuneEffectTags(
      "While you wear this armor, you gain 2 additional hit points whenever you regain hit points by magical or non-magical means, except when spending hit dice.",
    );
    expect(healBoost).toEqual(
      expect.arrayContaining([
        "mechanic:heal-self-boost",
        "mechanic:passive",
        "type:support",
      ]),
    );
  });

  it("tags named combat riders and utility patterns", () => {
    const blade = extractRuneEffectTags(
      "(One-Handed Melee Attacks Only) Blade Dancer. While you are attuned to this weapon, you can use your bonus action to make two attacks instead of one. You must meet the normal conditions to make the bonus action attack for this material to work. You can use this property a number of times equal to double your proficiency modifier, regaining all expended uses when you finish a long rest.",
    );
    expect(blade).toEqual(
      expect.arrayContaining([
        "mechanic:bonus-action",
        "mechanic:extra-attack",
        "mechanic:long-rest",
        "mechanic:active",
        "type:offensive",
      ]),
    );

    const graceful = extractRuneEffectTags(
      "Graceful Strike. When you critically hit a creature with this weapon, you can move up to 10 feet without provoking opportunity attacks.",
    );
    expect(graceful).toEqual(
      expect.arrayContaining([
        "mechanic:critical",
        "mechanic:no-opportunity-attacks",
        "mechanic:movement",
        "type:offensive",
      ]),
    );

    const sneak = extractRuneEffectTags(
      "Sneak Attack. When you force a creature to make a Dexterity saving throw while you are hidden or when an ally is within 5 feet of the creature, that creature has disadvantage on the save.",
    );
    expect(sneak).toEqual(
      expect.arrayContaining([
        "mechanic:hidden-save-disadvantage",
        "mechanic:disadvantage",
        "mechanic:saving-throw",
        "mechanic:area",
        "mechanic:passive",
        "type:offensive",
      ]),
    );

    const redirect = extractRuneEffectTags(
      "Redirection. When you are the target of a melee attack, you can use your reaction to swap your position with another creature within 5 feet of you that is the same size or smaller than you. If the creature is unwilling, you must succeed on a Strength (Athletics) or Dexterity (Acrobatics) check contested by its Strength (Athletics) or Dexterity (Acrobatics) check or remain in your space. You can use this property a number of times equal to half of your proficiency bonus, regaining all expended uses when you finish a long rest.",
    );
    expect(redirect).toEqual(
      expect.arrayContaining([
        "mechanic:position-swap",
        "mechanic:reaction",
        "mechanic:long-rest",
        "mechanic:active",
        "type:support",
      ]),
    );
  });

  it("tags bow melee mode, ammo buff, grapple trade, and perception utility", () => {
    const bow = extractRuneEffectTags(
      "(Bow Only) While attuned to this weapon, blades appear on the limbs of the bow. Additionally, you can make a special melee weapon attack with it using your Strength or Dexterity modifier. If you hit with this attack, you deal slashing damage equal to 1d8 + your modifier used to make the attack.",
    );
    expect(bow).toEqual(
      expect.arrayContaining([
        "weapon-type:bow",
        "mechanic:bow-melee-mode",
        "damage:slashing",
        "mechanic:passive",
        "type:offensive",
      ]),
    );

    const demon = extractRuneEffectTags(
      "(Light Bowgun Only) When you hit a creature with your demon ammo, its duration and effect are doubled.",
    );
    expect(demon).toEqual(
      expect.arrayContaining([
        "weapon-type:light-bowgun",
        "mechanic:ammo-buff",
        "mechanic:on-hit",
        "type:offensive",
      ]),
    );

    const grapple = extractRuneEffectTags(
      "(Melee Weapon Only) When you hit a creature with this weapon, you can choose to reduce the damage you deal by half to grapple the target.",
    );
    expect(grapple).toEqual(
      expect.arrayContaining([
        "weapon-type:melee",
        "mechanic:grapple-on-hit",
        "mechanic:on-hit",
        "type:offensive",
      ]),
    );

    const perception = extractRuneEffectTags(
      "While you wear this armor, being in a lightly obscured area doesn't impose disadvantage on your Wisdom (Perception) checks if you can both see and hear.",
    );
    expect(perception).toEqual(
      expect.arrayContaining([
        "mechanic:against-condition",
        "mechanic:disadvantage",
        "mechanic:skill-perception",
        "mechanic:passive",
        "type:utility",
      ]),
    );
  });
});
