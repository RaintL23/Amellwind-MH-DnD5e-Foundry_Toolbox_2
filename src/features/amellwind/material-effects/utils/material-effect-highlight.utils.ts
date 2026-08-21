import type { MaterialEffect, MaterialEffectSlot, ResourceRarity, Rune } from "@/shared/types";
import {
  MATERIAL_EFFECT_RARITIES,
  UNKNOWN_MATERIAL_EFFECT_TIER,
  type MaterialEffectTierFilter,
} from "@/features/amellwind/material-effects/constants/material-effect.constants";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { slugifyKebab } from "@/shared/utils/slugify.utils";
import { inferInlineDamageDefenseRarity } from "./inline-defense-rarity.utils";
import { inferInlineExtraDamageRarity } from "./inline-extra-damage-rarity.utils";
import { inferRarityFromAttackAdvantageTags } from "./inline-attack-advantage-rarity.utils";
import { inferRarityFromAttackRangeTags } from "./inline-attack-range-rarity.utils";
import { inferRarityFromAcceleratedRestTags } from "./inline-accelerated-rest-rarity.utils";
import { inferRarityFromClassResourceRecoveryTags } from "./inline-class-resource-rarity.utils";
import { inferRarityFromConditionDefenseTags, inferRarityFromConditionImmunityTags } from "./inline-condition-rarity.utils";
import { inferRarityFromGatherResourceTags } from "./inline-gather-rarity.utils";
import { inferRarityFromHoldBreathUnderwaterTags } from "./inline-hold-breath-rarity.utils";
import { inferRarityFromLightDarknessTags } from "./inline-light-darkness-rarity.utils";
import { inferRarityFromMithralArmorTags } from "./inline-mithral-rarity.utils";
import { inferRarityFromMovementTags } from "./inline-movement-rarity.utils";
import { inferRarityFromReactionAttackTags } from "./inline-reaction-attack-rarity.utils";
import { inferRarityFromRoll20UtilityTags } from "./inline-roll-20-rarity.utils";
import { inferRarityFromSkillUtilityTags } from "./inline-skill-rarity.utils";
import { inferRarityFromSpellMechanicTags } from "./inline-spell-rarity.utils";
import { inferRarityFromSpellcastingFocusTags } from "./inline-spellcasting-focus-rarity.utils";
import { lookupDiscoveredEffectRarity } from "../data/discovered-effect-rarity.data";

export interface MaterialEffectNameIndex {
  all: string[];
  bySlot: Record<MaterialEffectSlot, string[]>;
  byKey: Map<string, MaterialEffect>;
}

const LEADING_TITLE_REJECT =
  /^(while|when|whenever|where|you|your|if|this|the|a|an|as|on|at|after|before|during|once|until|unless|see|for|each|any|by|with|from)\b/i;

/** Real catalog titles are short proper names, not full sentences. */
const MAX_LEADING_TITLE_CHARS = 48;
const MAX_LEADING_TITLE_WORDS = 6;

/**
 * Extracts an inline material effect title from the start of rune effect text,
 * e.g. "{@i Sovereign Wrath.} You gain…" → "Sovereign Wrath".
 * Rejects sentence openers mistaken for titles (e.g. "As an action you can…").
 */
export function extractLeadingMaterialEffectName(text: string): string | null {
  const firstLine = parseFiveToolsMarkup(text).trim().split(/\n/)[0]?.trim() ?? "";
  // Drop leading class/weapon restrictions: "(Insect Glaive only) Title. Body"
  const withoutRestriction = firstLine
    .replace(/^\([^)]*only\)\s*/i, "")
    .replace(/^\([^)]*\)\s*/, "")
    .trim();
  const match = withoutRestriction.match(/^(.+?)\.\s+(.+)$/);
  if (!match) return null;

  const name = match[1].trim();
  if (!/^[A-Z]/.test(name)) return null;
  if (LEADING_TITLE_REJECT.test(name)) return null;
  if (name.length > MAX_LEADING_TITLE_CHARS) return null;
  if (name.split(/\s+/).length > MAX_LEADING_TITLE_WORDS) return null;
  // Titles are names, not clauses ("…you can…", lists with many commas).
  if (/\b(you|your|can|must|deal|gain|have|are|is|to)\b/i.test(name)) {
    return null;
  }
  if ((name.match(/,/g) ?? []).length >= 2) return null;

  return name;
}

