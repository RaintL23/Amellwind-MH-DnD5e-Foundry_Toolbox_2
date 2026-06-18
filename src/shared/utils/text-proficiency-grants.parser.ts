import type { NamedProficiencyGrant, ProficiencySource } from "@/shared/types/proficiency.types";
import { canonicalizeWeaponProficiencyLabel } from "@/shared/utils/weapon-proficiency-name.utils";

export interface TextProficiencyGrantItems {
  armorItems: string[];
  weaponItems: string[];
  toolItems: string[];
}

const ARMOR_CATEGORY_PATTERNS: Array<{ re: RegExp; item: string }> = [
  { re: /\bheavy\s+armor\b/i, item: "Heavy" },
  { re: /\bmedium\s+armor\b/i, item: "Medium" },
  { re: /\blight\s+armor\b/i, item: "Light" },
];

const WEAPON_CATEGORY_PATTERNS: Array<{ re: RegExp; item: string }> = [
  { re: /\bmartial\s+(?:ranged\s+)?weapons?\b/i, item: "Martial" },
  { re: /\bsimple\s+(?:ranged\s+)?weapons?\b/i, item: "Simple" },
];

/**
 * Shield: only when proficiency/training language is present (avoids "equip a shield").
 */
const SHIELD_GRANT_RE =
  /\bshield(?:s)?\b.{0,80}(?:proficiency|proficiencies|trained|training|proficient)\b|\b(?:proficiency|proficiencies|trained|training|proficient)\b.{0,80}\bshield(?:s)?\b/i;

/**
 * Clauses that convey gaining a fixed proficiency (not "choose one of the following").
 */
const PROFICIENCY_CLAUSE_RE =
  /\b(?:(?:you|your character)\s+(?:also\s+)?(?:gain|gains|have|has|obtain|obtains)\s+(?:proficiency|proficiencies)\s+(?:with|in)|(?:gain|gains|have|has|obtain|obtains)\s+(?:proficiency|proficiencies)\s+(?:with|in)|training\s+with|trained\s+in|\bproficient\s+(?:with|in))\s+([^.;]+?)(?=\.|;|$|\band\b(?=\s+(?:you|your|if|when|whenever|additionally|also)\b))/gi;

const CHOOSE_ONE_RE =
  /\b(?:one|choose|choice|following|your choice)\b/i;

function uniquePush(target: string[], item: string): void {
  const label = canonicalizeWeaponProficiencyLabel(item);
  if (!label) return;
  const key = label.toLowerCase();
  if (!target.some((existing) => existing.toLowerCase() === key)) {
    target.push(label);
  }
}

function splitProficiencyTargets(clause: string): string[] {
  return clause
    .split(/\s*,\s*|\s+and\s+/i)
    .map((part) => part.trim())
    .filter(Boolean);
}

const TRAINING_CLAUSE_RE = /\b(?:training|trained)\s+(?:with|in)\s+([^.;]+?)(?=\.|;|$)/gi;

function stripProficiencyPrefix(value: string): string {
  return value
    .replace(/^(?:proficiency|proficiencies)\s+(?:with|in)\s+/i, "")
    .replace(/^(?:training|trained)\s+(?:with|in)\s+/i, "")
    .replace(/^proficient\s+(?:with|in)\s+/i, "")
    .trim();
}

function classifyTarget(
  target: string,
  result: TextProficiencyGrantItems,
): void {
  const normalized = stripProficiencyPrefix(target.trim());
  if (!normalized || CHOOSE_ONE_RE.test(normalized)) return;

  for (const { re, item } of ARMOR_CATEGORY_PATTERNS) {
    if (re.test(normalized)) {
      uniquePush(result.armorItems, item);
      return;
    }
  }

  for (const { re, item } of WEAPON_CATEGORY_PATTERNS) {
    if (re.test(normalized)) {
      uniquePush(result.weaponItems, item);
      return;
    }
  }

  if (/\bshield(?:s)?\b/i.test(normalized)) {
    uniquePush(result.armorItems, "Shield");
    return;
  }

  if (/\b(?:artisan'?s?\s+tools?|gaming\s+set|musical\s+instrument|tool(?:s)?|kit|supplies|instruments?)\b/i.test(normalized)) {
    uniquePush(result.toolItems, normalized);
  }
}

/**
 * Parses plain-text feature entries for fixed armor, weapon, and tool proficiencies
 * granted by phrases like "you gain proficiency with …" or "training with …".
 */
export function parseTextProficiencyGrantItems(text: string): TextProficiencyGrantItems {
  const result: TextProficiencyGrantItems = {
    armorItems: [],
    weaponItems: [],
    toolItems: [],
  };

  if (!text.trim()) return result;

  if (SHIELD_GRANT_RE.test(text)) {
    uniquePush(result.armorItems, "Shield");
  }

  let match: RegExpExecArray | null;
  PROFICIENCY_CLAUSE_RE.lastIndex = 0;
  while ((match = PROFICIENCY_CLAUSE_RE.exec(text)) !== null) {
    const clause = match[1]?.trim() ?? "";
    if (!clause || CHOOSE_ONE_RE.test(clause)) continue;

    for (const target of splitProficiencyTargets(clause)) {
      classifyTarget(target, result);
    }
  }

  TRAINING_CLAUSE_RE.lastIndex = 0;
  while ((match = TRAINING_CLAUSE_RE.exec(text)) !== null) {
    const clause = match[1]?.trim() ?? "";
    if (!clause || CHOOSE_ONE_RE.test(clause)) continue;

    for (const target of splitProficiencyTargets(clause)) {
      classifyTarget(target, result);
    }
  }

  return result;
}

export function parseEntriesTextProficiencyGrantItems(
  entries: string[],
): TextProficiencyGrantItems {
  return parseTextProficiencyGrantItems(entries.join(" "));
}

function toFixedGrants(
  items: string[],
  source: ProficiencySource,
): NamedProficiencyGrant[] {
  if (!items.length) return [];
  return [{ kind: "fixed", items, source }];
}

export function parseEntriesProficiencyGrants(
  entries: string[],
  source: ProficiencySource,
): {
  armorGrants: NamedProficiencyGrant[];
  weaponGrants: NamedProficiencyGrant[];
  toolGrants: NamedProficiencyGrant[];
} {
  const parsed = parseEntriesTextProficiencyGrantItems(entries);
  return {
    armorGrants: toFixedGrants(parsed.armorItems, source),
    weaponGrants: toFixedGrants(parsed.weaponItems, source),
    toolGrants: toFixedGrants(parsed.toolItems, source),
  };
}
