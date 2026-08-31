import type { ResourceRarity } from "@/shared/types";
import {
  INLINE_BASIC_TEMPERATURE_TOLERANCE_RARITY,
  INLINE_CONDITIONAL_FLAVOR_RARITY,
  INLINE_DUAL_TEMPERATURE_TOLERANCE_RARITY,
  INLINE_EXTENDED_COLD_TOLERANCE_RARITY,
  INLINE_EXTREME_COLD_IMMUNITY_RARITY,
} from "../constants/material-effect.constants";

const EXTENDED_COLD_F_RE = /-(?:50|100)\s*degrees?\s*fahrenheit/i;
const DUAL_TOLERANCE_RE =
  /\bboth a cool drink and a hot drink\b|\bextreme cold or extreme heat\b/i;

/**
 * Infers rarity for always-on environmental temperature tolerance.
 *
 * | Pattern | Rarity |
 * | -20 °F cold / 120 °F heat | Common |
 * | -50 °F / -100 °F (Hot Drink tier) | Uncommon |
 * | Both hot + cold (Adaptability) | Rare |
 */
export function inferRarityFromTemperatureToleranceTags(
  text: string,
  tags: string[],
): ResourceRarity | null {
  const set = new Set(tags);
  if (!set.has("mechanic:temperature-tolerance")) return null;

  if (
    set.has("damage:cold") &&
    set.has("damage:fire") &&
    DUAL_TOLERANCE_RE.test(text)
  ) {
    return INLINE_DUAL_TEMPERATURE_TOLERANCE_RARITY;
  }

  if (EXTENDED_COLD_F_RE.test(text)) {
    return INLINE_EXTENDED_COLD_TOLERANCE_RARITY;
  }

  if (
    /\bsuffer no ill effects? from being in extremely cold environments?\b/i.test(
      text,
    )
  ) {
    return INLINE_EXTREME_COLD_IMMUNITY_RARITY;
  }

  return INLINE_BASIC_TEMPERATURE_TOLERANCE_RARITY;
}

/** HP-threshold flavor with no mechanical rider (Gaismagorm crystal shatter). */
export function inferRarityFromConditionalFlavorTags(
  tags: string[],
): ResourceRarity | null {
  return tags.includes("mechanic:conditional-flavor")
    ? INLINE_CONDITIONAL_FLAVOR_RARITY
    : null;
}
