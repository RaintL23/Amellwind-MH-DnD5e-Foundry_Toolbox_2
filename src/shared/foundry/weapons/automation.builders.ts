import type { FoundryItem } from "../types";
import { buildEffect } from "../effects";
import { lookupAutomation } from "./automation.data";
import { linkNonTransferEffectsToActivities } from "../midi";

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Recursively merges `source` into `target`, returning a new object. */
function deepMerge(
  target: Record<string, unknown>,
  source: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...target };
  for (const [key, value] of Object.entries(source)) {
    const existing = out[key];
    out[key] =
      isPlainObject(existing) && isPlainObject(value)
        ? deepMerge(existing, value)
        : value;
  }
  return out;
}

/**
 * Applies the Midi-QoL / DAE automation overlay for `item` (matched by name),
 * mutating it in place: appends the overlay's Active Effects and deep-merges any
 * item-level flags. No-op when no automation exists for the item.
 */
export function applyItemAutomation(item: FoundryItem, source?: string): void {
  const systemSource = item.system.source;
  const book =
    source ??
    (typeof systemSource === "object" &&
    systemSource !== null &&
    "book" in systemSource
      ? String((systemSource as { book?: string }).book ?? "")
      : undefined);
  const rules =
    typeof systemSource === "object" &&
    systemSource !== null &&
    "rules" in systemSource
      ? String((systemSource as { rules?: string }).rules ?? "")
      : undefined;
  const overlay = lookupAutomation(item.name, book, rules);
  if (!overlay) return;

  for (const eff of overlay.effects ?? []) {
    const flags = { ...(eff.flags ?? {}) };
    if (eff.transfer === false) {
      const dae = {
        ...((flags.dae as Record<string, unknown> | undefined) ?? {}),
      };
      if (dae.showIcon === undefined) dae.showIcon = true;
      flags.dae = dae;
    }
    item.effects.push(
      buildEffect({
        name: eff.name ?? item.name,
        img: eff.img ?? item.img,
        transfer: eff.transfer,
        disabled: eff.disabled,
        duration: eff.duration,
        flags,
        statuses: eff.statuses,
        changes: eff.changes.map((c) => ({
          key: c.key,
          mode: c.mode,
          value: c.value,
          priority: c.priority ?? 20,
        })),
      }),
    );
  }

  if (overlay.flags) {
    item.flags = deepMerge(item.flags, overlay.flags);
  }

  linkNonTransferEffectsToActivities(item);
}
