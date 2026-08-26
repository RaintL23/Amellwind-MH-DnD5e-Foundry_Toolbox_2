/**
 * Convert catalog.json into a 5etools-shaped overlay. Local sheets win at
 * runtime; GitHub fills names the PDF does not have.
 *
 * Usage: node scripts/build-mm-patreon-supplement.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const stagingDir = path.resolve(__dirname, "../public/data/mhmm-patreon-2.0");
const SOURCE = "MHMM-Patreon";
const SKIP_NAMES = new Set();

const SIZE_ABBR = {
  tiny: "T",
  small: "S",
  medium: "M",
  large: "L",
  huge: "H",
  gargantuan: "G",
};

const ALIGNMENT_WORDS = {
  chaotic: "C",
  lawful: "L",
  neutral: "N",
  good: "G",
  evil: "E",
  unaligned: "U",
};

function mapSize(size) {
  if (!size || typeof size !== "string") return ["M"];
  const first = size.trim().split(/\s+/)[0].toLowerCase();
  return [SIZE_ABBR[first] ?? "M"];
}

function mapAlignment(raw) {
  if (!raw || typeof raw !== "string") return ["U"];
  const lower = raw.trim().toLowerCase();
  if (lower === "unaligned") return ["U"];
  if (lower === "any alignment") return ["A"];
  const tokens = lower
    .split(/\s+/)
    .map((w) => ALIGNMENT_WORDS[w])
    .filter(Boolean);
  return tokens.length > 0 ? tokens : ["U"];
}

function mapType(creatureType) {
  if (!creatureType || typeof creatureType !== "string") {
    return { type: "unknown" };
  }
  const match = creatureType.match(/^([^(]+?)\s*\(([^)]+)\)\s*$/);
  if (match) {
    return {
      type: match[1].trim().toLowerCase(),
      tags: match[2]
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
    };
  }
  return { type: creatureType.trim().toLowerCase() };
}

function parseDamageList(raw) {
  if (!raw || typeof raw !== "string") return undefined;
  const parts = raw
    .split(/[,;]/)
    .map((p) => p.trim().toLowerCase())
    .filter((p) => p && p !== "—" && p !== "-");
  return parts.length > 0 ? parts : undefined;
}

function parseBonusMap(raw, { threeLetter = false } = {}) {
  if (!raw || typeof raw !== "string") return undefined;
  const out = {};
  for (const part of raw.split(",")) {
    const match = part.trim().match(/^([A-Za-z][A-Za-z ]*?)\s+([+-]\d+)$/);
    if (!match) continue;
    const label = match[1].trim();
    const key = threeLetter
      ? label.slice(0, 3).toLowerCase()
      : label.toLowerCase();
    out[key] = match[2];
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseSenses(raw) {
  if (!raw || typeof raw !== "string") return { senses: undefined, passive: undefined };
  let passive;
  const senses = [];
  for (const chunk of raw.split(",")) {
    const piece = chunk.trim();
    const passiveMatch = piece.match(/^passive perception\s+(\d+)$/i);
    if (passiveMatch) {
      passive = Number(passiveMatch[1]);
      continue;
    }
    if (piece && piece !== "—") senses.push(piece);
  }
  return {
    senses: senses.length > 0 ? senses : undefined,
    passive,
  };
}

function parseLanguages(raw) {
  if (!raw || typeof raw !== "string") return undefined;
  const trimmed = raw.trim();
  if (!trimmed || trimmed === "—" || trimmed === "-") return undefined;
  return [trimmed];
}

function mapNamedEntries(list) {
  if (!Array.isArray(list)) return undefined;
  const entries = list
    .filter((e) => e && typeof e === "object" && e.name)
    .map((e) => ({
      name: String(e.name),
      entries: [String(e.text ?? "")],
    }));
  return entries.length > 0 ? entries : undefined;
}

function formatSlots(slots) {
  if (!Array.isArray(slots) || slots.length === 0) return "";
  return `(${slots.join(",")})`;
}

function namedEffectList(name, materials, field) {
  if (!Array.isArray(materials)) return undefined;
  const items = materials
    .filter((m) => m && typeof m === "object" && m.name && m[field])
    .map((m) => ({
      type: "item",
      name: String(m.name),
      entries: [String(m[field])],
    }));
  if (items.length === 0) return undefined;
  return { type: "list", name, items };
}

function buildFluff(monster) {
  const entries = [];
  if (Array.isArray(monster.bio)) {
    for (const paragraph of monster.bio) {
      if (typeof paragraph === "string" && paragraph.trim()) {
        entries.push(paragraph.trim());
      }
    }
  }

  const insetEntries = [];
  const rolls = Number(monster.lootRolls) || 0;
  insetEntries.push({
    type: "table",
    rows: [["", "", "", String(rolls)]],
  });

  if (Array.isArray(monster.loot) && monster.loot.length > 0) {
    insetEntries.push({
      type: "table",
      colLabels: ["Carve Chance", "Capture Chance", "Material", "Slots"],
      rows: monster.loot.map((row) => [
        String(row.carveChance ?? "—"),
        String(row.captureChance ?? "—"),
        String(row.name ?? ""),
        formatSlots(row.slots),
      ]),
    });
  }

  const armor = namedEffectList(
    "ARMOR MATERIAL EFFECTS",
    monster.materials,
    "armorEffect",
  );
  const weapon = namedEffectList(
    "WEAPON MATERIAL EFFECTS",
    monster.materials,
    "weaponEffect",
  );
  const other = namedEffectList(
    "OTHER MATERIAL EFFECTS",
    monster.materials,
    "otherEffect",
  );
  if (armor) insetEntries.push(armor);
  if (weapon) insetEntries.push(weapon);
  if (other) insetEntries.push(other);

  const hasLoot =
    (Array.isArray(monster.loot) && monster.loot.length > 0) ||
    (Array.isArray(monster.materials) && monster.materials.length > 0);
  if (hasLoot) {
    entries.push({
      type: "inset",
      name: "Loot",
      entries: insetEntries,
    });
  }

  return entries.length > 0 ? { entries } : undefined;
}

function mapCr(raw) {
  if (raw == null || raw === "") return undefined;
  const text = String(raw).trim();
  if (/^event$/i.test(text) || /^[—–-]$/.test(text)) return undefined;
  const first = text.match(/^(\d+\/\d+|\d+)/);
  return first ? first[1] : text;
}

function parseConditionsMarkdown(md) {
  const conditions = [];
  const diseases = [];
  const parts = md.split(/^## /m).slice(1);
  for (const part of parts) {
    const nl = part.indexOf("\n");
    const heading = (nl === -1 ? part : part.slice(0, nl)).trim();
    const body = (nl === -1 ? "" : part.slice(nl)).trim();
    if (!heading) continue;

    let name = heading;
    let kind = "condition";
    if (/^Disease:/i.test(heading)) {
      kind = "disease";
      name = heading.replace(/^Disease:\s*/i, "").trim();
    } else if (/^Poison:/i.test(heading)) {
      kind = "condition";
      name = heading.replace(/^Poison:\s*/i, "").trim();
    }

    const entries = [];
    if (/^Poison:/i.test(heading)) {
      entries.push({
        type: "homebrew",
        entries: [
          `${name} is considered a type of poison for the purposes of features that grant advantage on saves against or immunity to poisons.`,
        ],
      });
    }
    if (kind === "disease") {
      entries.push({
        type: "homebrew",
        entries: [
          `${name} is considered a type of disease for the purposes of features that grant advantage on saves against or immunity to diseases.`,
        ],
      });
    }
    if (body) entries.push(body.replace(/\s+/g, " ").trim());
    const obj = { name, source: SOURCE, entries };
    if (kind === "disease") diseases.push(obj);
    else conditions.push(obj);
  }
  return { conditions, diseases };
}

