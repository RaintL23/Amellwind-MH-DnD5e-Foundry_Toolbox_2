import type { MHItem } from "@/shared/types";

export interface RaintdmCraftingRule {
  tool: string;
  item1: string;
  item2: string;
  dc: string;
  quantity?: string;
}

export interface RaintdmItemMeta {
  author?: string;
  kind?: string;
  magazineKey?: string;
  trapKey?: string;
  chargesPerMagazine?: number;
  damageType?: string;
  baseWeapon?: string;
}

export interface RaintdmItem extends MHItem {
  raintdm?: RaintdmItemMeta;
  crafting?: RaintdmCraftingRule;
}

export interface RaintdmItemsManifest {
  version?: string;
  description?: string;
  items: string[];
}
