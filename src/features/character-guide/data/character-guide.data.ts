import type {
  BuilderWorkflowStep,
  GuideSection,
  GuideTable,
} from "@/shared/types";

export const CHARACTER_GUIDE_INTRO =
  "This section helps answer some basic questions and outlines a number of new options for players to choose from when creating and developing their characters along the way, and can easily be introduced into any 5th edition D&D campaign, whether or not it takes place in the Monster Hunter Universe. Remember that all options presented here must be approved by your Dungeon Master for use within their game, and it is their final say on their inclusion.";

export const BUILDER_WORKFLOW_STEPS: BuilderWorkflowStep[] = [
  {
    step: 1,
    title: "Choose Species & Background",
    description:
      "Pick a species and background from Amellwind's Guide. Backgrounds tie into factions like the Hunter's Guild.",
    link: { to: "/species", label: "Browse Species" },
  },
  {
    step: 2,
    title: "Set Level & Ability Scores",
    description:
      "Set your level and generate ability scores. For levels above 1, consult the starting wealth and equipment tables.",
  },
  {
    step: 3,
    title: "Review Class Options",
    description:
      "Artificers and druids have special AGMH rules for materials and wildshape. Check the guide if you play those classes.",
    link: { to: "/character-guide", label: "Full Guide" },
  },
  {
    step: 4,
    title: "Buy Gear in Shops",
    description:
      "Purchase MH weapons, armor, and materials from Shops. Items sync to your builder inventory.",
    link: { to: "/shops", label: "Open Shops" },
  },
  {
    step: 5,
    title: "Equip & Assign Runes",
    description:
      "Equip weapons and armor on the paper doll, then slot rune materials into available slots.",
    link: { to: "/runes", label: "Browse Runes" },
  },
];

export const STARTING_WEALTH_TABLE: GuideTable = {
  colLabels: ["Character Level", "Starting Wealth"],
  rows: [
    ["1-2", "Gold given by your Background"],
    ["3-8", "500 gp plus 1d10 × 25 gp"],
    ["9-15", "5,000 gp plus 1d10 × 250 gp"],
    ["16-20", "5,000 gp plus 1d10 × 250 gp"],
  ],
};

export const STARTING_WEAPONS_TABLE: GuideTable = {
  colLabels: ["Character Level", "Weapon", "Upgrade Materials"],
  rows: [
    ["1-2", "Any one common MH weapon", "0"],
    ["3-8", "Any two common MH weapons", "1d8 earth crystals"],
    ["9-15", "Any two uncommon MH weapons", "2d8 machalite ore"],
    ["16-20", "Any two rare MH weapons", "3d8 dragonite ore"],
  ],
  footnotes: [
    "A character can upgrade a weapon without paying its upgrade cost if they roll enough upgrade materials to do so.",
  ],
};

export const STARTING_ARMOR_TABLE: GuideTable = {
  colLabels: ["Character Level", "Upgrade Materials"],
  rows: [
    ["1-2", "0"],
    ["3-8", "1d8 armor spheres"],
    ["9-15", "2d8 hard armor spheres"],
    ["16-20", "3d8 heavy armor spheres"],
  ],
  footnotes: [
    "A character can upgrade their armor without paying its upgrade cost if they roll enough upgrade materials. This includes armor purchased with starting wealth.",
  ],
};

export const STARTING_MATERIALS_TABLE: GuideTable = {
  colLabels: ["Character Level", "Starting Materials"],
  rows: [
    ["1-2", "0"],
    ["3-8", "5"],
    ["9-15", "8"],
    ["16-20", "10"],
  ],
};

