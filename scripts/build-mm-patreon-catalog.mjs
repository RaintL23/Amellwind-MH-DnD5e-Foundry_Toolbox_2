/**
 * Rebuild MHMM Patreon archive JSON from organized monster markdown sheets.
 *
 * Source of truth: `public/data/mhmm-patreon-2.0/monsters/<family>/<slug>.md`
 * Outputs: `catalog.json`, `runes.json`
 *
 * Usage:
 *   node scripts/build-mm-patreon-catalog.mjs
 *   node scripts/build-mm-patreon-catalog.mjs --file monsters/flying-wyverns/bazelgeuse.md
 *
 * Full pipeline (catalog + runtime overlay): pnpm build:mm-data
 */
import {
  readFileSync,
  writeFileSync,
  readdirSync,
  statSync,
  existsSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const STAGING_DIR = path.join(ROOT, "public/data/mhmm-patreon-2.0");
const MONSTERS_DIR = path.join(STAGING_DIR, "monsters");
const SOURCE = "MHMM-Patreon-2.0";

const SECTION_KEYS = {
  traits: "traits",
  actions: "actions",
  "bonus actions": "bonusActions",
  reactions: "reactions",
  "legendary actions": "legendaryActions",
  "mythic actions": "mythicActions",
};

const STAT_BLOCK_FIELDS = {
  "saving throws": "savingThrows",
  skills: "skills",
  "damage resistances": "damageResistances",
  "damage immunities": "damageImmunities",
  "damage vulnerabilities": "damageVulnerabilities",
  "condition immunities": "conditionImmunities",
  senses: "senses",
  languages: "languages",
  "proficiency bonus": "proficiencyBonus",
};

function parseArgs(argv) {
  const fileIdx = argv.indexOf("--file");
  if (fileIdx === -1) return { fileFilter: null };
  const fileFilter = argv[fileIdx + 1];
  if (!fileFilter) {
    console.error("Missing value for --file");
    process.exit(1);
  }
  return { fileFilter: fileFilter.replace(/^\//, "") };
}

function walkMarkdownFiles(dir, base = dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkMarkdownFiles(full, base));
    } else if (entry.endsWith(".md")) {
      out.push(path.relative(base, full).split(path.sep).join("/"));
    }
  }
  return out;
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!match) return { meta: {}, body: raw };
  const meta = {};
  for (const line of match[1].split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (value === "true") meta[key] = true;
    else if (value === "false") meta[key] = false;
    else if (/^-?\d+$/.test(value)) meta[key] = Number(value);
    else meta[key] = value;
  }
  return { meta, body: raw.slice(match[0].length) };
}

