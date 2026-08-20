/**
 * Resolve Monster Hunter token art from `mh-tokens.manifest.json`.
 *
 * Lookup order: exact name / aliases / slugs, then drop prefix or suffix
 * words and retry against the original monster (Tempered Dire Miralis →
 * Dire Miralis). Variants reuse the original token file instead of duplicating art.
 */
import manifest from "@/shared/data/mh-tokens.manifest.json";

export interface MhTokenEntry {
  path: string;
  source: string;
  names: string[];
}

export interface MhTokenManifest {
  version: number;
  generatedAt: string;
  count: number;
  tokens: Record<string, MhTokenEntry>;
  byName: Record<string, string>;
}

const MH_TOKEN_MANIFEST = manifest as MhTokenManifest;

/** Manual aliases where the Monster Manual name differs from the token filename. */
const TOKEN_NAME_ALIASES: Record<string, string> = {
  "shogun ceanataur": "shogunceantaur",
  "shogun ceantaur": "shogunceantaur",
  "pink rathian": "pinkrathian",
  "xeno'jiiva": "xenojiiva",
  "xeno jiiva": "xenojiiva",
  "great izuchi": "great-izuchi-token",
  "izuchi": "izuchi-token",
};

/** Split embedded camelCase/PascalCase so `PinkRathian` matches `pink rathian`. */
function splitEmbeddedCaps(name: string): string {
  return name
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
}

/** Normalize a monster or token label for manifest lookup. */
export function normalizeMhTokenLookupKey(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/\s*\([^)]*\)/g, "")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\s*(\d+(?:\.\d+)?)\s*$/g, " $1")
    .trim();
}

function lookupKeysForName(name: string): string[] {
  const trimmed = name.trim();
  const variants = [
    trimmed,
    splitEmbeddedCaps(trimmed),
  ];

  const keys = new Set<string>();
  for (const variant of variants) {
    const normalized = normalizeMhTokenLookupKey(variant);
    if (!normalized) continue;
    keys.add(normalized);
    keys.add(normalized.replace(/\s+/g, ""));
    keys.add(normalized.replace(/\s+/g, "-"));
    const alias = TOKEN_NAME_ALIASES[normalized];
    if (alias) keys.add(alias);
  }
  return [...keys];
}

function pathForKeys(keys: string[]): string | undefined {
  for (const key of keys) {
    const slug = MH_TOKEN_MANIFEST.byName[key] ?? key;
    const path = MH_TOKEN_MANIFEST.tokens[slug]?.path;
    if (path) return path;
  }
  return undefined;
}

/**
 * Resolve an app-relative token path (`/mh-tokens/...`) for a monster name.
 * Returns undefined when no curated token exists.
 */
export function resolveMhTokenPath(name: string): string | undefined {
  const direct = pathForKeys(lookupKeysForName(name));
  if (direct) return direct;

  const words = normalizeMhTokenLookupKey(name).split(" ").filter(Boolean);
  if (words.length < 2) return undefined;

  for (let drop = 1; drop < words.length; drop++) {
    const withoutPrefix = words.slice(drop).join(" ");
    const prefixHit = pathForKeys(lookupKeysForName(withoutPrefix));
    if (prefixHit) return prefixHit;

    const withoutSuffix = words.slice(0, words.length - drop).join(" ");
    const suffixHit = pathForKeys(lookupKeysForName(withoutSuffix));
    if (suffixHit) return suffixHit;
  }

  return undefined;
}

/** Map an app-relative token path to a Foundry module asset path. */
export function toFoundryMhTokenPath(appPath: string): string {
  const trimmed = appPath.trim();
  if (!trimmed) return trimmed;

  const filename = trimmed.replace(/^\/mh-tokens\//, "").replace(/^mh-tokens\//, "");
  return `mh-tokens/${filename}`;
}

export { MH_TOKEN_MANIFEST };
