export type ResourceCategory =
  | "Bonepiles"
  | "Fish"
  | "Insects"
  | "Minerals"
  | "Mushrooms"
  | "Plants";

export type ResourceRarity =
  | "Common"
  | "Uncommon"
  | "Rare"
  | "Very Rare"
  | "Legendary";

export interface Resource {
  name: string;
  category: ResourceCategory;
  rarity: ResourceRarity;
  details: string;
  sellValue: string;
  isCraftingMaterial: boolean;
}

export interface ResourceTableData {
  category: ResourceCategory;
  footnotes: string[];
  resources: Resource[];
}

export const RESOURCE_CATEGORY_LABELS: Record<ResourceCategory, string> = {
  Bonepiles: "Bonepiles",
  Fish: "Fish",
  Insects: "Insects",
  Minerals: "Minerals",
  Mushrooms: "Mushrooms",
  Plants: "Plants",
};

export const RESOURCE_CATEGORY_ICONS: Record<ResourceCategory, string> = {
  Bonepiles: "🦴",
  Fish: "🐟",
  Insects: "🐛",
  Minerals: "⛏️",
  Mushrooms: "🍄",
  Plants: "🌿",
};

export const RESOURCE_RARITY_STYLES: Record<
  ResourceRarity,
  { border: string; bg: string; text: string; badge: string }
> = {
  Common: {
    border: "border-gray-600",
    bg: "from-gray-900 to-gray-800",
    text: "text-gray-200",
    badge: "bg-gray-700/60 text-gray-300 border-gray-600",
  },
  Uncommon: {
    border: "border-green-700",
    bg: "from-green-950 to-green-900",
    text: "text-green-200",
    badge: "bg-green-900/60 text-green-300 border-green-700",
  },
  Rare: {
    border: "border-blue-700",
    bg: "from-blue-950 to-blue-900",
    text: "text-blue-200",
    badge: "bg-blue-900/60 text-blue-300 border-blue-700",
  },
  "Very Rare": {
    border: "border-purple-700",
    bg: "from-purple-950 to-purple-900",
    text: "text-purple-200",
    badge: "bg-purple-900/60 text-purple-300 border-purple-700",
  },
  Legendary: {
    border: "border-amber-600",
    bg: "from-amber-950 to-amber-900",
    text: "text-amber-200",
    badge: "bg-amber-900/60 text-amber-300 border-amber-600",
  },
};
