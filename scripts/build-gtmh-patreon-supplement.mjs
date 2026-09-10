/**
 * Build GTMH Patreon/GMBinder local overlay.
 *
 * Usage:
 *   node scripts/build-gtmh-patreon-supplement.mjs
 */
import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildBackgrounds } from "./gtmh/backgrounds.mjs";
import { writeDragonshipGuide } from "./gtmh/dragonship.mjs";
import { writeFactionSections } from "./gtmh/factions.mjs";
import { writeLoreSections } from "./gtmh/lore.mjs";
import { buildFeats } from "./gtmh/feats.mjs";
import { buildItems } from "./gtmh/items.mjs";
import { buildMaterialEffectsBookData } from "./gtmh/material-effects.mjs";
import { buildObjects } from "./gtmh/objects.mjs";
import { buildOptionalFeatures } from "./gtmh/optional-features.mjs";
import { buildRaces } from "./gtmh/races.mjs";
import { buildVariantRules } from "./gtmh/variant-rules.mjs";
import { buildWeapons } from "./gtmh/weapons.mjs";
import { STAGING_DIR } from "./gtmh/common.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SOURCE_DUMP = path
  .relative(ROOT, path.join(ROOT, "public/data/gtmh-patreon/gtmh-patreon.md"))
  .split(path.sep)
  .join("/");

function uniqueByName(items) {
  const byName = new Map();
  for (const item of items) {
    const name = String(item?.name ?? "").trim().toLowerCase();
    if (!name) continue;
    if (!byName.has(name)) byName.set(name, item);
  }
  return [...byName.values()];
}

function namesOf(items) {
  return items
    .map((row) => String(row?.name ?? "").trim())
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}

function buildSupplement() {
  const feats = uniqueByName(buildFeats());
  const rolesAndDowntime = uniqueByName(buildVariantRules());
  const raceRows = buildRaces();
  const backgrounds = uniqueByName(buildBackgrounds());
  const items = uniqueByName([...buildWeapons(), ...buildItems()]);
  const optionalfeature = uniqueByName(buildOptionalFeatures());
  const objects = uniqueByName(buildObjects());
  const bookData = buildMaterialEffectsBookData();

  return {
    source: "GTMH-Patreon",
    generatedFrom: SOURCE_DUMP,
    policy: "local-wins-by-name",
    item: items,
    optionalfeature,
    race: uniqueByName(raceRows.race),
    subrace: uniqueByName(raceRows.subrace),
    background: backgrounds,
    feat: feats,
    variantrule: rolesAndDowntime,
    classFeature: [],
    class: [],
    object: objects,
    bookData,
  };
}

function countMaterialEffects(bookData) {
  const root = bookData?.["0"] ?? bookData?.[0];
  const sections = Array.isArray(root?.data) ? root.data : [];
  let count = 0;
  const walk = (entries) => {
    for (const entry of entries ?? []) {
      if (!entry || typeof entry !== "object") continue;
      if (entry.type === "table" && Array.isArray(entry.rows)) {
        count += entry.rows.length;
      }
      if (Array.isArray(entry.entries)) walk(entry.entries);
    }
  };
  for (const section of sections) walk(section.entries);
  return count;
}

function buildManifest(supplement) {
  return {
    source: supplement.source,
    generatedFrom: supplement.generatedFrom,
    policy: supplement.policy,
    counts: {
      item: supplement.item.length,
      optionalfeature: supplement.optionalfeature.length,
      race: supplement.race.length,
      subrace: supplement.subrace.length,
      background: supplement.background.length,
      feat: supplement.feat.length,
      variantrule: supplement.variantrule.length,
      classFeature: supplement.classFeature.length,
      class: supplement.class.length,
      object: supplement.object.length,
      materialEffects: countMaterialEffects(supplement.bookData),
    },
    names: {
      item: namesOf(supplement.item),
      optionalfeature: namesOf(supplement.optionalfeature),
      race: namesOf(supplement.race),
      subrace: namesOf(supplement.subrace),
      background: namesOf(supplement.background),
      feat: namesOf(supplement.feat),
      variantrule: namesOf(supplement.variantrule),
      object: namesOf(supplement.object),
    },
  };
}

const supplement = buildSupplement();
const manifest = buildManifest(supplement);
const factions = writeFactionSections();
const lore = writeLoreSections();
const dragonship = writeDragonshipGuide();

writeFileSync(
  path.join(STAGING_DIR, "supplement.json"),
  `${JSON.stringify(supplement, null, 2)}\n`,
  "utf8",
);
writeFileSync(
  path.join(STAGING_DIR, "supplement-manifest.json"),
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8",
);

console.log(
  `[build-gtmh-patreon-supplement] wrote supplement.json (${supplement.item.length} items, ${supplement.optionalfeature.length} optfeatures, ${supplement.feat.length} feats, ${supplement.background.length} backgrounds, ${manifest.counts.materialEffects} material effects, ${supplement.variantrule.length} variant rules; ${factions.sections.length} faction + ${lore.sections.length} lore + dragonship(${dragonship.subsections.length}) guide sections)`,
);
