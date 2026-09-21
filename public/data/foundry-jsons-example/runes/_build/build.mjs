/**
 * Build curated Foundry rune JSON batches.
 *
 * Usage:
 *   node public/data/foundry-jsons-example/runes/_build/build.mjs <batch>
 *   node public/data/foundry-jsons-example/runes/_build/build.mjs --list
 *   node public/data/foundry-jsons-example/runes/_build/build.mjs --all
 *
 * Batches live in ./batches/<name>.mjs with optional ./data/<name>/{ids,meta}.json
 * Shared builders: public/data/scripts/runes/build-rune-lib.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BATCH_DIR = path.join(__dirname, "batches");

function listBatches() {
  return fs
    .readdirSync(BATCH_DIR)
    .filter((f) => f.endsWith(".mjs"))
    .map((f) => f.replace(/\.mjs$/, ""))
    .sort();
}

const arg = process.argv[2];
const batches = listBatches();

if (!arg || arg === "--help" || arg === "-h") {
  console.log(`Usage: node .../_build/build.mjs <batch|--list|--all>

Batches:
${batches.map((b) => `  - ${b}`).join("\n")}`);
  process.exit(arg ? 0 : 1);
}

if (arg === "--list") {
  for (const b of batches) console.log(b);
  process.exit(0);
}

const toRun = arg === "--all" ? batches : [arg];
for (const name of toRun) {
  if (!batches.includes(name)) {
    console.error(`Unknown batch "${name}". Use --list.`);
    process.exit(1);
  }
  const file = path.join(BATCH_DIR, `${name}.mjs`);
  console.log(`\n=== Building batch: ${name} ===`);
  await import(pathToFileURL(file).href);
}
