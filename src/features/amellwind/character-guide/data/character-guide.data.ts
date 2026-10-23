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
    ["16-20", "20,000 gp plus 1d10 × 250 gp"],
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

const RARITY_SLOTS_TABLE: GuideTable = {
  colLabels: ["Rarity", "Slots"],
  rows: [
    ["Common", "1"],
    ["Uncommon", "2"],
    ["Rare", "3"],
    ["Very Rare", "4"],
    ["Legendary", "5"],
  ],
};

const ARMOR_UPGRADE_TABLE: GuideTable = {
  colLabels: ["Rarity", "Resource*", "Amount Needed", "Cost"],
  rows: [
    ["Uncommon", "Armor Sphere", "5", "500 gp"],
    ["Rare", "Hard Armor Sphere", "10", "1,500 gp"],
    ["Very Rare", "Heavy Armor Sphere", "15", "6,000 gp"],
    ["Legendary", "Royal Armor Sphere", "20", "24,000 gp"],
  ],
  footnotes: [
    '*Some creature materials will state that it is a "rarity" armor crafting material, these can be used in place of the resources listed in the table above.',
  ],
};

const WEAPON_UPGRADE_TABLE: GuideTable = {
  colLabels: ["Rarity", "Resource*", "Amount Needed", "Cost"],
  rows: [
    ["Uncommon", "Earth Crystal", "5", "500 gp"],
    ["Rare", "Machalite Ore", "10", "1,000 gp"],
    ["Very Rare", "Dragonite Ore", "15", "4,000 gp"],
    ["Legendary", "Carbalite Ore", "20", "16,000 gp"],
  ],
  footnotes: [
    '*Some creature materials will state that it is a "rarity" weapon crafting material, these can be used in place of the resources listed in the table above.',
  ],
};

const WEAPON_PRICING_TABLE: GuideTable = {
  colLabels: ["Weapon", "Cost", "Damage", "AC", "Weight", "Properties"],
  rows: [
    ["Accel Axe", "50 gp", "1d12 slashing", "—", "8 lb.", "heavy, two-handed"],
    ["Charge Blade", "30 gp", "Varies, see Appendix B.", "Varies", "7 lb.", "heavy, two-handed, switch mode"],
    ["Dual Blades", "30 gp", "1d6 slashing", "—", "4 lb.", "finesse, light, comes with a main & offhand weapon"],
    ["Great Sword", "50 gp", "2d6 slashing", "—", "6 lb.", "heavy, two-handed"],
    ["Gunlance", "50 gp", "1d8 piercing", "+2", "12 lb.", "reach, reload, comes with a shield"],
    ["Hammer", "35 gp", "2d6 bludgeoning", "—", "10 lb.", "heavy, two-handed"],
    ["Hunting Horn", "50 gp", "1d12 bludgeoning", "—", "8 lb.", "heavy, two-handed, chord length: 2"],
    ["Insect Glaive", "35 gp", "1d10 slashing", "—", "5 lb.", "two-handed"],
    ["Lance", "40 gp", "1d8 piercing", "+2", "12 lb.", "reach, versatile (1d10), comes with a shield"],
    ["Longsword", "25 gp", "1d10 slashing", "—", "3 lb.", "two-handed"],
    ["Magnet Spike", "35 gp", "Varies, see Appendix B.", "—", "7 lb.", "heavy, two-handed"],
    ["Magus Staff", "20 gp", "1d6 bludgeoning", "—", "4 lb.", "versatile (1d8)"],
    ["Splint Rapier", "30 gp", "Varies, see Appendix B.", "—", "4 lb.", "finesse, light"],
    ["Switch Axe", "30 gp", "Varies, see Appendix B.", "—", "7 lb.", "heavy, two-handed"],
    ["Sword & Shield", "20 gp", "1d6 slashing", "+2", "8 lb.", "finesse, light"],
    ["Tonfas", "25 gp", "1d6 bludgeoning", "—", "6 lb.", "light, comes with a main & offhand weapon"],
    ["Wired Knuckles", "30 gp", "1d4 bludgeoning", "—", "2 lb.", "light, comes with a main & offhand weapon"],
    ["Wyvern Boomerang", "40 gp", "1d10 slashing", "—", "8 lb.", "two-handed, thrown (60/180)"],
    ["Bow", "24 gp", "1d8 piercing", "—", "2 lb.", "ammunition (range 150/600), two-handed"],
    ["Dual Repeaters", "25 gp", "2d4 piercing", "—", "5 lb.", "ammunition (range 30/120), finesse, loading (6), light, special"],
    ["Heavy Bowgun", "50 gp", "1d10 piercing", "—", "18 lb.", "ammunition (range 100/400), heavy, two-handed"],
    ["Light Bowgun", "24 gp", "1d4 piercing", "—", "5 lb.", "ammunition (range 80/320), two-handed, rapid fire"],
  ],
  footnotes: [
    "*Weapons have additional magical properties depending on their rarity. You can find more information about each weapon in Appendix B.",
    "**Shields are not sold separately by the smithy, they are part of specific weapon purchases.",
  ],
};

