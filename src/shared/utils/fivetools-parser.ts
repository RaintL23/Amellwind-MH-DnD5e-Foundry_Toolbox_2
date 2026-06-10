/**
 * Parser de marcado de texto de 5etools.
 * Convierte las etiquetas de 5etools en texto legible.
 */

const FIVETOOLS_PATTERNS: Array<[RegExp, string | ((match: string, ...args: string[]) => string)]> = [
  [/\{@atk mw\}/g, "Melee Weapon Attack:"],
  [/\{@atk rw\}/g, "Ranged Weapon Attack:"],
  [/\{@atk mw,rw\}/g, "Melee or Ranged Weapon Attack:"],
  [/\{@h\}/g, "Hit:"],
  [/\{@hit (-?\d+)\}/g, (_m, n) => `+${n} to hit`],
  [/\{@damage ([^}]+)\}/g, (_m, dmg) => dmg],
  [/\{@dc (\d+)\}/g, (_m, n) => `DC ${n}`],
  [/\{@recharge (\d+)\}/g, (_m, n) => `(Recharge ${n}–6)`],
  [/\{@condition ([^}|]+)(?:\|[^}]*)?\}/g, (_m, cond) => cond],
  [/\{@spell ([^}|]+)(?:\|[^}]*)?\}/g, (_m, spell) => spell],
  [/\{@skill ([^}|]+)(?:\|[^}]*)?\}/g, (_m, skill) => skill],
  [
    /\{@item ([^}|]+)(?:\|([^}|]*))?(?:\|([^}|]*))?\}/g,
    (_m, item, _source, display) => display?.trim() || item,
  ],
  [/\{@creature ([^}|]+)(?:\|[^}]*)?\}/g, (_m, creature) => creature],
  [/\{@action ([^}|]+)(?:\|[^}]*)?\}/g, (_m, action) => action],
  [
    /\{@dice ([^}|]+)(?:\|([^}|]*))?(?:\|([^}|]*))?\}/g,
    (_m, roll, display, label) => {
      const shown = (display?.trim() || roll?.trim()) ?? "";
      return label?.trim() ? `${label.trim()}: ${shown}` : shown;
    },
  ],
  [/\{@filter ([^}|]+)(?:\|[^}]*)?\}/g, (_m, text) => text],
  [/\{@adventure ([^}|]+)(?:\|[^}]*)?\}/g, (_m, text) => text],
  [/\{@book ([^}|]+)(?:\|[^}]*)?\}/g, (_m, text) => text],
  [/\{@quickref ([^}|]+)(?:\|[^}]*)?\}/g, (_m, text) => text],
  [/\{@variantrule ([^}|]+)(?:\|[^}]*)?\}/g, (_m, text) => text],
  [/\{@actSave (\w+)\}/g, (_m, save) => `${save.toUpperCase()} save`],
  [/\{@actSaveFail\}/g, "On a failed save"],
  [/\{@actSaveSuccess\}/g, "On a successful save"],
  [/\{@actSaveSuccessOrFail\}/g, "Whether the save succeeds or fails"],
  [/\{@atkr ([^}]+)\}/g, (_m, mode) => `${mode.toUpperCase()} Attack:`],
  [/\{@chance [^}]+\}/g, ""],
  [/\{@b ([^}]+)\}/g, (_m, text) => text],
  [/\{@bold ([^}]+)\}/g, (_m, text) => text],
  [/\{@i ([^}]+)\}/g, (_m, text) => text],
  [/\{@italic ([^}]+)\}/g, (_m, text) => text],
  [/\{@[a-zA-Z]+ ([^}|]+)(?:\|[^}]*)?\}/g, (_m, text) => text],
];

export function parseFiveToolsMarkup(text: string): string {
  let result = text;
  for (const [pattern, replacement] of FIVETOOLS_PATTERNS) {
    if (typeof replacement === "string") {
      result = result.replace(pattern, replacement);
    } else {
      result = result.replace(pattern, replacement as (...args: string[]) => string);
    }
  }
  return result;
}

export function parseEntries(entries: unknown[]): string {
  return entries
    .map((entry) => {
      if (typeof entry === "string") return parseFiveToolsMarkup(entry);
      if (typeof entry === "object" && entry !== null) {
        const obj = entry as Record<string, unknown>;
        if (typeof obj["text"] === "string") return parseFiveToolsMarkup(obj["text"]);
        if (Array.isArray(obj["entries"])) return parseEntries(obj["entries"] as unknown[]);
        if (obj["type"] === "list" && Array.isArray(obj["items"])) {
          return (obj["items"] as unknown[])
            .map((item) =>
              typeof item === "string"
                ? parseFiveToolsMarkup(item)
                : parseEntries([item]),
            )
            .filter(Boolean)
            .join("; ");
        }
        if (obj["type"] === "table" && typeof obj["caption"] === "string") {
          return parseFiveToolsMarkup(obj["caption"]);
        }
      }
      return "";
    })
    .filter(Boolean)
    .join(" ");
}

/**
 * Flattens 5etools entry arrays into multiline display text while preserving
 * {@…} markup for DndRichText. List items are emitted as bullet lines.
 */
export function flattenEntriesForDisplay(entries: unknown[]): string {
  const lines: string[] = [];

  function append(entry: unknown): void {
    if (typeof entry === "string") {
      if (entry.trim()) lines.push(entry);
      return;
    }
    if (typeof entry !== "object" || entry === null) return;

    const obj = entry as Record<string, unknown>;

    if (typeof obj.text === "string") {
      if (obj.text.trim()) lines.push(obj.text);
      return;
    }

    if (obj.type === "list" && Array.isArray(obj.items)) {
      for (const item of obj.items) {
        if (typeof item === "string") {
          lines.push(`• ${item}`);
          continue;
        }
        const nested = flattenEntriesForDisplay([item]);
        if (nested) lines.push(`• ${nested.replace(/\n/g, "\n  ")}`);
      }
      return;
    }

    if (Array.isArray(obj.entries)) {
      for (const nested of obj.entries) append(nested);
    }
  }

  for (const entry of entries) append(entry);
  return lines.join("\n");
}

export function splitDisplayTextLines(text: string): string[] {
  return text
    .split(/\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
