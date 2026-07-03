import type { MaterialEffect, MaterialEffectSlot } from "@/shared/types";
import type { Rune } from "@/shared/types";
import {
  UNKNOWN_MATERIAL_EFFECT_TIER,
  type MaterialEffectTierFilter,
} from "@/features/material-effects/constants/material-effect.constants";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

export interface MaterialEffectNameIndex {
  all: string[];
  bySlot: Record<MaterialEffectSlot, string[]>;
  byKey: Map<string, MaterialEffect>;
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

const LEADING_TITLE_REJECT =
  /^(while|when|you|if|this|the|a|an|see|for|each|any)\b/i;

/**
 * Extracts an inline material effect title from the start of rune effect text,
 * e.g. "{@i Sovereign Wrath.} You gain…" → "Sovereign Wrath".
 */
export function extractLeadingMaterialEffectName(text: string): string | null {
  const firstLine = parseFiveToolsMarkup(text).trim().split(/\n/)[0]?.trim() ?? "";
  const match = firstLine.match(/^(.+?)\.\s+(.+)$/);
  if (!match) return null;

  const name = match[1].trim();
  if (!/^[A-Z("(]/.test(name)) return null;
  if (LEADING_TITLE_REJECT.test(name)) return null;

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
      const synthetic: MaterialEffect = {
        id: `discovered:${slot}:${slugify(displayName)}`,
        name: displayName,
        effect: parsed,
        summary:
          parsed.length > 140 ? `${parsed.slice(0, 137)}…` : parsed,
        slot,
        rarity: "Common",
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
  const lower = text.toLowerCase();
  return names
    .filter((name) => new RegExp(buildNameMatchPattern(name), "i").test(lower))
    .sort((a, b) => b.length - a.length);
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
): MaterialEffectTierFilter {
  const refs = getReferencedMaterialEffectsForText(text, slot, index);
  if (refs.length === 0) return UNKNOWN_MATERIAL_EFFECT_TIER;
  if (isDiscoveredEffect(refs[0])) return UNKNOWN_MATERIAL_EFFECT_TIER;
  return refs[0].rarity;
}

export function getMaterialEffectTiersForRune(
  rune: Rune,
  index: MaterialEffectNameIndex,
): MaterialEffectTierFilter[] {
  return [
    getMaterialEffectTierForText(rune.armorEffect ?? "", "armor", index),
    getMaterialEffectTierForText(rune.weaponEffect ?? "", "weapon", index),
  ];
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
