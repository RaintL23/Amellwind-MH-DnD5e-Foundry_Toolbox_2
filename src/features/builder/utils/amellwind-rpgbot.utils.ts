import type { ArmorCategory } from "@/shared/types";
import type { RpgbotRatingLookupEntry } from "@/features/builder/data/rpgbot-ratings.types";
import type { RpgbotLookupFn } from "@/features/builder/data/rpgbot-ratings.utils";
import { getWeaponProficiencyRule } from "@/features/weapons/data/weapon-proficiencies.data";

/** AGMH armor names that differ from RPGBOT / 5e labels. */
const ARMOR_NAME_ALIASES: Record<string, string> = {
  "Plate Mail": "Full Plate",
  "Splint Mail": "Splint",
};

/** Expand AGMH-compatible proficiency labels into RPGBOT-rated weapon names. */
const COMPATIBLE_WEAPON_ALIASES: Record<string, string[]> = {
  Firearms: ["Musket", "Pistol"],
  "Thrown weapons": ["Javelin", "Handaxe"],
  "Light Hammer": ["Warhammer"],
  "Musical Instrument": [],
};

/** D&D armor names to probe when a class guide omits the exact AGMH name. */
const ARMOR_CATEGORY_PROXIES: Record<ArmorCategory, string[]> = {
  light: ["Studded Leather", "Leather", "Padded"],
  medium: ["Half Plate", "Breastplate", "Scale Mail", "Chain Shirt", "Hide"],
  heavy: ["Full Plate", "Chain Mail", "Splint", "Ring Mail"],
  shield: ["Shield"],
  clothing: [],
};

export function resolveAmellwindWeaponFallbackNames(weaponName: string): string[] {
  const rule = getWeaponProficiencyRule(weaponName);
  if (!rule) return [];

  const names = new Set<string>();
  for (const compatible of rule.compatible) {
    const aliases = COMPATIBLE_WEAPON_ALIASES[compatible];
    if (aliases) {
      for (const alias of aliases) names.add(alias);
      continue;
    }
    names.add(compatible);
  }
  return [...names];
}

export function resolveAmellwindArmorFallbackNames(
  name: string,
  category: ArmorCategory,
): string[] {
  const names = new Set<string>();
  const alias = ARMOR_NAME_ALIASES[name];
  if (alias) names.add(alias);

  for (const proxy of ARMOR_CATEGORY_PROXIES[category] ?? []) {
    names.add(proxy);
  }

  return [...names];
}

export function lookupBestRpgbotRating(
  lookup: RpgbotLookupFn,
  names: string[],
  source?: string,
  variantSources?: string[],
): RpgbotRatingLookupEntry | null {
  let best: RpgbotRatingLookupEntry | null = null;

  for (const name of names) {
    const rating = lookup(name, source, variantSources);
    if (!rating) continue;

    if (
      !best ||
      rating.score > best.score ||
      (rating.score === best.score &&
        name.localeCompare(best.name, undefined, { sensitivity: "base" }) < 0)
    ) {
      best = rating;
    }
  }

  return best;
}
