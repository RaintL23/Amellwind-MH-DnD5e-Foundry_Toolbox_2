import { Rune } from "@/shared/types";
import { flattenEntriesForDisplay } from "@/shared/utils/fivetools-parser";
import {
  materialLootNamesMatch,
  normalizeMaterialLootName,
  stripMaterialQuantity,
} from "../utils/rune-material-name.utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/**
 * Materials with loot slot "O" (Other) — upgrade bones, crafting mats, sellables —
 * parse to empty `slots` and are not placeable as Armor/Weapon/Trinket runes.
 */
export function isPlaceableRune(
  rune: Pick<Rune, "slots" | "armorEffect" | "weaponEffect">,
): boolean {
  return rune.slots.length > 0 && (!!rune.armorEffect || !!rune.weaponEffect);
}

/** Normalize loot-table dash variants (em/en dash) to ASCII "-". */
export function normalizeLootChance(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "-";
  if (/^[—–―−‐-]+$/.test(trimmed)) return "-";
  return trimmed;
}

export { stripMaterialQuantity } from "../utils/rune-material-name.utils";

function preferShorterEffect(
  map: Map<string, string>,
  key: string,
  effect: string,
): void {
  const prev = map.get(key);
  if (!prev || effect.length < prev.length) map.set(key, effect);
}

/**
 * Shared O-slot materials often omit `OTHER MATERIAL EFFECTS` on some sheets.
 * Copy the shortest known `otherEffect` onto empty-slot rows that lack one.
 */
export function backfillSharedOtherEffects(runes: Rune[]): Rune[] {
  const bestByKey = new Map<string, string>();
  for (const rune of runes) {
    const effect = rune.otherEffect?.trim();
    if (!effect) continue;
    preferShorterEffect(bestByKey, normalizeMaterialLootName(rune.name), effect);
    preferShorterEffect(
      bestByKey,
      normalizeMaterialLootName(stripMaterialQuantity(rune.name)),
      effect,
    );
  }

  return runes.map((rune) => {
    if (rune.otherEffect || rune.slots.length > 0) return rune;
    const filled =
      bestByKey.get(normalizeMaterialLootName(rune.name)) ??
      bestByKey.get(
        normalizeMaterialLootName(stripMaterialQuantity(rune.name)),
      );
    return filled ? { ...rune, otherEffect: filled } : rune;
  });
}

/** Look up an effect by exact name, then by normalized / tier-flexible variants. */
export function lookupEffectByMaterialName(
  index: Record<string, string>,
  name: string,
): string | null {
  if (index[name]) return index[name];

  const normalized = normalizeMaterialLootName(name);
  for (const [key, value] of Object.entries(index)) {
    if (normalizeMaterialLootName(key) === normalized) return value;
  }

  for (const [key, value] of Object.entries(index)) {
    if (materialLootNamesMatch(name, key)) return value;
  }

  return null;
}

export function indexEffectsByName(items: unknown[]): Record<string, string> {
  const index: Record<string, string> = {};
  if (!Array.isArray(items)) return index;
  for (const item of items) {
    if (typeof item !== "object" || item === null) continue;
    const i = item as Raw;
    const name = String(i.name ?? "");
    const entries = Array.isArray(i.entries) ? i.entries : [];
    index[name] = flattenEntriesForDisplay(entries);
  }
  return index;
}
