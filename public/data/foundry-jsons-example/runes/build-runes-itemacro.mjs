/**
 * Re-injects the shared unified rune Item Macro into every curated rune JSON.
 *
 * Shared controller: public/data/scripts/runes/unified-rune-controller.js
 * Per-rune combat / on-equip code is preserved from each JSON (section after
 * "// ===== rune-specific combat passes ====="), except for known Partbreaker+1
 * runes which pull public/data/scripts/runes/partbreaker-plus-one.fragment.js.
 *
 * Run: node public/data/foundry-jsons-example/runes/build-runes-itemacro.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  composeRuneItemMacroCommand,
  readPartbreakerPlusOneFragment,
  RUNE_COMBAT_MARKER,
  RUNE_COMBAT_PLACEHOLDER,
} from "../../scripts/runes/compose-rune-itemacro.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RUNES_DIR = __dirname;

/** Basename → use shared Partbreaker+1 fragment instead of preserved tail. */
const PARTBREAKER_PLUS_ONE = new Set([
  "fvtt-Item-coral-pukei-pukei-coral-pukei-pukei-shard-rune.json",
  "fvtt-Item-duramboros-duram-carapace-rune.json",
  "fvtt-Item-uragaan-uragaan-scute-rune.json",
]);

const partbreakerFragment = readPartbreakerPlusOneFragment();

function walkRuneItems(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name.startsWith("_")) continue;
      walkRuneItems(full, out);
      continue;
    }
    if (entry.name.startsWith("fvtt-Item-") && entry.name.endsWith(".json")) {
      out.push(full);
    }
  }
  return out;
}

/**
 * Pull per-rune code after the combat marker.
 * Supports old layout (marker after on/off) and new layout (marker before on/off).
 */
function extractCombatPasses(command) {
  const idx = command.indexOf(RUNE_COMBAT_MARKER);
  if (idx < 0) return { hasMarker: false, body: "" };

  let after = command.slice(idx + RUNE_COMBAT_MARKER.length);
  if (after.startsWith("\r\n")) after = after.slice(2);
  else if (after.startsWith("\n")) after = after.slice(1);

  if (after.startsWith(RUNE_COMBAT_PLACEHOLDER)) {
    after = after.slice(RUNE_COMBAT_PLACEHOLDER.length);
    if (after.startsWith("\r\n")) after = after.slice(2);
    else if (after.startsWith("\n")) after = after.slice(1);
  }

  const onMatch = after.match(/\nif \(arg0 === "on"\)/);
  if (onMatch && onMatch.index != null) {
    return { hasMarker: true, body: after.slice(0, onMatch.index).trim() };
  }
  if (after.trimStart().startsWith('if (arg0 === "on")')) {
    return { hasMarker: true, body: "" };
  }
  return { hasMarker: true, body: after.trim() };
}

const files = walkRuneItems(RUNES_DIR);
let updated = 0;
let skipped = 0;
const notes = [];

for (const filePath of files) {
  const base = path.basename(filePath);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const macro = data?.flags?.itemacro?.macro;
  if (!macro || typeof macro.command !== "string") {
    notes.push(`skip (no itemacro): ${path.relative(RUNES_DIR, filePath)}`);
    skipped += 1;
    continue;
  }

  let combatBody;
  if (PARTBREAKER_PLUS_ONE.has(base)) {
    combatBody = partbreakerFragment;
  } else {
    const extracted = extractCombatPasses(macro.command);
    if (!extracted.hasMarker) {
      notes.push(`skip (no combat marker): ${path.relative(RUNES_DIR, filePath)}`);
      skipped += 1;
      continue;
    }
    combatBody = extracted.body;
  }

  const nextCommand = composeRuneItemMacroCommand(combatBody);
  if (macro.command === nextCommand) {
    skipped += 1;
    continue;
  }

  macro.command = nextCommand;
  fs.writeFileSync(filePath, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  updated += 1;
}

console.log(`Rune Item Macro sync: updated ${updated}, unchanged/skipped ${skipped}, total ${files.length}`);
if (notes.length) {
  console.log("Notes:");
  for (const n of notes) console.log(`  - ${n}`);
}
