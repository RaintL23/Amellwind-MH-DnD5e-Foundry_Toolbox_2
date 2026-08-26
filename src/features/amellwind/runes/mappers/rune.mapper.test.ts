import { describe, expect, it } from "vitest";
import { extractRuneEffectTags, isPlaceableRune, mapRunesFromMonster, backfillSharedOtherEffects, normalizeLootChance, stripMaterialQuantity } from "../mappers/rune.mapper";
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
      expect.arrayContaining([
        "mechanic:gather-resources",
        "mechanic:fishing",
      ]),
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
      expect.arrayContaining([
        "mechanic:gather-resources",
        "mechanic:mining",
      ]),
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

  it("tags Coalescence attack-rolls + spell save DC as spell-buff:save", () => {
    const tags = extractRuneEffectTags(
      "Coalescence+. Whenever you succeed on a saving throw to end a condition, you gain a +2 bonus to your attack rolls and spell save DC, and your weapon or spell attacks deal an extra 1d8 cold damage until the end of your next turn.",
    );

    expect(tags).toContain("mechanic:spell-buff:save");
    expect(tags).toContain("mechanic:attack-roll");
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
    expect(stripMaterialQuantity("2x Paddock Cream")).toBe("Paddock Cream");
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
});
