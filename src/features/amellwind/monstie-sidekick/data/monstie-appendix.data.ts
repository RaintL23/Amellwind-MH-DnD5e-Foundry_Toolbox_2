import type { GuideSection } from "@/shared/types";

/** Intro from AGMH Appendix C — Monstie Sidekick Class (Patreon). */
export const MONSTIE_CLASS_INTRO =
  "A monstie is a monster that you can form bonds with. This is typically accomplished through a kinship stone or perhaps by rescuing it from near death. However it happens, you now have a friend for life.";

export const MONSTIE_APPENDIX_OVERVIEW: GuideSection = {
  id: "appendix-overview",
  name: "Monstie Sidekick Class",
  intro: [MONSTIE_CLASS_INTRO],
  subsections: [
    {
      name: "Monstie Rules",
      paragraphs: [
        "There are over 240 monsters in the Monster Hunter Monster Manual and each one is someone's favorite. But not all monsters are created equal and many of them would be entirely too strong as monsties. Due to this the following rules are put in place to help balance out the monstie sidekick class.",
      ],
      bulletList: [
        "Elder Dragons and Paragon monsters cannot be monsties (they have too many unique traits and attacks to try and balance).",
        "A monstie is based off the original stat block of a creature, not a tempered version (subspecies, deviants, etc. are still ok to use).",
        'Monsties all use the same basic creature template when initially created.',
        '"PB" stands for proficiency bonus when looking through this sidekick class.',
      ],
    },
    {
      name: "Choose Your Original Monster",
      paragraphs: [
        "Look through the Monster Hunter Monster Manual for a monster following the above rules to be the original monster that your Monstie will be based on. Your original monster will be referenced often as your monstie levels up and learns new traits and actions.",
      ],
    },
    {
      name: "Create Your Monstie",
      paragraphs: [
        "Using the Monstie template and the rules below, put together your level 1 monstie before it gains its initial level 1 features.",
      ],
      subsections: [
        {
          name: "Ability Scores",
          paragraphs: [
            "The monstie's ability score array is 15, 14, 13, 12, 10, and 8. The ability scores are placed in the stat block the same way as the original monster. If Strength is the original's strongest ability score, then you would make the monstie's Strength a 15. If Strength is the 3rd strongest ability score, place the 13 in Strength for the monstie.",
            "For example: A Rajang monstie would have Str 15, Dex 12, Con 14, Int 10, Wis 13, Cha 8.",
          ],
        },
        {
          name: "Saving Throws",
          paragraphs: [
            "Some of your monstie's features require the target to make a saving throw to resist its effects. The saving throw DC is calculated as: Monstie Save DC = 8 + its proficiency bonus + the appropriate Ability Score modifier for the save.",
            "When a creature succeeds on a saving throw against a condition from the monstie, they are immune to that effect for 24 hours.",
          ],
          bulletList: [
            "STR: Being knocked prone, charge trait",
            "CON: Breath attacks, disease, poisons, roars",
            "CHA: Frightful Presence",
          ],
        },
        {
          name: "Senses",
          paragraphs: [
            "The Monstie gains the same senses as the main stat block (darkvision, blindsight, truesight, tremorsense) but it has a maximum range of 30 feet. If the original monster's sense is lower than 30 feet, your monstie's sense is equal to that. As the monstie's size increases at 6th level, the range of its senses increases to 60 feet, or the original monster's maximum sense range (whichever is lower). This range is increased to 120 feet at 15th level, or the original monster's maximum sense range (whichever is lower).",
          ],
        },
        {
          name: "Speed",
          paragraphs: [
            "A monstie has the same types of movement as the original monster it is based on, but it is not as fast initially. Their base walking speed is 25 feet. Any other type of movement (flying, burrowing, climbing, etc.) is 15 feet. Each time the monstie levels up it gains an extra 5 feet of each type of movement up to its original stat block's movement for each type.",
          ],
        },
      ],
    },
    {
      name: "Monstie Template (Level 1)",
      paragraphs: [
        "Small original monster's type, unaligned.",
      ],
      bulletList: [
        "Armor Class 10 + Dex + PB (natural armor)",
        "Hit Points 10 + Con (an extra 1d8 + Con per level)",
        "Speed 25 feet (+5 feet for each level until it reaches its original monster's speed); Burrow, Climb, Fly, Swim 15 ft. (if the original stat block has it, +5 feet for each level until it reaches its original monster's speed)",
        "Senses determined by original monster",
        "Languages same as original monster; understands Common, but can't speak it",
        "Actions: one attack the original monster knows that only deals damage. The +to hit is the appropriate Ability Score modifier plus PB. Damage is 1d# where # matches the original attack's damage die. Reach 5 feet for melee; ranged attacks keep the original range.",
      ],
    },
  ],
};
