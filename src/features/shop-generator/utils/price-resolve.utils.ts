import type { DndItem } from "@/shared/types";
import {
  MAGIC_ITEM_PRICING_BY_NAME,
  MAGIC_ITEM_PRICING_META_BY_NAME,
  magicItemPricingNameAliases,
  normalizeMagicItemPricingName,
  type MagicItemPricingMeta,
} from "../data/magic-item-pricing.data";
import { MAGIC_ITEM_PRICING_ATTRIBUTION } from "../data/magic-item-pricing-attribution";
import { estimatePriceByRarity } from "../data/rarity-price-estimates.data";
import type { PriceSourceKind } from "../data/shop-generator.types";

export interface ResolvedItemPrice {
  basePriceGp: number;
  priceSource: PriceSourceKind;
  /** Human-readable calculation lines for tooltips. */
  breakdown: string[];
  matchedCsvName?: string;
  csvNote?: string;
  sourceSheet?: string;
  magicPremiumGp?: number;
  mundaneBaseGp?: number;
}

const GENERIC_BONUS_PATTERNS: Array<{
  label: string;
  test: (item: DndItem) => boolean;
  csvKeys: string[];
}> = [
  {
    label: "Ammunition",
    test: (item) =>
      /\bammunition\b/i.test(item.typeLabel) ||
      /\bammunition\b/i.test(item.name) ||
      Boolean(item.ammoType),
    csvKeys: ["ammunition +1", "ammunition +2", "ammunition +3"],
  },
  {
    label: "Armor",
    test: (item) =>
      /\barmor\b/i.test(item.typeLabel) ||
      Boolean(item.armorClass) ||
      Boolean(item.bonusAc),
    csvKeys: ["armor +1", "armor +2", "armor +3"],
  },
  {
    label: "Weapon",
    test: (item) =>
      /\bweapon\b/i.test(item.typeLabel) ||
      Boolean(item.weaponCategory) ||
      Boolean(item.bonusWeapon),
    csvKeys: ["weapon +1", "weapon +2", "weapon +3"],
  },
];

function parseBonusRank(item: DndItem): 1 | 2 | 3 | null {
  const hay = [
    item.name,
    item.variantName ?? "",
    item.bonusWeapon ?? "",
    item.bonusAc ?? "",
  ]
    .join(" ")
    .toLowerCase();
  if (/\+3\b/.test(hay) || hay.includes(" +3")) return 3;
  if (/\+2\b/.test(hay) || hay.includes(" +2")) return 2;
  if (/\+1\b/.test(hay) || hay.includes(" +1")) return 1;
  return null;
}

function mundaneBaseGpFromItem(item: DndItem): number {
  if (item.baseValueCp != null && item.baseValueCp > 0) {
    return Math.round(item.baseValueCp / 100);
  }
  // Generic templates (e.g. "Weapon, +1") have no base item; catalog value
  // on specific variants is cleared, so do not fall back to valueCp here.
  return 0;
}

interface CsvLookupHit {
  key: string;
  costGp: number;
  meta: MagicItemPricingMeta | undefined;
}

function lookupCsvEntry(name: string): CsvLookupHit | null {
  const normalized = normalizeMagicItemPricingName(name);
  for (const key of magicItemPricingNameAliases(normalized)) {
    const value = MAGIC_ITEM_PRICING_BY_NAME[key];
    if (typeof value === "number") {
      return {
        key,
        costGp: value,
        meta: MAGIC_ITEM_PRICING_META_BY_NAME[key],
      };
    }
  }
  return null;
}

function resolveGenericCsvPremium(item: DndItem): {
  premiumGp: number;
  csvKey: string;
  label: string;
  rank: 1 | 2 | 3;
  meta: MagicItemPricingMeta | undefined;
} | null {
  const rank = parseBonusRank(item);
  if (!rank) return null;
  for (const pattern of GENERIC_BONUS_PATTERNS) {
    if (!pattern.test(item)) continue;
    const key = pattern.csvKeys[rank - 1];
    const value = MAGIC_ITEM_PRICING_BY_NAME[key];
    if (typeof value !== "number") continue;
    return {
      premiumGp: value,
      csvKey: key,
      label: pattern.label,
      rank,
      meta: MAGIC_ITEM_PRICING_META_BY_NAME[key],
    };
  }
  return null;
}