function extractFrenzyVirus(catalogMonsters) {
  const shagaru = catalogMonsters.find((m) => m && m.name === "Shagaru Magala");
  const bio = Array.isArray(shagaru?.bio) ? shagaru.bio : [];
  const start = bio.findIndex(
    (p) =>
      typeof p === "string" &&
      /frenzy virus is an infectious disease/i.test(p),
  );
  if (start < 0) return null;
  const paras = bio
    .slice(start)
    .filter((p) => typeof p === "string" && p.trim())
    .map((p) => String(p).replace(/\s+/g, " ").trim());
  if (paras.length === 0) return null;
  return { name: "Frenzy Virus", source: SOURCE, entries: paras };
}

function toFiveToolsMonster(monster) {
  const { senses, passive } = parseSenses(monster.senses);
  const abilities = monster.abilities ?? {};
  // Keep bonus actions only on `bonus` (not duplicated into `action` with a
  // "Bonus Action:" prefix) so the stat block can render a separate section.
  const action = mapNamedEntries(monster.actions) ?? [];
  const legendary = [
    ...(mapNamedEntries(monster.legendaryActions) ?? []),
    ...(mapNamedEntries(monster.mythicActions)?.map((entry) => ({
      ...entry,
      name: `Mythic: ${entry.name}`,
    })) ?? []),
  ];

  const out = {
    name: monster.name,
    source: SOURCE,
    page: typeof monster.pdfPage === "number" ? monster.pdfPage : undefined,
    group: monster.group ? [monster.group] : undefined,
    size: mapSize(monster.size),
    type: mapType(monster.creatureType),
    alignment: mapAlignment(monster.alignment),
    ac: monster.ac
      ? [
          {
            ac: Number(monster.ac.ac) || 0,
            from: Array.isArray(monster.ac.from) ? monster.ac.from : undefined,
          },
        ]
      : undefined,
    hp: monster.hp ?? undefined,
    speed: monster.speed ?? undefined,
    str: abilities.str,
    dex: abilities.dex,
    con: abilities.con,
    int: abilities.int,
    wis: abilities.wis,
    cha: abilities.cha,
    save: parseBonusMap(monster.savingThrows, { threeLetter: true }),
    skill: parseBonusMap(monster.skills),
    immune: parseDamageList(monster.damageImmunities),
    resist: parseDamageList(monster.damageResistances),
    vulnerable: parseDamageList(monster.damageVulnerabilities),
    conditionImmune: parseDamageList(monster.conditionImmunities),
    senses,
    passive,
    languages: parseLanguages(monster.languages),
    cr: mapCr(monster.cr),
    trait: mapNamedEntries(monster.traits),
    action: action.length > 0 ? action : undefined,
    reaction: mapNamedEntries(monster.reactions),
    legendary: legendary.length > 0 ? legendary : undefined,
    bonus: mapNamedEntries(monster.bonusActions),
    mythic: mapNamedEntries(monster.mythicActions),
    fluff: buildFluff(monster),
  };

  return Object.fromEntries(
    Object.entries(out).filter(([, value]) => value !== undefined),
  );
}

