// Validate that every mh-tokens/ path referenced in foundry-jsons-example
// resolves to a file under public/mh-tokens/ before bundling the module.
//
// Run with: pnpm validate:mh-tokens

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const SRC_DIR = path.join(ROOT, "public", "data", "foundry-jsons-example");
const TOKENS_DIR = path.join(ROOT, "public", "mh-tokens");

const TOKEN_REF_RE = /mh-tokens\/([A-Za-z0-9._-]+\.webp)/g;

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

function collectTokenRefs() {
  const refs = new Map(); // token file -> Set<source json paths>
  for (const file of walkJsonFiles(SRC_DIR)) {
    const text = fs.readFileSync(file, "utf8");
    for (const match of text.matchAll(TOKEN_REF_RE)) {
      const tokenFile = match[1];
      const rel = path.relative(ROOT, file);
      if (!refs.has(tokenFile)) refs.set(tokenFile, new Set());
      refs.get(tokenFile).add(rel);
    }
  }
  return refs;
}

function main() {
  if (!fs.existsSync(TOKENS_DIR)) {
    console.error(`mh-tokens directory not found: ${TOKENS_DIR}`);
    process.exitCode = 1;
    return;
  }

  const refs = collectTokenRefs();
  const missing = [];

  for (const [tokenFile, sources] of refs) {
    const full = path.join(TOKENS_DIR, tokenFile);
    if (!fs.existsSync(full)) {
      missing.push({ tokenFile, sources: [...sources].sort() });
    }
  }

  if (missing.length === 0) {
    console.log(`ok: ${refs.size} mh-tokens reference(s) in foundry-jsons-example`);
    return;
  }

  console.error(`Missing ${missing.length} mh-token file(s) under public/mh-tokens/:\n`);
  for (const { tokenFile, sources } of missing.sort((a, b) => a.tokenFile.localeCompare(b.tokenFile))) {
    console.error(`  - ${tokenFile}`);
    for (const src of sources) console.error(`      referenced in ${src}`);
  }
  process.exitCode = 1;
}

main();
