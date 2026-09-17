import type { GuideSection, GuideTable } from "@/shared/types";

export const GUARDIAN_TEMPLATE_INTRO =
  "Guardians are artificial monsters resembling their original forms but with pale grey bodies and glowing purple veins. They no longer require food, sleep, and can't reproduce. Guardians enhance their attacks with wylk energy, creating large explosions and create Wylk Crystals when striking certain surfaces.";

export const GUARDIAN_TEMPLATE_BEHAVIOR =
  "While their behavior mirrors their original species, they are now highly aggressive, attacking intruders and even other Guardians without reason.";

export const WYLK_EXPLOSION_TABLE: GuideTable = {
  colLabels: ["CR", "Force Damage"],
  rows: [
    ["0–4", "1d4"],
    ["5–8", "2d6"],
    ["9–12", "2d8"],
    ["13–16", "3d6"],
    ["17–20", "3d8"],
    ["21+", "4d8"],
  ],
};

export const GUARDIAN_TEMPLATE_SECTIONS: GuideSection[] = [
  {
    id: "apply",
    name: "Applying the Template",
    intro: [
      "Apply the following changes to any monster from the Monster Hunter Monster Manual to create a Guardian version of that creature (MHMM p.619).",
    ],
    subsections: [
      {
        name: "Type",
        paragraphs: [
          "The creature's type changes to Construct. It no longer requires air, food, drink, or sleep.",
        ],
      },
      {
        name: "Senses",
        paragraphs: [
          "The creature gains darkvision out to 60 feet if it doesn't already have it.",
        ],
      },
      {
        name: "Damage Resistances",
        paragraphs: [
          "The creature gains resistance to bludgeoning, piercing, and slashing damage from nonmagical attacks.",
        ],
      },
      {
        name: "Damage Immunities",
        paragraphs: [
          "The creature becomes immune to psychic damage.",
        ],
      },
      {
        name: "Condition Immunities",
        paragraphs: [
          "The creature becomes immune to the charmed, deafened, exhaustion, frightened, and petrified conditions.",
        ],
      },
    ],
  },
  {
    id: "traits",
    name: "Guardian Traits",
    subsections: [
      {
        name: "Synthetic Suppression",
        paragraphs: [
          "The Guardian's attacks and actions no longer inflict blight conditions or the poisoned condition. Other effects, such as bleeding, being stunned, knocked prone, or put to sleep, function as normal.",
        ],
      },
      {
        name: "Wylk Explosion (1/round)",
        paragraphs: [
          "When the Guardian hits a creature with a melee weapon attack, the target takes additional force damage based on the Guardian's CR (see table below). Additionally, each creature within 5 feet of the target must succeed on a Dexterity saving throw with a DC equal to 8 + the guardian's proficiency bonus + the guardian's Strength modifier, taking the same amount of force damage as the target on a failed save.",
        ],
        table: WYLK_EXPLOSION_TABLE,
      },
      {
        name: "Wylk Crystals",
        paragraphs: [
          "When the guardian uses Wylk Explosion there is a 25% chance for a crystal to form from the explosion's energy. This crystal can be attacked and destroyed (AC 10; HP 5; immunity to poison and psychic damage).",
          "Destroying the crystal creates an explosion and each creature within 10 feet of it must succeed on a Dexterity saving throw equal to 8 + the guardian's proficiency bonus + the guardian's Strength modifier or be knocked prone and take damage equal to the damage on the Wylk Explosion table above.",
          "The damage type is the same as the damage type that destroyed it, except bludgeoning, piercing, or slashing damage, which deals force damage.",
        ],
      },
    ],
  },
];
