import type { ArmorCategory, ArmorItem } from "@/shared/types";
import type { RawItemEntity } from "@/features/dnd-items/utils/item-raw.types";
import { mapDndRarityLabel } from "../utils/dnd-rarity.utils";

function parseArmorCategory(type?: string): ArmorCategory | null {
  const abbrev = type?.split("|")[0]?.toUpperCase();
  if (abbrev === "S") return "shield";
  if (abbrev === "LA") return "light";
  if (abbrev === "MA") return "medium";
  if (abbrev === "HA") return "heavy";
  return null;
}

function isDndShieldType(type?: string): boolean {
  return type?.split("|")[0]?.toUpperCase() === "S";
}

function maxDexForCategory(category: ArmorCategory): number | null {
  if (category === "light") return null;
  if (category === "medium") return 2;
  return 0;
}

function parseBonusAc(raw: RawItemEntity): number {
  const bonus = raw.bonusAc;
  if (typeof bonus !== "string") return 0;
  const match = bonus.match(/\+(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}

export function isBuilderDndArmor(raw: RawItemEntity): boolean {
  if (!raw._isBaseItem && !raw._variantName) return false;
  const type = typeof raw.type === "string" ? raw.type : undefined;
  if (isDndShieldType(type)) return true;
  if (raw.armor !== true) return false;
  return true;
}

export function mapDndBaseItemToArmor(raw: RawItemEntity): ArmorItem | null {
  const category = parseArmorCategory(
    typeof raw.type === "string" ? raw.type : undefined,
  );
  if (!category) return null;

  const itemRarityLabel = mapDndRarityLabel(
    typeof raw.rarity === "string" ? raw.rarity : undefined,
  );

  if (category === "shield") {
    const acBonus =
      (typeof raw.ac === "number" ? raw.ac : 2) + parseBonusAc(raw);
    return {
      name: String(raw.name ?? "Shield"),
      category,
      baseAC: acBonus,
      maxDexBonus: null,
      rarity: itemRarityLabel,
      runeSlots: 0,
      stealthDisadvantage: false,
      weight: typeof raw.weight === "number" ? raw.weight : 6,
      contentSource: "dnd",
      itemRarityLabel,
      source: String(raw.source ?? "PHB"),
    };
  }

  const baseAc =
    (typeof raw.ac === "number" ? raw.ac : 10) + parseBonusAc(raw);

  return {
    name: String(raw.name ?? "Unknown"),
    category,
    baseAC: baseAc,
    maxDexBonus: maxDexForCategory(category),
    rarity: itemRarityLabel,
    runeSlots: 0,
    stealthDisadvantage: raw.stealth === true,
    weight: typeof raw.weight === "number" ? raw.weight : 0,
    contentSource: "dnd",
    itemRarityLabel,
    source: String(raw.source ?? "PHB"),
  };
}

const SOURCE_PRIORITY_2024 = ["XPHB", "PHB"];
const SOURCE_PRIORITY_2014 = ["PHB", "XPHB"];

export function dedupeDndArmorsByName(
  armors: ArmorItem[],
  prefer2024: boolean,
): ArmorItem[] {
  const priority = prefer2024 ? SOURCE_PRIORITY_2024 : SOURCE_PRIORITY_2014;
  const byName = new Map<string, ArmorItem>();

  for (const armor of armors) {
    const existing = byName.get(armor.name);
    if (!existing) {
      byName.set(armor.name, armor);
      continue;
    }

    const existingRank = priority.indexOf(existing.source ?? "");
    const nextRank = priority.indexOf(armor.source ?? "");
    const existingScore = existingRank >= 0 ? existingRank : priority.length;
    const nextScore = nextRank >= 0 ? nextRank : priority.length;

    if (nextScore < existingScore) {
      byName.set(armor.name, armor);
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}