function isDiscoveredEffect(effect: MaterialEffect): boolean {
  return effect.id.startsWith("discovered:");
}

function normalizeEffectName(name: string): string {
  return name
    .replace(/\.$/, "")
    .trim()
    .replace(/\s+(\+\d+)\s*$/, "$1")
    .toLowerCase();
}

function parseEffectNameParts(name: string): {
  base: string;
  tierSuffix: string | null;
} {
  const trimmed = name.replace(/\.$/, "").trim();
  const match = trimmed.match(/^(.+?)(\s*\+\d+)\s*$/);
  if (match) {
    return {
      base: match[1].trim(),
      tierSuffix: match[2].replace(/\s+/g, ""),
    };
  }
  return { base: trimmed, tierSuffix: null };
}

/** Builds a regex fragment that matches a catalog name in rune text, including tier suffixes (+1, +2, …). */
function buildNameMatchPattern(name: string): string {
  const { base, tierSuffix } = parseEffectNameParts(name);
  const escapedBase = escapeRegExp(base);

  if (tierSuffix) {
    const tierNum = tierSuffix.slice(1);
    return `${escapedBase}\\s*\\+${tierNum}\\.?`;
  }

  return `${escapedBase}(?:\\s*\\+\\d+)?\\.?`;
}

function otherSlot(slot: MaterialEffectSlot): MaterialEffectSlot {
  return slot === "weapon" ? "armor" : "weapon";
}

function lookupByNormalizedName(
  normalized: string,
  preferredSlot: MaterialEffectSlot,
  byKey: Map<string, MaterialEffect>,
): MaterialEffect | undefined {
  return (
    byKey.get(`${preferredSlot}:${normalized}`) ??
    byKey.get(`${otherSlot(preferredSlot)}:${normalized}`)
  );
}

function resolveMaterialEffect(
  matchedText: string,
  slot: MaterialEffectSlot,
  byKey: Map<string, MaterialEffect>,
): MaterialEffect | undefined {
  const normalized = normalizeEffectName(matchedText);
  let effect = lookupByNormalizedName(normalized, slot, byKey);
  if (effect) return effect;

  const baseKey = normalized.replace(/\+\d+$/, "").trim();
  if (baseKey !== normalized) {
    effect = lookupByNormalizedName(baseKey, slot, byKey);
  }
  return effect;
}

function resolveMaterialEffectByName(
  name: string,
  slot: MaterialEffectSlot,
  byKey: Map<string, MaterialEffect>,
): MaterialEffect | undefined {
  return lookupByNormalizedName(normalizeEffectName(name), slot, byKey);
}

export function buildMaterialEffectNameIndex(
  effects: MaterialEffect[],
): MaterialEffectNameIndex {
  const byKey = new Map<string, MaterialEffect>();
  const weaponNames: string[] = [];
  const armorNames: string[] = [];

  for (const effect of effects) {
    byKey.set(`${effect.slot}:${normalizeEffectName(effect.name)}`, effect);
    if (effect.slot === "weapon") weaponNames.push(effect.name);
    else armorNames.push(effect.name);
  }

  const sortByLength = (a: string, b: string) => b.length - a.length;

  return {
    all: [...new Set([...weaponNames, ...armorNames])].sort(sortByLength),
    bySlot: {
      weapon: [...new Set(weaponNames)].sort(sortByLength),
      armor: [...new Set(armorNames)].sort(sortByLength),
    },
    byKey,
  };
}

