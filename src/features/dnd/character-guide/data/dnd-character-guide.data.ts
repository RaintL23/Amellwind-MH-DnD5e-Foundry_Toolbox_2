import type {
  BuilderWorkflowStep,
  GuideSection,
  GuideTable,
} from "@/shared/types";

export const DND_CHARACTER_GUIDE_INTRO =
  "A practical walkthrough of creating a Dungeons & Dragons 5e character, comparing the Player's Handbook (2014) and the Player's Handbook (2024). Use this alongside your table's edition choice — ask your DM which ruleset you are using. This toolbox organizes the official step flow and common advice; your books remain the rules source of truth.";

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
    link: { to: "/classes", label: "Browse Classes" },
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
    link: { to: "/dnd-races", label: "Browse Races" },
  },
  {
    step: 4,
    title: "Spells & Feats",
    description:
      "Select spells for casters and feats at ASI levels. Subclass options unlock at the appropriate level.",
    link: { to: "/dnd-feats", label: "Browse Feats" },
  },
  {
    step: 5,
    title: "Starting Equipment",
    description:
      "Pick class and background starting equipment packages from the library detail panels.",
    link: { to: "/dnd-items", label: "Browse Items" },
  },
];

export const DND_CHARACTER_GUIDE_SECTIONS: GuideSection[] = [
  {
    id: "creating",
    name: "Creating a Character",
    paragraphs: [
      "Both editions walk you from a blank sheet to a playable adventurer: pick options that define what you can do, then fill in who you are. The biggest process difference is order — 2024 leads with class, while 2014 often starts with race and background.",
      "Browse official options in this toolbox (Classes, Races, Backgrounds, Feats, Spells, Items), then assemble everything in the Character Builder.",
    ],
    subsections: [
      {
        name: "2014 — Suggested order (PHB)",
        edition: "2014",
        paragraphs: [
          "The 2014 Player's Handbook presents character creation roughly in this order. Your DM may rearrange steps.",
        ],
        orderedList: [
          "Choose a race (and subrace if any). Note ability score increases, size, speed, languages, and racial traits.",
          "Choose a class. Record hit die, proficiencies, saving throws, skills, equipment packages, and 1st-level features. Spellcasters also pick cantrips and 1st-level spells.",
          "Determine ability scores (Standard Array, point buy, or rolling — see Ability Scores tab).",
          "Describe your character: name, alignment, ideals, bonds, flaws, and appearance.",
          "Choose a background. Add skill/tool/language proficiencies, equipment, and the background feature.",
          "Select starting equipment from class and background packages (or buy with starting gold if the DM allows).",
          "Fill derived numbers: HP, AC, initiative, proficiency bonus, attack bonuses, spell save DC, and passive Perception.",
        ],
        inset: {
          name: "2014 tip",
          paragraphs: [
            "Racial ability bonuses (+2/+1 or similar) are baked into the race/subrace. Plan your class primary ability around those bonuses, or ask the DM about variant Human / custom lineage / Tasha's customizing ability scores if those books are allowed.",
          ],
        },
      },
      {
        name: "2024 — Suggested order (PHB / XPHB)",
        edition: "2024",
        paragraphs: [
          "The 2024 rules emphasize class fantasy first, then origin pieces (species and background) that feed ability scores and a starting feat.",
        ],
        orderedList: [
          "Choose a class. Note hit point die, proficiencies, weapon/armor training, class features at 1st level, and (for casters) spellcasting setup.",
          "Determine ability scores with Standard Array, point buy, or rolling.",
          "Choose a species. Species grant traits (darkvision, breath weapons, etc.) but not the classic +2/+1 ability bumps.",
          "Choose a background. Backgrounds grant skill/tool proficiencies, starting equipment or gold, ability score increases, and an origin feat.",
          "Choose an origin feat from your background (or the options your table allows).",
          "Fill equipment, then calculate HP, AC, attacks, saves, and spell DCs.",
          "Describe personality, appearance, and (optionally) alignment — alignment is less mechanically central than in older editions.",
        ],
        inset: {
          name: "2024 tip",
          paragraphs: [
            "Ability score increases usually come from the background (often +2 to one score and +1 to another, or +1 to three scores). Pick a background that boosts your class's key abilities, then take the origin feat that matches your fantasy.",
          ],
        },
      },
      {
        name: "Shared checklist",
        bulletList: [
          "Confirm edition and allowed sources with your DM (PHB only, Xanathar, Tasha, 2024 core, UA, etc.).",
          "Know the campaign tone and starting level before locking a build.",
          "Write down every proficiency and feature source so you do not double-count skills.",
          "Casters: note spellcasting ability, prepared vs known, ritual casting, and focus/component needs.",
          "Martial characters: armor training, weapon mastery (2024), fighting style, and Extra Attack timing.",
        ],
      },
      {
        name: "Where to look in this toolbox",
        bulletList: [
          "Classes → /classes",
          "Races / species → /dnd-races",
          "Backgrounds → /dnd-backgrounds",
          "Feats → /dnd-feats",
          "Spells → /spells",
          "Items & gear → /dnd-items",
          "Assemble the sheet → /builder",
        ],
      },
    ],
  },
  {
    id: "abilities",
    name: "Ability Scores",
    paragraphs: [
      "The six abilities (Strength, Dexterity, Constitution, Intelligence, Wisdom, Charisma) drive almost every roll. Generate a set of scores, assign them to abilities, apply edition-specific increases, then derive modifiers ((score − 10) ÷ 2, round down).",
    ],
    subsections: [
      {
        name: "Generation methods (both editions)",
        paragraphs: [
          "Most tables use one of three methods. Ask which is legal before you roll.",
        ],
        subsections: [
          {
            name: "Standard Array",
            paragraphs: [
              "Assign 15, 14, 13, 12, 10, and 8 among the six abilities. Fast, fair, and great for new players.",
            ],
          },
          {
            name: "Point Buy",
            paragraphs: [
              "Start from a baseline (commonly all 8s) and spend a fixed pool of points to raise scores, usually capping before racial/background increases. Exact costs match your PHB edition — use the book's point-buy table.",
            ],
          },
          {
            name: "Rolling",
            paragraphs: [
              "A common house method is 4d6 drop the lowest, six times, then assign. Some tables roll in order; others allow rearranging. Agree on rerolls, minimum totals, and whether everyone rolls or shares one array.",
            ],
            inset: {
              name: "Table tip",
              paragraphs: [
                "If one player rolled very high and another very low, consider letting the low roller use Standard Array or point buy so the party stays balanced.",
              ],
            },
          },
        ],
      },
      {
        name: "2014 — Where increases come from",
        edition: "2014",
        paragraphs: [
          "After generating base scores, apply racial ability score increases (and subrace bumps). Some later books let you reassign those increases (customizing your origin).",
          "At certain class levels you gain Ability Score Improvements (usually +2 to one score or +1 to two), or you may take a feat instead if feats are allowed.",
        ],
        bulletList: [
          "Primary ability: put your highest score in the ability your class attacks or casts with.",
          "Constitution is almost always valuable for hit points and Concentration.",
          "Dexterity helps AC (light/medium armor), initiative, and many skills.",
        ],
      },
      {
        name: "2024 — Where increases come from",
        edition: "2024",
        paragraphs: [
          "Species traits no longer carry the classic +2/+1 package. Backgrounds grant the ability score increases and an origin feat, so origin choice is tightly linked to your build.",
          "Class still grants Ability Score Improvements / feat choices at listed levels. Feats are a core part of the 2024 ruleset rather than an optional chapter.",
        ],
        bulletList: [
          "Match background ASI to your class key abilities.",
          "Origin feats (Alert, Magic Initiate, Tough, etc.) can define early play more than a raw +1.",
          "Weapon Mastery and other 2024 features may change which secondary scores matter — read your class.",
        ],
      },
      {
        name: "Derived stats to fill after scores",
        orderedList: [
          "Ability modifiers for each score.",
          "Hit points at 1st level: maximum of your hit die + Constitution modifier (higher levels: roll or take average per your table).",
          "Proficiency bonus by character level (both editions use the same progression band).",
          "Saving throw bonuses: proficiency on class saves + ability modifier.",
          "Spell save DC and spell attack bonus for casters (8 + proficiency + casting ability, or proficiency + casting ability for attacks).",
        ],
      },
    ],
  },
  {
    id: "describe",
    name: "Describe Your Character",
    paragraphs: [
      "Mechanical choices make a functional adventurer; description makes a character the table remembers. Both editions encourage name, appearance, and personality — they differ on how structured that personality is.",
    ],
    subsections: [
      {
        name: "Basics (both editions)",
        bulletList: [
          "Name, pronouns, and appearance (height, build, distinguishing marks, gear look).",
          "Age and how your species' lifespan shapes your outlook.",
          "Languages known from species, background, and class features.",
          "A one-sentence concept: \"exiled knight seeking redemption,\" \"curious apprentice chasing lost spells.\"",
        ],
      },
      {
        name: "2014 — Alignment, ideals, bonds, flaws",
        edition: "2014",
        paragraphs: [
          "The 2014 PHB leans on alignment (lawful/neutral/chaotic × good/neutral/evil) plus background personality tables: personality traits, an ideal, a bond, and a flaw. These are roleplaying hooks, not hard locks on what you can do.",
        ],
        bulletList: [
          "Ideals: what principles drive you (freedom, power, charity, tradition).",
          "Bonds: people, places, or organizations you care about.",
          "Flaws: temptations or weaknesses that create trouble.",
          "Inspiration: DMs often award it when you lean into traits, ideals, bonds, or flaws.",
        ],
        inset: {
          name: "2014 tip",
          paragraphs: [
            "If random tables feel stiff, rewrite them in your own words while keeping the same dramatic job: one drive, one attachment, one complication.",
          ],
        },
      },
      {
        name: "2024 — Personality with lighter rails",
        edition: "2024",
        paragraphs: [
          "The 2024 presentation keeps alignment as optional flavor for many tables and focuses more on freeform personality notes, connections to the world, and how your origin feat/background story ties into the campaign.",
        ],
        bulletList: [
          "Write a few clear personality notes instead of filling four rigid boxes if that fits your table.",
          "Tie your background story to the DM's setting (faction, hometown, rival).",
          "Inspiration still rewards vivid play — ask how your DM awards and spends it.",
        ],
      },
      {
        name: "Backstory tools",
        paragraphs: [
          "For random life events and family details, use this toolbox's Xanathar Backstory generator (XGE-style tables). Keep the result short enough to share in a session zero.",
        ],
      },
    ],
  },
  {
    id: "equipment",
    name: "Equipment & Higher Level",
    paragraphs: [
      "At 1st level, most characters take class and background equipment packages. Some tables prefer starting wealth and shopping. Above 1st level, the DM decides wealth and magic items — the table below is a common 2024-oriented guide.",
    ],
    subsections: [
      {
        name: "1st-level starting gear",
        subsections: [
          {
            name: "2014",
            edition: "2014",
            paragraphs: [
              "Choose equipment packages from your class and background, or (if allowed) take the class starting gold and buy from the PHB Adventuring Gear / armor / weapons lists. Track armor proficiency so you do not wear gear that imposes penalties.",
            ],
          },
          {
            name: "2024",
            edition: "2024",
            paragraphs: [
              "Class and background still supply starting packages or gold. Note weapon mastery properties on eligible weapons, armor training, and whether you need a spellcasting focus. Some backgrounds emphasize tools and lifestyle gear that support downtime.",
            ],
          },
        ],
        inset: {
          name: "Shared tip",
          paragraphs: [
            "Pack the boring essentials: rations, rope, light source, healer's kit or potions if affordable, and a way to bypass simple locks or barriers. A specialized combat build still needs exploration tools.",
          ],
        },
      },
      {
        name: "Starting at higher level",
        paragraphs: [
          "When the campaign begins above 1st level, characters should receive gear appropriate to the tier so they are not underpowered next to the threats they face. Exact awards are always the DM's call.",
        ],
        table: DND_STARTING_EQUIPMENT_TABLE,
        orderedList: [
          "Apply normal level-1 starting equipment (or an agreed substitute).",
          "Add money and magic items for your starting level band from the table (or the DM's custom list).",
          "Choose magic items that fit the character fantasy and the campaign's rarity rules; attunement limits still apply.",
          "Recalculate AC, attack bonuses, save DCs, and prepared spells for the new level.",
        ],
        inset: {
          name: "DM note",
          paragraphs: [
            "The values above follow common 2024 higher-level starting guidance. For 2014-only tables, many DMs use DMG starting equipment by tier or a simpler gold lump sum. Align with your DM before building.",
          ],
        },
      },
      {
        name: "Wealth and shopping",
        bulletList: [
          "Use the Items catalog and Shop Generator when the party reaches a settlement.",
          "Attunement: typically three items unless a feature says otherwise.",
          "Consumables (potions, scrolls) are a good way to boost power without permanent attunement slots.",
        ],
      },
    ],
  },
  {
    id: "tips",
    name: "Tips & Party Roles",
    paragraphs: [
      "Strong characters serve the story and the party, not only a damage spreadsheet. Use these habits during session zero and the first few sessions.",
    ],
    subsections: [
      {
        name: "Ask your DM early",
        bulletList: [
          "Which edition and books are legal?",
          "Starting level, wealth, and free feats?",
          "Setting assumptions (gods, factions, technology, horror level)?",
          "House rules for flanking, inspiration, resting, and multiclassing?",
          "Are you rolling stats together or using array/point buy?",
        ],
      },
      {
        name: "Party coverage",
        paragraphs: [
          "You do not need a perfect \"tank, healer, controller, striker\" board, but gaps hurt. Talk before everyone locks a pure damage build.",
        ],
        bulletList: [
          "Someone who can take hits or control space (high AC, reach, battlefield control spells).",
          "Someone who can restore hit points or stabilize (Life domain, healer kit expertise, potions).",
          "Skill coverage: social face, trap/lock specialist, wilderness tracker, lore nerd.",
          "A mix of damage types and ranges so one resistance does not shut the party down.",
        ],
        inset: {
          name: "Toolbox tip",
          paragraphs: [
            "Compare expected damage in the Damage Calculator, then sanity-check skills and utility in the Builder before you call the character finished.",
          ],
        },
      },
      {
        name: "Multiclassing",
        paragraphs: [
          "Multiclassing is optional and has ability prerequisites. Dip only when you know what feature you are chasing (Extra Attack, Armor training, a subclass dip, spell slot progression).",
          "See this toolbox's Multiclassing page for prerequisites and spell-slot tables.",
        ],
      },
      {
        name: "Edition quick contrast",
        table: {
          colLabels: ["Topic", "2014", "2024"],
          rows: [
            [
              "Creation lead",
              "Race & class intertwined; race ASI matter early",
              "Class first; background ASI + origin feat",
            ],
            [
              "Feats",
              "Optional; replace ASI when allowed",
              "Core; origin feat at level 1 via background",
            ],
            [
              "Species naming",
              "Race / subrace common in PHB",
              "Species; lineages still appear in some sources",
            ],
            [
              "Weapons",
              "Properties + fighting styles",
              "Properties + Weapon Mastery (many martial classes)",
            ],
            [
              "Personality tools",
              "Traits, ideal, bond, flaw tables",
              "Lighter guidance; alignment often optional",
            ],
          ],
        },
      },
      {
        name: "Ready to build",
        paragraphs: [
          "When you know edition, level, and concept, open the Character Builder. Keep this guide open in another tab for the checklist and higher-level gear table.",
        ],
      },
    ],
  },
];
