/**
 * Guild Knight stat blocks from GTMH Appendix C (Old World Bestiary), shaped
 * as 5etools monster JSON so `mapMonster` + `MonsterStatBlock` render them
 * like bestiary entries. Source slice: `gtmh-patreon-appendixC.md`.
 */

export const GUILD_KNIGHTS_INTRO =
  "The guild knight stat blocks use materials found in the Monster Hunter Monster Loot Tables. The materials can be swapped, but it is best to swap the materials with others from the same CR range.";

const SOURCE = "GTMH-Patreon";
const TYPE = { type: "humanoid", tags: ["any race"] };
const ALIGNMENT = ["Any lawful alignment"];
const LANGUAGES = ["any one language (usually Common)"];

const BRAVE = {
  name: "Brave",
  entries: [
    "The guild knight has advantage on saving throws against being frightened.",
  ],
};

const PALADIN_SPELLS_LOW = [
  "1st level (4 slots): {@spell bless}, {@spell command}, {@spell cure wounds}, {@spell heroism}, {@spell protection from evil and good}, a smite spell ({@spell searing smite}, {@spell thunderous smite}, or {@spell wrathful smite})",
  "2nd level (3 slots): {@spell lesser restoration}, {@spell protection from poison}, {@spell zone of truth}",
];

