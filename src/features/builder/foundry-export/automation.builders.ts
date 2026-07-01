import type { FoundryItem } from "./foundry.types";
import { buildEffect } from "./effect.builders";
import { lookupAutomation } from "./automation.data";

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
  const overlay = lookupAutomation(item.name, source);
  if (!overlay) return;

  for (const eff of overlay.effects ?? []) {
    item.effects.push(
      buildEffect({
        name: eff.name ?? item.name,
        img: eff.img ?? item.img,
        transfer: eff.transfer,
        disabled: eff.disabled,
        duration: eff.duration,
        flags: eff.flags,
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
}
