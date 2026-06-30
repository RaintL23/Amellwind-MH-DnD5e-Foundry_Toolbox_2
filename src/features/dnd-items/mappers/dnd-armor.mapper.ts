import type { ArmorCategory, ArmorItem } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import type { RawItemEntity } from "../utils/item-raw.types";
import {
  buildEquipmentSourcePriority,
  pickPreferredBySource,
} from "../utils/item-dedupe.utils";
import { mapDndRarityLabel } from "../utils/dnd-equipment-rarity.utils";

function parseArmorCategory(type?: string): ArmorCategory | null {
  const abbrev = type?.split("|")[0]?.toUpperCase();
  if (abbrev === "S") return "shield";
  if (abbrev === "LA") return "light";
  if (abbrev === "MA") return "medium";
  if (abbrev === "HA") return "heavy";
  return null;
}

/** Renders an armor's 5etools entries into a single plain-text description. */
function renderArmorDescription(raw: RawItemEntity): string | undefined {
  const entries = [
    ...(Array.isArray(raw.entries) ? raw.entries : []),
    ...(Array.isArray(raw.additionalEntries) ? raw.additionalEntries : []),
  ];
  const text = entries
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => parseFiveToolsMarkup(entry).trim())
    .filter(Boolean)
    .join("\n\n");
  return text || undefined;
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
      description: renderArmorDescription(raw),
      contentSource: "dnd",
      itemRarityLabel,
      baseName:
        typeof raw._baseName === "string" ? raw._baseName : undefined,
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
    description: renderArmorDescription(raw),
    contentSource: "dnd",
    itemRarityLabel,
    baseName:
      typeof raw._baseName === "string" ? raw._baseName : undefined,
    source: String(raw.source ?? "PHB"),
  };
}

export function dedupeDndArmorsByName(
  armors: ArmorItem[],
  prefer2024: boolean,
): ArmorItem[] {
  const priority = buildEquipmentSourcePriority(prefer2024);
  const byName = new Map<string, ArmorItem[]>();

  for (const armor of armors) {
    const group = byName.get(armor.name) ?? [];
    group.push(armor);
    byName.set(armor.name, group);
  }

  return Array.from(byName.values())
    .map((group) => pickPreferredBySource(group, priority))
    .sort((a, b) => a.name.localeCompare(b.name));
}
