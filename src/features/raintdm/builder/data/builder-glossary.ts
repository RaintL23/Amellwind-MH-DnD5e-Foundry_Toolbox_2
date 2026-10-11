/**
 * Plain-language explanations of D&D terms shown in the Character Builder.
 * Summaries only — the rules text in the books remains the source of truth.
 */
export const BUILDER_GLOSSARY = {
  proficiency: {
    title: "Proficiency Bonus",
    text: "Added to rolls you are trained in: proficient skills, saving throws, weapon attacks and spells. It grows with level, from +2 at level 1 to +6.",
  },
  "hit-points": {
    title: "Hit Points",
    text: "How much damage you can take before you drop to 0 and start falling unconscious. Based on your class and Constitution.",
  },
  "hit-dice": {
    title: "Hit Dice",
    text: "Dice you can spend during a Short Rest to recover hit points. You have one per character level; the die size comes from your class.",
  },
  "armor-class": {
    title: "Armor Class (AC)",
    text: "How hard you are to hit. An attack hits you when its roll equals or beats your AC.",
  },
  speed: {
    title: "Speed",
    text: "How many feet you can move on your turn.",
  },
  initiative: {
    title: "Initiative",
    text: "Added to your d20 roll when combat starts to decide the turn order. Usually your Dexterity modifier.",
  },
  "passive-perception": {
    title: "Passive Perception",
    text: "How alert you are without actively searching: 10 + your Perception bonus. The DM compares it against hidden creatures and traps.",
  },
  "spell-attack": {
    title: "Spell Attack",
    text: "Added to your d20 when a spell asks you to make an attack roll: proficiency bonus + your spellcasting ability modifier.",
  },
  "spell-save-dc": {
    title: "Spell Save DC",
    text: "The number a target must meet or beat on a saving throw to resist your spell: 8 + proficiency bonus + your spellcasting ability modifier.",
  },
  attunement: {
    title: "Attunement",
    text: "Some magic items only work after you bond (attune) with them during a Short Rest. You can be attuned to a limited number of items at once.",
  },
  asi: {
    title: "Ability Score Improvement (ASI)",
    text: "Increase one ability score by 2, or two scores by 1 each (normally up to 20). Feat slots let you take this or a feat.",
  },
  "origin-feat": {
    title: "Origin Feat",
    text: "A feat your character starts with at level 1, granted by your background (2024 rules) or by some species — for example Alert or Lucky.",
  },
  "prepared-known": {
    title: "Prepared and known spells",
    text: "These are the leveled spells you can cast. Depending on your class you can swap them after a Long Rest (prepared) or only when you level up (known). Cantrips are always available.",
  },
  "always-prepared": {
    title: "Always prepared",
    text: "Spells granted by your subclass or a feature. They are always ready and do not count against your normal spell limit.",
  },
  "tasha-origin": {
    title: "Customizing Your Origin",
    text: "Optional rule from Tasha's Cauldron of Everything: ignore your species' fixed ability bonuses and put +2 and +1 on any two different abilities.",
  },
} as const satisfies Record<string, { title: string; text: string }>;

export type BuilderGlossaryTerm = keyof typeof BUILDER_GLOSSARY;
