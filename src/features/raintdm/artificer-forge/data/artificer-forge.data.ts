import type { GuideSection, GuideTable } from "@/shared/types";

export const ARTIFICER_FORGE_INTRO = [
  "EFA is the official book Eberron: Forge of the Artificer, which contains the 2024 version of the Artificer class.",
  "This version drops infusions in favor of Replicate Magic Item: you learn plans and create magic items from them. An Amellwind table has no magic items, so this Forge adaptation keeps the 2024 chassis and changes only what a plan produces: a Material Effect instead of a magic item.",
  "Plans Known, Active Effects, and unlock levels are exactly the 2024 numbers. The +1 material slot on weapon and armor at levels 10, 14, and 18 from the Amellwind Hunter's Guide is unchanged.",
];

const PLAN_LIST_COLUMNS = ["Effect", "Slot", "Rarity", "Summary", "Replaces"];

export const ARTIFICER_FORGE_COMPARISON_TABLE: GuideTable = {
  colLabels: ["", "Amellwind (2014)", "2024 (EFA)", "Forge adaptation"],
  rows: [
    [
      "Core feature",
      "Artificer Infusions",
      "Replicate Magic Item",
      "Replicate Material Effect",
    ],
    [
      "What you make",
      "Infusion materials",
      "Magic items from plans",
      "Material Effects from plans",
    ],
    [
      "Duration",
      "Until removed during a long rest, forgotten, or you leave the party",
      "Until you decide; vanishes if the plan is replaced, the cap is exceeded, or you die",
      "Same as EFA",
    ],
    [
      "Extra slots",
      "+1 weapon and armor material slot at levels 10, 14, 18",
      "Attune to 4, 5, 6 items at levels 10, 14, 18",
      "Unchanged: +1 weapon and armor material slot at levels 10, 14, 18",
    ],
  ],
};

export const ARTIFICER_FORGE_PROGRESSION_TABLE: GuideTable = {
  colLabels: [
    "Artificer Level",
    "Plans Known",
    "Active Effects",
    "Plan List",
  ],
  rows: [
    ["2", "4", "2", "List starts: 7 effects"],
    ["6", "5", "3", "+12 effects (18 available)"],
    ["10", "6", "4", "+16 effects (31 available)"],
    ["14", "7", "5", "+17 effects (39 available)"],
    ["18", "8", "6", "No list change"],
  ],
};

const LEVEL_2_LIST: GuideTable = {
  colLabels: PLAN_LIST_COLUMNS,
  rows: [
    [
      "Divine Blessing",
      "Armor",
      "Common",
      "Reduce damage you take (unless immune or resistant) by 1d4. Uses equal your proficiency bonus per long rest.",
      "—",
    ],
    [
      "Recovery Speed",
      "Armor",
      "Common",
      "Hit Dice you roll to regain hit points restore double.",
      "—",
    ],
    ["Detect", "Armor", "Common", "+1 to passive Perception.", "—"],
    [
      "Team Player",
      "Armor",
      "Common",
      "Take the Help action as a bonus action, twice per long rest.",
      "—",
    ],
    ["Marathon Runner", "Armor", "Common", "+5 feet walking speed.", "—"],
    [
      "Taunt",
      "Weapon",
      "Common",
      "Reaction: when a creature you can see attacks another target within 5 feet of you, redirect the attack to you.",
      "—",
    ],
    [
      "Current Resist",
      "Weapon",
      "Common",
      "While holding the weapon, you are unaffected by water currents, natural or magical, unless you choose otherwise.",
      "—",
    ],
  ],
};

