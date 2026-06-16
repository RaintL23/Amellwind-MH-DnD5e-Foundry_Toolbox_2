import type { MaterialEffect, MaterialEffectSlot } from "@/shared/types";
import type { Rune } from "@/shared/types";
import type { MaterialEffectNameIndex } from "@/features/material-effects/services/material-effect.service";
import { getReferencedMaterialEffectsForText } from "@/features/material-effects/utils/material-effect-highlight.utils";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

export type RuneSearchSlotFilter = "" | "A" | "W";

export interface RuneSearchContext {
  slot: RuneSearchSlotFilter;
  tags: string[];
  materialEffectTier: string[];
}

function effectTextMatchesQuery(text: string, query: string): boolean {
  return parseFiveToolsMarkup(text).toLowerCase().includes(query);
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
  return tags.some((tag) => runeTags.includes(tag));
}

function collectSearchableEffectTexts(
  rune: Rune,
  context: RuneSearchContext,
): string[] {
  const texts: string[] = [];

  if (
    slotIncluded("armor", context.slot) &&
    tagsAllowEffect(rune, "armor", context.tags) &&
    rune.armorEffect
  ) {
    texts.push(rune.armorEffect);
  }

  if (
    slotIncluded("weapon", context.slot) &&
    tagsAllowEffect(rune, "weapon", context.tags) &&
    rune.weaponEffect
  ) {
    texts.push(rune.weaponEffect);
  }

  return texts;
}

function collectSearchableMaterialEffects(
  rune: Rune,
  index: MaterialEffectNameIndex,
  context: RuneSearchContext,
): MaterialEffect[] {
  const refs: MaterialEffect[] = [];

  for (const slot of ["armor", "weapon"] as const) {
    if (!slotIncluded(slot, context.slot)) continue;
    if (!tagsAllowEffect(rune, slot, context.tags)) continue;

    const effectText =
      slot === "armor" ? (rune.armorEffect ?? "") : (rune.weaponEffect ?? "");
    refs.push(...getReferencedMaterialEffectsForText(effectText, slot, index));
  }

  if (context.materialEffectTier.length === 0) return refs;

  return refs.filter((ref) => context.materialEffectTier.includes(ref.rarity));
}

export function matchesRuneSearchQuery(
  rune: Rune,
  query: string,
  materialEffectIndex: MaterialEffectNameIndex | null,
  context: RuneSearchContext = { slot: "", tags: [], materialEffectTier: [] },
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  if (rune.name.toLowerCase().includes(q)) return true;
  if (rune.monsterName.toLowerCase().includes(q)) return true;

  const effectTexts = collectSearchableEffectTexts(rune, context);
  if (effectTexts.some((text) => effectTextMatchesQuery(text, q))) return true;

  if (materialEffectIndex) {
    const refs = collectSearchableMaterialEffects(
      rune,
      materialEffectIndex,
      context,
    );
    if (refs.some((effect) => effect.name.toLowerCase().includes(q))) {
      return true;
    }
  }

  return false;
}