const ARMOR_PRICING_TABLE: GuideTable = {
  colLabels: ["Armor", "Cost", "Armor Class (AC)", "Strength", "Stealth", "Weight"],
  rows: [
    ["Padded (light)", "5 gp", "11 + Dex modifier", "—", "Disadvantage", "8 lb."],
    ["Leather (light)", "10 gp", "11 + Dex modifier", "—", "—", "10 lb."],
    ["Studded Leather (light)", "45 gp", "12 + Dex modifier", "—", "—", "13 lb."],
    ["Hide (medium)", "10 gp", "12 + Dex modifier (max 2)", "—", "—", "12 lb."],
    ["Chain Shirt (medium)", "50 gp", "13 + Dex modifier (max 2)", "—", "—", "20 lb."],
    ["Scale Mail (medium)", "50 gp", "14 + Dex modifier (max 2)", "—", "Disadvantage", "45 lb."],
    ["Breastplate (medium)", "400 gp", "14 + Dex modifier (max 2)", "—", "—", "20 lb."],
    ["Half Plate (medium)", "700 gp", "15 + Dex modifier (max 2)", "—", "Disadvantage", "—"],
    ["Ring Mail (heavy)", "30 gp", "14", "—", "Disadvantage", "40 lb."],
    ["Chain Mail (heavy)", "75 gp", "16", "Str 13", "Disadvantage", "55 lb."],
    ["Splint (heavy)", "200 gp", "17", "Str 15", "Disadvantage", "60 lb."],
    ["Plate (heavy)", "1,500 gp", "18", "Str 15", "Disadvantage", "65 lb."],
  ],
  footnotes: [
    "***No other armor exists in Monster Hunter. +1 armor or +3 armor is not something you will find at the smithy or on a hunt.",
  ],
};

