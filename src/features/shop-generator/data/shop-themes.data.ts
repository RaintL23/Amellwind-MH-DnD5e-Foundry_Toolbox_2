import type { ShopThemeId } from "./shop-generator.types";

export interface ShopThemeDefinition {
  id: ShopThemeId;
  label: string;
  description: string;
  shopNameTemplates: string[];
  shopkeeperTitles: string[];
  flavorLines: string[];
  /**
   * Hard allowlist: typeLabel must match at least one entry
   * (case-insensitive substring). Empty = no type gate.
   */
  allowedTypes: string[];
  /**
   * Hard denylist applied after the allowlist. Use when a broad allow
   * (e.g. "Weapon") would still pull unwanted subtypes.
   */
  excludedTypes: string[];
  /**
   * Types that are only kept when the item also matches a theme keyword.
   * Keeps broad buckets like "Wondrous Item" from flooding every specialty shop.
   */
  keywordGatedTypes: string[];
  /** Keywords matched against name + searchText + attunement + typeLabel. */
  keywords: string[];
  /** Bias toward magic items when true; mundane when false; null = balanced. */
  preferMagic: boolean | null;
  /** Extra weight when a keyword matches (ranking within the themed pool). */
  keywordWeightBoost: number;
}

export const SHOP_THEMES: ShopThemeDefinition[] = [
  {
    id: "general",
    label: "General Store",
    description:
      "Stock: adventuring gear, tools, trade goods, and rations — not armory or arcana.",
    shopNameTemplates: [
      "The Wayside Emporium",
      "{name}'s General Goods",
      "Crossroads Outfitters",
      "The Packed Wagon",
    ],
    shopkeeperTitles: ["shopkeeper", "merchant", "trader"],
    flavorLines: [
      "Keeps a little of everything under the counter.",
      "Happy to haggle if the coin is honest.",
      "Knows every caravan route within a week's travel.",
    ],
    allowedTypes: [
      "Adventuring Gear",
      "Tool",
      "Goods",
      "Food",
      "Trade Good",
    ],
    excludedTypes: [
      "Weapon",
      "Armor",
      "Shield",
      "Ammunition",
      "Wand",
      "Staff",
      "Rod",
      "Scroll",
      "Ring",
      "Potion",
      "Poison",
    ],
    keywordGatedTypes: [],
    keywords: ["kit", "pack", "rope", "lantern", "rations", "tool", "torch"],
    preferMagic: false,
    keywordWeightBoost: 1.8,
  },
  {
    id: "blacksmith",
    label: "Blacksmith",
    description:
      "Stock: weapons, armor, shields, and ammunition — forged steel, mundane or enchanted.",
    shopNameTemplates: [
      "The Anvil & Flame",
      "{name}'s Forge",
      "Ironheart Armory",
      "The Quenched Blade",
    ],
    shopkeeperTitles: ["blacksmith", "armorer", "weaponsmith"],
    flavorLines: [
      "Sparks fly from dawn until the last order is quenched.",
      "Insists every blade leave the shop with a proper edge.",
      "Speaks of steel the way others speak of old friends.",
    ],
    allowedTypes: ["Weapon", "Armor", "Shield", "Ammunition"],
    excludedTypes: [
      "Potion",
      "Poison",
      "Scroll",
      "Wand",
      "Rod",
      "Ring",
      "Wondrous Item",
    ],
    keywordGatedTypes: [],
    keywords: ["sword", "axe", "armor", "shield", "hammer", "blade", "mail"],
    preferMagic: null,
    keywordWeightBoost: 1.6,
  },
  {
    id: "alchemist",
    label: "Alchemist",
    description:
      "Stock: potions, elixirs, oils, and poisons — no weapons, armor, or random curios.",
    shopNameTemplates: [
      "The Bubbling Flask",
      "{name}'s Apothecary",
      "Emberglass Alchemy",
      "The Green Retort",
    ],
    shopkeeperTitles: ["alchemist", "apothecary", "brewer"],
    flavorLines: [
      "The air smells of herbs, acid, and unfinished experiments.",
      "Labels everything twice — once for safety, once for comedy.",
      "Will not sell anything that is still smoking.",
    ],
    allowedTypes: ["Potion", "Poison"],
    excludedTypes: [
      "Weapon",
      "Armor",
      "Shield",
      "Ammunition",
      "Wand",
      "Staff",
      "Rod",
      "Ring",
      "Scroll",
      "Wondrous Item",
    ],
    keywordGatedTypes: [],
    keywords: [
      "potion",
      "elixir",
      "poison",
      "oil",
      "alchem",
      "philter",
      "antidote",
      "draught",
    ],
    preferMagic: null,
    keywordWeightBoost: 1.7,
  },
  {
    id: "arcane",
    label: "Arcane Emporium",
    description:
      "Stock: scrolls, wands, staves, rods, rings, and wizardly wondrous items — not the armory.",
    shopNameTemplates: [
      "The Gilded Grimoire",
      "{name}'s Arcana",
      "Starlit Curios",
      "The Whispering Shelf",
    ],
    shopkeeperTitles: ["arcanist", "magewright", "curio dealer"],
    flavorLines: [
      "Dust motes drift like tiny constellations between the shelves.",
      "Warns customers not to open anything that hums.",
      "Trades rumors as readily as spell components.",
    ],
    allowedTypes: [
      "Scroll",
      "Wand",
      "Staff",
      "Rod",
      "Ring",
      "Wondrous Item",
    ],
    excludedTypes: [
      "Weapon",
      "Armor",
      "Shield",
      "Ammunition",
      "Potion",
      "Poison",
    ],
    // Full wondrous catalog is in-theme; weapons with spell text are typed Weapon.
    keywordGatedTypes: [],
    keywords: [
      "scroll",
      "wand",
      "staff",
      "robe",
      "arcane",
      "focus",
      "crystal",
      "orb",
      "grimoire",
      "spellbook",
      "component",
      "amulet",
      "tome",
      "ioun",
      "cloak",
      "boots",
      "bracers",
    ],
    preferMagic: true,
    keywordWeightBoost: 1.9,
  },
  {
    id: "temple",
    label: "Temple Reliquary",
    description:
      "Stock: holy symbols, potions, scrolls, and blessed wondrous relics.",
    shopNameTemplates: [
      "The Open Hand Reliquary",
      "Sanctum Supplies",
      "{name}'s Alms Counter",
      "The Blessed Threshold",
    ],
    shopkeeperTitles: ["acolyte", "reliquary keeper", "temple merchant"],
    flavorLines: [
      "Soft incense covers the scent of polished brass and old parchment.",
      "Gives a quiet blessing with every purchase.",
      "Keeps the rarest relics behind a curtained alcove.",
    ],
    allowedTypes: ["Potion", "Holy Symbol", "Scroll", "Wondrous Item"],
    excludedTypes: [
      "Weapon",
      "Armor",
      "Shield",
      "Ammunition",
      "Wand",
      "Rod",
      "Poison",
    ],
    keywordGatedTypes: ["Wondrous Item"],
    keywords: [
      "holy",
      "bless",
      "heal",
      "healing",
      "cleric",
      "paladin",
      "symbol",
      "amulet",
      "prayer",
      "divine",
      "radiant",
      "undead",
      "restoration",
      "cure",
      "life",
      "spirit",
      "sacred",
      "temple",
      "monastery",
      "pearl of",
      "necklace of prayer",
    ],
    preferMagic: true,
    keywordWeightBoost: 1.8,
  },
  {
    id: "adventuring",
    label: "Adventuring Outfitter",
    description:
      "Stock: travel kits, tools, mundane weapons/armor, mounts, and vehicles.",
    shopNameTemplates: [
      "Ready Pack Outfitters",
      "The Trailworn Rack",
      "{name}'s Expeditionary",
      "Far Road Supplies",
    ],
    shopkeeperTitles: ["outfitter", "provisioner", "expedition seller"],
    flavorLines: [
      "Every shelf is arranged for people who leave at dawn.",
      "Can pack a dungeon kit faster than most people pack lunch.",
      "Charges extra for anything that has already seen a dragon.",
    ],
    allowedTypes: [
      "Adventuring Gear",
      "Tool",
      "Weapon",
      "Armor",
      "Shield",
      "Ammunition",
      "Mount",
      "Vehicle",
      "Food",
    ],
    excludedTypes: [
      "Wand",
      "Staff",
      "Rod",
      "Scroll",
      "Ring",
      "Wondrous Item",
      "Potion",
      "Poison",
    ],
    keywordGatedTypes: [],
    keywords: [
      "pack",
      "kit",
      "rope",
      "torch",
      "rations",
      "climbing",
      "camping",
      "tool",
      "tent",
      "waterskin",
    ],
    preferMagic: false,
    keywordWeightBoost: 1.7,
  },
  {
    id: "black-market",
    label: "Black Market",
    description:
      "Stock: poisons, illicit magic, quiet weapons, and goods best bought after dark.",
    shopNameTemplates: [
      "The Back-Alley Vault",
      "No Questions Asked",
      "{name}'s Quiet Wares",
      "The Veiled Counter",
    ],
    shopkeeperTitles: ["fence", "shadow broker", "discreet dealer"],
    flavorLines: [
      "The door only opens for those who know the knock.",
      "Prices climb with how badly you need the goods.",
      "Remembers faces better than names.",
    ],
    allowedTypes: [
      "Poison",
      "Wondrous Item",
      "Weapon",
      "Ring",
      "Scroll",
      "Potion",
    ],
    excludedTypes: ["Holy Symbol", "Mount", "Vehicle", "Food", "Trade Good"],
    // Weapons/poisons/scrolls/rings are in-theme; wondrous curios need a shady slant.
    keywordGatedTypes: ["Wondrous Item"],
    keywords: [
      "poison",
      "assassin",
      "invisibility",
      "cursed",
      "shadow",
      "venom",
      "stealth",
      "silent",
      "dust of",
      "death",
      "necro",
      "theft",
      "thieves",
      "dagger",
      "disguise",
      "forgery",
      "charm",
      "fear",
      "nightmare",
      "slippery",
      "portable hole",
      "bag of",
    ],
    preferMagic: true,
    keywordWeightBoost: 2,
  },
];

export function getShopTheme(id: ShopThemeId): ShopThemeDefinition {
  return SHOP_THEMES.find((t) => t.id === id) ?? SHOP_THEMES[0];
}

export function matchesTypePreference(
  typeLabel: string,
  preferred: string[],
): boolean {
  if (preferred.length === 0) return false;
  const lower = typeLabel.toLowerCase();
  return preferred.some((p) => lower.includes(p.toLowerCase()));
}

/** Hard theme eligibility (allowlist / denylist / keyword gates). */
export function itemMatchesShopTheme(
  typeLabel: string,
  textBlob: string,
  theme: ShopThemeDefinition,
): boolean {
  if (matchesTypePreference(typeLabel, theme.excludedTypes)) {
    return false;
  }

  if (
    theme.allowedTypes.length > 0 &&
    !matchesTypePreference(typeLabel, theme.allowedTypes)
  ) {
    return false;
  }

  if (matchesTypePreference(typeLabel, theme.keywordGatedTypes)) {
    const blob = textBlob.toLowerCase();
    const hasKeyword = theme.keywords.some((k) =>
      blob.includes(k.toLowerCase()),
    );
    if (!hasKeyword) return false;
  }

  return true;
}
