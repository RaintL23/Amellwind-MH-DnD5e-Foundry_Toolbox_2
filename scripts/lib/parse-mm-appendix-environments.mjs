/**
 * Parse MHMM Appendix A ("Monster by Environment") into 5etools-style
 * environment tags keyed by normalized monster name.
 *
 * Source: public/data/mhmm-patreon-2.0/22-appendices.md
 */

/** Biome table labels → environment tags stored on monsters. */
export const APPENDIX_BIOME_TAGS = {
  arctic: "arctic",
  coastal: "coastal",
  desert: "desert",
  forest: "forest",
  grassland: "grassland",
  hill: "hill",
  mountain: "mountain",
  swamp: "swamp",
  underdark: "underdark",
  urban: "urban",
  volcano: "volcano",
  /** Expanded to every standard tag when resolving (wide-ranging quarry). */
  roaming: "roaming",
};

export const STANDARD_ENVIRONMENT_TAGS = Object.values(APPENDIX_BIOME_TAGS).filter(
  (tag) => tag !== "roaming",
);

/**
 * Appendix name variants → catalog normalized keys.
 * Keys and values are produced with {@link normalizeAppendixMonsterName}.
 */
export const APPENDIX_NAME_ALIASES = {
  wingdrakes: "wingdrake",
  "young arzuros": "arzuros cub",
  "shara ishvalda true form": "shara ishvalda",
};

export function normalizeAppendixMonsterName(name) {
  let normalized = String(name ?? "")
    .normalize("NFKD")
    .toLowerCase();
  normalized = normalized.replace(/[''`´]/g, "");
  normalized = normalized.replace(/\(mhw\)/gi, " ");
  normalized = normalized.replace(/\bbloodsoaked\b/g, "blood soaked");
  normalized = normalized.replace(/\bsolider\b/g, "soldier");
  return normalized.replace(/[^a-z0-9]+/g, " ").trim().replace(/\s+/g, " ");
}

function isNoiseName(name) {
  if (!name) return true;
  if (/^monster name cr$/i.test(name)) return true;
  return /^(arctic|coastal|desert|forest|grassland|hill|mountain|swamp|underdark|urban|volcano|roaming)$/i.test(
    name,
  );
}

/**
 * @param {string} markdown full 22-appendices.md (or Appendix A excerpt)
 * @returns {Map<string, string[]>} normalized name → sorted unique tags
 */
export function parseAppendixEnvironments(markdown) {
  const start = markdown.search(/^## Appendix A:/m);
  const end = markdown.search(/^## Monster by Challenge Rating/m);
  const section = markdown.slice(
    start >= 0 ? start : 0,
    end >= 0 ? end : undefined,
  );

  /** @type {Map<string, Set<string>>} */
  const byNorm = new Map();
  let currentBiome = null;
  let nameBuf = "";

  const addNames = (rawList, biome) => {
    const tag = APPENDIX_BIOME_TAGS[biome];
    if (!tag) return;
    for (const raw of rawList.split(",")) {
      let name = raw.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
      name = name.replace(/^[,.\s]+|[,.\s]+$/g, "");
      if (isNoiseName(name)) continue;
      let norm = normalizeAppendixMonsterName(name);
      if (!norm) continue;
      norm = APPENDIX_NAME_ALIASES[norm] ?? norm;
      if (!byNorm.has(norm)) byNorm.set(norm, new Set());
      byNorm.get(norm).add(tag);
    }
  };

  const flush = () => {
    const text = nameBuf.replace(/\*\*/g, "").replace(/\s+/g, " ").trim();
    nameBuf = "";
    if (!text || !currentBiome) return;
    addNames(text, currentBiome);
  };

  const appendNameChunk = (chunk) => {
    if (!chunk) return;
    if (nameBuf && /-$/.test(nameBuf.trim())) {
      nameBuf = nameBuf.trim() + chunk;
    } else {
      nameBuf = nameBuf ? `${nameBuf} ${chunk}` : chunk;
    }
  };

  for (const line of section.split(/\r?\n/)) {
    const h2 = line.match(/^##\s+([A-Za-z]+) Monsters\s*$/i);
    const bold = line.match(/^\*\*([A-Za-z]+) Monsters\*\*\s*$/i);
    const tableHdr = line.match(/^([A-Za-z]+) Monster Name CR \(XP\)\s*$/i);
    if (h2 || bold || tableHdr) {
      flush();
      const biome = (h2 || bold || tableHdr)[1].toLowerCase();
      if (biome in APPENDIX_BIOME_TAGS) currentBiome = biome;
      continue;
    }
    if (!currentBiome) continue;

    let rest = line.replace(/\*\*/g, "");
    if (/^\s*(\d+\/\d+|\d+)\s*\([^)]*\)\s*$/.test(rest)) {
      flush();
      continue;
    }

    const withCr = rest.match(/^(.*?)\s+(\d+\/\d+|\d+)\s*\([^)]*\)\s*$/);
    if (withCr) {
      appendNameChunk(withCr[1].trim());
      flush();
      continue;
    }

    const trimmed = rest.trim();
    if (!trimmed) continue;
    appendNameChunk(trimmed);
  }
  flush();

  /** @type {Map<string, string[]>} */
  const resolved = new Map();
  for (const [norm, tags] of byNorm) {
    const expanded = new Set();
    for (const tag of tags) {
      if (tag === "roaming") {
        for (const std of STANDARD_ENVIRONMENT_TAGS) expanded.add(std);
      } else {
        expanded.add(tag);
      }
    }
    resolved.set(norm, [...expanded].sort());
  }
  return resolved;
}

/**
 * Look up environment tags for a catalog/supplement monster name.
 * @param {Map<string, string[]>} envByNorm
 * @param {string} monsterName
 * @returns {string[] | undefined}
 */
export function getAppendixEnvironmentsForName(envByNorm, monsterName) {
  const norm = normalizeAppendixMonsterName(monsterName);
  const tags = envByNorm.get(norm);
  return tags && tags.length > 0 ? tags : undefined;
}