function parseSpeed(speedStr) {
  if (!speedStr || typeof speedStr !== "string") return undefined;
  const out = {};
  for (const chunk of speedStr.split(",")) {
    const part = chunk.trim();
    const withMode = part.match(/^(\w[\w ]*?)\s+(\d+)\s*ft\.?$/i);
    if (withMode) {
      const mode = withMode[1].trim().toLowerCase().replace(/\s+/g, "_");
      out[mode] = Number(withMode[2]);
      continue;
    }
    const walkOnly = part.match(/^(\d+)\s*ft\.?$/i);
    if (walkOnly) out.walk = Number(walkOnly[1]);
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseCr(cr) {
  const text = String(cr ?? "0").trim();
  if (text.includes("/")) {
    const [num, den] = text.split("/").map(Number);
    return num / den;
  }
  return Number(text);
}

function crToTier(cr) {
  const n = parseCr(cr);
  if (n <= 4) return 1;
  if (n <= 10) return 2;
  if (n <= 16) return 3;
  return 4;
}

function formatCrDisplay(cr) {
  return String(cr ?? "0");
}

function getCrValues(cr) {
  if (cr == null || cr === "") return ["0"];
  return [String(cr)];
}

function splitSections(body) {
  const sections = new Map();
  const parts = body.split(/^## /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim().toLowerCase();
    const content = (nl === -1 ? "" : part.slice(nl + 1)).trim();
    sections.set(heading, content);
  }
  return sections;
}

function parseBio(content) {
  if (!content) return undefined;
  const paragraphs = content
    .split(/\n\n+/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return paragraphs.length > 0 ? paragraphs : undefined;
}

function parseNamedEntries(content) {
  if (!content) return undefined;
  const entries = [];
  const chunks = content.split(/^### /m).slice(1);
  for (const chunk of chunks) {
    const nl = chunk.indexOf("\n");
    const name = (nl === -1 ? chunk : chunk.slice(0, nl)).trim();
    const text = (nl === -1 ? "" : chunk.slice(nl + 1)).trim();
    if (!name) continue;
    entries.push({ name, text: text.replace(/\s+/g, " ").trim() });
  }
  return entries.length > 0 ? entries : undefined;
}

function parseStatBlockBullets(content) {
  const out = {};
  if (!content) return out;
  for (const line of content.split("\n")) {
    const match = line.match(/^- \*\*([^*]+):\*\*\s*(.+)$/);
    if (!match) continue;
    const key = STAT_BLOCK_FIELDS[match[1].trim().toLowerCase()];
    if (key) out[key] = match[2].trim();
  }
  return out;
}

function parseLootTable(content) {
  const rows = [];
  const lines = content.split("\n");
  let inTable = false;
  for (const line of lines) {
    if (!line.trim().startsWith("|")) continue;
    if (/^\|\s*---/.test(line)) {
      inTable = true;
      continue;
    }
    if (!inTable) continue;
    const cells = line
      .split("|")
      .slice(1, -1)
      .map((c) => c.trim());
    if (cells.length < 4) continue;
    const [carveChance, captureChance, name, slotsRaw] = cells;
    if (!name || /^material$/i.test(name)) continue;
    const slots = slotsRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    rows.push({ carveChance, captureChance, name, slots });
  }
  return rows.length > 0 ? rows : undefined;
}

function parseLootRolls(content, fallback) {
  const match = content?.match(/\*\*Carves\/Capture rolls:\*\*\s*(\d+)/i);
  if (match) return Number(match[1]);
  return typeof fallback === "number" ? fallback : undefined;
}

function parseMaterialBullets(block) {
  const out = {
    slots: [],
    carveChance: undefined,
    captureChance: undefined,
    armorEffect: null,
    weaponEffect: null,
    otherEffect: null,
  };
  const fields = [
    ...block.matchAll(
      /^- \*\*([^*]+):\*\*\s*([\s\S]*?)(?=^- \*\*|\s*$)/gim,
    ),
  ];
  for (const match of fields) {
    const label = match[1].trim().toLowerCase();
    const value = match[2].replace(/\s+/g, " ").trim();
    if (label === "slots") {
      out.slots = value
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    } else if (label === "carve") out.carveChance = value || "—";
    else if (label === "capture") out.captureChance = value || "—";
    else if (label === "armor effect") out.armorEffect = value || null;
    else if (label === "weapon effect") out.weaponEffect = value || null;
    else if (label === "other effect") out.otherEffect = value || null;
  }
  return out;
}

function parseMaterials(content) {
  if (!content) return undefined;
  const materials = [];
  const chunks = content.split(/^### /m).slice(1);
  for (const chunk of chunks) {
    const nl = chunk.indexOf("\n");
    const name = (nl === -1 ? chunk : chunk.slice(0, nl)).trim();
    const body = (nl === -1 ? "" : chunk.slice(nl + 1)).trim();
    if (!name) continue;
    const parsed = parseMaterialBullets(body);
    materials.push({
      name,
      carveChance: parsed.carveChance ?? "—",
      captureChance: parsed.captureChance ?? "—",
      slots: parsed.slots,
      armorEffect: parsed.armorEffect,
      weaponEffect: parsed.weaponEffect,
      otherEffect: parsed.otherEffect,
    });
  }
  return materials.length > 0 ? materials : undefined;
}

function splitRuneSlots(slots) {
  const aw = slots.filter((s) => s === "A" || s === "W");
  const other = slots.filter((s) => s === "O");
  return {
    slots: aw,
    otherSlots: other.length > 0 ? other : null,
  };
}

function buildMonsterFromMarkdown(relativeFile, content) {
  const { meta, body } = parseFrontmatter(content);
  const sections = splitSections(body);
  const statBlock = parseStatBlockBullets(sections.get("stat block"));
  const lootSection = sections.get("loot") ?? "";
  const lootRolls = parseLootRolls(lootSection, meta.lootRolls);
  const loot = parseLootTable(lootSection);
  const materials = parseMaterials(sections.get("materials (runes)"));

  const familySlug = relativeFile.split("/")[1] ?? "";
  const abilities = {
    str: Number(meta.str),
    dex: Number(meta.dex),
    con: Number(meta.con),
    int: Number(meta.int),
    wis: Number(meta.wis),
    cha: Number(meta.cha),
  };

  const monster = {
    name: String(meta.name ?? ""),
    slug: String(meta.slug ?? ""),
    group: String(meta.group ?? ""),
    cr: String(meta.cr ?? ""),
    pdfPage: typeof meta.pdfPage === "number" ? meta.pdfPage : undefined,
    inGithubJson: Boolean(meta.inGithubJson),
    source: String(meta.source ?? SOURCE),
    size: String(meta.size ?? ""),
    creatureType: String(meta.creatureType ?? ""),
    alignment: String(meta.alignment ?? ""),
    abilities,
    ac: meta.ac
      ? {
          ac: Number(meta.ac),
          from: meta.acFrom
            ? String(meta.acFrom)
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : undefined,
        }
      : undefined,
    hp:
      meta.hp != null
        ? {
            average: Number(meta.hp),
            formula: String(meta.hpFormula ?? ""),
          }
        : undefined,
    speed: parseSpeed(meta.speed),
    bio: parseBio(sections.get("bio")),
    lootRolls,
    loot,
    materials,
    familySlug,
    file: `monsters/${relativeFile}`,
  };

  for (const [heading, key] of Object.entries(SECTION_KEYS)) {
    const entries = parseNamedEntries(sections.get(heading));
    if (entries) monster[key] = entries;
  }

  for (const [field, value] of Object.entries(statBlock)) {
    if (value) monster[field] = value;
  }

  return Object.fromEntries(
    Object.entries(monster).filter(([, value]) => value !== undefined),
  );
}

function buildRuneRows(monster, relativeFile) {
  const materials = Array.isArray(monster.materials) ? monster.materials : [];
  const tier = crToTier(monster.cr);
  const monsterCr = formatCrDisplay(monster.cr);
  const monsterCrs = getCrValues(monster.cr);
  const rolls = Number(monster.lootRolls) || 0;

  return materials.map((material) => {
    const slotSplit = splitRuneSlots(
      Array.isArray(material.slots) ? material.slots : [],
    );
    return {
      name: material.name,
      monsterName: monster.name,
      monsterSource: monster.source,
      monsterCr,
      monsterCrs,
      tier,
      carveChance: material.carveChance ?? "—",
      captureChance: material.captureChance ?? "—",
      rolls,
      slots: slotSplit.slots,
      otherSlots: slotSplit.otherSlots,
      armorEffect: material.armorEffect ?? null,
      weaponEffect: material.weaponEffect ?? null,
      otherEffect: material.otherEffect ?? null,
      inGithubJson: Boolean(monster.inGithubJson),
      file: `monsters/${relativeFile}`,
    };
  });
}

function loadExistingCatalogOrder() {
  const catalogPath = path.join(STAGING_DIR, "catalog.json");
  if (!existsSync(catalogPath)) return [];
  try {
    const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));
    return Array.isArray(catalog.monsters)
      ? catalog.monsters.map((m) => m?.file).filter(Boolean)
      : [];
  } catch {
    return [];
  }
}

function orderMonsters(monstersByFile, existingOrder) {
  const ordered = [];
  const seen = new Set();

  for (const file of existingOrder) {
    const monster = monstersByFile.get(file);
    if (monster) {
      ordered.push(monster);
      seen.add(file);
    }
  }

  const remaining = [...monstersByFile.entries()]
    .filter(([file]) => !seen.has(file))
    .sort(([a], [b]) => a.localeCompare(b));
  for (const [, monster] of remaining) ordered.push(monster);

  return ordered;
}

function main() {
  const { fileFilter } = parseArgs(process.argv.slice(2));
  const allFiles = walkMarkdownFiles(MONSTERS_DIR).sort();
  const targetFiles = fileFilter
    ? allFiles.filter((f) => f === fileFilter || `monsters/${f}` === fileFilter)
    : allFiles;

  if (fileFilter && targetFiles.length === 0) {
    console.error(`No monster sheet found for --file ${fileFilter}`);
    process.exit(1);
  }

  const parsedByFile = new Map();
  for (const relativeFile of targetFiles) {
    const fullPath = path.join(MONSTERS_DIR, relativeFile);
    const content = readFileSync(fullPath, "utf8");
    const monster = buildMonsterFromMarkdown(relativeFile, content);
    parsedByFile.set(`monsters/${relativeFile}`, monster);
  }

  let monsters;
  let runes;

  if (fileFilter) {
    const catalog = JSON.parse(
      readFileSync(path.join(STAGING_DIR, "catalog.json"), "utf8"),
    );
    const runesDoc = JSON.parse(
      readFileSync(path.join(STAGING_DIR, "runes.json"), "utf8"),
    );
    const updatedFile = [...parsedByFile.keys()][0];
    const updatedMonster = parsedByFile.get(updatedFile);

    monsters = (catalog.monsters ?? []).map((m) =>
      m.file === updatedFile ? updatedMonster : m,
    );
    if (!monsters.some((m) => m.file === updatedFile)) {
      monsters.push(updatedMonster);
    }

    const otherRunes = (runesDoc.runes ?? []).filter(
      (r) => r.file !== updatedFile,
    );
    runes = [
      ...otherRunes,
      ...buildRuneRows(updatedMonster, targetFiles[0]),
    ];
  } else {
    const existingOrder = loadExistingCatalogOrder();
    monsters = orderMonsters(parsedByFile, existingOrder);
    runes = [];
    for (const relativeFile of targetFiles) {
      const fileKey = `monsters/${relativeFile}`;
      const monster = parsedByFile.get(fileKey);
      runes.push(...buildRuneRows(monster, relativeFile));
    }
  }

  const newVsGithubCount = monsters.filter((m) => !m.inGithubJson).length;
  const catalog = {
    source: SOURCE,
    pdf: "MHMM with Loot Tables 2.0.pdf",
    patreon:
      "https://www.patreon.com/amellwind/posts/monster-hunter-137502033",
    staging: false,
    wiredToApp: true,
    runtimeOverlay: "supplement.json",
    monsterCount: monsters.length,
    newVsGithubCount,
    monsters,
  };

  const runesDoc = {
    source: SOURCE,
    staging: true,
    wiredToApp: false,
    runeCount: runes.length,
    runes,
  };

  writeFileSync(
    path.join(STAGING_DIR, "catalog.json"),
    `${JSON.stringify(catalog, null, 2)}\n`,
    "utf8",
  );
  writeFileSync(
    path.join(STAGING_DIR, "runes.json"),
    `${JSON.stringify(runesDoc, null, 2)}\n`,
    "utf8",
  );

  console.log(
    `Wrote catalog.json (${monsters.length} monsters) and runes.json (${runes.length} runes)${
      fileFilter ? ` — updated ${fileFilter}` : ""
    }.`,
  );
}

main();
