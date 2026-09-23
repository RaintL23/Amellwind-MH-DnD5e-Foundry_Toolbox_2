/**
 * Shared Foundry core icon catalog + path resolution.
 *
 * Scans `FOUNDRY_PUBLIC/icons` (default Windows install path) so build scripts
 * and `validate-foundry-icons.mjs` can verify / remap `icons/...` references.
 */
import fs from "node:fs";
import path from "node:path";

const DEFAULT_FOUNDRY =
  process.platform === "win32"
    ? "C:/Program Files/Foundry Virtual Tabletop/resources/app/public"
    : "/usr/share/foundryvtt/resources/app/public";

export function resolveFoundryPublic(env = process.env) {
  return env.FOUNDRY_PUBLIC ?? DEFAULT_FOUNDRY;
}

export function resolveIconsDir(foundryPublic = resolveFoundryPublic()) {
  return path.join(foundryPublic, "icons");
}

/** List every `icons/...` file under a Foundry public/icons tree. */
export function listFoundryIcons(iconsDir) {
  const out = [];
  if (!fs.existsSync(iconsDir)) return out;

  const walk = (dir, prefix = "") => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full, rel);
      else if (/\.(?:webp|png|svg)$/i.test(entry.name)) {
        out.push(`icons/${rel.replace(/\\/g, "/")}`);
      }
    }
  };
  walk(iconsDir);
  return out;
}

function stripExt(s) {
  return s.replace(/\.(?:webp|png|svg)$/i, "");
}

function tokens(iconPath) {
  return stripExt(iconPath.replace(/^icons\//, ""))
    .toLowerCase()
    .split(/[/\-_]+/)
    .filter(Boolean);
}

function dirnameOf(iconPath) {
  const without = iconPath.replace(/^icons\//, "");
  const i = without.lastIndexOf("/");
  return i === -1 ? "" : without.slice(0, i);
}

function basenameOf(iconPath) {
  const without = iconPath.replace(/^icons\//, "");
  const i = without.lastIndexOf("/");
  return stripExt(i === -1 ? without : without.slice(i + 1)).toLowerCase();
}

/** Levenshtein distance for short basenames. */
function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const row = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 0; i < a.length; i += 1) {
    let prev = i;
    row[0] = i + 1;
    for (let j = 0; j < b.length; j += 1) {
      const cur = row[j + 1];
      const cost = a[i] === b[j] ? 0 : 1;
      row[j + 1] = Math.min(row[j + 1] + 1, row[j] + 1, prev + cost);
      prev = cur;
    }
  }
  return row[b.length];
}

const COLOR_TOKENS = new Set([
  "red",
  "blue",
  "green",
  "yellow",
  "orange",
  "purple",
  "pink",
  "teal",
  "cyan",
  "white",
  "black",
  "brown",
  "gray",
  "grey",
  "gold",
  "silver",
]);

/**
 * Score how well `candidate` matches a desired / missing icon path.
 * Higher is better. Prefers same folder, shared tokens, color agreement,
 * and similar basenames.
 */
export function scoreIconMatch(desired, candidate) {
  const aTokens = tokens(desired);
  const bTokens = tokens(candidate);
  const aBase = basenameOf(desired);
  const bBase = basenameOf(candidate);
  const aDir = dirnameOf(desired);
  const bDir = dirnameOf(candidate);

  let score = 0;

  // Shared path/filename tokens (length-weighted).
  for (const token of aTokens) {
    if (bTokens.includes(token)) score += 4 + Math.min(token.length, 8);
  }

  // Same directory is a strong signal.
  if (aDir && aDir === bDir) score += 40;
  else if (aDir && bDir.startsWith(aDir.split("/")[0])) score += 8;

  // Basename similarity (edit distance → 0..30).
  const maxLen = Math.max(aBase.length, bBase.length, 1);
  const dist = editDistance(aBase, bBase);
  score += Math.max(0, Math.round(30 * (1 - dist / maxLen)));

  // Exact basename (ignoring extension / path).
  if (aBase === bBase) score += 50;

  // Color agreement / mismatch.
  const aColors = aTokens.filter((t) => COLOR_TOKENS.has(t));
  const bColors = bTokens.filter((t) => COLOR_TOKENS.has(t));
  if (aColors.length && bColors.length) {
    const shared = aColors.filter((c) => bColors.includes(c));
    if (shared.length) score += 18 * shared.length;
    else score -= 12;
  }

  return score;
}

/**
 * Rank Foundry icons against a desired path or free-text query.
 * @returns {Array<{ candidate: string, score: number }>}
 */
export function suggestIcons(query, catalog, { limit = 5, minScore = 8 } = {}) {
  const desired = query.startsWith("icons/")
    ? query
    : `icons/${query.replace(/^\/+/, "")}`;
  // Free-text search: treat words as a synthetic path under icons/.
  const needle = /\s/.test(query.trim())
    ? `icons/${query.trim().toLowerCase().replace(/\s+/g, "-")}.webp`
    : desired;

  return catalog
    .map((candidate) => ({
      candidate,
      score: scoreIconMatch(needle, candidate),
    }))
    .filter(({ score }) => score >= minScore)
    .sort((a, b) => b.score - a.score || a.candidate.localeCompare(b.candidate))
    .slice(0, limit);
}

/**
 * Load catalog once. Returns `{ foundryPublic, iconsDir, catalog, iconSet }`.
 */
export function loadFoundryIconCatalog(env = process.env) {
  const foundryPublic = resolveFoundryPublic(env);
  const iconsDir = resolveIconsDir(foundryPublic);
  const catalog = listFoundryIcons(iconsDir);
  return {
    foundryPublic,
    iconsDir,
    catalog,
    iconSet: new Set(catalog),
  };
}

/**
 * If `desired` exists, return it. Otherwise return the best suggestion (or null).
 * Logs a warning when remapping.
 */
export function resolveFoundryIcon(desired, catalogOrOpts = {}) {
  const opts =
    Array.isArray(catalogOrOpts) || catalogOrOpts instanceof Set
      ? { catalog: catalogOrOpts }
      : catalogOrOpts;

  let catalog = opts.catalog;
  let iconSet = opts.iconSet;
  if (!catalog) {
    const loaded = loadFoundryIconCatalog(opts.env);
    catalog = loaded.catalog;
    iconSet = loaded.iconSet;
  } else if (!iconSet) {
    iconSet = catalog instanceof Set ? catalog : new Set(catalog);
    catalog = catalog instanceof Set ? [...catalog] : catalog;
  }

  const normalized = desired.replace(/\\/g, "/");
  if (iconSet.has(normalized)) {
    return { path: normalized, remapped: false, score: Infinity };
  }

  const suggestions = suggestIcons(normalized, catalog, {
    limit: opts.limit ?? 5,
    minScore: opts.minScore ?? 10,
  });
  const best = suggestions[0] ?? null;
  if (!best) {
    return { path: null, remapped: false, score: 0, suggestions: [] };
  }
  return {
    path: best.candidate,
    remapped: true,
    score: best.score,
    suggestions: suggestions.map((s) => s.candidate),
  };
}
