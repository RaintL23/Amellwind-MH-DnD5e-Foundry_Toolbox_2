import type { ShopThemeId } from "./shop-generator.types";

export interface ShopThemeDefinition {
  id: ShopThemeId;
  label: string;
  description: string;
  shopNameTemplates: string[];
  shopkeeperTitles: string[];
  flavorLines: string[];
  /** Preferred typeLabel substrings (case-insensitive). */
  preferredTypes: string[];
  /** Keywords matched against name + searchText. */
  keywords: string[];
  /** Bias toward magic items when true; mundane when false; null = balanced. */
  preferMagic: boolean | null;
  weightBoost: number;
}

export const SHOP_THEMES: ShopThemeDefinition[] = [
  {
    id: "general",
    label: "General Store",
    description: "A mixed stock of gear, tools, and the odd curiosity.",
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
    preferredTypes: ["Adventuring Gear", "Tool", "Goods", "Food"],
    keywords: ["kit", "pack", "rope", "lantern", "rations", "tool"],
    preferMagic: null,
    weightBoost: 2.5,
  },
  {
    id: "blacksmith",
    label: "Blacksmith",
    description: "Weapons, armor, and forged goods.",
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
    preferredTypes: [
      "Weapon",
      "Armor",
      "Shield",
      "Melee Weapon",
      "Ranged Weapon",
    ],
    keywords: ["sword", "axe", "armor", "shield", "hammer", "blade", "mail"],
    preferMagic: null,
    weightBoost: 3.5,
  },
  {
    id: "alchemist",
    label: "Alchemist",
    description: "Potions, poisons, and alchemical supplies.",
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
    preferredTypes: ["Potion", "Poison", "Wondrous Item"],
    keywords: [
      "potion",
      "elixir",
      "poison",
      "oil",
      "alchem",
      "philter",
      "antidote",
    ],
    preferMagic: true,
    weightBoost: 3.5,
  },
  {
    id: "arcane",
    label: "Arcane Emporium",
    description: "Scrolls, wands, foci, and wizardly curios.",
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
    preferredTypes: [
      "Scroll",
      "Wand",
      "Staff",
      "Rod",
      "Ring",
      "Wondrous Item",
    ],
    keywords: [
      "scroll",
      "wand",
      "staff",
      "robe",
      "spell",
      "arcane",
      "focus",
      "crystal",
    ],
    preferMagic: true,
    weightBoost: 3.5,
  },
  {
    id: "temple",
    label: "Temple Reliquary",
    description: "Holy symbols, blessed gear, and restorative items.",
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
    preferredTypes: ["Potion", "Wondrous Item", "Holy Symbol", "Scroll"],
    keywords: [
      "holy",
      "bless",
      "heal",
      "cleric",
      "paladin",
      "symbol",
      "amulet",
      "prayer",
    ],
    preferMagic: true,
    weightBoost: 3,
  },
  {
    id: "adventuring",
    label: "Adventuring Outfitter",
    description: "Travel gear, tools, and practical equipment.",
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
    preferredTypes: [
      "Adventuring Gear",
      "Tool",
      "Weapon",
      "Armor",
      "Mount",
      "Vehicle",
    ],
    keywords: [
      "pack",
      "kit",
      "rope",
      "torch",
      "rations",
      "climbing",
      "camping",
      "tool",
    ],
    preferMagic: false,
    weightBoost: 3,
  },
  {
    id: "black-market",
    label: "Black Market",
    description: "Risky magic, poisons, and goods best bought quietly.",
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
    preferredTypes: [
      "Poison",
      "Wondrous Item",
      "Weapon",
      "Ring",
      "Scroll",
    ],
    keywords: [
      "poison",
      "assassin",
      "invisibility",
      "cursed",
      "stolen",
      "shadow",
      "venom",
    ],
    preferMagic: true,
    weightBoost: 3,
  },
];

export function getShopTheme(id: ShopThemeId): ShopThemeDefinition {
  return SHOP_THEMES.find((t) => t.id === id) ?? SHOP_THEMES[0];
}
