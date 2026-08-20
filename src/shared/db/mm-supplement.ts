/**
 * Overlay the local MHMM Patreon 2.0 archive onto the GitHub Monster Manual
 * feed. Local sheets win on normalized name; GitHub only fills names the PDF
 * does not have. Catalog lives in `public/data/mhmm-patreon-2.0/`.
 */

import { MM_PATREON_SUPPLEMENT_URL } from "@/shared/constants/api.constants";

const ROLE_WORDS = "juvenile|adolescent";

export interface MergeNamedFeedsResult {
  items: unknown[];
  /** GitHub names skipped because a local sheet already covers them. */
  unusedGithubNames: string[];
}

export interface MergeMonsterFeedsResult {
  monsters: unknown[];
  unusedGithubNames: string[];
}

export interface MmPatreonOverlay {
  monster: unknown[];
  condition: unknown[];
  disease: unknown[];
}

export function getRawMonsterName(raw: unknown): string {
  if (typeof raw !== "object" || raw === null) return "";
  const name = (raw as { name?: unknown }).name;
  return typeof name === "string" ? name : "";
}

/** Fold spelling variants so GitHub and PDF sheets collide on the same keys. */
export function normalizeMonsterName(name: string): string {
  let normalized = name.normalize("NFKD").toLowerCase();
  normalized = normalized.replace(/[''`´]/g, "");
  normalized = normalized.replace(/\(mhw\)/gi, " ");
  normalized = normalized.replace(/\bbloodsoaked\b/g, "blood soaked");
  normalized = normalized.replace(/\bsolider\b/g, "soldier");
  return normalized.replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

/** Keys that should collide with a GitHub entry (juvenile comma/order flips). */
export function monsterNameKeys(name: string): string[] {
  const normalized = normalizeMonsterName(name);
  if (!normalized) return [];
  const keys = new Set<string>([normalized]);
  const role = ROLE_WORDS;

  const comma = normalized.match(new RegExp(`^(.*), (${role})$`));
  if (comma) {
    keys.add(`${comma[2]} ${comma[1]}`);
    keys.add(`${comma[1]} ${comma[2]}`);
  }
  const leading = normalized.match(new RegExp(`^(${role}) (.*)$`));
  if (leading) {
    keys.add(`${leading[2]}, ${leading[1]}`);
    keys.add(`${leading[2]} ${leading[1]}`);
  }
  const trailing = normalized.match(new RegExp(`^(.*) (${role})$`));
  if (trailing && !comma) {
    keys.add(`${trailing[2]} ${trailing[1]}`);
    keys.add(`${trailing[1]}, ${trailing[2]}`);
  }
  return [...keys];
}

function nameKeySet(rawList: unknown[]): Set<string> {
  const keys = new Set<string>();
  for (const raw of rawList) {
    for (const key of monsterNameKeys(getRawMonsterName(raw))) {
      keys.add(key);
    }
  }
  return keys;
}

function isCoveredBy(name: string, keys: Set<string>): boolean {
  return monsterNameKeys(name).some((key) => keys.has(key));
}

/**
 * Local (Patreon PDF) entries come first. A GitHub entry is appended only when
 * none of its name keys match the local set (or `extraCoveredNames`).
 */
export function mergeNamedFeeds(
  github: unknown[],
  local: unknown[],
  extraCoveredNames: string[] = [],
): MergeNamedFeedsResult {
  const githubList = Array.isArray(github) ? github : [];
  const localList = Array.isArray(local) ? local : [];
  const localKeys = nameKeySet(localList);
  for (const name of extraCoveredNames) {
    for (const key of monsterNameKeys(name)) localKeys.add(key);
  }
  const unusedGithubNames: string[] = [];
  const extraGithub: unknown[] = [];

  for (const raw of githubList) {
    const name = getRawMonsterName(raw);
    if (!name) continue;
    if (isCoveredBy(name, localKeys)) {
      unusedGithubNames.push(name);
      continue;
    }
    extraGithub.push(raw);
  }

  return {
    items: [...localList, ...extraGithub],
    unusedGithubNames,
  };
}

export function mergeMonsterFeeds(
  github: unknown[],
  local: unknown[],
): MergeMonsterFeedsResult {
  const result = mergeNamedFeeds(github, local);
  return { monsters: result.items, unusedGithubNames: result.unusedGithubNames };
}

const EMPTY_OVERLAY: MmPatreonOverlay = {
  monster: [],
  condition: [],
  disease: [],
};

function asOverlay(json: unknown): MmPatreonOverlay {
  if (Array.isArray(json)) {
    return { monster: json, condition: [], disease: [] };
  }
  if (typeof json !== "object" || json === null) return EMPTY_OVERLAY;
  const raw = json as { monster?: unknown; condition?: unknown; disease?: unknown };
  return {
    monster: Array.isArray(raw.monster) ? raw.monster : [],
    condition: Array.isArray(raw.condition) ? raw.condition : [],
    disease: Array.isArray(raw.disease) ? raw.disease : [],
  };
}

let overlayCache: MmPatreonOverlay | null = null;
let overlayPromise: Promise<MmPatreonOverlay> | null = null;

async function fetchPatreonOverlay(): Promise<MmPatreonOverlay> {
  try {
    const response = await fetch(MM_PATREON_SUPPLEMENT_URL);
    if (!response.ok) return EMPTY_OVERLAY;
    return asOverlay(await response.json());
  } catch {
    return EMPTY_OVERLAY;
  }
}

/** Static overlay file. Cached for the page lifetime. */
export async function loadMmPatreonOverlay(): Promise<MmPatreonOverlay> {
  if (overlayCache) return overlayCache;
  if (!overlayPromise) {
    overlayPromise = fetchPatreonOverlay()
      .then((overlay) => {
        overlayCache = overlay;
        return overlay;
      })
      .finally(() => {
        overlayPromise = null;
      });
  }
  return overlayPromise;
}

export async function loadMmPatreonSupplement(): Promise<unknown[]> {
  return (await loadMmPatreonOverlay()).monster;
}

export function clearMmPatreonSupplementCache(): void {
  overlayCache = null;
  overlayPromise = null;
}
