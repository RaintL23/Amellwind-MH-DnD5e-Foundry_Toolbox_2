// Build the Foundry VTT content module `Amellwind-MH-RaintDM-module` from the
// JSON exports in `public/data/foundry-jsons-example`.
//
// Why this exists: Foundry v11+ does NOT read loose JSON files as compendium
// packs; each pack must be a LevelDB database. This script groups the source
// JSON by document type + folder, recreates the folder tree inside each pack
// with Folder documents, assigns STABLE ids (so rebuilds update in place and
// never duplicate), rewrites `mh-icons/...` and `mh-tokens/...` image paths so the module is
// self-contained, and compiles everything to LevelDB via @foundryvtt/foundryvtt-cli.
//
// Run with: pnpm build:foundry-module

import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compilePack } from "@foundryvtt/foundryvtt-cli";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const MODULE_ID = "Amellwind-MH-RaintDM-module";
const SRC_DIR = path.join(ROOT, "public", "data", "foundry-jsons-example");
const ICONS_SRC = path.join(ROOT, "public", "mh-icons");
const TOKENS_SRC = path.join(ROOT, "public", "mh-tokens");
const MODULE_DIR = path.join(ROOT, "public", "data", "foundry-module", MODULE_ID);
const PACKS_DIR = path.join(MODULE_DIR, "packs");
const ASSETS_ICONS_DIR = path.join(MODULE_DIR, "assets", "mh-icons");
const ASSETS_TOKENS_DIR = path.join(MODULE_DIR, "assets", "mh-tokens");
const STAGING_DIR = path.join(MODULE_DIR, ".staging");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";

// Pack definitions. `rootDir` is the source directory scanned recursively;
// `docType` filters entries by their `fvtt-<Type>-` filename prefix. Any
// sub-directory that contains matching JSON becomes a Folder inside the pack.
const PACKS = [
  { name: "weapons", docType: "Item", rootDir: path.join(SRC_DIR, "weapons") },
  { name: "weapon-resources", docType: "Item", rootDir: path.join(SRC_DIR, "weapons-resources") },
  { name: "runes", docType: "Item", rootDir: path.join(SRC_DIR, "runes") },
  { name: "cooking-items", docType: "Item", rootDir: path.join(SRC_DIR, "cooking-features") },
  { name: "cooking-actors", docType: "Actor", rootDir: path.join(SRC_DIR, "cooking-features") },
  { name: "cooking-macros", docType: "Macro", rootDir: path.join(SRC_DIR, "cooking-features") },
  { name: "combo-crafting", docType: "Item", rootDir: path.join(SRC_DIR, "combo-crafting") },
  { name: "items-forge", docType: "Item", rootDir: path.join(SRC_DIR, "items-forge") },
  { name: "hidden-detect-items", docType: "Item", rootDir: path.join(SRC_DIR, "hidden-detect") },
  { name: "hidden-detect-macros", docType: "Macro", rootDir: path.join(SRC_DIR, "hidden-detect") },
  { name: "resource-node-items", docType: "Item", rootDir: path.join(SRC_DIR, "resource-node") },
  { name: "resource-node-macros", docType: "Macro", rootDir: path.join(SRC_DIR, "resource-node") },
  { name: "resource-node-actors", docType: "Actor", rootDir: path.join(SRC_DIR, "resource-node") },
  { name: "monsters", docType: "Actor", rootDir: path.join(SRC_DIR, "monsters") },
];

const COLLECTION_BY_TYPE = { Item: "items", Actor: "actors", Macro: "macros" };
const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const ID_RE = /^[A-Za-z0-9]{16}$/;

// Mirror of the CLI's embedded-document hierarchy. The compiler recurses into
// these collections and requires every embedded doc to carry its own `_key`
// (e.g. `!actors.items!<actorId>.<itemId>`), otherwise LevelDB rejects the batch.
const HIERARCHY = {
  actors: { items: [], effects: [] },
  items: { effects: [] },
  effects: {},
};

const keyJoin = (prefix, part) => (prefix ? `${prefix}.${part}` : part);