const LEVEL_6_LIST: GuideTable = {
  colLabels: PLAN_LIST_COLUMNS,
  rows: [
    [
      "Divine Blessing+",
      "Armor",
      "Uncommon",
      "As Divine Blessing, but the die is a d6.",
      "Divine Blessing",
    ],
    [
      "Guard",
      "Armor",
      "Common",
      "You can't be pushed or knocked backward.",
      "—",
    ],
    [
      "Evade Extender (S)",
      "Armor",
      "Uncommon",
      "+1 to Dexterity saving throws.",
      "—",
    ],
    [
      "Stamina Surge",
      "Armor",
      "Uncommon",
      "Action: cast haste on yourself, once per day. You gain 3 levels of exhaustion when it ends.",
      "—",
    ],
    [
      "Guts",
      "Armor",
      "Uncommon",
      "When reduced to 0 hit points but not killed outright, drop to 1 hit point instead. Once per long rest.",
      "—",
    ],
    [
      "Spider Climb",
      "Armor",
      "Uncommon",
      "Climb vertical surfaces and ceilings hands-free with a climbing speed equal to your walking speed. Doesn't work on slippery surfaces such as ice or oil.",
      "—",
    ],
    [
      "Negate Bleeding",
      "Armor",
      "Uncommon",
      "Immune to wounding effects, such as Odogaron's bloody wound.",
      "—",
    ],
    [
      "Critical Draw",
      "Weapon",
      "Uncommon",
      "First round of combat: your melee weapon attacks score a critical hit on a 17 or higher.",
      "—",
    ],
    [
      "Partbreaker",
      "Weapon",
      "Uncommon",
      "+1d4 damage on a critical hit.",
      "—",
    ],
    [
      "Ammo Saver",
      "Weapon",
      "Uncommon",
      "Ranged attack roll of 17–20: the ammunition isn't consumed.",
      "—",
    ],
    [
      "Stamina Drain",
      "Weapon",
      "Uncommon",
      "On a hit, the target's speed is reduced by 5 feet until the start of your next turn.",
      "—",
    ],
    [
      "Sharpening",
      "Weapon",
      "Uncommon",
      "Sharpen a bladed weapon during a rest; the first hit afterward deals maximum piercing or slashing damage.",
      "—",
    ],
  ],
};

const LEVEL_10_LIST: GuideTable = {
  colLabels: PLAN_LIST_COLUMNS,
  rows: [
    [
      "Divine Blessing+2",
      "Armor",
      "Rare",
      "As Divine Blessing, but the die is a d8.",
      "Divine Blessing+",
    ],
    [
      "Evade Extender (M)",
      "Armor",
      "Rare",
      "+2 to Dexterity saving throws.",
      "Evade Extender (S)",
    ],
    [
      "Partbreaker+1",
      "Weapon",
      "Rare",
      "+1d6 damage on a critical hit.",
      "Partbreaker",
    ],
    [
      "Hero Shield",
      "Armor",
      "Uncommon",
      "Immune to bludgeoning, piercing, and slashing damage from creatures of CR 2 or lower.",
      "—",
    ],
    [
      "Survivor",
      "Armor",
      "Rare",
      "Reaction: when an ally you can see drops to 0 hit points, gain +1 AC, damage, and attack rolls for 1 minute. Once until the next dawn.",
      "—",
    ],
    [
      "Wide-Range",
      "Armor",
      "Rare",
      "Herbs, antidotes, drinks, and seeds you use also affect creatures within 10 feet of you.",
      "—",
    ],
    [
      "Handicraft",
      "Armor",
      "Rare",
      "Each dawn, gain proficiency with one artisan's tool of your choice for 24 hours.",
      "—",
    ],
    ["Alert", "Armor", "Rare", "You can't be surprised while conscious.", "—"],
    [
      "Rock Steady",
      "Armor",
      "Rare",
      "You can't be unwillingly knocked prone and you ignore wind-barrier effects such as Kushala Daora's or Amatsu's.",
      "—",
    ],
    [
      "Negate Sleep",
      "Armor",
      "Rare",
      "You can't be put to sleep unwillingly.",
      "—",
    ],
    [
      "Tool Specialist",
      "Armor",
      "Rare",
      "Double your proficiency bonus on ability checks with tools you're proficient with.",
      "—",
    ],
    [
      "Airborne",
      "Armor",
      "Rare",
      "Cast jump on yourself as a bonus action, at will.",
      "—",
    ],
    [
      "Critical Eye",
      "Weapon",
      "Rare",
      "Your weapon attacks' critical hit range increases by 1.",
      "—",
    ],
    [
      "Weakness Exploit",
      "Weapon",
      "Rare",
      "Deal maximum damage to a creature vulnerable to the weapon's damage type.",
      "—",
    ],
    [
      "Siege",
      "Weapon",
      "Rare",
      "Double damage to objects and structures.",
      "—",
    ],
    [
      "Status Pursuit",
      "Weapon",
      "Rare",
      "Advantage on opportunity attacks; creatures afflicted with a condition provoke them even if they took the Disengage action.",
      "—",
    ],
  ],
};

