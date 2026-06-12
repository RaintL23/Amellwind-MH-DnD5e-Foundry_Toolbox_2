import type { BuilderSlotSelection } from "@/features/builder/hooks/useBuilderSlotSelection";

export const RARITY_BADGE: Record<string, string> = {
  Uncommon:
    "bg-emerald-100 text-emerald-900 dark:bg-emerald-950/50 dark:text-emerald-300",
  Rare: "bg-sky-100 text-sky-900 dark:bg-sky-950/50 dark:text-sky-300",
  "Very Rare":
    "bg-violet-100 text-violet-900 dark:bg-violet-950/50 dark:text-violet-300",
  Legendary:
    "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-300",
};

export const SLOT_LABELS: Partial<Record<NonNullable<BuilderSlotSelection>, string>> = {
  species: "Species",
  background: "Background",
  class: "Class",
  subclass: "Subclass",
  "origin-feat": "Origin Feat",
  mainHand: "Weapon",
  offHand: "Weapon",
  armor: "Armor",
  trinket1: "Trinket",
  trinket2: "Trinket",
};
