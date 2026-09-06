/**
 * Compose a full rune Item Macro command from the shared controller + optional combat passes.
 * Canonical controller: ./unified-rune-controller.js
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const RUNE_COMBAT_MARKER = "// ===== rune-specific combat passes =====";
export const RUNE_COMBAT_PLACEHOLDER = "/* @@RUNE_COMBAT_PASSES@@ */";

const PLACEHOLDER_LINE = new RegExp(
  `^[ \\t]*${RUNE_COMBAT_PLACEHOLDER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}[ \\t]*\\r?$`,
  "m",
);

const controllerTemplate = fs.readFileSync(
  path.join(__dirname, "unified-rune-controller.js"),
  "utf8",
);

if (!PLACEHOLDER_LINE.test(controllerTemplate)) {
  throw new Error(`unified-rune-controller.js is missing a standalone ${RUNE_COMBAT_PLACEHOLDER} line`);
}
if (
  controllerTemplate.indexOf(RUNE_COMBAT_PLACEHOLDER)
  !== controllerTemplate.lastIndexOf(RUNE_COMBAT_PLACEHOLDER)
) {
  throw new Error(
    `unified-rune-controller.js must contain ${RUNE_COMBAT_PLACEHOLDER} exactly once`,
  );
}

/**
 * @param {string} [combatPasses] Per-rune Midi/on-equip code (no combat marker required).
 * @returns {string} Full Item Macro command ready to embed in flags.itemacro.macro.command
 */
export function composeRuneItemMacroCommand(combatPasses = "") {
  const trimmed = String(combatPasses ?? "").trim();
  const injection = trimmed ? `${trimmed}\n` : "";
  return `${controllerTemplate.replace(PLACEHOLDER_LINE, injection).replace(/\s+$/, "")}\n`;
}

export function readPartbreakerPlusOneFragment() {
  return fs.readFileSync(path.join(__dirname, "partbreaker-plus-one.fragment.js"), "utf8").trim();
}
