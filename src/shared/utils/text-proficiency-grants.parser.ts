import type { NamedProficiencyGrant, ProficiencySource } from "@/shared/types/proficiency.types";
import { getChooseableMusicalInstruments } from "@/shared/data/chooseable-musical-instruments";
import {
  getChooseableArtisanTools,
  getChooseableMartialWeapons,
  getChooseableSimpleWeapons,
} from "@/shared/data/chooseable-tools-weapons";
import {
  canonicalizeWeaponProficiencyLabel,
  normalizeWeaponProficiencyKey,
} from "@/shared/utils/weapon-proficiency-name.utils";

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
  { re: /\bmartial\s+(?:ranged\s+|melee\s+)?weapons?\b/i, item: "Martial" },
  { re: /\bsimple\s+(?:ranged\s+|melee\s+)?weapons?\b/i, item: "Simple" },
  { re: /^martial$/i, item: "Martial" },
  { re: /^simple$/i, item: "Simple" },
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

const WORD_NUMBERS: Record<string, number> = {
  a: 1,
  an: 1,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
};

const CHOOSE_PROFICIENCY_OF_CHOICE_RE =
  /\b(?:proficiency|proficiencies|proficient)\s+(?:with|in)\s+(?:(?<countWord>a|an|one|two|three|four|five|\d+)\s+)?(?<target>[^.;]+?)\s+of your choice\b/gi;

function parseCountWord(raw: string | undefined, fallback = 1): number {
  if (!raw) return fallback;
  const lower = raw.trim().toLowerCase();
  if (/^\d+$/.test(lower)) return Math.max(1, Number(lower));
  return WORD_NUMBERS[lower] ?? fallback;
}

function pushAnyProficiencyGrant(
  grants: NamedProficiencyGrant[],
  count: number,
  label: string,
  source: ProficiencySource,
  options?: string[],
): void {
  if (count <= 0) return;
  grants.push({ kind: "any", count, label, options, source });
}

/** Parses "proficiency in two artisan's tools of your choice" style grants. */
export function parseChooseProficiencyGrantsFromText(
  text: string,
  source: ProficiencySource,
): {
  weaponGrants: NamedProficiencyGrant[];
  toolGrants: NamedProficiencyGrant[];
} {
  const weaponGrants: NamedProficiencyGrant[] = [];
  const toolGrants: NamedProficiencyGrant[] = [];
  if (!text.trim()) return { weaponGrants, toolGrants };

  CHOOSE_PROFICIENCY_OF_CHOICE_RE.lastIndex = 0;
  for (const match of text.matchAll(CHOOSE_PROFICIENCY_OF_CHOICE_RE)) {
    const groups = match.groups as { countWord?: string; target?: string } | undefined;
    const count = parseCountWord(groups?.countWord);
    const target = (groups?.target ?? "").trim().toLowerCase();
    if (!target) continue;

    if (
      /simple\s+or\s+martial\s+weapons?/.test(target) ||
      /martial\s+or\s+simple\s+weapons?/.test(target) ||
      /^(?:simple\s+or\s+martial\s+|martial\s+or\s+simple\s+)?weapons?$/.test(target)
    ) {
      pushAnyProficiencyGrant(
        weaponGrants,
        count,
        count > 1 ? "Weapons" : "Weapon",
        source,
        [...getChooseableSimpleWeapons(), ...getChooseableMartialWeapons()],
      );
      continue;
    }

    if (/artisan'?s?\s+tools?/.test(target)) {
      pushAnyProficiencyGrant(
        toolGrants,
        count,
        `Artisan's tool${count > 1 ? "s" : ""}`,
        source,
        [...getChooseableArtisanTools()],
      );
      continue;
    }
    if (/martial\s+weapons?/.test(target)) {
      pushAnyProficiencyGrant(
        weaponGrants,
        count,
        `Martial weapon${count > 1 ? "s" : ""}`,
        source,
        [...getChooseableMartialWeapons()],
      );
      continue;
    }
    if (/simple\s+weapons?/.test(target)) {
      pushAnyProficiencyGrant(
        weaponGrants,
        count,
        `Simple weapon${count > 1 ? "s" : ""}`,
        source,
        [...getChooseableSimpleWeapons()],
      );
      continue;
    }
    if (/musical\s+instruments?/.test(target)) {
      pushAnyProficiencyGrant(
        toolGrants,
        count,
        `Musical instrument${count > 1 ? "s" : ""}`,
        source,
        [...getChooseableMusicalInstruments()],
      );
    }
  }

  return { weaponGrants, toolGrants };
}

