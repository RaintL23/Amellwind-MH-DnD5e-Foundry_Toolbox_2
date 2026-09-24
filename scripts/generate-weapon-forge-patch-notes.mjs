/**
 * Builds Weapon Forge patch notes from git history of catalog weapon JSON.
 * Run: pnpm patch-notes:build
 *
 * Output:
 *   public/data/raintdm-weapons/patch-notes/index.json
 *   public/data/raintdm-weapons/patch-notes/YYYY-MM-DD.json
 */
import { execFileSync } from "node:child_process";
import {
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const weaponsRel = "public/data/raintdm-weapons";
const outDir = path.resolve(root, weaponsRel, "patch-notes");

const DICE_RE = /\b\d+d\d+(?:[+-]\d+)?\b/gi;
const TOP_FIELDS = [
  "name",
  "dmg1",
  "dmg2",
  "dmgType",
  "property",
  "weight",
  "value",
  "rarity",
  "type",
  "img",
];

/** @param {string} fileName */
function weaponLabel(fileName) {
  if (fileName === "manifest.json") return "Catalog manifest";
  const base = fileName.replace(/\.json$/i, "");
  return base
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/** @param {string} subject */
function displayMessage(subject) {
  const stripped = subject.replace(
    /^(feat|fix|data|chore|refactor|docs|style|test|perf|ci|build|revert)(\([^)]+\))?:\s*/i,
    "",
  );
  return stripped.charAt(0).toUpperCase() + stripped.slice(1);
}

/** @param {string} text */
function extractDice(text) {
  if (!text) return [];
  const matches = text.match(DICE_RE) ?? [];
  return [...new Set(matches.map((d) => d.toLowerCase()))].sort();
}

/** @param {string} text @param {number} max */
function truncate(text, max = 140) {
  const clean = String(text ?? "").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

/**
 * Keep only the changed span with a small local context — not the shared
 * long prefix/suffix that makes Before/After look identical.
 * @param {string} before
 * @param {string} after
 * @param {number} [max]
 * @returns {{ before?: string; after?: string }}
 */
function diffSnippets(before, after, max = 160) {
  const a = String(before ?? "").replace(/\s+/g, " ").trim();
  const b = String(after ?? "").replace(/\s+/g, " ").trim();
  if (!a && !b) return {};
  if (a === b) return {};
  if (!a) return { after: truncate(b, max) };
  if (!b) return { before: truncate(a, max) };

  let prefix = 0;
  const minLen = Math.min(a.length, b.length);
  while (prefix < minLen && a[prefix] === b[prefix]) prefix += 1;

  let suffix = 0;
  while (
    suffix < minLen - prefix &&
    a[a.length - 1 - suffix] === b[b.length - 1 - suffix]
  ) {
    suffix += 1;
  }

  const aMidLen = a.length - prefix - suffix;
  const bMidLen = b.length - prefix - suffix;
  // Tiny edits (comma, word swap): pull a little nearby text so the snippet is readable.
  const context =
    aMidLen <= 12 || bMidLen <= 12 || aMidLen === 0 || bMidLen === 0 ? 28 : 0;

  const aFrom = Math.max(0, prefix - context);
  const aTo = Math.min(a.length, a.length - suffix + context);
  const bFrom = Math.max(0, prefix - context);
  const bTo = Math.min(b.length, b.length - suffix + context);

  /** @param {string} full @param {number} from @param {number} to */
  function formatSpan(full, from, to) {
    let start = from;
    let end = to;
    // Never start/end mid-word.
    if (start > 0 && full[start] !== " " && full[start - 1] !== " ") {
      const space = full.lastIndexOf(" ", start);
      start = space < 0 ? 0 : space + 1;
    }
    if (end < full.length && end > 0 && full[end - 1] !== " " && full[end] !== " ") {
      const space = full.indexOf(" ", end);
      end = space < 0 ? full.length : space;
    }
    let mid = full.slice(start, end).trim();
    if (!mid) return "—";
    if (start > 0) mid = `…${mid}`;
    if (end < full.length) mid = `${mid}…`;
    return truncate(mid, max);
  }

  return {
    before: formatSpan(a, aFrom, aTo),
    after: formatSpan(b, bFrom, bTo),
  };
}

/**
 * @param {unknown} value
 * @returns {string}
 */
function stringifyField(value) {
  if (value == null) return "—";
  if (Array.isArray(value)) return value.join(", ") || "—";
  return String(value);
}

/**
 * @param {Record<string, unknown> | null | undefined} weapon
 */
function getFeatures(weapon) {
  const raintdm = weapon?._raintdm;
  if (!raintdm || typeof raintdm !== "object") return [];
  const list = /** @type {{ customFeatures?: unknown }} */ (raintdm)
    .customFeatures;
  if (!Array.isArray(list)) return [];
  return list.filter(
    (f) => f && typeof f === "object" && typeof f.name === "string",
  );
}

/**
 * Pull rarity → features-list string from the first table in entries.
 * @param {Record<string, unknown> | null | undefined} weapon
 * @returns {Map<string, string>}
 */
function getRarityFeatureLists(weapon) {
  /** @type {Map<string, string>} */
  const map = new Map();
  const entries = weapon?.entries;
  if (!Array.isArray(entries)) return map;

  /** @param {unknown} node */
  function walk(node) {
    if (!node || typeof node !== "object") return;
    if (Array.isArray(node)) {
      for (const child of node) walk(child);
      return;
    }
    const obj = /** @type {Record<string, unknown>} */ (node);
    if (obj.type === "table" && Array.isArray(obj.rows)) {
      for (const row of obj.rows) {
        if (!Array.isArray(row) || row.length < 5) continue;
        const rarity = String(row[0] ?? "").trim();
        const features = String(row[4] ?? "").trim();
        if (rarity) map.set(rarity, features);
      }
    }
    if (Array.isArray(obj.entries)) walk(obj.entries);
  }

  walk(entries);
  return map;
}

/**
 * @param {string} before
 * @param {string} after
 * @param {string} featureName
 */
function describeTextChange(before, after, featureName) {
  const diceBefore = extractDice(before);
  const diceAfter = extractDice(after);
  /** @type {{ kind: string; text: string; feature?: string; before?: string; after?: string }[]} */
  const out = [];

  const onlyDiceChanged =
    diceBefore.join("|") !== diceAfter.join("|") &&
    before.replace(DICE_RE, "§DICE§") === after.replace(DICE_RE, "§DICE§");

  if (onlyDiceChanged) {
    const max = Math.max(diceBefore.length, diceAfter.length);
    if (max === 0) {
      out.push({
        kind: "dice",
        feature: featureName,
        text: `Updated dice in "${featureName}".`,
        before: diceBefore.join(", ") || undefined,
        after: diceAfter.join(", ") || undefined,
      });
    } else {
      for (let i = 0; i < max; i++) {
        const b = diceBefore[i];
        const a = diceAfter[i];
        if (b === a) continue;
        if (b && a) {
          out.push({
            kind: "dice",
            feature: featureName,
            text: `"${featureName}" dice ${b} → ${a}.`,
            before: b,
            after: a,
          });
        } else if (a) {
          out.push({
            kind: "dice",
            feature: featureName,
            text: `"${featureName}" added dice ${a}.`,
            after: a,
          });
        } else if (b) {
          out.push({
            kind: "dice",
            feature: featureName,
            text: `"${featureName}" removed dice ${b}.`,
            before: b,
          });
        }
      }
    }
    return out;
  }

  if (diceBefore.join("|") !== diceAfter.join("|")) {
    out.push({
      kind: "dice",
      feature: featureName,
      text: `"${featureName}" dice ${diceBefore.join(", ") || "—"} → ${diceAfter.join(", ") || "—"}.`,
      before: diceBefore.join(", ") || undefined,
      after: diceAfter.join(", ") || undefined,
    });
  }

  out.push({
    kind: "feature-text",
    feature: featureName,
    text: `Rewrote "${featureName}" text.`,
    ...diffSnippets(before, after, 160),
  });
  return out;
}

/**
 * @param {Record<string, unknown> | null} before
 * @param {Record<string, unknown> | null} after
 * @param {string} fileName
 */
function diffWeapon(before, after, fileName) {
  const name =
    (after && typeof after.name === "string" && after.name) ||
    (before && typeof before.name === "string" && before.name) ||
    weaponLabel(fileName);

  /** @type {{ kind: string; text: string; feature?: string; before?: string; after?: string }[]} */
  const changes = [];

  if (!before && after) {
    const features = getFeatures(after);
    changes.push({
      kind: "weapon-added",
      text: `Added "${name}" to the catalog (${features.length} feature${features.length === 1 ? "" : "s"}).`,
    });
    return { name, file: fileName, changes };
  }

  if (before && !after) {
    changes.push({
      kind: "weapon-removed",
      text: `Removed "${name}" from the catalog.`,
    });
    return { name, file: fileName, changes };
  }

  if (!before || !after) return { name, file: fileName, changes };

  for (const field of TOP_FIELDS) {
    const b = stringifyField(before[field]);
    const a = stringifyField(after[field]);
    if (b === a) continue;
    if (field === "dmg1" || field === "dmg2") {
      changes.push({
        kind: "dice",
        text: `Base ${field === "dmg1" ? "damage" : "versatile damage"} ${b} → ${a}.`,
        before: b,
        after: a,
      });
      continue;
    }
    const labels = {
      dmgType: "Damage type",
      property: "Properties",
      weight: "Weight",
      value: "Value",
      rarity: "Rarity",
      type: "Type",
      img: "Icon",
      name: "Name",
    };
    changes.push({
      kind: "field",
      text: `${labels[field] ?? field}: ${b} → ${a}.`,
      before: b,
      after: a,
    });
  }

  const beforeFeats = getFeatures(before);
  const afterFeats = getFeatures(after);
  /** @type {Set<number>} */
  const usedBeforeIdx = new Set();
  /** @type {Set<number>} */
  const usedAfterIdx = new Set();

  /** @param {any} bf @param {any} af */
  function pairFeatures(bf, af) {
    if (bf.name !== af.name) {
      changes.push({
        kind: "feature-renamed",
        feature: af.name,
        text: `Renamed feature "${bf.name}" → "${af.name}".`,
        before: bf.name,
        after: af.name,
      });
    }
    const bDesc = String(bf.description ?? "");
    const aDesc = String(af.description ?? "");
    if (bDesc !== aDesc) {
      changes.push(...describeTextChange(bDesc, aDesc, af.name));
    }
  }

  // 1) Match by stable feature id
  for (let ai = 0; ai < afterFeats.length; ai++) {
    const af = afterFeats[ai];
    const id = String(af.id ?? "");
    if (!id) continue;
    const bi = beforeFeats.findIndex(
      (f, idx) => !usedBeforeIdx.has(idx) && String(f.id ?? "") === id,
    );
    if (bi < 0) continue;
    usedBeforeIdx.add(bi);
    usedAfterIdx.add(ai);
    pairFeatures(beforeFeats[bi], af);
  }

  // 2) Match remaining by name (ids sometimes regenerate on rewrite)
  for (let ai = 0; ai < afterFeats.length; ai++) {
    if (usedAfterIdx.has(ai)) continue;
    const af = afterFeats[ai];
    const bi = beforeFeats.findIndex(
      (f, idx) => !usedBeforeIdx.has(idx) && f.name === af.name,
    );
    if (bi < 0) continue;
    usedBeforeIdx.add(bi);
    usedAfterIdx.add(ai);
    pairFeatures(beforeFeats[bi], af);
  }

  for (let bi = 0; bi < beforeFeats.length; bi++) {
    if (usedBeforeIdx.has(bi)) continue;
    const bf = beforeFeats[bi];
    changes.push({
      kind: "feature-removed",
      feature: bf.name,
      text: `Removed feature "${bf.name}".`,
    });
  }

  for (let ai = 0; ai < afterFeats.length; ai++) {
    if (usedAfterIdx.has(ai)) continue;
    const af = afterFeats[ai];
    changes.push({
      kind: "feature-added",
      feature: af.name,
      text: `Added feature "${af.name}": ${truncate(String(af.description ?? ""), 160)}`,
      after: truncate(String(af.description ?? ""), 200),
    });
  }

  const rarityBefore = getRarityFeatureLists(before);
  const rarityAfter = getRarityFeatureLists(after);
  const rarities = new Set([...rarityBefore.keys(), ...rarityAfter.keys()]);
  for (const rarity of rarities) {
    const b = rarityBefore.get(rarity) ?? "";
    const a = rarityAfter.get(rarity) ?? "";
    if (b === a) continue;
    const snippets = diffSnippets(b, a, 120);
    changes.push({
      kind: "rarity-table",
      text: `${rarity} rarity features updated.`,
      before: snippets.before,
      after: snippets.after,
    });
  }

  return { name, file: fileName, changes };
}

/**
 * @param {string} commit
 * @param {string} relPath
 */
function gitShowJson(commit, relPath) {
  try {
    const raw = execFileSync("git", ["show", `${commit}:${relPath}`], {
      cwd: root,
      encoding: "utf8",
      maxBuffer: 12 * 1024 * 1024,
      stdio: ["ignore", "pipe", "ignore"],
    });
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * @param {string} commit
 * @returns {string[]}
 */
function listChangedWeaponFiles(commit) {
  const raw = execFileSync(
    "git",
    [
      "diff-tree",
      "--no-commit-id",
      "--name-only",
      "-r",
      commit,
      "--",
      weaponsRel,
    ],
    { cwd: root, encoding: "utf8" },
  );
  return raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .filter((p) => p.endsWith(".json"))
    .filter((p) => !p.includes("/patch-notes/"))
    .filter((p) => path.basename(p) !== "manifest.json");
}

// ─── Collect commits ───────────────────────────────────────────────────────────

const logRaw = execFileSync(
  "git",
  [
    "log",
    "--pretty=format:%H|%ad|%s",
    "--date=short",
    "--",
    weaponsRel,
  ],
  { cwd: root, encoding: "utf8" },
);

/** @type {{ hash: string; date: string; subject: string }[]} */
const commits = [];
for (const line of logRaw.split(/\r?\n/)) {
  if (!line.trim() || !line.includes("|")) continue;
  const [hash, date, ...rest] = line.split("|");
  if (!hash || !date) continue;
  commits.push({ hash, date, subject: rest.join("|") });
}

/** @type {Map<string, any[]>} */
const byDate = new Map();

for (const commit of commits) {
  const files = listChangedWeaponFiles(commit.hash);
  if (files.length === 0) continue;

  /** @type {any[]} */
  const weapons = [];
  for (const relPath of files) {
    const fileName = path.basename(relPath);
    const after = gitShowJson(commit.hash, relPath);
    const before = gitShowJson(`${commit.hash}^`, relPath);
    const weaponDiff = diffWeapon(before, after, fileName);
    if (weaponDiff.changes.length === 0) continue;
    weapons.push(weaponDiff);
  }

  if (weapons.length === 0) continue;

  const entry = {
    summary: displayMessage(commit.subject),
    commit: commit.hash.slice(0, 7),
    weapons: weapons.sort((a, b) => a.name.localeCompare(b.name)),
  };

  const list = byDate.get(commit.date) ?? [];
  list.push(entry);
  byDate.set(commit.date, list);
}

// ─── Write output ──────────────────────────────────────────────────────────────

mkdirSync(outDir, { recursive: true });
for (const existing of readdirSync(outDir)) {
  if (existing.endsWith(".json")) {
    rmSync(path.join(outDir, existing));
  }
}

const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));
const generatedAt = new Date().toISOString();

for (const date of dates) {
  const day = {
    date,
    generatedAt,
    entries: byDate.get(date) ?? [],
  };
  writeFileSync(
    path.join(outDir, `${date}.json`),
    `${JSON.stringify(day, null, 2)}\n`,
    "utf8",
  );
}

const index = {
  version: 1,
  generatedAt,
  description:
    "Weapon Forge catalog patch notes (one file per date). Regenerated by pnpm patch-notes:build.",
  dates,
};

writeFileSync(
  path.join(outDir, "index.json"),
  `${JSON.stringify(index, null, 2)}\n`,
  "utf8",
);

console.log(
  `Generated weapon forge patch notes: ${dates.length} day(s) → ${path.relative(root, outDir)}`,
);