/** Deterministic 16-char Foundry id derived from a seed string. */
function stableId(seed) {
  const hash = createHash("sha1").update(seed).digest();
  let id = "";
  for (let i = 0; i < 16; i += 1) id += ID_ALPHABET[hash[i] % ID_ALPHABET.length];
  return id;
}

/** Turn a directory segment (e.g. "daily-skills") into a folder label. */
function prettifyFolderName(segment) {
  return segment
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/**
 * Recursively assign LevelDB `_key`s to a document and every embedded document,
 * matching the format the Foundry CLI expects when compiling packs.
 */
function assignKeys(doc, collection, sublevelPrefix = null, idPrefix = null, seed = "") {
  if (!(typeof doc._id === "string" && ID_RE.test(doc._id))) doc._id = stableId(`${seed}::${collection}`);
  const sublevel = keyJoin(sublevelPrefix, collection);
  const id = keyJoin(idPrefix, doc._id);
  doc._key = `!${sublevel}!${id}`;
  for (const embeddedName of Object.keys(HIERARCHY[collection] ?? {})) {
    const value = doc[embeddedName];
    if (!Array.isArray(value)) continue;
    value.forEach((child, index) => assignKeys(child, embeddedName, sublevel, id, `${id}.${embeddedName}.${index}`));
  }
}

/** Rewrite module asset paths so they resolve inside the Foundry module bundle. */
function rewriteModuleAssets(doc) {
  let json = JSON.stringify(doc);
  json = json.split('"mh-icons/').join(`"modules/${MODULE_ID}/assets/mh-icons/`);
  json = json.split('"mh-tokens/').join(`"modules/${MODULE_ID}/assets/mh-tokens/`);
  return JSON.parse(json);
}

function ensureCleanDir(dir) {
  fs.rmSync(dir, { force: true, recursive: true, maxRetries: 10 });
  fs.mkdirSync(dir, { recursive: true });
}

function walkJsonFiles(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJsonFiles(full));
    else if (entry.isFile() && entry.name.endsWith(".json")) out.push(full);
  }
  return out;
}

const folderStats = () => ({ coreVersion: CORE_VERSION, systemId: SYSTEM_ID, systemVersion: SYSTEM_VERSION });

/**
 * Build the JSON documents (content + folders) for one pack.
 * @returns {{docs: object[], folders: number, entries: number}}
 */
function buildPackDocs({ name, docType, rootDir }) {
  const prefix = `fvtt-${docType}-`;
  const collection = COLLECTION_BY_TYPE[docType];
  const files = walkJsonFiles(rootDir).filter((f) => path.basename(f).startsWith(prefix));

  const folderDocs = new Map(); // relDir -> folder doc
  const contentDocs = [];

  // Create (or reuse) a folder doc for `relDir` and every ancestor. Returns leaf id.
  const ensureFolder = (relDir) => {
    if (!relDir || relDir === ".") return null;
    const segments = relDir.split(path.sep).filter(Boolean);
    let parentId = null;
    let accumulated = "";
    for (const segment of segments) {
      accumulated = accumulated ? `${accumulated}/${segment}` : segment;
      if (!folderDocs.has(accumulated)) {
        const id = stableId(`${name}::folder::${accumulated}`);
        folderDocs.set(accumulated, {
          _id: id,
          _key: `!folders!${id}`,
          name: prettifyFolderName(segment),
          type: docType,
          sorting: "a",
          folder: parentId,
          color: null,
          description: "",
          flags: {},
          sort: 0,
          _stats: folderStats(),
        });
      }
      parentId = folderDocs.get(accumulated)._id;
    }
    return parentId;
  };

  for (const file of files) {
    const raw = JSON.parse(fs.readFileSync(file, "utf8"));
    const relPath = path.relative(rootDir, file);
    const relDir = path.dirname(relPath);
    const folderId = ensureFolder(relDir);

    let id = typeof raw._id === "string" && ID_RE.test(raw._id) ? raw._id : null;
    if (!id) id = stableId(`${name}::doc::${relPath.split(path.sep).join("/")}`);

    const doc = rewriteModuleAssets(raw);
    doc._id = id;
    assignKeys(doc, collection, null, null, `${name}::${id}`);
    doc.folder = folderId;
    contentDocs.push(doc);
  }

  return { docs: [...folderDocs.values(), ...contentDocs], folders: folderDocs.size, entries: contentDocs.length };
}

