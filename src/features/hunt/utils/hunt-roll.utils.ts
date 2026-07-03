import type { Environment, Monster } from "@/shared/types";
import { rollDie } from "@/features/environments/utils/environmentRoll.utils";
import {
  getTagsForEnvironment,
  HUNT_ENVIRONMENT_MAPPINGS,
} from "../data/hunt-env-mapping.data";
import type { HuntPrepEntry } from "../data/hunt-prep-defaults.data";

export type HuntTrackingEvent =
  | "major-challenge"
  | "minor-challenge"
  | "sign-minor-challenge"
  | "sign"
  | "signs-benefit";

export interface FindingSignsResult {
  dieSides: 20 | 10;
  rawRoll: number;
  flatBonus: number;
  adjustedRoll: number;
  signs: number;
  event: HuntTrackingEvent;
  label: string;
  description: string;
}

export function pickRandom<T>(items: readonly T[]): T | null {
  if (items.length === 0) return null;
  return items[Math.floor(Math.random() * items.length)] ?? null;
}

export function interpretFindingSignsRoll(roll: number): Omit<
  FindingSignsResult,
  "dieSides" | "rawRoll" | "flatBonus" | "adjustedRoll"
> {
  if (roll === 1) {
    return {
      signs: 0,
      event: "major-challenge",
      label: "Major Challenge",
      description: "A major challenge occurs in this area.",
    };
  }
  if (roll >= 2 && roll <= 9) {
    return {
      signs: 0,
      event: "minor-challenge",
      label: "Minor Challenge",
      description: "A minor challenge occurs in this area.",
    };
  }
  if (roll >= 10 && roll <= 17) {
    return {
      signs: 1,
      event: "sign-minor-challenge",
      label: "1 Sign + Minor Challenge",
      description: "The party finds 1 sign and faces a minor challenge.",
    };
  }
  if (roll >= 18 && roll <= 19) {
    return {
      signs: 1,
      event: "sign",
      label: "1 Sign",
      description: "The party finds 1 sign of the prey.",
    };
  }
  return {
    signs: 2,
    event: "signs-benefit",
    label: "2 Signs + Benefit",
    description: "The party finds 2 signs and gains a benefit.",
  };
}

export function rollFindingSigns(
  survivalSucceeded: boolean,
  flatBonus = 0,
): FindingSignsResult {
  const dieSides: 20 | 10 = survivalSucceeded ? 20 : 10;
  const rawRoll = rollDie(dieSides);
  const adjustedRoll = Math.min(
    dieSides,
    Math.max(1, rawRoll + flatBonus),
  );
  const interpretation = interpretFindingSignsRoll(adjustedRoll);

  return {
    dieSides,
    rawRoll,
    flatBonus,
    adjustedRoll,
    ...interpretation,
  };
}

export function getCompatibleEnvironments(
  monster: Monster | null,
  environments: Environment[],
): Environment[] {
  if (!monster?.environment?.length) return environments;

  const monsterTags = new Set(monster.environment);
  const compatible = environments.filter((env) => {
    const tags = getTagsForEnvironment(env.name);
    return tags.some((tag) => monsterTags.has(tag));
  });

  return compatible.length > 0 ? compatible : environments;
}

export function getCompatibleMonsters(
  environment: Environment | null,
  monsters: Monster[],
): Monster[] {
  if (!environment) return monsters;

  const tags = getTagsForEnvironment(environment.name);
  if (tags.length === 0) return monsters;

  const tagSet = new Set(tags);
  const compatible = monsters.filter((monster) =>
    monster.environment?.some((tag) => tagSet.has(tag)),
  );

  return compatible.length > 0 ? compatible : monsters;
}

export function environmentMatchesMonster(
  environment: Environment,
  monster: Monster,
): boolean {
  if (!monster.environment?.length) return true;
  const tags = getTagsForEnvironment(environment.name);
  if (tags.length === 0) return true;
  return monster.environment.some((tag) => tags.includes(tag));
}

export function getEnvironmentTagsLabel(envName: string): string {
  const tags = getTagsForEnvironment(envName);
  if (tags.length === 0) return "No mapped tags";
  return tags.join(", ");
}

export function listAllMappedEnvironmentNames(): string[] {
  return HUNT_ENVIRONMENT_MAPPINGS.map((mapping) => mapping.envName);
}

export function pickPrepEntries(
  entries: HuntPrepEntry[],
  count: number,
): string[] {
  if (entries.length === 0 || count <= 0) return [];
  const results: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const picked = pickRandom(entries);
    if (picked?.text) results.push(picked.text);
  }
  return results;
}

export function pickPrepEntry(entries: HuntPrepEntry[]): string | null {
  return pickRandom(entries)?.text ?? null;
}

export interface ResolvedTrackingOutcome {
  signs: string[];
  minorChallenges: string[];
  majorChallenges: string[];
  benefits: string[];
}

export function resolveTrackingOutcome(
  event: HuntTrackingEvent,
  signCount: number,
  prep: {
    signs: HuntPrepEntry[];
    minorChallenges: HuntPrepEntry[];
    majorChallenges: HuntPrepEntry[];
    benefits: HuntPrepEntry[];
  },
): ResolvedTrackingOutcome {
  const resolved: ResolvedTrackingOutcome = {
    signs: [],
    minorChallenges: [],
    majorChallenges: [],
    benefits: [],
  };

  if (signCount > 0) {
    resolved.signs = pickPrepEntries(prep.signs, signCount);
  }

  switch (event) {
    case "major-challenge": {
      const entry = pickPrepEntry(prep.majorChallenges);
      if (entry) resolved.majorChallenges.push(entry);
      break;
    }
    case "minor-challenge": {
      const entry = pickPrepEntry(prep.minorChallenges);
      if (entry) resolved.minorChallenges.push(entry);
      break;
    }
    case "sign-minor-challenge": {
      const entry = pickPrepEntry(prep.minorChallenges);
      if (entry) resolved.minorChallenges.push(entry);
      break;
    }
    case "signs-benefit": {
      const entry = pickPrepEntry(prep.benefits);
      if (entry) resolved.benefits.push(entry);
      break;
    }
    default:
      break;
  }

  return resolved;
}

export function formatResolvedTrackingOutcome(
  resolved: ResolvedTrackingOutcome,
): string {
  const parts: string[] = [];

  if (resolved.signs.length > 0) {
    parts.push(`Signs: ${resolved.signs.join("; ")}`);
  }
  if (resolved.minorChallenges.length > 0) {
    parts.push(`Minor challenge: ${resolved.minorChallenges.join("; ")}`);
  }
  if (resolved.majorChallenges.length > 0) {
    parts.push(`Major challenge: ${resolved.majorChallenges.join("; ")}`);
  }
  if (resolved.benefits.length > 0) {
    parts.push(`Benefit: ${resolved.benefits.join("; ")}`);
  }

  return parts.length > 0 ? parts.join(" · ") : "";
}
