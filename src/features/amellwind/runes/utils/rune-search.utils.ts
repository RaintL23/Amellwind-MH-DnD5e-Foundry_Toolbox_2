import type { MaterialEffectSlot, Rune } from "@/shared/types";
import type { MaterialEffectNameIndex } from "@/features/amellwind/material-effects/services/material-effect.service";
import { getMaterialEffectTiersForRune } from "@/features/amellwind/material-effects/utils/material-effect-highlight.utils";
import type { MaterialEffectTierFilter } from "@/features/amellwind/material-effects/constants/material-effect.constants";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

export type RuneSearchSlotFilter = "" | "A" | "W";

export interface RuneSearchContext {
  slot: RuneSearchSlotFilter;
  tags: string[];
  materialEffectTier: string[];
}

/** Precomputed haystacks so list search is a cheap `includes`, not markup parsing. */
export interface RuneSearchIndexEntry {
  rune: Rune;
  name: string;
  monsterName: string;
  armorHaystack: string;
  weaponHaystack: string;
  materialEffectTiers: MaterialEffectTierFilter[];
}

function slotIncluded(
  slot: MaterialEffectSlot,
  filter: RuneSearchSlotFilter,
): boolean {
  if (filter === "") return true;
  return filter === "W" ? slot === "weapon" : slot === "armor";
}

function tagsAllowEffect(
  rune: Rune,
  slot: MaterialEffectSlot,
  tags: string[],
): boolean {
  if (tags.length === 0) return true;
  const runeTags = slot === "weapon" ? rune.weaponTags : rune.armorTags;
  return tags.every((tag) => runeTags.includes(tag));
}

function parsedEffectHaystack(text: string | null): string {
  if (!text) return "";
  return parseFiveToolsMarkup(text).toLowerCase();
}

export function buildRuneSearchIndex(
  runes: Rune[],
  materialEffectIndex: MaterialEffectNameIndex | null,
): RuneSearchIndexEntry[] {
  return runes.map((rune) => ({
    rune,
    name: rune.name.toLowerCase(),
    monsterName: rune.monsterName.toLowerCase(),
    armorHaystack: parsedEffectHaystack(rune.armorEffect),
    weaponHaystack: parsedEffectHaystack(rune.weaponEffect),
    materialEffectTiers: materialEffectIndex
      ? getMaterialEffectTiersForRune(rune, materialEffectIndex)
      : [],
  }));
}

export function matchesRuneSearchQuery(
  entry: RuneSearchIndexEntry,
  query: string,
  context: RuneSearchContext = { slot: "", tags: [], materialEffectTier: [] },
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (entry.name.includes(q) || entry.monsterName.includes(q)) return true;

  if (
    slotIncluded("armor", context.slot) &&
    tagsAllowEffect(entry.rune, "armor", context.tags) &&
    entry.armorHaystack.includes(q)
  ) {
    return true;
  }

  if (
    slotIncluded("weapon", context.slot) &&
    tagsAllowEffect(entry.rune, "weapon", context.tags) &&
    entry.weaponHaystack.includes(q)
  ) {
    return true;
  }

  return false;
}

export function runeIndexMatchesMaterialEffectTier(
  entry: RuneSearchIndexEntry,
  selectedTiers: string[],
): boolean {
  if (selectedTiers.length === 0) return true;
  return selectedTiers.some((tier) =>
    entry.materialEffectTiers.includes(tier as MaterialEffectTierFilter),
  );
}
