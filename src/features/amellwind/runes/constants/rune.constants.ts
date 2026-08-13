import type { ItemRarity } from "../context/RuneBuildContext";

export const TIER_LABELS: Record<number, string> = {
  1: "Tier 1 — Uncommon (CR 1-4)",
  2: "Tier 2 — Rare (CR 5-10)",
  3: "Tier 3 — Very Rare (CR 11-16)",
  4: "Tier 4 — Legendary (CR 17+)",
};

export const TIER_SHORT_LABELS: Record<number, string> = {
  1: "Uncommon",
  2: "Rare",
  3: "Very Rare",
  4: "Legendary",
};

export const TIER_BADGE_CLASS: Record<number, string> = {
  1: "bg-slate-700/60 text-slate-300 border border-slate-600/40",
  2: "bg-blue-900/50 text-blue-300 border border-blue-700/40",
  3: "bg-purple-900/50 text-purple-300 border border-purple-700/40",
  4: "bg-amber-900/50 text-amber-300 border border-amber-700/40",
};

export const RARITY_LABEL: Record<ItemRarity, string> = {
  common: "Common",
  uncommon: "Uncommon",
  rare: "Rare",
  "very rare": "Very Rare",
  legendary: "Legendary",
};

export const RARITY_COLOR: Record<ItemRarity, string> = {
  common: "text-gray-300",
  uncommon: "text-green-400",
  rare: "text-blue-400",
  "very rare": "text-purple-400",
  legendary: "text-amber-400",
};