const catalog = JSON.parse(
  readFileSync(path.join(stagingDir, "catalog.json"), "utf8"),
);
const all = Array.isArray(catalog.monsters) ? catalog.monsters : [];
const localOnly = all.filter(
  (m) => m && !SKIP_NAMES.has(m.name),
);
const overlap = all.filter((m) => m && m.inGithubJson).map((m) => m.name);
const skipped = all
  .filter((m) => m && SKIP_NAMES.has(m.name))
  .map((m) => m.name);

const monsters = localOnly.map(toFiveToolsMonster);

const chapterMd = readFileSync(
  path.join(stagingDir, "01-conditions-poisons-diseases.md"),
  "utf8",
);
const { conditions, diseases } = parseConditionsMarkdown(chapterMd);
if (!diseases.some((d) => d.name === "Frenzy Virus")) {
  const frenzy = extractFrenzyVirus(all);
  if (frenzy) diseases.push(frenzy);
}

const supplement = {
  source: SOURCE,
  generatedFrom: "catalog.json",
  policy: "local-wins-by-normalized-name",
  monster: monsters,
  condition: conditions,
  disease: diseases,
};

const manifest = {
  policy:
    "Patreon MHMM 2.0 sheets win on normalized name. GitHub MHMM entries are kept only when the PDF has no matching name. Regenerated with pnpm build:mm-supplement.",
  archiveDir: "public/data/mhmm-patreon-2.0",
  supplementUrl: "/data/mhmm-patreon-2.0/supplement.json",
  source: SOURCE,
  localCount: monsters.length,
  localNames: localOnly.map((m) => m.name),
  githubOverlapCount: overlap.length,
  githubOverlapNames: overlap,
  skippedNames: skipped,
  conditionNames: conditions.map((c) => c.name),
  diseaseNames: diseases.map((d) => d.name),
};

writeFileSync(
  path.join(stagingDir, "supplement.json"),
  `${JSON.stringify(supplement)}\n`,
  "utf8",
);
writeFileSync(
  path.join(stagingDir, "supplement-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `Wrote supplement.json (${monsters.length} local sheets, ${conditions.length} conditions, ${diseases.length} diseases).`,
);