const LEVEL_14_LIST: GuideTable = {
  colLabels: PLAN_LIST_COLUMNS,
  rows: [
    [
      "Divine Blessing+3",
      "Armor",
      "Very Rare",
      "As Divine Blessing, but the die is a d10.",
      "Divine Blessing+2",
    ],
    [
      "Evade Extender (L)",
      "Armor",
      "Very Rare",
      "+3 to Dexterity saving throws.",
      "Evade Extender (M)",
    ],
    [
      "Stamina Surge+1",
      "Armor",
      "Rare",
      "As Stamina Surge, but you gain 2 levels of exhaustion when it ends.",
      "Stamina Surge",
    ],
    [
      "Survivor+",
      "Armor",
      "Very Rare",
      "As Survivor, but +2 AC, damage, and attack rolls.",
      "Survivor",
    ],
    [
      "Wide-Range+",
      "Armor",
      "Very Rare",
      "As Wide-Range, but within 20 feet.",
      "Wide-Range",
    ],
    [
      "Handicraft+2",
      "Armor",
      "Very Rare",
      "As Handicraft, but with two artisan's tools.",
      "Handicraft",
    ],
    [
      "Critical Draw+",
      "Weapon",
      "Rare",
      "As Critical Draw, but on a 15 or higher.",
      "Critical Draw",
    ],
    [
      "Partbreaker+2",
      "Weapon",
      "Very Rare",
      "+1d8 damage on a critical hit.",
      "Partbreaker+1",
    ],
    [
      "Critical Eye+",
      "Weapon",
      "Very Rare",
      "Your weapon attacks' critical hit range increases by 2.",
      "Critical Eye",
    ],
    [
      "Evasion",
      "Armor",
      "Very Rare",
      "Advantage on Dexterity saving throws.",
      "—",
    ],
    [
      "Blightproof",
      "Armor",
      "Very Rare",
      "Immune to blight spells, spell-like abilities, and conditions.",
      "—",
    ],
    [
      "Critical Boost",
      "Weapon",
      "Very Rare",
      "Roll one additional weapon damage die when determining a critical hit's extra damage.",
      "—",
    ],
    [
      "Heavy Polish",
      "Weapon",
      "Very Rare",
      "The weapon ignores a creature's resistance to slashing damage.",
      "—",
    ],
    [
      "Elderseal",
      "Weapon",
      "Very Rare",
      "A creature you hit can't use an action with a recharge until the start of your next turn (it can still roll to recharge at the end of its turn).",
      "—",
    ],
    [
      "Strong Attack",
      "Weapon",
      "Very Rare",
      "When you hit a creature, use a bonus action to push it back 10 feet.",
      "—",
    ],
    [
      "Trump Card",
      "Weapon",
      "Very Rare",
      "Advantage on attack rolls against grappled creatures.",
      "—",
    ],
    [
      "Enlightened Blade",
      "Weapon",
      "Very Rare",
      "Advantage on Intelligence (Arcana) checks; elemental damage dice the weapon deals increase by one size.",
      "—",
    ],
  ],
};

export const DRAIN_SLOT_TABLE: GuideTable = {
  colLabels: ["Rarity of the active effect", "Spell slot level"],
  rows: [
    ["Common", "1"],
    ["Uncommon", "2"],
    ["Rare", "2"],
    ["Very Rare", "3"],
  ],
};