export const GUILD_KNIGHTS = [
  {
    name: "Guild Knight Apprentice",
    source: SOURCE,
    size: ["M"],
    type: TYPE,
    alignment: ALIGNMENT,
    ac: [{ ac: 19, from: ["chainmail", "shield +1"] }],
    hp: { average: 65, formula: "10d8 + 20" },
    speed: { walk: 30 },
    str: 15,
    dex: 13,
    con: 15,
    int: 12,
    wis: 16,
    cha: 14,
    save: { con: "+4", wis: "+5" },
    skill: { perception: "+5" },
    passive: 15,
    languages: LANGUAGES,
    cr: "3",
    trait: [
      BRAVE,
      {
        name: "R.Ludroth Tail (3/Long Rest)",
        entries: [
          "When the guild knight takes damage they are not immune or resistant to, roll a {@dice d4} and reduce the damage taken by the amount rolled.",
        ],
      },
      {
        name: "Passive Materials",
        entries: [
          "The following materials are already included in other parts of the stat block: Nerscylla Shell (A), Tobi Electro Sac (W).",
        ],
      },
      {
        name: "Uncommon Sword and Shield",
        entries: [
          "The guild knight wields an uncommon sword and shield, that increases their AC by 1, and attack and damage rolls by +1 when they attack with it (included in the attack and AC).",
        ],
      },
      {
        name: "Free Hands",
        entries: ['The guild knight can "use an object" as a bonus action.'],
      },
    ],
    action: [
      {
        name: "Multiattack",
        entries: [
          "The guild knight makes two attacks with their sword and shield.",
        ],
      },
      {
        name: "Sword and Shield",
        entries: [
          "{@atk mw} {@hit 5} to hit, reach 5 ft., one target. {@h}6 ({@damage 1d6 + 3}) piercing damage plus 2 ({@damage 1d4}) lightning damage.",
        ],
      },
    ],
    reaction: [
      {
        name: "Hypno Claw",
        entries: [
          "{@i Taunt.} When a creature the guild knight can see attacks a target other than them that is within 5 feet of them, they can use their reaction to redirect the attack to themselves.",
        ],
      },
    ],
  },
  {
    name: "Guild Knight",
    source: SOURCE,
    size: ["M"],
    type: TYPE,
    alignment: ALIGNMENT,
    ac: [{ ac: 19, from: ["splint", "shield"] }],
    hp: { average: 112, formula: "15d8 + 45" },
    speed: { walk: 35 },
    str: 16,
    dex: 15,
    con: 16,
    int: 15,
    wis: 17,
    cha: 16,
    save: { dex: "+5", wis: "+6" },
    skill: { investigation: "+5", perception: "+6", survival: "+6" },
    resist: ["see Unnamed Material"],
    passive: 16,
    languages: LANGUAGES,
    cr: "7",
    trait: [
      BRAVE,
      {
        name: "Kirin Tail (3/Long Rest)",
        entries: [
          "When the guild knight takes damage they are not immune or resistant to, roll a {@dice d6} and reduce the damage taken by the amount rolled.",
        ],
      },
      {
        name: "Odogaron Fang",
        entries: [
          "The guild knight's weapon attacks score a critical hit on a roll of 19 or 20.",
        ],
      },
      {
        name: "Unnamed Material",
        entries: [
          "The guild knight has resistance to a damage type appropriate to the situation they expect to be in, excluding bludgeoning, slashing, or piercing damage.",
        ],
      },
      {
        name: "Passive Materials",
        entries: [
          "The following materials are already included in other parts of the stat block: Blangonga Fang (W), Dodogama Talon (W), Gypceros Webbing (A).",
        ],
      },
      {
        name: "Rare Gunlance",
        entries: [
          "The guild knight wields a rare gunlance, that increases their attack and damage rolls by +1 when they attack with it (included in the attack).",
        ],
      },
    ],
    action: [
      {
        name: "Multiattack",
        entries: [
          "The guild knight makes two attacks with their gunlance. It can replace any one of these attacks with its shell attack.",
        ],
      },
      {
        name: "Gunlance",
        entries: [
          "{@atk mw} {@hit 7} to hit, reach 5 ft., one target. {@h}7 ({@damage 1d8 + 3}) piercing damage plus 3 ({@damage 1d6}) cold damage.",
        ],
      },
      {
        name: "Shell (3/Short Rest)",
        entries: [
          "{@atk rw} {@hit 7} to hit, range 60/100 ft., one target. {@h}7 ({@damage 1d8 + 3}) fire damage.",
        ],
      },
      {
        name: "Wyvernfire (2/Long Rest)",
        entries: [
          "The guild knight loads a special shell into the gunlance releasing flames in a 30-foot line that is 5 feet wide. Each creature hit must make a {@dc 14} Dexterity saving throw, taking 10 ({@damage 3d6}) fire damage on a failed save, or half as much on a successful one.",
        ],
      },
    ],
  },
  {
    name: "Guild Knight Captain",
    source: SOURCE,
    size: ["M"],
    type: TYPE,
    alignment: ALIGNMENT,
    ac: [{ ac: 19, from: ["plate", "red kinsect essence"] }],
    hp: { average: 135, formula: "18d8 + 54" },
    speed: { walk: 40 },
    str: 16,
    dex: 18,
    con: 17,
    int: 16,
    wis: 18,
    cha: 18,
    save: { dex: "+8", wis: "+8", cha: "+8" },
    skill: {
      athletics: "+7",
      insight: "+7",
      investigation: "+7",
      perception: "+8",
      stealth: "+8",
      survival: "+8",
    },
    resist: ["see Unnamed Material"],
    senses: { darkvision: 60 },
    passive: 18,
    languages: LANGUAGES,
    cr: "10",
    trait: [
      BRAVE,
      {
        name: "Glavenus Plate",
        entries: [
          "{@i Heavy Polish.} The guild knight's insect glaive ignores a creature's resistance to slashing damage.",
        ],
      },
      {
        name: "Glavenus Pyroshell",
        entries: [
          "Any creature that hits the guild knight with a melee weapon, an unarmed strike, or a natural melee weapon takes {@damage 1d6} fire damage.",
        ],
      },
      {
        name: "Gravios Carapace",
        entries: [
          "The guild knight deals an extra {@damage 1d6} damage when they critically hit with this weapon.",
        ],
      },
      {
        name: "Velkhana Cortex (4/Long Rest)",
        entries: [
          "When the guild knight takes damage they are not immune or resistant to, roll a {@dice d8} and reduce the damage taken by the amount rolled.",
        ],
      },
      {
        name: "Spellcasting",
        entries: [
          "The guild knight is a 10th-level spellcaster. Its spellcasting ability is Charisma (spell save {@dc 16}, {@hit 8} to hit with spell attacks). The guild knight has the following paladin spells prepared:",
          {
            type: "list",
            style: "list-no-bullets",
            items: [
              ...PALADIN_SPELLS_LOW,
              "3rd level (2 slots): {@spell dispel magic}, {@spell remove curse}",
            ],
          },
        ],
      },
      {
        name: "Unnamed Material",
        entries: [
          "The guild knight is resistant to a damage type appropriate to the situation they expect to be in, excluding bludgeoning, slashing, or piercing damage.",
        ],
      },
      {
        name: "Passive Materials",
        entries: [
          "The following materials are already included in other parts of the stat block: Shell Shocker (W), and Nargacuga Pelt (A).",
        ],
      },
      {
        name: "Very Rare Insect Glaive",
        entries: [
          "The guild knight wields a very rare insect glaive, that increases their attack and damage rolls by +2 when they attack with it (included in the attack).",
        ],
      },
      {
        name: "Kinsect Essence",
        entries: [
          "The guild knight is always under the effects of all kinsect essence effects (already included in their AC, Damage, and Speed).",
        ],
      },
      {
        name: "Kinsect Mastery",
        entries: [
          "The guild knight can use its bonus action to have their kinsect act as if it was summoned by the {@spell find familiar} spell, with the following differences:",
          "It can only be used in this way for a total of 1 hour each day, it cannot be dismissed, instead they can use an action to call it back to them, when its hit points reaches 0 it reappears on their insect glaive at full hit points and will resume what it was last doing unless told otherwise, and the guild knight cannot use their kinsect attack action while it is being used in this way.",
        ],
      },
    ],
    action: [
      {
        name: "Multiattack",
        entries: [
          "The guild knight makes two attacks with their insect glaive.",
        ],
      },
      {
        name: "Insect Glaive",
        entries: [
          "{@atk mw} {@hit 9} to hit, reach 5 ft., one target. {@h}18 ({@damage 2d10 + 7}) slashing damage.",
        ],
      },
      {
        name: "Kinsect",
        entries: [
          "{@atk rw} {@hit 8} to hit, range 60/120 ft., one target. {@h}6 ({@damage 1d12}) bludgeoning damage and the guild knight heals for half the damage dealt.",
        ],
      },
      {
        name: "Standing Leap",
        entries: [
          "The guild knight can make a standing leap forward or upwards, covering up to a 25 foot distance. They can make an insect glaive attack against a target when they land or during the leap.",
        ],
      },
      {
        name: "Fearsome Maw (1/Day)",
        entries: ["The guild knight regains a spell slot of 3rd level or lower."],
      },
    ],
  },
  {
    name: "Guild Knight Commander",
    source: SOURCE,
    size: ["M"],
    type: TYPE,
    alignment: ALIGNMENT,
    ac: [{ ac: 20, from: ["plate", "armor material"] }],
    hp: { average: 171, formula: "18d8 + 90" },
    speed: { walk: 30 },
    str: 25,
    dex: 16,
    con: 18,
    int: 18,
    wis: 20,
    cha: 20,
    save: { str: "+12", wis: "+10", cha: "+10" },
    skill: {
      athletics: "+12",
      insight: "+10",
      investigation: "+9",
      perception: "+10",
      stealth: "+8",
      survival: "+10",
    },
    immune: ["see Unnamed Material"],
    senses: { darkvision: 60 },
    passive: 20,
    languages: LANGUAGES,
    cr: "16",
    trait: [
      BRAVE,
      {
        name: "Dragonmoss",
        entries: [
          "The guild knight's hammer attacks bypass the damage resistance of any creature.",
        ],
      },
      {
        name: "Rubbery Hide",
        entries: [
          "The guild knight can speak the weapons command word and transform it into a fishing pole with a hook, a line, and a reel. Speaking the command word again changes the fishing pole back into the weapon.",
        ],
      },
      {
        name: "Savage Tallfang",
        entries: [
          "The guild knight deals an extra 5 ({@damage 1d10}) weapon damage when they critically hit.",
        ],
      },
      {
        name: "Spellcasting",
        entries: [
          "The guild knight is a 17th-level spellcaster. Its spellcasting ability is Charisma (spell save {@dc 18}, {@hit 10} to hit with spell attacks). The guild knight has the following paladin spells prepared:",
          {
            type: "list",
            style: "list-no-bullets",
            items: [
              ...PALADIN_SPELLS_LOW,
              "3rd level (3 slots): {@spell dispel magic}, {@spell remove curse}",
              "4th level (3 slots): {@spell banishment}, {@spell staggering smite}, {@spell watery sphere}*",
              "5th level (1 slot): {@spell destructive wave}",
            ],
          },
          "*Always prepared due to Mizutsune Water Gem Material.",
        ],
      },
      {
        name: "T.Velkhana Cortex (5/Long Rest)",
        entries: [
          "When the guild knight takes damage they are not immune or resistant to, roll a {@dice d10} and reduce the damage taken by the amount rolled.",
        ],
      },
      {
        name: "Unnamed Material",
        entries: [
          "The guild knight is immune to a damage type appropriate to the situation they expect to be in, excluding bludgeoning, slashing, or piercing damage.",
        ],
      },
      {
        name: "Passive Materials",
        entries: [
          "The following materials are already included in other parts of the stat block: Dragonmoss (A, Strength is 20 otherwise), Dalam Tail Scale (A), Malfestio Tailfeather (A), Mizutsune Water Gem (W), T.Teostra Claw (W).",
        ],
      },
      {
        name: "Legendary Hammer",
        entries: [
          "The guild knight wields a legendary hammer, that increases their attack and damage rolls by +3 when they attack with it (included in the attack).",
        ],
      },
      {
        name: "Charge",
        entries: [
          "If the guild knight moves at least 20 feet straight toward a target and then hits it with a hammer attack on the same turn, the target takes an extra 7 ({@damage 3d4}) bludgeoning damage.",
        ],
      },
      {
        name: "Mighty Weapon (4/Day)",
        entries: [
          "When the guild knight hits a creature with their hammer, they can choose to have that creature make a {@dc 20} Strength saving throw or be {@condition stunned} until the end of the guild knight's next turn on a failed save.",
        ],
      },
    ],
    action: [
      {
        name: "Multiattack",
        entries: ["The guild knight makes two attacks with their hammer."],
      },
      {
        name: "Hammer",
        entries: [
          "{@atk mw} {@hit 15} to hit, reach 5 ft., one target. {@h}17 ({@damage 2d6 + 10}) bludgeoning damage plus 5 ({@damage 1d10}) fire damage.",
        ],
      },
    ],
    legendary: [
      {
        name: "Attack",
        entries: ["The guild knight makes one attack with its hammer."],
      },
      {
        name: "Detect",
        entries: ["The guild knight makes a Wisdom (Perception) check."],
      },
      {
        name: "Cast a Spell (Costs 3 Actions)",
        entries: [
          "The guild knight casts a spell from its list of prepared spells.",
        ],
      },
    ],
  },
];

export const GUILD_KNIGHT_LEGENDARY_NOTE =
  "The guild knight commander can take 3 legendary actions, choosing from the options in its stat block. Only one legendary action option can be used at a time and only at the end of another creature's turn. The guild knight regains spent legendary actions at the start of its turn.";