export const STARTING_MATERIALS_CR_TABLE: GuideTable = {
  colLabels: ["Character Level", "Highest Challenge Rating", "Roll"],
  rows: [
    ["1", "--", "--"],
    ["2", "--", "--"],
    ["3", "CR 5", "1d6-1*"],
    ["4", "CR 6", "1d6"],
    ["5", "CR 9", "1d8+1"],
    ["6", "CR 10", "1d8+2"],
    ["7", "CR 11", "1d10+1"],
    ["8", "CR 12", "1d10+2"],
    ["9", "CR 13", "1d10+3"],
    ["10", "CR 14", "1d10+4"],
    ["11", "CR 16", "2d6+4"],
    ["12", "CR 17", "2d6+5"],
    ["13", "CR 19", "2d6+7"],
    ["14", "CR 20", "3d6+2"],
    ["15", "CR 21", "3d6+3"],
    ["16", "CR 21", "3d6+3"],
    ["17", "CR 22", "3d6+4"],
    ["18", "CR 22", "3d6+4"],
    ["19", "CR 23", "3d6+5"],
    ["20", "CR 24", "3d6+6"],
  ],
  footnotes: ["If you roll a 0 on this CR range, treat it as if you rolled a 1."],
};

export const CHARACTER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "creating",
    name: "Creating a Character",
    page: 32,
    paragraphs: [
      "In the Monster Hunter video game series, you are basically a powerful warrior, with no magical ability, that swings around a giant sword or fires arrows at the creature you are hunting.",
      "That is not the case in a Monster Hunter styled Dungeons and Dragons game. The Monster Hunter Universe was created with all official classes and races in mind. You will find weapons and monster materials, and even factions that grant extra spells to spellcasters throughout this guide and its companion book the Monster Hunter Monster Loot Tables.",
    ],
    subsections: [
      {
        name: "The Artificer",
        paragraphs: [
          "The artificer is a special case when it comes to the rule set found within this book. As an artificer levels up, they gain the ability to attune to additional magical items. The balance of this system does not mesh well with this feature, so instead of an artificer gaining the ability to attune to additional magical items, they instead are given one additional material slot in both their armor and weapons at the 10th, 14th, and 18th level.",
        ],
        subsections: [
          {
            name: "Artificer Infusions",
            paragraphs: [
              "Artificer infusions are a special material that can be placed into a creature's armor, weapon, or trinket. These infusion materials are considered temporary and can be placed in slot(s) during a long rest. The slot can be empty or already contain a normal material. If it is placed in a slot with a normal material already in it, then the infusion material replaces it as the active material (but it does not destroy the normal material). The infusion material remains in the slot until it is removed during a long rest, the artificer no longer knows the infusion, or the artificer is no longer apart of the hunting party.",
              "If an infusion material requires attunement, then being attuned to the armor or weapon counts towards the attunement requirement for it with one condition. If the artificer places an infusion material into another creature's armor or weapon and it requires attunement, then the infusion takes up two slots instead of one. When an artificer places an infusion material that requires attunement into its own armor or weapon, it takes only one slot.",
            ],
          },
        ],
      },
      {
        name: "Druid Wildshapes",
        paragraphs: [
          "Druids may want to make use of some of the beasts found in the Monster Hunter Monster Manual. If the DM allows this, the druid can choose any beast that doesn't have an action that causes the blinded, incapacitated, or paralyzed conditions (CR 0–6, MHMM beasts). The druid also cannot use a beast's action that summons additional creatures to its aid.",
          "Alternatively, a DM can allow the druid to choose creatures whose actions cause these conditions. If so, once the creature succeeds on a saving throw against a condition caused by the druid's wildshape, that creature is immune to that condition from the wildshape's actions for 24 hours.",
        ],
      },
    ],
  },
  {
    id: "higher-level",
    name: "Creating a Higher Level Character",
    paragraphs: [
      "Creating a character at higher than 1st level in a monster hunter styled campaign is not a complicated matter, but does take a little more time than creating a standard Dungeons and Dragons character.",
      "Starting equipment and materials for characters above 1st level is entirely up to the DM's discretion, but the following section provides a guide for a balanced start to the character.",
    ],
    subsections: [
      {
        name: "Starting Wealth",
        paragraphs: ["A character's starting wealth is shown below."],
        table: STARTING_WEALTH_TABLE,
      },
      {
        name: "Starting Weapons",
        paragraphs: [
          "With Monster Hunter weapons, replace all the starting weapons a character gets in their normal starting equipment. They instead get the rarity and number of weapons listed in the table below. They also get a number of upgrade materials that can be saved or used to upgrade their weapon immediately at no cost, if they roll enough of the materials required for the upgrade.",
        ],
        table: STARTING_WEAPONS_TABLE,
      },
      {
        name: "Starting Armor",
        paragraphs: [
          "A character begins with the armor they get from their starting equipment, but they are allowed to use their starting wealth to purchase better armor if they so choose. They can then roll on the table below to determine how many armor upgrade materials they begin with and which type they are depending on their level.",
        ],
        table: STARTING_ARMOR_TABLE,
      },
      {
        name: "Starting Monster Materials",
        paragraphs: [
          "A character has a number of monster materials already collected when they begin at a higher level. This can be explained through weapons and armor that are family heirlooms, or perhaps it's from creatures the character has already hunted.",
        ],
        table: STARTING_MATERIALS_TABLE,
        subsections: [
          {
            name: "What Materials do I start with?",
            paragraphs: [
              "To determine what materials you start with, find out the number of materials you will get in total from the table above.",
              "Once you know the number of materials, you need to find out what the highest Challenge Rating monsters you could have gotten materials from. Consult the table below:",
            ],
            table: STARTING_MATERIALS_CR_TABLE,
            orderedList: [
              "Roll the number of dice and add the bonuses shown in the table. The number rolled is the CR of the creature you gained the material from.",
              "Count the number of creatures that are that Challenge Rating (a list can be found at the end of the MHMM) and roll a die number equal to (or close to) the amount of creatures in that challenge rating, or pick a number and find the creature down the list equal to that number. This is the creature you hunted.",
              "Roll on that creature's loot table, and choose either the carved or captured material (your choice after reading the material's effects).",
              "Repeat steps 1-3 until you have the number of materials you should have for your level.",
            ],
            inset: {
              name: "Creator's Note",
              paragraphs: [
                "When I have my players roll for materials, if they aren't having great luck with the RNG, I will have them reroll a material or 2, typically on the same creature they got the material from.",
                "I also like to give them at least one material on the higher range of CRs on their final material, if they are rolling low on previous materials.",
              ],
            },
          },
        ],
      },
      {
        name: "Other Starting Equipment",
        paragraphs: [
          "Any and all other starting equipment you get from your class or background remains the same.",
        ],
      },
    ],
  },
  {
    id: "skills",
    name: "Skills and Their Uses",
    page: 33,
    intro: [
      "Most skills in a Monster Hunter styled campaign have the exact same uses as they do in a standard Dungeons and Dragons game, but some of them that are used more frequently, have additional uses in this type of game, or perhaps just need a bit more clarification on some of the things they can do.",
    ],
    skillEntries: [
      {
        name: "Arcana",
        description:
          "If your DM plans to use the shrine benefits or cursed shrine complications, an arcana check can help determine if it's worth touching when the shrine is more closely related to magic than religion. An arcana check can also help identify magical effects left by creatures, such as the Gore Magala's frenzy virus.",
      },
      {
        name: "History",
        description:
          "Used when attempting to recall information about a creature a character may have read about or has done other research on.",
      },
      {
        name: "Investigation",
        description:
          "Used for finding resources in an area and looking for signs when a perception check finds nothing.",
      },
      {
        name: "Medicine",
        description:
          "Can be used to determine what type of the new blight conditions (found in the MHMM) a creature is suffering from.",
      },
      {
        name: "Nature",
        description:
          "Used when attempting to discern what creature(s) a party is dealing with by the signs they find, silhouettes off in the distance, or the impact the creature has on the environment.",
      },
      {
        name: "Perception",
        description:
          "Used by both the scout and spotter roles during hunts (see the scout and spotter role in Chapter 2 for more information).",
      },
      {
        name: "Religion",
        description:
          "If your DM plans to use the shrine benefits or cursed shrine complications, a religion check can help determine if it's worth touching when the shrine is more religiously based.",
      },
      {
        name: "Stealth",
        description:
          "Commonly used by the scout role during hunts (see the scout role in Chapter 2 for more information).",
      },
      {
        name: "Survival",
        description:
          "Used by the trailblazer role during hunts (see the trailblazer role in Chapter 2 for more information).",
      },
    ],
  },
];
