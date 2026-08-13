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

/** XPHB 2024 — Starting Equipment at Higher Levels (DM guide). */
export const DND_STARTING_EQUIPMENT_TABLE: GuideTable = {
  colLabels: ["Starting Level", "Equipment and Money", "Magic Items"],
  rows: [
    ["2-4", "Normal starting equipment", "1 Common"],
    [
      "5-10",
      "500 gp plus 1d10 × 25 gp plus normal starting equipment",
      "1 Common, 1 Uncommon",
    ],
    [
      "11-16",
      "5,000 gp plus 1d10 × 250 gp plus normal starting equipment",
      "2 Common, 3 Uncommon, 1 Rare",
    ],
    [
      "17-20",
      "20,000 gp plus 1d10 × 250 gp plus normal starting equipment",
      "2 Common, 4 Uncommon, 3 Rare, 1 Very Rare",
    ],
  ],
};

export const DND_BUILDER_WORKFLOW_STEPS: BuilderWorkflowStep[] = [
  {
    step: 1,
    title: "Choose Class & Subclass",
    description:
      "Pick your class first — it drives species, background, spells, and feat recommendations.",
  },
  {
    step: 2,
    title: "Set Level & Ability Scores",
    description:
      "Set your level and assign ability scores. For levels above 1, consult the XPHB starting equipment table.",
  },
  {
    step: 3,
    title: "Species & Background",
    description:
      "Choose a species and background. Use RPGBOT ratings when available for stronger builds.",
  },
  {
    step: 4,
    title: "Spells & Feats",
    description:
      "Select spells for casters and feats at ASI levels. Subclass options unlock at the appropriate level.",
  },
  {
    step: 5,
    title: "Starting Equipment",
    description:
      "Pick class and background starting equipment packages from the library detail panels.",
  },
];

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
          "Used by both the scout and spotter roles during hunts (see the Hunt Roles section for more information).",
      },
      {
        name: "Religion",
        description:
          "If your DM plans to use the shrine benefits or cursed shrine complications, a religion check can help determine if it's worth touching when the shrine is more religiously based.",
      },
      {
        name: "Stealth",
        description:
          "Commonly used by the scout role during hunts (see the Scout role in the Hunt Roles section for more information).",
      },
      {
        name: "Survival",
        description:
          "Used by the trailblazer role during hunts (see the Trailblazer role in the Hunt Roles section for more information).",
      },
    ],
  },
  {
    id: "hunt-roles",
    name: "Your Role on a Hunt",
    page: 48,
    paragraphs: [
      "When your party goes on a hunt or heads out on an expedition, you choose a role from the ones detailed below. Each role can be only chosen by one character, except for the spotter role.",
      "Roles are meant to fire at different moments in the same area. Think of the flow as scout first (ahead), trailblazer second (party enters and tracks the quarry), spotter third (passive safety net while everyone else acts). Overlap feels redundant when every player rolls the same skills; the rules assume one person owns each step.",
      "Sometimes the party may split up. When split into groups of two the only roles available are the trailblazer and spotter.",
      "If someone is alone, they are both the trailblazer and spotter, but they either have to choose to take disadvantage on their survival roll for finding signs or take a -4 to their passive perception.",
    ],
    subsections: [
      {
        name: "Trailblazer",
        paragraphs: [
          "Primary Skill: Survival",
          "The trailblazer is the leader of the group and is the one who makes the final decision on which direction the group should go on a hunt. Whenever the group enters an area (new or old), the trailblazer rolls a survival check vs the creatures carve DC. On a failure the GM rolls a d10 on the finding signs table (found in the Going on a Hunt section in chapter 4), on a success the GM rolls a d20 instead. On a critical, the GM rolls a 2d20 and takes the highest roll, on a nat 1 the GM rolls 2d10 and takes the lowest roll.",
        ],
        inset: {
          name: "Example",
          paragraphs: [
            "The party leaves basecamp and enters the grassy fields toward Area 1. The Trailblazer rolls Survival vs the Yian Kut-ku's Carve DC and succeeds. The GM rolls a d20 on the Finding Signs Table (hidden) and gets an 11: the party finds a broken kut-ku scale plus a minor challenge (four Velociprey feeding on an Aptonoth).",
          ],
        },
        orderedList: [
          "Only the Trailblazer rolls Survival to advance the hunt. That roll determines whether the GM uses a d10 or d20 on the Finding Signs Table — this is how signs, challenges, and benefits are generated.",
          "Why the Scout should not replace this: the Scout goes ahead alone and reports what they see. They do not roll Survival vs the quarry's Carve DC for the whole party, and their Stealth/Perception does not move the sign counter.",
          "Why the Spotter should not replace this: passive Perception does not trigger Finding Signs. The Spotter catches what was missed; they do not choose the route or resolve hunt progress.",
        ],
      },
      {
        name: "Scout",
        paragraphs: [
          "Primary Skill: Perception, Stealth",
          "The scout is the initial person who enters an area, they get the lay of the land, potential resources, creatures in the area, potential hazards. When a scout notices a potential spot for an ambush it gives the spotter a +4 bonus to their perception.",
        ],
        inset: {
          name: "Example",
          paragraphs: [
            "Before the party enters Area 1, the Scout moves ahead and rolls Stealth (18) and Perception (12). They spot Velociprey on an Aptonoth carcass but miss the kut-ku scale in the grass. They return and brief the group so the party can approach with a plan.",
          ],
        },
        orderedList: [
          "The Scout acts before or at the edge of the area with active Stealth and Perception — tactical intel, not hunt-track progress.",
          "Why the Trailblazer should not replace this: the Trailblazer is with the main group and rolls Survival when the party enters the area. They do not quietly preview threats alone without splitting the party's action economy.",
          "Why the Spotter should not replace this: the Spotter uses passive Perception while others work. They do not advance into the area first, and they do not grant the +4 ambush warning unless the Scout flagged a danger zone.",
        ],
      },
      {
        name: "Spotter",
        paragraphs: [
          "Primary Skill: passive Perception",
          "The spotter uses their passive perception to scope out for any ambushes or dangers missed initially by the scout. There can be 2 spotters, the 2nd spotter gives a +4 perception bonus to the other, but does not provide any bonus to the original spotter's passive investigation.",
          "(Optional Rule) If your DM chooses to allow passive Investigations (10+ investigation skill bonus), then the spotter is also able to find resources in an area without needing to make an Intelligence (Investigation) to find them. A spotter is able to spot resources with their passive Investigation, only if it is higher than the investigation DC of the area they are in. Finally, a second spotter does not provide any bonus to the spotters passive Investigation.",
        ],
        inset: {
          name: "Example",
          paragraphs: [
            "While the party deals with the Velociprey, the Spotter keeps watch with passive Perception and notices the broken kut-ku scale the Scout walked past. With the optional passive Investigation rule, a Spotter with Investigation +10 might also spot gatherable plants without spending an action to search.",
          ],
        },
        orderedList: [
          "The Spotter is the passive safety net: ambushes, missed details, and (optionally) resources — without rolling every turn.",
          "Why the Scout should not replace this: the Scout is forward and focused on active recon. Once they return, someone still needs to watch the rear and flanks while others carve, negotiate, or heal.",
          "Why the Trailblazer should not replace this: the Trailblazer owns route and Survival for signs. Splitting attention would mean choosing disadvantage on Survival or -4 passive Perception when alone — the rules explicitly punish doing both jobs at once.",
        ],
      },
      {
        name: "Artisan",
        paragraphs: [
          "Primary Skill: Cooking Utensils, Three highest Ability Scores",
          "The artisan can cook a meal for the party at the start of a hunt and during a short or long rest (if they choose to), granting all who eat it a boon to help them on their hunt/journey/day.",
        ],
        inset: {
          name: "Example",
          paragraphs: [
            "At basecamp before leaving Area A, the Artisan cooks a meal. On a successful cooking check, everyone gains a boon (such as inspiration) before the Trailblazer leads the party toward the first hunting ground.",
          ],
        },
        orderedList: [
          "The Artisan sets the party's buff layer at hunt start and rests. No other role grants meal boons by default.",
          "Why combat-focused roles should not skip a dedicated Artisan: without them, the party loses a repeatable, action-free boost tied to short/long rests on long hunts.",
        ],
      },
    ],
  },
];
