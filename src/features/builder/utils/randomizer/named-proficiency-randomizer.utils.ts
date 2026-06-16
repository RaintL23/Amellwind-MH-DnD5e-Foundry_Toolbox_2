import type { NamedProficiencyGrant } from "@/shared/types/proficiency.types";
import { STANDARD_LANGUAGES } from "@/shared/data/chooseable-languages";
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
): string[] {
  const excluded = new Set([...exclude].map((item) => item.toLowerCase()));
  const choices: string[] = [];

  for (const grant of grants) {
    const pool =
      grant.kind === "choose" ? grant.from : poolForAnyGrant(grant);
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
): string[] {
  return pickAllNamedChoices(getPendingNamedChoiceGrants(grants), exclude);
}
