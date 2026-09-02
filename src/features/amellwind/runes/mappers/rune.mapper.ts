/**
 * Rune mapper — raw MHMM monster JSON → domain `Rune[]`.
 *
 * Flow per monster:
 * 1. Locate the loot inset in `fluff.entries` (`findInset`).
 * 2. Read the carve/capture loot table + three effect lists (A/W/O).
 * 3. For each loot row: resolve effects by material name, extract tags from text.
 * 4. `rune.service` aggregates all monsters and runs `backfillSharedOtherEffects`.
 *
 * Tag assignment happens here via `extractRuneEffectTags` (see `tags/rune-effect-tags.ts`).
 */
import { Rune } from "@/shared/types";
import type { SpellLevelLookup } from "../utils/spell-level-lookup.utils";
import {
  backfillSharedOtherEffects,
  indexEffectsByName,
  isPlaceableRune,
  lookupEffectByMaterialName,
  normalizeLootChance,
  stripMaterialQuantity,
} from "./rune-material.utils";
import {
  buildRuneMonsterMeta,
  findInset,
  parseSlots,
} from "./rune-monster-parse.utils";
import { extractRuneEffectTags } from "./tags/rune-effect-tags";

/** Re-export helpers consumed by `rune.service` and tests. */
export {
  backfillSharedOtherEffects,
  extractRuneEffectTags,
  isPlaceableRune,
  normalizeLootChance,
  stripMaterialQuantity,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

/**
 * Parses every placeable material row from one monster's 5etools fluff inset.
 * Returns an empty array when the sheet has no loot table.
 */
export function mapRunesFromMonster(
  rawMonster: unknown,
  spellLevels?: SpellLevelLookup | null,
): Rune[] {
  if (typeof rawMonster !== "object" || rawMonster === null) return [];
  const monster = rawMonster as Raw;
  const fluff = monster?.fluff;
  if (!fluff || !Array.isArray(fluff.entries)) return [];

  // ─── 1. Find loot inset ───────────────────────────────────────────────────
  const inset = findInset(fluff.entries as unknown[]);
  if (!inset || !Array.isArray(inset.entries)) return [];

  // ─── 2. Loot table + header (rolls count) ─────────────────────────────────
  const tables = inset.entries.filter((e: Raw) => e.type === "table") as Raw[];
  const lootTable = tables.find((t) => t.colLabels?.[0] === "Carve Chance");
  const headerTable = tables.find((t) => !t.colLabels);

  if (!lootTable || !Array.isArray(lootTable.rows)) return [];

  // ─── 3. Effect lists → name → flattened text index ────────────────────────
  const lists = inset.entries.filter((e: Raw) => e.type === "list") as Raw[];
  const armorList = lists.find((l) => l.name === "ARMOR MATERIAL EFFECTS");
  const weaponList = lists.find((l) => l.name === "WEAPON MATERIAL EFFECTS");
  const otherList = lists.find((l) => l.name === "OTHER MATERIAL EFFECTS");

  const armorEffects = indexEffectsByName(armorList?.items ?? []);
  const weaponEffects = indexEffectsByName(weaponList?.items ?? []);
  const otherEffects = indexEffectsByName(otherList?.items ?? []);

  const rolls = parseInt(String(headerTable?.rows?.[0]?.[3] ?? "0")) || 0;
  const hasCapture = (lootTable.colLabels as string[]).length >= 4;
  const meta = buildRuneMonsterMeta(monster);
  const runes: Rune[] = [];

  // ─── 4. One domain Rune per loot-table row ────────────────────────────────
  for (const row of lootTable.rows as unknown[][]) {
    let carveChance: string;
    let captureChance: string;
    let name: string;
    let slotsStr: string;

    // Column layout differs when Capture Chance column is present.
    if (hasCapture) {
      carveChance = normalizeLootChance(String(row[0] ?? "-"));
      captureChance = normalizeLootChance(String(row[1] ?? "-"));
      name = String(row[2] ?? "");
      slotsStr = String(row[3] ?? "");
    } else {
      carveChance = normalizeLootChance(String(row[0] ?? "-"));
      captureChance = "-";
      name = String(row[1] ?? "");
      slotsStr = String(row[2] ?? "");
    }

    if (!name) continue;

    const slots = parseSlots(slotsStr);
    const armorEffect = lookupEffectByMaterialName(armorEffects, name);
    const weaponEffect = lookupEffectByMaterialName(weaponEffects, name);
    const otherEffect = lookupEffectByMaterialName(otherEffects, name);

    // ─── 5. Tags — regex/heuristic extraction from effect prose ─────────────
    const weaponTags = weaponEffect
      ? extractRuneEffectTags(weaponEffect, spellLevels)
      : [];
    const armorTags = armorEffect
      ? extractRuneEffectTags(armorEffect, spellLevels)
      : [];
    const tags = Array.from(new Set([...weaponTags, ...armorTags]));

    runes.push({
      name,
      ...meta,
      carveChance,
      captureChance,
      rolls,
      slots,
      armorEffect,
      weaponEffect,
      otherEffect,
      tags,
      weaponTags,
      armorTags,
    });
  }

  return runes;
}