async function buildPack(def) {
  const { docs, folders, entries } = buildPackDocs(def);
  if (entries === 0) {
    console.warn(`  ! pack "${def.name}" has no ${def.docType} documents — skipped`);
    return { entries: 0, folders: 0 };
  }

  const staging = path.join(STAGING_DIR, def.name);
  ensureCleanDir(staging);
  for (const doc of docs) {
    fs.writeFileSync(path.join(staging, `${doc._id}.json`), JSON.stringify(doc, null, 2));
  }

  const dest = path.join(PACKS_DIR, def.name);
  // compilePack does not clean LevelDB destinations; remove stale data first so
  // deletions in the source are reflected in the rebuilt pack.
  ensureCleanDir(dest);
  await compilePack(staging, dest, { log: false });

  console.log(`  ok pack "${def.name}": ${entries} ${def.docType} + ${folders} folder(s)`);
  return { entries, folders };
}

function copyAssetDir(srcDir, destDir, label) {
  if (!fs.existsSync(srcDir)) {
    console.warn(`  ! ${label} source not found: ${srcDir}`);
    return 0;
  }
  ensureCleanDir(destDir);
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (!entry.isFile()) continue;
    if (entry.name === "manifest.json") continue;
    fs.copyFileSync(path.join(srcDir, entry.name), path.join(destDir, entry.name));
  }
  return fs.readdirSync(destDir).filter((f) => fs.statSync(path.join(destDir, f)).isFile()).length;
}

function copyIcons() {
  return copyAssetDir(ICONS_SRC, ASSETS_ICONS_DIR, "mh-icons");
}

function copyTokens() {
  return copyAssetDir(TOKENS_SRC, ASSETS_TOKENS_DIR, "mh-tokens");
}

/**
 * Resource Node double-click must arm on EVERY client (players included).
 * A Sync/Configure macro only runs on the GM client — that is why players saw
 * silent no-ops. Ship the engine as a real module script instead.
 */
