/**
 * Item Macro 2.x + Midi QoL 12.4 wiring for exported items.
 * Midi runs `flags.itemacro.macro.command` when `onUseMacroName` lists `[pass]ItemMacro`.
 */

import type { FoundryItem } from "./types";
import { FOUNDRY_EXPORT_TARGET } from "./target";

/** Midi 12.4 on-use passes used by Amellwind item macros. */
export const MIDI_ON_USE_PASSES = [
  "preTargeting",
  "preItemRoll",
  "preambleComplete",
  "preAttackRoll",
  "postAttackRoll",
  "preDamageRoll",
  "postDamageRoll",
  "preSave",
  "postSave",
  "preActiveEffects",
  "postActiveEffects",
] as const;

export type MidiOnUsePass = (typeof MIDI_ON_USE_PASSES)[number];

export interface MidiOnUseMacroPart {
  macroName: "ItemMacro";
  option: MidiOnUsePass;
}

export interface EmbedItemMacroOptions {
  command: string;
  passes: readonly MidiOnUsePass[];
  /** Macro document name; defaults to the item name. */
  name?: string;
  /**
   * `merge` (default) keeps other `flags.midi-qol` keys.
   * `replace` writes only on-use fields (matches Hunting Horn example JSON).
   */
  midiMode?: "merge" | "replace";
}

function isMidiOnUsePass(value: string): value is MidiOnUsePass {
  return (MIDI_ON_USE_PASSES as readonly string[]).includes(value);
}

/** `[preTargeting]ItemMacro,[postDamageRoll]ItemMacro` */
export function midiOnUseMacroName(passes: readonly MidiOnUsePass[]): string {
  return passes.map((pass) => `[${pass}]ItemMacro`).join(",");
}

export function midiOnUseMacroParts(
  passes: readonly MidiOnUsePass[],
): { items: MidiOnUseMacroPart[] } {
  return {
    items: passes.map((option) => ({ macroName: "ItemMacro", option })),
  };
}

/** Parses Midi's comma-separated `onUseMacroName` into ordered ItemMacro passes. */
export function parseMidiOnUseMacroName(value: unknown): MidiOnUsePass[] {
  if (typeof value !== "string" || !value.trim()) return [];
  const passes: MidiOnUsePass[] = [];
  for (const chunk of value.split(",")) {
    const trimmed = chunk.trim();
    const bracket = trimmed.match(/^\[([^\]]+)\]ItemMacro(?:\b|$)/i);
    if (bracket && isMidiOnUsePass(bracket[1]!)) {
      passes.push(bracket[1]!);
      continue;
    }
    const commaForm = trimmed.match(/^ItemMacro\s*,\s*(.+)$/i);
    if (commaForm) {
      const pass = commaForm[1]!.trim();
      if (isMidiOnUsePass(pass)) passes.push(pass);
    }
  }
  return passes;
}

/** Item Macro 2.x document stored at `flags.itemacro.macro` (Foundry 12). */
export function buildItemMacroDocument(opts: {
  name: string;
  command: string;
}): Record<string, unknown> {
  return {
    name: opts.name,
    type: "script",
    scope: "global",
    author: "",
    img: "icons/svg/dice-target.svg",
    command: opts.command,
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {},
    _stats: {
      coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
      systemId: FOUNDRY_EXPORT_TARGET.systemId,
      systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
    },
  };
}

/** Midi + Item Macro flag pair for spreading into a new `flags` object. */
export function itemMacroFlagBundle(opts: {
  name: string;
  command: string;
  passes: readonly MidiOnUsePass[];
}): { "midi-qol": Record<string, unknown>; itemacro: Record<string, unknown> } {
  return {
    "midi-qol": {
      onUseMacroName: midiOnUseMacroName(opts.passes),
      onUseMacroParts: midiOnUseMacroParts(opts.passes),
    },
    itemacro: {
      macro: buildItemMacroDocument({
        name: opts.name,
        command: opts.command,
      }),
    },
  };
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Embeds an Item Macro and Midi on-use hooks on `item.flags`.
 * Preserves `world` / toolbox flags; only `midi-qol` on-use + `itemacro` change.
 */
export function embedItemMacro(
  item: FoundryItem,
  opts: EmbedItemMacroOptions,
): void {
  const bundle = itemMacroFlagBundle({
    name: opts.name ?? item.name,
    command: opts.command,
    passes: opts.passes,
  });
  const existingMidi = isPlainObject(item.flags["midi-qol"])
    ? item.flags["midi-qol"]
    : {};
  const midiQol =
    opts.midiMode === "replace"
      ? bundle["midi-qol"]
      : { ...existingMidi, ...bundle["midi-qol"] };

  item.flags = {
    ...item.flags,
    "midi-qol": midiQol,
    itemacro: bundle.itemacro,
  };
}

function itemMacroCommand(item: FoundryItem): string {
  const bag = item.flags.itemacro;
  if (!isPlainObject(bag)) return "";
  const macro = bag.macro;
  if (!isPlainObject(macro)) return "";
  return typeof macro.command === "string" ? macro.command : "";
}

/**
 * When an item already has an Item Macro, ensure Midi 12.4 on-use parts and
 * the Item Macro 2.x document envelope are complete (does not invent passes).
 */
export function normalizeItemMacroFlags(item: FoundryItem): void {
  const command = itemMacroCommand(item);
  const midi = isPlainObject(item.flags["midi-qol"])
    ? item.flags["midi-qol"]
    : undefined;
  const namedPasses = parseMidiOnUseMacroName(midi?.onUseMacroName);

  if (!command && namedPasses.length === 0) return;

  if (command) {
    const bag = isPlainObject(item.flags.itemacro) ? item.flags.itemacro : {};
    const macro = isPlainObject(bag.macro) ? bag.macro : {};
    item.flags = {
      ...item.flags,
      itemacro: {
        ...bag,
        macro: {
          ...buildItemMacroDocument({ name: item.name, command }),
          ...macro,
          command,
          name: typeof macro.name === "string" && macro.name ? macro.name : item.name,
        },
      },
    };
  }

  if (namedPasses.length === 0) return;
  const currentMidi = isPlainObject(item.flags["midi-qol"])
    ? item.flags["midi-qol"]
    : {};
  const parts = currentMidi.onUseMacroParts;
  const hasParts =
    isPlainObject(parts) && Array.isArray(parts.items) && parts.items.length > 0;
  if (hasParts && typeof currentMidi.onUseMacroName === "string") return;

  item.flags = {
    ...item.flags,
    "midi-qol": {
      ...currentMidi,
      onUseMacroName: midiOnUseMacroName(namedPasses),
      onUseMacroParts: midiOnUseMacroParts(namedPasses),
    },
  };
}