export function parseChooseProficiencyGrantsFromEntries(
  entries: string[],
  source: ProficiencySource,
): {
  weaponGrants: NamedProficiencyGrant[];
  toolGrants: NamedProficiencyGrant[];
} {
  return parseChooseProficiencyGrantsFromText(entries.join(" "), source);
}

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
    .map((part) => part.replace(/^(?:and|or)\s+/i, "").trim())
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

function isMartialFinesseOrLightClause(value: string): boolean {
  const lower = value.toLowerCase();
  return (
    lower.includes("martial") &&
    lower.includes("finesse") &&
    lower.includes("light")
  );
}

function knownWeaponNames(): readonly string[] {
  return [
    ...getChooseableSimpleWeapons(),
    ...getChooseableMartialWeapons(),
    "Firearms",
  ];
}

/** Maps "the longsword", "shortbows", or "firearms" onto a catalog proficiency label. */
function matchCatalogWeapon(raw: string): string | null {
  const stripped = raw.replace(/^(?:the|a|an)\s+/i, "").trim();
  if (!stripped) return null;
  const key = normalizeWeaponProficiencyKey(stripped);
  if (!key || key === "simple" || key === "martial" || key === "shield") return null;
  if (key === "firearm") return "Firearms";
  for (const name of knownWeaponNames()) {
    if (normalizeWeaponProficiencyKey(name) === key) return name;
  }
  return null;
}

function classifyTarget(
  target: string,
  result: TextProficiencyGrantItems,
): void {
  const normalized = stripProficiencyPrefix(target.trim());
  if (!normalized || CHOOSE_ONE_RE.test(normalized)) return;

  if (isMartialFinesseOrLightClause(normalized)) {
    uniquePush(result.weaponItems, normalized);
    return;
  }

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

  if (/\bfirearms?\b/i.test(normalized)) {
    uniquePush(result.weaponItems, "Firearms");
    return;
  }

  const namedWeapon = matchCatalogWeapon(normalized);
  if (namedWeapon) {
    uniquePush(result.weaponItems, namedWeapon);
    return;
  }

  if (/\b(?:artisan'?s?\s+tools?|gaming\s+set|musical\s+instrument|tool(?:s)?|kit|supplies|instruments?)\b/i.test(normalized)) {
    uniquePush(result.toolItems, normalized);
  }
}

const GAIN_NOUN_PROFICIENCY_RE =
  /\b(?:you\s+)?(?:also\s+)?gain\s+([^.;]*\bproficiency\b[^.;]*)/gi;

function stripProficiencyNoun(value: string): string {
  return value
    .replace(/^(?:proficiency|proficiencies)\s+(?:with|in)\s+/i, "")
    .replace(/\s+(?:proficiency|proficiencies)$/i, "")
    .trim();
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

  GAIN_NOUN_PROFICIENCY_RE.lastIndex = 0;
  while ((match = GAIN_NOUN_PROFICIENCY_RE.exec(text)) !== null) {
    const clause = match[1]?.trim() ?? "";
    if (!clause || CHOOSE_ONE_RE.test(clause)) continue;

    for (const target of splitProficiencyTargets(clause)) {
      const stripped = stripProficiencyNoun(target);
      if (!stripped) continue;
      classifyTarget(stripped, result);
    }
  }

  return result;
}

/** Paragraphs plus titled sections, in reading order. */
export function collectProficiencyEntryLines(
  paragraphs: readonly string[] | undefined,
  sections?: readonly { paragraphs?: readonly string[] }[],
): string[] {
  return [
    ...(paragraphs ?? []),
    ...(sections ?? []).flatMap((section) => section.paragraphs ?? []),
  ];
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
  const chooseGrants = parseChooseProficiencyGrantsFromEntries(entries, source);
  return {
    armorGrants: toFixedGrants(parsed.armorItems, source),
    weaponGrants: [
      ...toFixedGrants(parsed.weaponItems, source),
      ...chooseGrants.weaponGrants,
    ],
    toolGrants: [
      ...toFixedGrants(parsed.toolItems, source),
      ...chooseGrants.toolGrants,
    ],
  };
}
