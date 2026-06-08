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
  [/\{@item ([^}|]+)(?:\|[^}]*)?\}/g, (_m, item) => item],
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
