export interface MulticlassRuleSection {
  id: string;
  title: string;
  paragraphs: string[];
  bullets?: string[];
}

export const MULTICLASS_RULE_SECTIONS: MulticlassRuleSection[] = [
  {
    id: "prerequisites",
    title: "Prerequisites",
    paragraphs: [
      "Multiclassing lets you gain levels in multiple classes. With each level you take, you can choose a new class or gain a level in a class you already have.",
      "To qualify for a new class, you must meet the ability score minimums listed for that class (typically 13 in at least one primary ability). You must meet the prerequisite for your current class and for every other class you already have before you can multiclass into another one.",
    ],
  },
  {
    id: "experience",
    title: "Experience Points & Character Level",
    paragraphs: [
      "Your total character level is the sum of all your class levels. You cannot exceed level 20 in total.",
      "When you gain a level, you choose which class receives that level. Features, hit points, and spell progression for that level come from the class you selected.",
    ],
  },
  {
    id: "hit-points",
    title: "Hit Points & Hit Dice",
    paragraphs: [
      "When you gain your first level in a class, you gain the maximum hit points for that class's hit die plus your Constitution modifier.",
      "When you gain a level in a class after the first, you gain hit points equal to that class's average hit die value (typically half the die size, rounded up) plus your Constitution modifier, unless your table uses a different rule.",
      "You keep a pool of Hit Dice from all your classes. When you spend a Hit Die during a short rest, you roll one die from that pool and add your Constitution modifier.",
    ],
  },
  {
    id: "proficiency-bonus",
    title: "Proficiency Bonus",
    paragraphs: [
      "Your proficiency bonus is based on your total character level, not on any single class level. A 5th-level fighter / 5th-level wizard has proficiency bonus +4, the same as a 10th-level single-class character.",
    ],
  },
  {
    id: "proficiencies",
    title: "Proficiencies",
    paragraphs: [
      "When you take your first level in any class, you gain that class's starting proficiencies.",
      "When you multiclass into an additional class, you gain only the proficiencies listed in that class's Multiclassing entry—not the full starting proficiencies of a 1st-level character in that class.",
      "If two classes grant the same proficiency, you still have it once; you do not gain extra copies or bonuses from duplication.",
    ],
  },
  {
    id: "class-features",
    title: "Class Features",
    paragraphs: [
      "You gain the features of each class level you take in that class, subject to any multiclassing restrictions noted in the class or feature text.",
      "Some features do not stack or have special multiclass rules:",
    ],
    bullets: [
      "Extra Attack: If you gain Extra Attack from more than one class, the features do not stack unless a feature says otherwise.",
      "Channel Divinity: You must finish a short or long rest to use Channel Divinity again, regardless of how many classes grant it.",
      "Unarmored Defense: If you already have Unarmored Defense, you cannot gain it again from another class.",
      "Spellcasting: See the spell slot calculator below for combined spell slots when you have levels in more than one spellcasting class.",
    ],
  },
  {
    id: "spellcasting",
    title: "Spellcasting",
    paragraphs: [
      "If you have levels in more than one spellcasting class, you determine available spell slots by combining contributions from each class into a single caster level, then consulting the Multiclass Spellcaster table.",
      "Full casters (bard, cleric, druid, sorcerer, wizard) contribute their full class level. Half casters (paladin, ranger) contribute half their level (round down in 2014 rules; round up in 2024 rules where noted). Third-caster subclasses (Eldritch Knight, Arcane Trickster) contribute one-third of their fighter or rogue level, rounded down, once the subclass is taken (typically from level 3 onward).",
      "You use the combined caster level only to determine how many spell slots you have. Spells you prepare or know remain tied to each individual class. You can use spell slots from this combined pool to cast spells from any class whose spells you know or have prepared.",
      "Cantrips, spells known, and spells prepared are tracked separately for each class. A multiclass druid / wizard prepares wizard spells using Intelligence and druid spells using Wisdom, each according to that class's rules.",
    ],
  },
  {
    id: "pact-magic",
    title: "Pact Magic (Warlock)",
    paragraphs: [
      "Warlock Pact Magic is an exception. Pact spell slots do not combine with the Multiclass Spellcaster table.",
      "You track warlock spell slots separately using the warlock's own slot progression. When you cast a warlock spell, you use a warlock slot; when you cast a spell from another class, you use slots from the combined multiclass pool (if any).",
      "Warlock invocations and other warlock features still function according to your warlock level only.",
    ],
  },
  {
    id: "ability-scores",
    title: "Ability Score Improvements",
    paragraphs: [
      "When you gain a level in a class that grants an Ability Score Improvement (or feat choice), you gain that benefit based on the level you just gained in that class—not your total character level.",
      "Feat choices from one class do not count toward another class's progression unless a specific feature says otherwise.",
    ],
  },
];
