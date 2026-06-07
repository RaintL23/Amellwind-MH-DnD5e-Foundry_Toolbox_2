import type { MaterialEffect, MaterialEffectSlot } from "@/shared/types";
import type { Rune } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

export interface MaterialEffectNameIndex {
  all: string[];
  bySlot: Record<MaterialEffectSlot, string[]>;
  byKey: Map<string, MaterialEffect>;
}

function normalizeEffectName(name: string): string {
  return name.replace(/\.$/, "").trim().toLowerCase();
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

  const patterns = names.map(
    (name) => `${escapeRegExp(name)}\\.?`,
  );
  const regex = new RegExp(`(${patterns.join("|")})`, "gi");

  return text
    .split(regex)
    .filter((part) => part.length > 0)
    .map((part, idx) => {
      const normalized = normalizeEffectName(part);
      const effect = byKey.get(`${slot}:${normalized}`);
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
    .filter((name) => {
      const escaped = escapeRegExp(name);
      return new RegExp(`${escaped}\\.?`, "i").test(lower);
    })
    .sort((a, b) => b.length - a.length);
}

export function getReferencedMaterialEffectsForText(
  text: string,
  slot: MaterialEffectSlot,
  index: MaterialEffectNameIndex,
): MaterialEffect[] {
  const found = new Map<string, MaterialEffect>();
  const parsed = parseFiveToolsMarkup(text);
  const names = findMatchingMaterialEffectNames(parsed, index.bySlot[slot]);
  for (const name of names) {
    const effect = index.byKey.get(`${slot}:${normalizeEffectName(name)}`);
    if (effect) found.set(effect.id, effect);
  }
  return [...found.values()];
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
