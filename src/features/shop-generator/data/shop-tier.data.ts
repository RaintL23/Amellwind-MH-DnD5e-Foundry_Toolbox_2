import type { ShopTierId } from "./shop-generator.types";

export interface ShopTierDefinition {
  id: ShopTierId;
  label: string;
  levelRange: string;
  description: string;
  /** Relative weights by normalized rarity key. */
  rarityWeights: Record<string, number>;
}

export const SHOP_TIERS: ShopTierDefinition[] = [
  {
    id: 1,
    label: "Tier 1",
    levelRange: "Levels 1–4",
    description: "Mostly mundane gear and common/uncommon magic.",
    rarityWeights: {
      none: 4,
      common: 5,
      uncommon: 3,
      rare: 0.4,
      "very rare": 0.05,
      legendary: 0,
      artifact: 0,
      varies: 0.5,
      unknown: 0.2,
    },
  },
  {
    id: 2,
    label: "Tier 2",
    levelRange: "Levels 5–10",
    description: "Uncommon staples with a growing rare selection.",
    rarityWeights: {
      none: 2,
      common: 3,
      uncommon: 5,
      rare: 3,
      "very rare": 0.5,
      legendary: 0.05,
      artifact: 0,
      varies: 0.8,
      unknown: 0.2,
    },
  },
  {
    id: 3,
    label: "Tier 3",
    levelRange: "Levels 11–16",
    description: "Rare and very rare stock for established parties.",
    rarityWeights: {
      none: 1,
      common: 1.5,
      uncommon: 3,
      rare: 5,
      "very rare": 3,
      legendary: 0.6,
      artifact: 0.05,
      varies: 1,
      unknown: 0.2,
    },
  },
  {
    id: 4,
    label: "Tier 4",
    levelRange: "Levels 17–20",
    description: "Very rare and legendary treasures, scarce mundanes.",
    rarityWeights: {
      none: 0.5,
      common: 0.8,
      uncommon: 2,
      rare: 3,
      "very rare": 5,
      legendary: 3,
      artifact: 0.3,
      varies: 1,
      unknown: 0.2,
    },
  },
];

export function getShopTier(id: ShopTierId): ShopTierDefinition {
  return SHOP_TIERS.find((t) => t.id === id) ?? SHOP_TIERS[0];
}
