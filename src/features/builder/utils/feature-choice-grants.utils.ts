import type { NamedProficiencyGrant } from "@/shared/types/proficiency.types";
import type {
  BuilderOptionalFeatureSelections,
  OptionalFeatureProgression,
} from "@/shared/types";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface FeatureChoiceGrants {
  armorGrants?: NamedProficiencyGrant[];
  weaponGrants?: NamedProficiencyGrant[];
  /** Extra cantrips granted by this option. */
  cantripBonus?: number;
}

export interface AggregatedFeatureChoiceGrants {
  armorGrants: NamedProficiencyGrant[];
  weaponGrants: NamedProficiencyGrant[];
  cantripBonus: number;
}

// ─── Patterns ────────────────────────────────────────────────────────────────

/** Armor category keywords to detect in plain-text entries. */
const ARMOR_PATTERNS: Array<{ re: RegExp; item: string }> = [
  { re: /\bheavy\s+armor\b/i, item: "Heavy" },
  { re: /\bmedium\s+armor\b/i, item: "Medium" },
  { re: /\blight\s+armor\b/i, item: "Light" },
];

/** Weapon category keywords to detect in plain-text entries. */
const WEAPON_PATTERNS: Array<{ re: RegExp; item: string }> = [
  { re: /\bmartial\s+weapons?\b/i, item: "Martial" },
  { re: /\bsimple\s+weapons?\b/i, item: "Simple" },
];

/**
 * Shield: only grant if the text explicitly conveys proficiency/training with
 * shields (avoids false positives like "equip a shield").
 */
const SHIELD_GRANT_RE =
  /\bshield(?:s)?\b.{0,60}(?:proficiency|trained|training)\b|\b(?:proficiency|trained|training)\b.{0,60}\bshield(?:s)?\b/i;

/**
 * Cantrip bonus: "one extra cantrip", "one additional cantrip",
 * "know one more cantrip", "one extra cantrip from", etc.
 */
const CANTRIP_BONUS_RE =
  /\b(?:one\s+)?(?:extra|additional|more)\s+cantrip\b|\bcantrip\b.{0,50}\b(?:extra|additional|more)\b/i;

// ─── Parser ──────────────────────────────────────────────────────────────────

/**
 * Infers mechanical grants by scanning the plain-text `entries` of a
 * feature-choice option.  No hardcoded IDs — works for any class.
 */
function detectGrantsFromEntries(
  entries: string[],
  sourceName: string,
): FeatureChoiceGrants {
  const text = entries.join(" ");
  const grants: FeatureChoiceGrants = {};

  const armorItems: string[] = [];
  for (const { re, item } of ARMOR_PATTERNS) {
    if (re.test(text)) armorItems.push(item);
  }
  if (SHIELD_GRANT_RE.test(text)) armorItems.push("Shield");
  if (armorItems.length > 0) {
    grants.armorGrants = [
      { kind: "fixed", items: armorItems, source: { type: "class", name: sourceName } },
    ];
  }

  const weaponItems: string[] = [];
  for (const { re, item } of WEAPON_PATTERNS) {
    if (re.test(text)) weaponItems.push(item);
  }
  if (weaponItems.length > 0) {
    grants.weaponGrants = [
      { kind: "fixed", items: weaponItems, source: { type: "class", name: sourceName } },
    ];
  }

  if (CANTRIP_BONUS_RE.test(text)) {
    grants.cantripBonus = 1;
  }

  return grants;
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Aggregates mechanical grants for the currently selected feature-choice
 * options by parsing each option's plain-text entries.
 *
 * Pass the active `progressions` so the function can look up the full option
 * data (including entries) for each selection.
 */
export function computeFeatureChoiceGrants(
  optionalFeatureSelections: BuilderOptionalFeatureSelections,
  progressions: OptionalFeatureProgression[],
): AggregatedFeatureChoiceGrants {
  const result: AggregatedFeatureChoiceGrants = {
    armorGrants: [],
    weaponGrants: [],
    cantripBonus: 0,
  };

  for (const progression of progressions) {
    if (progression.catalog !== "feature-choice") continue;
    const picks = optionalFeatureSelections[progression.id] ?? [];

    for (const pick of picks) {
      if (!pick) continue;
      const option = progression.choiceOptions?.find((o) => o.id === pick.id);
      if (!option?.entries?.length) continue;

      const sourceName = `${progression.name}: ${option.name}`;
      const grants = detectGrantsFromEntries(option.entries, sourceName);

      if (grants.armorGrants?.length) result.armorGrants.push(...grants.armorGrants);
      if (grants.weaponGrants?.length) result.weaponGrants.push(...grants.weaponGrants);
      if (grants.cantripBonus) result.cantripBonus += grants.cantripBonus;
    }
  }

  return result;
}
