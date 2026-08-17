/**
 * Stamps exported Foundry items so Midi QoL, Item Macro, Plutonium, CPR, and
 * Gambit's Premades can pick them up. Does not fake CPR/GPS "already applied"
 * flags — Medkit matches English names + `system.source.rules`.
 */

import type { FoundryItem } from "./types";
import {
  ensureActivityMidiProperties,
  ensureMidiActivityIdentifiers,
  midiOverridesForItem,
} from "./midi";
import { normalizeItemMacroFlags } from "./item-macro";
import { inferFoundryRulesVersion } from "./target";

const TOOLBOX_NS = "amellwind-toolbox";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Items CPR / GPS Medkit can overlay (canonical D&D names, not MH homebrew macros). */
function isPremadeMedkitType(type: string): boolean {
  return (
    type === "spell" ||
    type === "feat" ||
    type === "equipment" ||
    type === "consumable" ||
    type === "weapon" ||
    type === "tool"
  );
}

function alignSourceRules(item: FoundryItem): void {
  const source = item.system.source;
  if (!isPlainObject(source)) return;
  const book = typeof source.book === "string" ? source.book : "";
  if (!book.trim()) return;
  source.rules = inferFoundryRulesVersion(book);
}

function ensureDaeShowIcon(item: FoundryItem): void {
  for (const effect of item.effects) {
    if (effect.transfer !== false) continue;
    const flags = isPlainObject(effect.flags) ? effect.flags : {};
    const dae = isPlainObject(flags.dae) ? flags.dae : {};
    if (dae.showIcon !== undefined) continue;
    effect.flags = { ...flags, dae: { ...dae, showIcon: true } };
  }
}

function stampToolboxCompat(item: FoundryItem): void {
  const existing = isPlainObject(item.flags[TOOLBOX_NS])
    ? item.flags[TOOLBOX_NS]
    : {};
  const hasItemMacro = Boolean(
    isPlainObject(item.flags.itemacro) &&
      isPlainObject(item.flags.itemacro.macro) &&
      String(item.flags.itemacro.macro.command ?? "").trim(),
  );

  item.flags = {
    ...item.flags,
    [TOOLBOX_NS]: {
      ...existing,
      compat: {
        midiQol: true,
        itemMacro: hasItemMacro,
        plutonium: true,
        /** Actor/Item Medkit matches by English name + source.rules. Do not pre-stamp applied ids. */
        chrisPremades: isPremadeMedkitType(item.type) ? "medkit" : "skip",
        gambitsPremades: isPremadeMedkitType(item.type) ? "medkit" : "skip",
      },
    },
  };
}

export interface ApplyFoundryModuleCompatOptions {
  /**
   * Weapon Forge example JSON snapshots the flag/activity tree. Light mode
   * only completes Item Macro + Midi on-use parts without rewriting midiProperties.
   */
  light?: boolean;
}

/**
 * Aligns an exported item with the Foundry 12 / dnd5e 4.4.4 automation stack.
 * Safe to call more than once. Never overwrites an existing Item Macro command.
 */
export function applyFoundryModuleCompat(
  item: FoundryItem,
  opts: ApplyFoundryModuleCompatOptions = {},
): void {
  normalizeItemMacroFlags(item);
  if (opts.light) return;

  ensureActivityMidiProperties(item, midiOverridesForItem(item));
  ensureMidiActivityIdentifiers(item);
  alignSourceRules(item);
  ensureDaeShowIcon(item);
  stampToolboxCompat(item);
}
