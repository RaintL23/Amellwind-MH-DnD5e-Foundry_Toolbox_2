import type { NamedProficiencyGrant, ProficiencySourceType } from "@/shared/types/proficiency.types";
import {
  getChooseableLanguages,
  STANDARD_LANGUAGES,
} from "@/shared/data/chooseable-languages";
import { getChooseableMusicalInstruments } from "@/shared/data/chooseable-musical-instruments";
import {
  getPendingNamedChoiceGrants,
  resolveFixedNamedGrants,
} from "@/shared/utils/named-proficiency.parser";
import { shuffle } from "./character-randomizer.utils";

type PendingNamedGrant = ReturnType<typeof getPendingNamedChoiceGrants>[number];

const COMMON_ARTISAN_TOOLS = [
  "Carpenter's Tools",
  "Smith's Tools",
  "Thieves' Tools",
  "Herbalism Kit",
  "Cook's Utensils",
];

const COMMON_GAMING_SETS = [
  "Dice Set",
  "Playing Cards",
  "Dragonchess Set",
  "Three-Dragon Ante Set",
];

const FALLBACK_MUSICAL_INSTRUMENTS = ["Lute", "Flute", "Drum"];

function poolForAnyGrant(
  grant: Extract<NamedProficiencyGrant, { kind: "any" }>,
): string[] {
  if (grant.options?.length) return [...grant.options];

  const label = grant.label.toLowerCase();
  if (label.includes("language")) return [...STANDARD_LANGUAGES];
  if (label.includes("musical")) {
    const loaded = getChooseableMusicalInstruments();
    return loaded.length > 0 ? [...loaded] : FALLBACK_MUSICAL_INSTRUMENTS;
  }
  if (label.includes("gaming")) return COMMON_GAMING_SETS;
  if (label.includes("artisan") || label.includes("tool")) {
    return COMMON_ARTISAN_TOOLS;
  }
  return COMMON_ARTISAN_TOOLS;
}

function isLanguageGrant(grant: PendingNamedGrant): boolean {
  if (grant.kind === "any") {
    return grant.label.toLowerCase().includes("language");
  }

  const knownLanguages = new Set(
    [...getChooseableLanguages(), ...STANDARD_LANGUAGES].map((name) =>
      name.toLowerCase(),
    ),
  );

  return (
    grant.from.length > 0 &&
    grant.from.every((item) => knownLanguages.has(item.toLowerCase()))
  );
}

function filterToLanguagePool(
  pool: string[],
  languagePool: readonly string[],
): string[] {
  const allowed = new Map(
    languagePool.map((name) => [name.toLowerCase(), name]),
  );
  return pool
    .filter((item) => allowed.has(item.toLowerCase()))
    .map((item) => allowed.get(item.toLowerCase())!);
}

function resolvePoolForGrant(
  grant: PendingNamedGrant,
  languagePool?: readonly string[],
): string[] {
  const basePool =
    grant.kind === "choose" ? grant.from : poolForAnyGrant(grant);

  if (!languagePool?.length || !isLanguageGrant(grant)) {
    return basePool;
  }

  const filtered = filterToLanguagePool(basePool, languagePool);
  return filtered.length > 0 ? filtered : [...languagePool];
}

export function collectResolvedNamedItems(
  grants: NamedProficiencyGrant[],
  choices: string[],
): Set<string> {
  const items = new Set<string>();
  for (const { item } of resolveFixedNamedGrants(grants)) {
    items.add(item.toLowerCase());
  }
  for (const choice of choices) {
    items.add(choice.toLowerCase());
  }
  return items;
}

export function pickAllNamedChoices(
  grants: PendingNamedGrant[],
  exclude: Set<string> = new Set(),
  languagePool?: readonly string[],
): string[] {
  const excluded = new Set([...exclude].map((item) => item.toLowerCase()));
  const choices: string[] = [];

  for (const grant of grants) {
    const pool = resolvePoolForGrant(grant, languagePool);
    const available = shuffle(
      pool.filter((item) => !excluded.has(item.toLowerCase())),
    );
    const picked = available.slice(0, grant.count);

    for (const item of picked) {
      choices.push(item);
      excluded.add(item.toLowerCase());
    }
  }

  return choices;
}

export function pickNamedChoicesFromGrants(
  grants: NamedProficiencyGrant[],
  exclude: Set<string> = new Set(),
  languagePool?: readonly string[],
): string[] {
  return pickAllNamedChoices(
    getPendingNamedChoiceGrants(grants),
    exclude,
    languagePool,
  );
}

export function pickIndexedNamedChoicesForSource(
  grants: NamedProficiencyGrant[],
  sourceType: ProficiencySourceType,
  exclude: Set<string> = new Set(),
  languagePool?: readonly string[],
): Record<number, string[]> {
  const excluded = new Set([...exclude].map((item) => item.toLowerCase()));
  const result: Record<number, string[]> = {};
  let grantIndex = 0;

  for (const grant of grants) {
    if (grant.source.type !== sourceType) continue;
    if (grant.kind !== "choose" && grant.kind !== "any") continue;

    const picked = pickAllNamedChoices(
      [grant],
      excluded,
      languagePool,
    );
    if (picked.length > 0) {
      result[grantIndex] = picked;
      grantIndex += 1;
      for (const item of picked) {
        excluded.add(item.toLowerCase());
      }
    }
  }

  return result;
}