function buildResourceNodeClientScript() {
  const enginePath = path.join(SRC_DIR, "resource-node", "resource-node-sync-engine.js");
  if (!fs.existsSync(enginePath)) {
    console.warn("  ! resource-node engine missing — client script skipped");
    return false;
  }

  let engine = fs.readFileSync(enginePath, "utf8").replace(/\r\n/g, "\n");
  // Module script waits for ready; strip the trailing self-arm used by macros.
  engine = engine.replace(/\nensureResourceNodeHooks\(\);\s*$/m, "\n");

  const client = [
    "/**",
    " * Amellwind Resource Node — client bootstrap",
    " * Auto-generated by scripts/build-foundry-module.mjs — do not edit by hand.",
    " * Loads on ALL clients (GM + players) so double-click gather works Item Piles–style.",
    " */",
    engine.trim(),
    "",
    'Hooks.once("ready", () => {',
    "  try {",
    "    ensureResourceNodeHooks();",
    '    console.log("Amellwind Resource Node | interaction hooks armed");',
    "    if (game.user.isGM) {",
    "      Promise.resolve(publishAllResourceNodeMarkers())",
    "        .then((n) => {",
    "          if (n > 0) {",
    '            console.log(`Amellwind Resource Node | published markers for ${n} node(s)`);',
    "          }",
    "        })",
    '        .catch((err) => console.error("Amellwind Resource Node | marker publish failed", err));',
    "    }",
    "  } catch (err) {",
    '    console.error("Amellwind Resource Node | failed to arm hooks", err);',
    "  }",
    "});",
    "",
  ].join("\n");

  const scriptsDir = path.join(MODULE_DIR, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(path.join(scriptsDir, "resource-node.js"), `${client}\n`);
  console.log('  ok client script "scripts/resource-node.js"');
  return true;
}

/**
 * Hidden Detection proximity must arm on EVERY client so Passive Perception
 * checks fire when PCs walk near preconfigured resource-node actors.
 */
function buildHiddenDetectionClientScript() {
  const enginePath = path.join(SRC_DIR, "hidden-detect", "hidden-detection-sync-engine.js");
  if (!fs.existsSync(enginePath)) {
    console.warn("  ! hidden-detect engine missing — client script skipped");
    return false;
  }

  let engine = fs.readFileSync(enginePath, "utf8").replace(/\r\n/g, "\n");
  // Strip the source file's trailing self-call; the client bootstrap owns lifecycle.
  engine = engine.replace(/\nensureHiddenDetectHooks\(\);\s*$/m, "\n");

  const client = [
    "/**",
    " * Amellwind Hidden Detection — client bootstrap",
    " * Auto-generated by scripts/build-foundry-module.mjs — do not edit by hand.",
    " * Loads on ALL clients so proximity Passive Perception / skill checks resolve.",
    " */",
    engine.trim(),
    "",
    "// Register API immediately so Resource Node Configure can open HD settings",
    "// even if this script evaluates after Hooks.once('ready') already fired.",
    "try {",
    "  ensureHiddenDetectHooks();",
    '  console.log("Amellwind Hidden Detection | proximity hooks armed");',
    "} catch (err) {",
    '  console.error("Amellwind Hidden Detection | failed to arm hooks", err);',
    "}",
    "",
    'Hooks.once("ready", () => {',
    "  try {",
    "    ensureHiddenDetectHooks();",
    "    if (canvas?.ready) globalThis.__amellwindHiddenDetect?.syncHiddenDetection?.({ notify: false });",
    "  } catch (err) {",
    '    console.error("Amellwind Hidden Detection | ready re-arm failed", err);',
    "  }",
    "});",
    "",
  ].join("\n");

  const scriptsDir = path.join(MODULE_DIR, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(path.join(scriptsDir, "hidden-detection.js"), `${client}\n`);
  console.log('  ok client script "scripts/hidden-detection.js"');
  return true;
}

/**
 * Felyne Cook double-click must arm on EVERY client (players included).
 * Also ships the shared cooking UI (runCookingFlow) used by the token menu.
 */
function buildFelyneCookClientScript() {
  const flowPath = path.join(SRC_DIR, "cooking-features", "felyne-cook-player-flow.fragment.js");
  const enginePath = path.join(SRC_DIR, "cooking-features", "felyne-cook-sync-engine.js");
  if (!fs.existsSync(flowPath) || !fs.existsSync(enginePath)) {
    console.warn("  ! felyne-cook sources missing — client script skipped");
    return false;
  }

  let flow = fs.readFileSync(flowPath, "utf8").replace(/\r\n/g, "\n");
  // Module script has no Ask/handoff scope — strip legacy auto-run tail.
  flow = flow.replace(
    /\n\/\/ Legacy Ask \/ handoff macros: variables already in scope\.[\s\S]*$/m,
    "\n",
  );

  let engine = fs.readFileSync(enginePath, "utf8").replace(/\r\n/g, "\n");
  // Engine is an IIFE that exposes APIs on globalThis.__amellwindFelyneCook.

  const client = [
    "/**",
    " * Amellwind Felyne Cook — client bootstrap",
    " * Auto-generated by scripts/build-foundry-module.mjs — do not edit by hand.",
    " * Loads on ALL clients so double-click kitchen menus work Item Piles–style.",
    " */",
    flow.trim(),
    "",
    engine.trim(),
    "",
    'Hooks.once("ready", () => {',
    "  try {",
    "    const api = globalThis.__amellwindFelyneCook;",
    "    api?.ensureFelyneCookHooks?.();",
    '    console.log("Amellwind Felyne Cook | token interaction hooks armed");',
    "    if (game.user.isGM) {",
    "      Promise.resolve(api?.publishAllCookMarkers?.())",
    "        .then((n) => {",
    "          if (n > 0) {",
    '            console.log(`Amellwind Felyne Cook | published markers for ${n} cook actor(s)`);',
    "          }",
    "        })",
    '        .catch((err) => console.error("Amellwind Felyne Cook | marker publish failed", err));',
    "    }",
    "  } catch (err) {",
    '    console.error("Amellwind Felyne Cook | failed to arm hooks", err);',
    "  }",
    "});",
    "",
  ].join("\n");

  const scriptsDir = path.join(MODULE_DIR, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(path.join(scriptsDir, "felyne-cook.js"), `${client}\n`);
  console.log('  ok client script "scripts/felyne-cook.js"');
  return true;
}

/**
 * Dire Miralis boss automations (Magma Armor, lava, Calamity Rain, auras)
 * must run on the GM client. Ship the engine as a module script.
 */
function buildDireMiralisClientScript() {
  const enginePath = path.join(SRC_DIR, "monsters", "dire-miralis-engine.js");
  if (!fs.existsSync(enginePath)) {
    console.warn("  ! dire-miralis engine missing — client script skipped");
    return false;
  }

  const engine = fs.readFileSync(enginePath, "utf8").replace(/\r\n/g, "\n");

  const client = [
    "/**",
    " * Amellwind Dire Miralis — client bootstrap",
    " * Auto-generated by scripts/build-foundry-module.mjs — do not edit by hand.",
    " * Arms Magma Armor, lava hazards, Calamity Rain, and turn auras.",
    " */",
    engine.trim(),
    "",
    'Hooks.once("ready", () => {',
    "  try {",
    "    globalThis.__amellwindDireMiralis?.ensureHooks?.();",
    '    console.log("Amellwind Dire Miralis | combat automation hooks armed");',
    "  } catch (err) {",
    '    console.error("Amellwind Dire Miralis | failed to arm hooks", err);',
    "  }",
    "});",
    "",
  ].join("\n");

  const scriptsDir = path.join(MODULE_DIR, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(path.join(scriptsDir, "dire-miralis.js"), `${client}\n`);
  console.log('  ok client script "scripts/dire-miralis.js"');
  return true;
}

/**
 * Hunter trap templates (set / trigger / retrieve / 1-hour expiry) must run on
 * the GM client. Ship the engine as a module script.
 */
function buildHunterTrapsClientScript() {
  const enginePath = path.join(SRC_DIR, "items-forge", "hunter-traps-engine.js");
  if (!fs.existsSync(enginePath)) {
    console.warn("  ! hunter-traps engine missing — client script skipped");
    return false;
  }

  const engine = fs.readFileSync(enginePath, "utf8").replace(/\r\n/g, "\n");

  const client = [
    "/**",
    " * Amellwind Hunter Traps — client bootstrap",
    " * Auto-generated by scripts/build-foundry-module.mjs — do not edit by hand.",
    " * Arms canvas trigger, camouflage notices, and 1-hour expiry.",
    " */",
    engine.trim(),
    "",
    'Hooks.once("ready", () => {',
    "  try {",
    "    globalThis.__amellwindHunterTraps?.ensureHooks?.();",
    '    console.log("Amellwind Hunter Traps | canvas hooks armed");',
    "  } catch (err) {",
    '    console.error("Amellwind Hunter Traps | failed to arm hooks", err);',
    "  }",
    "});",
    "",
  ].join("\n");

  const scriptsDir = path.join(MODULE_DIR, "scripts");
  fs.mkdirSync(scriptsDir, { recursive: true });
  fs.writeFileSync(path.join(scriptsDir, "hunter-traps.js"), `${client}\n`);
  console.log('  ok client script "scripts/hunter-traps.js"');
  return true;
}

async function main() {
  console.log(`Building Foundry module "${MODULE_ID}" from ${path.relative(ROOT, SRC_DIR)}`);
  fs.mkdirSync(PACKS_DIR, { recursive: true });

  let totalEntries = 0;
  for (const def of PACKS) {
    const { entries } = await buildPack(def);
    totalEntries += entries;
  }

  const iconCount = copyIcons();
  const tokenCount = copyTokens();
  buildResourceNodeClientScript();
  buildHiddenDetectionClientScript();
  buildFelyneCookClientScript();
  buildDireMiralisClientScript();
  buildHunterTrapsClientScript();
  fs.rmSync(STAGING_DIR, { force: true, recursive: true, maxRetries: 10 });

  console.log(`Done: ${totalEntries} documents across ${PACKS.length} packs, ${iconCount} mh-icons, ${tokenCount} mh-tokens bundled.`);
}

main().catch((err) => {
  console.error("Foundry module build failed:", err);
  process.exitCode = 1;
});
