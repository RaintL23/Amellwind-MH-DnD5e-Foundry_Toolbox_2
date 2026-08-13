// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const EFFECT_ITEM_TYPES = new Set(["MHPSA", "MHCB", "MHABG", "MHADR"]);

function findEffectTable(
  entries: unknown[],
): { effectCol: number; typeCol: number; rows: unknown[][] } | null {
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const obj = entry as Raw;

    if (obj.type === "table" && Array.isArray(obj.colLabels) && Array.isArray(obj.rows)) {
      const labels = (obj.colLabels as string[]).map((l) => l.toLowerCase());
      const effectCol = labels.indexOf("effect");
      if (effectCol >= 0) {
        const typeCol = labels.indexOf("type");
        return {
          effectCol,
          typeCol,
          rows: obj.rows as unknown[][],
        };
      }
    }

    if (Array.isArray(obj.entries)) {
      const found = findEffectTable(obj.entries as unknown[]);
      if (found) return found;
    }
  }

  return null;
}

function extractStringEffect(entries: unknown[]): string {
  for (const entry of entries) {
    if (typeof entry !== "string") continue;
    if (/can only be used with/i.test(entry)) continue;
    const text = entry.trim();
    if (text) return text;
  }
  return "";
}

function addAlias(map: Map<string, string>, alias: string, effect: string): void {
  const key = alias.trim().toLowerCase();
  if (!key || map.has(key)) return;
  map.set(key, effect);
}

function aliasesFromName(name: string): string[] {
  const result = [name];
  let current = name;

  while (/\([^)]*\)/.test(current)) {
    current = current.replace(/\s*\([^)]*\)\s*$/, "").trim();
    if (current) result.push(current);
  }

  return result;
}

function buildItemEffectsMap(raw: Raw): Map<string, string> {
  const map = new Map<string, string>();
  const entries = Array.isArray(raw.entries) ? (raw.entries as unknown[]) : [];
  const name = String(raw.name ?? "").trim();
  if (!name) return map;

  const table = findEffectTable(entries);
  if (table) {
    for (const row of table.rows) {
      const effect = String(row[table.effectCol] ?? "").trim();
      if (!effect) continue;

      for (const alias of aliasesFromName(name)) {
        addAlias(map, alias, effect);
      }

      if (table.typeCol >= 0) {
        const typeName = String(row[table.typeCol] ?? "")
          .replace(/:+$/, "")
          .trim();
        if (typeName) addAlias(map, typeName, effect);
      }
    }
    return map;
  }

  const effect = extractStringEffect(entries);
  if (!effect) return map;

  for (const alias of aliasesFromName(name)) {
    addAlias(map, alias, effect);
  }

  return map;
}

/** Builds a lookup map from MH item display names to their effect text. */
export function mapMhItemEffects(
  rawItems: unknown[],
): Map<string, string> {
  const map = new Map<string, string>();

  for (const item of rawItems) {
    if (typeof item !== "object" || item === null) continue;
    const raw = item as Raw;
    if (!EFFECT_ITEM_TYPES.has(String(raw.type ?? ""))) continue;

    for (const [alias, effect] of buildItemEffectsMap(raw)) {
      addAlias(map, alias, effect);
    }
  }

  return map;
}