const GREAT_JAGRAS_LOOT_TABLE: GuideTable = {
  colLabels: ["Carve Chance", "Capture Chance", "Material", "Slots"],
  rows: [
    ["1-6", "1-4", "Great Jagras Scale", "A"],
    ["7-11", "5-10", "Great Jagras Hide", "A"],
    ["12-15", "11-14", "Great Jagras Mane", "A"],
    ["16-20", "15-16", "Great Jagras Claw", "W"],
    ["—", "17-20", "Monster Bone+", "O"],
  ],
  footnotes: ["Great Jagras — Challenge Rating 4, Carves/Capture 2."],
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
    id: "equipment",
    name: "Equipment",
    paragraphs: [
      "Equipment and Equipment Crafting are essentials of Monster Hunter. Players will seek out monster materials to use to improve their weapons, armor, and consumables. Below you will find the rules for weapons and armor, new items, and crafting.",
    ],
    subsections: [
      {
        name: "Starting Equipment",
        paragraphs: [
          "When you create your character, you receive equipment based on a combination of your class and background as per usual with a standard D&D game, except that you start with at least one of the new Monster Hunter Weapons found in appendix B and two trinkets. Alternatively, you can start with a number of gold pieces based on your class and spend them on items from the lists in this book or in the PHB. See the Starting Wealth by Class table (PHB p.143) to determine how much gold you have to spend.",
          "You decide how your character came by this starting equipment. Typically you would have been equipped with a weapon, armor, and a backpack as part of graduating from the Wyvernian Academy, or from one of the other suggestions in the PHB.",
          "Starting above 1st level? See the Higher Level tab for starting wealth, weapons, armor, and monster materials by level.",
        ],
      },
      {
        name: "Wealth",
        paragraphs: [
          "Wealth in the Monster Hunter universe is the same as in a standard D&D universe. Though it is a high magic setting, so a couple hundred gold is a pretty standard reward for a hunting party fresh out of the Wycademy. While high rank rewards can range in the tens if not hundreds of thousands.",
        ],
      },
      {
        name: "Selling Treasure",
        paragraphs: [
          "Opportunities are abound to find monster parts research items; rare ores, bugs, plants, etc; and old weapons and armor. Normally, you can sell your treasures and trinkets when you return to a town or other settlement, provided that the town, guild, research fleet, or wandering merchants are interested in your loot.",
        ],
      },
      {
        name: "Magical Items",
        paragraphs: [
          "Magical items do not exist in Monster Hunter the same way that they do in a normal D&D game. You cannot find or obtain a Flame Tongue Long sword, a Staff of Frost or any other magical armor, weapon, or wonderous items. Instead, when you kill or capture a creature, the party receives a number of materials that can be inserted into their weapons and armor to gain their magical effects. Think of it as a \"create your own magical items.\"",
          "The number of materials you obtain from a creature is shown on the creatures loot table located in the Monster Hunter Monster Loot Table PDF.",
        ],
        subsections: [
          {
            name: "Limited Use Magical Items",
            paragraphs: [
              "Magical Items that have a limited number of uses, such as potions, food, spell scrolls, Bag of Beans (DMG 152), Dust of Disappearance (DMG 166), etc are all allowed and made available based on your GMs choosing.",
            ],
          },
          {
            name: "Attunement",
            paragraphs: [
              "When you finish a Short or Long rest you can attune to one weapon, one armor, and two trinkets. You cannot attune to multiple weapons or armor, and only one attuned trinket is active at a time, granting you the material effect placed inside of it. As an action, you can swap between which trinket is active.",
              "An unattuned armor or weapon acts as a common version of the weapon no matter its rarity; preventing the use of the weapon properties it gained from the rarity increase. Additionally, any materials in these unattuned armor or weapons are disabled until attuned.",
            ],
          },
        ],
      },
      {
        name: "Armor",
        paragraphs: [
          "Armor in the Monster Hunter universe is comprised of all nonmagical armor in the Player's Handbook (p.145) and uses the standard rules for the armor. A PC at level 1 starts with the armor in their starting equipment of their class. This armor can be enhanced at the Smithy using materials you obtain while out on a hunt. They usually have the look and feel of the monsters utilized to enhance the armor.",
        ],
        subsections: [
          {
            name: "Rarity",
            paragraphs: [
              "There are 5 rarities of armor in Monster Hunter: common, uncommon, rare, very rare, and legendary. Each rarity has a number of slots the hunter can use to place monster materials in. These monster materials enchant their armor with magical effects.",
              "When your armor's rarity increases to rare and above, choose one of the following properties it gains: +1 bonus to your AC, +1 to two skills of your choice, +1 to a chosen saving throw, or +1 to all saving throws you are not proficient with. You can pick the same bonus each time your armor's rarity increases or a different one if that is your preference.",
            ],
            table: RARITY_SLOTS_TABLE,
          },
          {
            name: "Rules",
            paragraphs: [
              "Below you will find a set of rules that limit the materials that you can place in your armor, to provide a fair and balanced game:",
            ],
            orderedList: [
              "Your armor can only have one damage reduction, resistance, or immunity to any one damage type.",
              "Your armor can only have one advantage or immunity vs a condition such as poisoned, frightened, or prone.",
              "Your armor can only have one material that grants a bonus to AC.",
              "Your armor can only have one effect that uses runes.",
              "A material can only be replaced with another material. Once replaced the previous material is destroyed.",
              "Materials do not stack with improved versions of their effects, including unnamed materials (IE: detect does not stack with detect+).",
            ],
          },
          {
            name: "Clothing",
            paragraphs: [
              "A class that does not use armor such as a barbarian, monk, or some spellcasters can choose a piece of clothing as their armor. For example, this could be a robe, a tunic, or a loincloth. This armor provides no AC increase, but they can have their rarity upgrade the same way as a normal piece of armor can be to increase the material slots for magical effects.",
            ],
          },
          {
            name: "Upgrading your Armor",
            paragraphs: [
              "When you want to upgrade your armor consult the table below. Once you have the correct number of resources, a smithy will upgrade your armor for the cost listed. It takes one week to complete the process.",
            ],
            table: ARMOR_UPGRADE_TABLE,
          },
        ],
      },
      {
        name: "Shields",
        paragraphs: [
          "Shields in the Monster Hunter universe can only be used with a weapon that already provides it. Any AC bonus it may provide is increased as the weapon's rarity changes, as shown in the weapons information in appendix B.",
        ],
      },
      {
        name: "Weapons",
        paragraphs: [
          "Your class grants proficiency in certain weapons, reflecting both the class's focus and the tools you are most likely to use. Whether you favor an insect glaive or a heavy bowgun, your weapon and your ability to wield it effectively can mean the difference between life and death while adventuring.",
          "There are 21 types of weapons in the Monster Hunter universe: Accel Axe, Charge Blade, Dual Blades, Great Sword, Gunlance, Hammer, Hunting Horn, Insect Glaive, Lance, Longsword, Magnet Spike, Magus Staff, Splint Rapier, Switch Axe, Sword & Shield, Tonfas, Wyvern Boomerang Bow, Dual Repeaters, Light Bowgun, and Heavy Bowgun. These are the only weapons available to the players and other npcs. Standard D&D weapons do not exist in this world, but their proficiencies are still used to determine which type of weapon each class can use. Each weapon's compatible proficiencies are listed on the Weapons page.",
          "All weapons stats & additional information can be found in Appendix B.",
        ],
        subsections: [
          {
            name: "Unarmed Strikes",
            paragraphs: [
              "A character can choose to attune to an \"unarmed item\" instead of a weapon, such as handwraps, gauntlets, or knuckles. This item is treated as a weapon for upgrading, attunement and material placement. This item has no special properties except that it offers 1 additional material slot per rarity level. E.g. an uncommon \"unarmed item\" would have 3 material slots rather than 2.",
            ],
          },
          {
            name: "Rarity",
            paragraphs: [
              "There are 5 rarities of weapons in Monster Hunter: common, uncommon, rare, very rare, and legendary. Each rarity has a number of slots the hunter can place materials into, enhancing their weapon with magical effects. Additionally, as the weapon's rarity increases their effects also improve.",
            ],
            table: RARITY_SLOTS_TABLE,
          },
          {
            name: "Rules",
            paragraphs: [
              "Below you will find a set of rules that limit the materials that you can place in your weapon, to provide a fair and balanced game:",
            ],
            orderedList: [
              "A weapon can have one material that causes an effect when you roll a 20, such as critical status effect on the Fancy Beak material. This material is exempt from rule 2.",
              "A weapon can only have one extra damage, condition inflicting, or on-hit effect material. The extra damage material rule doesn't apply to materials that have a requirement to deal that extra damage, such as the partbreaker effect found on the Gravios Carapace material.",
              "A weapon can only have one effect that uses runes.",
              "A weapon can only have one bonus to spell DC and spell attack rolls.",
              "A material can only be replaced with another material. Once replaced the previous material is destroyed.",
              "Materials do not stack with improved versions of their effects, including unnamed materials (IE: critical eye+1 does not stack with critical eye+2).",
            ],
          },
          {
            name: "Upgrading your Weapon",
            paragraphs: [
              "When you want to upgrade your weapon consult the table below. Once you have the correct number of resources, a smithy will upgrade your weapon for the cost listed. It takes one week to complete the process.",
            ],
            table: WEAPON_UPGRADE_TABLE,
          },
        ],
      },
      {
        name: "Trinkets",
        paragraphs: [
          "Trinkets in Monster Hunter are not just for show. They have 1 material slot that you can place a weapon or armor material into and still gain their benefit as if it was in a weapon or armor set. You can have up to two trinkets on you at a time, but you only gain the effect of one of the trinkets at a time. As an action, you can swap which trinket effect you are using.",
          "Players can choose a trinket from the Player's Handbook (p.159) or perhaps a trophy from a creature they have hunted. If they do not find something they like on the list, the player can work with the GM to choose an appropriate trinket for their setting.",
        ],
        subsections: [
          {
            name: "Rules",
            paragraphs: [
              "If the material grants an effect such as extra damage on weapon attacks, or requires the armor to be worn, then it only works on armor or weapons you are attuned to.",
            ],
          },
          {
            name: "Cosmetic Material Slot",
            paragraphs: [
              "There are many materials you may find while hunting monsters. These cosmetic materials have no mechanical benefit, but change your characters appearance in some way. You have one cosmetic slot in either your armor or weapon (your choice) that you can place a cosmetic material into or replace when you find a different that suits your character a bit more.",
            ],
          },
        ],
      },
      {
        name: "Armor & Weapon Pricing",
        subsections: [
          { name: "Weapons", table: WEAPON_PRICING_TABLE },
          { name: "Armor", table: ARMOR_PRICING_TABLE },
        ],
      },
      {
        name: "Let's Walk Through It All",
        paragraphs: [
          "With all the information you have read above, let's give an example of what you might see at the start of your game and how it all works.",
          "Conrad is a level 2 fighter who has just killed his first great jagras (p.68 MHMM). He is currently wielding a common greatsword, wearing chainmail (that he got with his starting equipment), and has a tiny silver icon of a raven (his Trinket) attached to his belt.",
          "Being excited over his first kill, Conrad attempts to carve the great jagras to obtain some materials he might be able to use. The GM then looks up the great jagras in the Monster Hunter Loot Table PDF to see how many carves Conrad will get to attempt on the creature. In this case we can see the great jagras's loot table below. Looking at the top of the table, Conrad gets two attempts at carving this creature (He would have also gotten two rolls on the capture table should he have captured it).",
          "Next we need to determine the DC of the carve check. In this case the difficulty is a DC 12 (10 + 1/2 of the creatures CR rounded down). So Conrad makes his first Wisdom (Survival) check and rolls a 13! A success, and on a success we roll a d20. Conrad rolls a 14 which we compare to the carve chance section of the loot table. A 14 gets Conrad a Great Jagras Mane which is an armor material that makes it so you no longer need to eat or drink.",
          "On Conrad's second carve attempt he rolls another Wisdom (Survival) check and rolls a 9. With the carve DC being 12 he fails the second carve attempt. Just because Conrad failed, doesn't mean he does not get anything, instead a failure results in you rolling a 1 on the creature's loot table. For his second item Conrad gets a great jagras scale which gives a +2 bonus to intimidation checks when placed into an armor slot. With the hunt complete, Conrad returns to the guild and reports his success.",
          "At the guild he wants to make use of the materials he has just obtained, but he realizes there is one issue. Both materials he gathered are both armor materials and his common chainmail only has 1 slot. He has to choose which material to place into his armor. After some thought and deliberation, Conrad decides to place the great jagras mane into his armor, so that he no longer needs to eat or drink while he is attuned to this armor.",
          "He then places the great jagras scale material into his trinket, because it can hold either 1 armor or weapon material in it. This way he can always have the great jagras scale effect when he needs to be a bit more intimidating. He can also then replace the great jagras scale with a stronger material once he finds one he prefers.",
        ],
        table: GREAT_JAGRAS_LOOT_TABLE,
        bulletList: [
          "{@b Great Jagras Scale (A).} You have a +2 bonus to Intimidation checks while you wear this armor.",
          "{@b Great Jagras Hide (A) — Speed Eating.} While you are attuned to this armor, you can use any consumable, such as a potion or food, as a bonus action; so long as you are the one consuming it.",
          "{@b Great Jagras Mane (A).} Free meal. While attuned to this armor, you no longer need to eat or drink.",
          "{@b Great Jagras Claw (W) — Palico Rally.} NPC allies within 10 feet of you gain +1 AC and +1 to attack rolls while you are attuned to this weapon.",
          "{@b Monster Bone+ (O).} Rare weapon crafting material.",
        ],
        inset: {
          name: "Creator's Note",
          paragraphs: [
            "Hopefully this walkthrough of the process helps answer any questions you might have. The one thing I will note is that the great jagras is a lower CR creature and as such most of its materials have common magical effects, but as you start to kill stronger and more difficult creatures you will begin to see more powerful materials that you can socket into your armor, trinket, and weapons.",
          ],
        },
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
          "If your DM plans to use the shrine benefits or cursed shrine complications. An Arcana check can help determine if it's worth touching, if the shrine is more closely related to magic than religion. An Arcana check can also help identify magical effects left by creatures, such as the Gore Magala's frenzy virus.",
      },
      {
        name: "History",
        description:
          "Used when attempting to recall information about a creature a character may have read about or has done other research on.",
      },
      {
        name: "Investigation",
        description:
          "Used for finding resources in an area and looking for signs when a Perception check finds nothing.",
      },
      {
        name: "Medicine",
        description:
          "Can be used to determine what type of the new blight conditions (found in the MHMM) a creature is suffering from.",
      },
      {
        name: "Nature",
        description:
          "Used when attempting to discern what a creature(s) is by the signs they find, the silhouettes they see off in the distance, or possibly by the impact the creature has on the environment.",
      },
      {
        name: "Perception",
        description:
          "Used by both the scout and spotter roles during hunts (see the Scout and Spotter roles in this chapter for more information).",
      },
      {
        name: "Religion",
        description:
          "If your DM plans to use the shrine benefits or cursed shrine complications. A Religion check can help determine if it's worth touching, if the shrine is more religiously based.",
      },
      {
        name: "Stealth",
        description:
          "Commonly used by the scout role during hunts (see the Scout role in this chapter for more information).",
      },
      {
        name: "Survival",
        description:
          "Used by the trailblazer role during hunts (see the Trailblazer role in this chapter for more information).",
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