/** Adds inline effect titles found in rune data but missing from the GTMH catalog. */
export function supplementIndexWithRuneEffectNames(
  index: MaterialEffectNameIndex,
  runes: Rune[],
): MaterialEffectNameIndex {
  const byKey = new Map(index.byKey);
  const weaponNames = new Set(index.bySlot.weapon);
  const armorNames = new Set(index.bySlot.armor);
  const sortByLength = (a: string, b: string) => b.length - a.length;

  for (const rune of runes) {
    for (const slot of ["armor", "weapon"] as const) {
      const text = slot === "armor" ? rune.armorEffect : rune.weaponEffect;
      if (!text) continue;

      const name = extractLeadingMaterialEffectName(text);
      if (!name) continue;
      if (resolveMaterialEffectByName(name, slot, byKey)) continue;

      const normalized = normalizeEffectName(name);
      const key = `${slot}:${normalized}`;
      if (byKey.has(key)) continue;

      const parsed = parseFiveToolsMarkup(text);
      const displayName = name.replace(/\.$/, "").trim();
      const assignedRarity = lookupDiscoveredEffectRarity(displayName, slot);
      const synthetic: MaterialEffect = {
        id: `discovered:${slot}:${slugifyKebab(displayName)}`,
        name: displayName,
        effect: parsed,
        summary:
          parsed.length > 140 ? `${parsed.slice(0, 137)}…` : parsed,
        slot,
        rarity: assignedRarity ?? "Common",
        isReference: true,
      };

      byKey.set(key, synthetic);
      if (slot === "weapon") weaponNames.add(displayName);
      else armorNames.add(displayName);
    }
  }

  return {
    all: [...new Set([...weaponNames, ...armorNames])].sort(sortByLength),
    bySlot: {
      weapon: [...weaponNames].sort(sortByLength),
      armor: [...armorNames].sort(sortByLength),
    },
    byKey,
  };
}