function attributionLine(): string {
  return `Source: ${MAGIC_ITEM_PRICING_ATTRIBUTION.title} (${MAGIC_ITEM_PRICING_ATTRIBUTION.author})`;
}

/**
 * Resolve shop base price (gp) before markup:
 * CSV exact (with +N name aliases) → generic +N + mundane base → catalog → rarity.
 */
export function resolveItemPriceGp(item: DndItem): ResolvedItemPrice {
  const exact = lookupCsvEntry(item.name);
  if (exact != null) {
    const matchedName = exact.meta?.canonicalName ?? item.name;
    const sheet = exact.meta?.sourceSheet;
    const note = exact.meta?.note;
    const breakdown = [
      `CSV match: "${matchedName}" = ${exact.costGp.toLocaleString("en-US")} gp`,
    ];
    if (sheet) breakdown.push(`Spreadsheet tab: ${sheet}`);
    if (note) breakdown.push(`Note: ${note}`);
    breakdown.push(attributionLine());
    return {
      basePriceGp: exact.costGp,
      priceSource: "csv",
      breakdown,
      matchedCsvName: matchedName,
      csvNote: note || undefined,
      sourceSheet: sheet || undefined,
      magicPremiumGp: exact.costGp,
      mundaneBaseGp: 0,
    };
  }

  const generic = resolveGenericCsvPremium(item);
  if (generic != null) {
    const mundaneBaseGp = mundaneBaseGpFromItem(item);
    const total = generic.premiumGp + mundaneBaseGp;
    const matchedName =
      generic.meta?.canonicalName ??
      `${generic.label}, +${generic.rank}`;
    const note = generic.meta?.note;
    const breakdown = [
      `Generic ${generic.label} +${generic.rank}: ${generic.premiumGp.toLocaleString("en-US")} gp (CSV "${matchedName}")`,
    ];
    if (mundaneBaseGp > 0) {
      const baseLabel = item.baseName ? ` (${item.baseName})` : "";
      breakdown.push(
        `+ Mundane base${baseLabel}: ${mundaneBaseGp.toLocaleString("en-US")} gp`,
      );
      breakdown.push(`Total: ${total.toLocaleString("en-US")} gp`);
    } else if (note) {
      breakdown.push(
        `Mundane base not applied (no base item cost on this entry). ${note}`,
      );
    } else {
      breakdown.push(
        "Mundane base not applied (no base item cost on this entry).",
      );
    }
    if (generic.meta?.sourceSheet) {
      breakdown.push(`Spreadsheet tab: ${generic.meta.sourceSheet}`);
    }
    if (note && mundaneBaseGp > 0) breakdown.push(`Note: ${note}`);
    breakdown.push(attributionLine());
    return {
      basePriceGp: total,
      priceSource: "generic",
      breakdown,
      matchedCsvName: matchedName,
      csvNote: note || undefined,
      sourceSheet: generic.meta?.sourceSheet || undefined,
      magicPremiumGp: generic.premiumGp,
      mundaneBaseGp,
    };
  }

  if (item.valueCp != null && item.valueCp > 0) {
    const gp = Math.max(1, Math.round(item.valueCp / 100));
    return {
      basePriceGp: gp,
      priceSource: "catalog",
      breakdown: [
        `5etools catalog value: ${gp.toLocaleString("en-US")} gp`,
        "No Magic Item Pricing row matched this name.",
      ],
      mundaneBaseGp: 0,
    };
  }

  const estimated = estimatePriceByRarity(item.rarity);
  return {
    basePriceGp: estimated,
    priceSource: "estimated",
    breakdown: [
      `Estimated from rarity (${item.rarityLabel || item.rarity}): ${estimated.toLocaleString("en-US")} gp`,
      "No CSV or catalog value available.",
    ],
    mundaneBaseGp: 0,
  };
}

export function formatPriceBreakdownTooltip(
  resolved: ResolvedItemPrice,
): string {
  return resolved.breakdown.join("\n");
}

export function applyMarkupGp(
  basePriceGp: number,
  multiplier: number,
): number {
  return Math.max(0, Math.round(basePriceGp * multiplier));
}

export function formatShopPriceGp(gp: number): string {
  return `${gp.toLocaleString("en-US")} gp`;
}
