import { DMG_TYPE_LABELS } from "@/shared/types";
import type { ItemBaseIndexes, RawItemEntity } from "./item-raw.types";

const ITEM_ENTRY_WHOLE =
  /^\s*\{#itemEntry\s+([^}|]+)(?:\|([^}]+))?\}\s*$/i;

function capitalizeDamageType(value: string): string {
  const key = value.trim().toLowerCase();
  if (DMG_TYPE_LABELS[key]) return DMG_TYPE_LABELS[key];
  if (!key) return value;
  return key.charAt(0).toUpperCase() + key.slice(1);
}

/** 5etools `getFullImmRes` — human-readable damage type list. */
function formatFullImmRes(value: unknown): string {
  const parts = Array.isArray(value) ? value : value != null ? [value] : [];
  return parts
    .map((part) => capitalizeDamageType(String(part)))
    .filter(Boolean)
    .join(", ");
}

function readItemPath(item: RawItemEntity, path: string): unknown {
  const key = path.replace(/^item\./, "").trim();
  if (!key) return undefined;
  return item[key];
}

/**
 * Expand `{{item.*}}` / `{{getFullImmRes item.*}}` placeholders used by
 * items-base.json `itemEntry.entriesTemplate`.
 */
export function resolveItemEntryTemplateVars(
  text: string,
  item: RawItemEntity,
): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (_m, rawExpr: string) => {
    const expr = rawExpr.trim();
    if (expr.startsWith("getFullImmRes ")) {
      const path = expr.slice("getFullImmRes ".length).trim();
      return formatFullImmRes(readItemPath(item, path));
    }
    if (expr.startsWith("item.")) {
      const value = readItemPath(item, expr);
      if (Array.isArray(value)) return formatFullImmRes(value);
      return value != null ? String(value) : "";
    }
    return "";
  });
}

function applyTemplateVarsDeep(
  entry: unknown,
  item: RawItemEntity,
): unknown {
  if (typeof entry === "string") {
    return resolveItemEntryTemplateVars(entry, item);
  }
  if (Array.isArray(entry)) {
    return entry.map((child) => applyTemplateVarsDeep(child, item));
  }
  if (entry && typeof entry === "object") {
    const obj = entry as Record<string, unknown>;
    const out: Record<string, unknown> = { ...obj };
    if (typeof out.name === "string") {
      out.name = resolveItemEntryTemplateVars(out.name, item);
    }
    if (typeof out.text === "string") {
      out.text = resolveItemEntryTemplateVars(out.text, item);
    }
    if (Array.isArray(out.entries)) {
      out.entries = out.entries.map((child) =>
        applyTemplateVarsDeep(child, item),
      );
    }
    if (Array.isArray(out.items)) {
      out.items = out.items.map((child) => applyTemplateVarsDeep(child, item));
    }
    return out;
  }
  return entry;
}

function lookupItemEntryTemplate(
  name: string,
  source: string | undefined,
  indexes: ItemBaseIndexes,
): unknown[] | null {
  const map = indexes.itemEntries;
  if (!map || map.size === 0) return null;

  if (source) {
    const exact = map.get(`${name}|${source}`.toLowerCase());
    if (exact) return exact;
  }
  return map.get(name.toLowerCase()) ?? null;
}

/**
 * Replace whole-entry `{#itemEntry Name|Source}` refs with the resolved
 * `entriesTemplate` from items-base.json, with item template vars filled in.
 */
export function expandItemEntryRefs(
  entries: unknown[],
  item: RawItemEntity,
  indexes: ItemBaseIndexes,
): unknown[] {
  const out: unknown[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      const match = entry.match(ITEM_ENTRY_WHOLE);
      if (match) {
        const name = match[1].trim();
        const source = match[2]?.trim();
        const template = lookupItemEntryTemplate(name, source, indexes);
        if (template) {
          for (const piece of template) {
            out.push(applyTemplateVarsDeep(piece, item));
          }
          continue;
        }
      }
      out.push(resolveItemEntryTemplateVars(entry, item));
      continue;
    }

    if (entry && typeof entry === "object") {
      const obj = entry as Record<string, unknown>;
      if (Array.isArray(obj.entries)) {
        out.push({
          ...obj,
          entries: expandItemEntryRefs(obj.entries, item, indexes),
        });
        continue;
      }
    }

    out.push(entry);
  }

  return out;
}