export type MaterialEffectTextSegment = {
  idx: number;
  text: string;
  isMaterialEffect: boolean;
  effect?: MaterialEffect;
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function splitMaterialEffectRefs(
  text: string,
  names: string[],
  byKey: Map<string, MaterialEffect>,
  slot: MaterialEffectSlot,
): MaterialEffectTextSegment[] {
  if (!names.length) return [{ idx: 0, text, isMaterialEffect: false }];

  const patterns = names.map((name) => buildNameMatchPattern(name));
  const regex = new RegExp(`(${patterns.join("|")})`, "gi");

  return text
    .split(regex)
    .filter((part) => part.length > 0)
    .map((part, idx) => {
      const effect = resolveMaterialEffect(part, slot, byKey);
      return {
        idx,
        text: part,
        isMaterialEffect: !!effect,
        effect,
      };
    });
}

export function findMatchingMaterialEffectNames(
  text: string,
  names: string[],
): string[] {
  if (names.length === 0 || !text) return [];
  const lower = text.toLowerCase();
  const matched: string[] = [];

  for (const name of names) {
    const { base, tierSuffix } = parseEffectNameParts(name);
    const needle = base.toLowerCase();
    if (!lower.includes(needle)) continue;
    if (!tierSuffix) {
      matched.push(name);
      continue;
    }
    if (new RegExp(buildNameMatchPattern(name), "i").test(lower)) {
      matched.push(name);
    }
  }

  return matched.sort((a, b) => b.length - a.length);
}

export function getReferencedMaterialEffectsForText(
  text: string,
  slot: MaterialEffectSlot,
  index: MaterialEffectNameIndex,
): MaterialEffect[] {
  const found = new Map<string, MaterialEffect>();
  const parsed = parseFiveToolsMarkup(text);
  const names = findMatchingMaterialEffectNames(parsed, index.all);
  for (const name of names) {
    const effect = resolveMaterialEffectByName(name, slot, index.byKey);
    if (effect) found.set(effect.id, effect);
  }
  return [...found.values()];
}

export function getMaterialEffectTierForText(
  text: string,
  slot: MaterialEffectSlot,
  index: MaterialEffectNameIndex,
  effectTags: string[] = [],
): MaterialEffectTierFilter {
  if (!text.trim()) return UNKNOWN_MATERIAL_EFFECT_TIER;

  const refs = getReferencedMaterialEffectsForText(text, slot, index);
  const catalogRef = refs.find((effect) => !isDiscoveredEffect(effect));
  if (catalogRef) return catalogRef.rarity;

  const discoveredAssigned = refs
    .filter(isDiscoveredEffect)
    .map((effect) => lookupDiscoveredEffectRarity(effect.name, effect.slot))
    .filter((rarity): rarity is ResourceRarity => rarity != null);
  if (discoveredAssigned.length > 0) {
    return discoveredAssigned.reduce((best, rarity) =>
      MATERIAL_EFFECT_RARITIES.indexOf(rarity) >=
      MATERIAL_EFFECT_RARITIES.indexOf(best)
        ? rarity
        : best,
    );
  }

  const inferred = [
    inferInlineDamageDefenseRarity(text),
    inferInlineExtraDamageRarity(text),
  ].filter((rarity): rarity is ResourceRarity => rarity != null);

  if (inferred.length > 0) {
    return inferred.reduce((best, rarity) =>
      MATERIAL_EFFECT_RARITIES.indexOf(rarity) >=
      MATERIAL_EFFECT_RARITIES.indexOf(best)
        ? rarity
        : best,
    );
  }

  // Only when still Unknown: spell / cantrip / spell-slot tags from the rune side.
  const spellRarity = inferRarityFromSpellMechanicTags(effectTags);
  if (spellRarity) return spellRarity;

  const spellcastingFocusRarity =
    inferRarityFromSpellcastingFocusTags(effectTags);
  if (spellcastingFocusRarity) return spellcastingFocusRarity;

  const conditionDefenseRarity =
    inferRarityFromConditionDefenseTags(effectTags);
  if (conditionDefenseRarity) return conditionDefenseRarity;

  const conditionImmunityRarity =
    inferRarityFromConditionImmunityTags(effectTags);
  if (conditionImmunityRarity) return conditionImmunityRarity;

  const skillUtilityRarity = inferRarityFromSkillUtilityTags(effectTags);
  if (skillUtilityRarity) return skillUtilityRarity;

  const mithralRarity = inferRarityFromMithralArmorTags(effectTags);
  if (mithralRarity) return mithralRarity;

  const roll20UtilityRarity = inferRarityFromRoll20UtilityTags(effectTags);
  if (roll20UtilityRarity) return roll20UtilityRarity;

  const reactionAttackRarity = inferRarityFromReactionAttackTags(effectTags);
  if (reactionAttackRarity) return reactionAttackRarity;

  const holdBreathRarity = inferRarityFromHoldBreathUnderwaterTags(effectTags);
  if (holdBreathRarity) return holdBreathRarity;

  const acceleratedRestRarity = inferRarityFromAcceleratedRestTags(effectTags);
  if (acceleratedRestRarity) return acceleratedRestRarity;

  const gatherRarity = inferRarityFromGatherResourceTags(effectTags);
  if (gatherRarity) return gatherRarity;

  const classResourceRarity =
    inferRarityFromClassResourceRecoveryTags(effectTags);
  if (classResourceRarity) return classResourceRarity;

  const attackRangeRarity = inferRarityFromAttackRangeTags(effectTags);
  if (attackRangeRarity) return attackRangeRarity;

  const attackAdvantageRarity =
    inferRarityFromAttackAdvantageTags(effectTags);
  if (attackAdvantageRarity) return attackAdvantageRarity;

  const movementRarity = inferRarityFromMovementTags(effectTags);
  if (movementRarity) return movementRarity;

  const lightDarknessRarity = inferRarityFromLightDarknessTags(effectTags);
  if (lightDarknessRarity) return lightDarknessRarity;

  return UNKNOWN_MATERIAL_EFFECT_TIER;
}

export function getMaterialEffectTiersForRune(
  rune: Rune,
  index: MaterialEffectNameIndex,
): MaterialEffectTierFilter[] {
  const tiers: MaterialEffectTierFilter[] = [];
  if (rune.armorEffect) {
    tiers.push(
      getMaterialEffectTierForText(
        rune.armorEffect,
        "armor",
        index,
        rune.armorTags,
      ),
    );
  }
  if (rune.weaponEffect) {
    tiers.push(
      getMaterialEffectTierForText(
        rune.weaponEffect,
        "weapon",
        index,
        rune.weaponTags,
      ),
    );
  }
  return tiers;
}

export function runeMatchesMaterialEffectTierFilter(
  rune: Rune,
  index: MaterialEffectNameIndex,
  selectedTiers: string[],
): boolean {
  if (selectedTiers.length === 0) return true;
  const runeTiers = getMaterialEffectTiersForRune(rune, index);
  return selectedTiers.some((tier) =>
    runeTiers.includes(tier as MaterialEffectTierFilter),
  );
}

export function getReferencedMaterialEffectsForRune(
  rune: Rune,
  index: MaterialEffectNameIndex,
): MaterialEffect[] {
  const found = new Map<string, MaterialEffect>();

  for (const effect of getReferencedMaterialEffectsForText(
    rune.armorEffect ?? "",
    "armor",
    index,
  )) {
    found.set(effect.id, effect);
  }

  for (const effect of getReferencedMaterialEffectsForText(
    rune.weaponEffect ?? "",
    "weapon",
    index,
  )) {
    found.set(effect.id, effect);
  }

  return [...found.values()];
}