export const ARTIFICER_FORGE_SECTIONS: GuideSection[] = [
  {
    id: "overview",
    name: "What Changes",
    subsections: [
      {
        name: "Amellwind vs. 2024 vs. Forge",
        table: ARTIFICER_FORGE_COMPARISON_TABLE,
      },
    ],
  },
  {
    id: "replicate",
    name: "Replicate Material Effect (Level 2)",
    intro: [
      "You have learned arcane plans that you use to make Material Effects. This replaces Replicate Magic Item.",
    ],
    subsections: [
      {
        name: "Plans Known and Active Effects",
        paragraphs: [
          "Plans Known is how many plans you can have. Active Effects is the most replicated effects you can have at once. Both are the 2024 values. The Plan List below grows at levels 2, 6, 10, and 14.",
        ],
        table: ARTIFICER_FORGE_PROGRESSION_TABLE,
      },
      {
        name: "Rules",
        bulletList: [
          "{@b Plans.} Each plan is a Material Effect from the Plan List, not from the whole Material Effects catalog. Choose four plans when you gain this feature.",
          "{@b Swapping plans.} Whenever you gain an Artificer level, you can replace one plan you know with another plan you qualify for.",
          "{@b Creating effects.} When you finish a long rest, you can create effects, each based on a different plan you know. Place each in a weapon or armor slot you own or one belonging to a willing creature. It replaces the active material in that slot, which stays underneath unharmed.",
          "{@b Duration.} An effect doesn't end on a long rest; it lasts until you decide to remove it. It also vanishes if you replace the plan it was made from (immediately), if you exceed your Active Effects maximum (the oldest vanishes), or if you die (1d4 days later).",
          "{@b Another creature's gear.} An effect placed in gear you don't own counts as two of your Active Effects.",
          "{@b No duplicates.} You can't know or have active the same effect twice; every version of an effect counts as the same effect ([[Divine Blessing]] and [[Divine Blessing+]], for example). A creature also can't receive an effect it already has active from a real material.",
          "{@b No attunement.} Effects that require attunement are not on the Plan List.",
          "{@b Limited uses.} Uses are regained when you finish a long rest. An effect whose original recharge is longer than a long rest ([[Guts]]: 2 days) is usable once per long rest.",
        ],
      },
    ],
  },
  {
    id: "plan-list",
    name: "Plan List",
    intro: [
      "You use a single list, and it updates as the feature evolves at Artificer levels 2, 6, 10, and 14. Each table below shows what is added at that level.",
      "Some effects are an improved version of one already on the list ([[Divine Blessing]] becomes [[Divine Blessing+]], then [[Divine Blessing+2]], then [[Divine Blessing+3]]). When the improved version is added, it {@b replaces} the earlier one, which is no longer available. A plan you know for the replaced effect becomes the new version automatically, without spending another plan.",
      "The Rarity column is the effect's rarity in the Material Effects catalog. It only matters for Drain Material Effect; it doesn't decide the level at which an effect appears. Tables show summaries; select an effect name to open its full Material Effect entry.",
    ],
    subsections: [
      { name: "Level 2: 7 effects", table: LEVEL_2_LIST },
      { name: "Level 6: +12 effects (18 available)", table: LEVEL_6_LIST },
      { name: "Level 10: +16 effects (31 available)", table: LEVEL_10_LIST },
      { name: "Level 14: +17 effects (39 available)", table: LEVEL_14_LIST },
    ],
    footerNote:
      "[[Ammo Saver]] has no improved version, and [[Stamina Surge+1]] and [[Critical Draw+]] don't appear until level 14. At level 14 the Artificer has 39 distinct effects available.",
  },
  {
    id: "tinker",
    name: "Magic Item Tinker (Level 6)",
    intro: [
      "Adapted from the 2024 feature. Charge Magic Item doesn't apply because Material Effects don't use item charges.",
    ],
    subsections: [
      {
        name: "Drain Material Effect",
        paragraphs: [
          "As a bonus action, touch an active replicated effect within 5 feet of you. The effect ends, converting its energy into a spell slot. The slot's level depends on the rarity of the effect you drained.",
          "Once you use this, you can't do so again until you finish a long rest. The spell slot vanishes when you finish a long rest. You keep the plan, and the material that was underneath becomes active again.",
        ],
        table: DRAIN_SLOT_TABLE,
      },
      {
        name: "Transmute Material Effect",
        paragraphs: [
          "As a Magic action, touch an active replicated effect within 5 feet of you and transform it into a different effect based on a plan you know. The new effect must be for the same kind of gear (weapon or armor) and can't be one you already have active.",
          "Once you use this, you can't do so again until you finish a long rest.",
        ],
      },
    ],
  },
  {
    id: "slots",
    name: "Material Slots (Levels 10, 14, 18)",
    paragraphs: [
      "Unchanged from the Amellwind Hunter's Guide. Artificers don't gain extra attunement slots. Instead, they gain +1 material slot on both their weapon and their armor at levels 10, 14, and 18. These are the levels of Magic Item Adept, Savant, and Master, which raise attunement to 4, 5, and 6 items in the 2024 rules.",
    ],
  },
  {
    id: "criteria",
    name: "What Is Not on the List",
    intro: [
      "The Plan List contains basic, useful effects that work on any weapon or armor. These are left out:",
    ],
    bulletList: [
      "{@b Loot and resource generators:} [[Botanist]], [[Geologist]], [[Luck]], [[Pack Rat]], [[Capturer]], [[Bounty Hunter]], [[Carving Celebrity]], [[Hunter]], [[Honey Hunter]]. Replicating them would mean endless loot and break the hunting loop.",
      "{@b Weapon-type specific:} [[Artillery]], [[Horn Maestro]], [[Bonus Shot]], [[Rapid Fire]], [[Soul of the Dragoon]], [[Punish Draw]], [[FastCharge]], and similar.",
      "{@b Cross-references to another table:} [[Blast Coat]], [[Capacity Boost]], [[Mushroomancer+]].",
      "{@b Class resources or ability score changes.}",
      "{@b Attunement required:} [[Well Rested]], [[Earplugs]], [[Shield]], [[Speed Eating]], [[Constitution]], [[Wind Barrier]].",
      "{@b Removed for balance:} [[Iron Wall]], [[Good Luck]], [[Honed Blade]], [[Health Boost]], [[Heat Guard]], [[Stamina Surge+2]], [[Ammo Saver+]].",
    ],
  },
];
