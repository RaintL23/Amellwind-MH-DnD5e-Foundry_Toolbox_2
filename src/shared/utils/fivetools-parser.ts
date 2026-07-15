/**
 * Parser de marcado de texto de 5etools.
 * Convierte las etiquetas de 5etools en texto legible.
 */

import { ABILITY_NAMES, toAbilityKey } from "@/shared/constants/dnd/abilities.constants";

/**
 * Formats a 5etools `{ type: "abilityDc", name, attributes }` block into book-style text.
 * Example: `Ammo save DC = 8 + your proficiency bonus + your Dexterity modifier`
 */
export function formatAbilityDcText(
  name: string,
  attributes: unknown,
): string {
  const attrKeys = Array.isArray(attributes)
    ? attributes
        .map((attr) => toAbilityKey(String(attr)))
        .filter((key): key is NonNullable<typeof key> => key != null)
    : [];

  const abilityPart =
    attrKeys.length === 0
      ? "your ability modifier"
      : attrKeys.length === 1
        ? `your ${ABILITY_NAMES[attrKeys[0]]} modifier`
        : `your ${attrKeys.map((key) => ABILITY_NAMES[key]).join(" or ")} modifier`;

  const label = name.trim() || "Save";
  return `${label} save DC = 8 + your proficiency bonus + ${abilityPart}`;
}

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
        if (obj["type"] === "abilityDc") {
          return formatAbilityDcText(
            typeof obj["name"] === "string" ? obj["name"] : "Save",
            obj["attributes"],
          );
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

    if (obj.type === "abilityDc") {
      lines.push(
        formatAbilityDcText(
          typeof obj.name === "string" ? obj.name : "Save",
          obj.attributes,
        ),
      );
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

export interface RenderEntriesOptions {
  /** Bullet prefix for plain string list items. */
  bullet?: string;
  /** Render `{type:"item", name, entry}` list children as `• **name**: entry`. */
  renderItemObjects?: boolean;
  /** Emit a bold `**name**` heading for named `type:"entries"` blocks. */
  boldNamedEntries?: boolean;
  /** Emit a bold `**caption**` line for `type:"table"` blocks. */
  renderTableCaption?: boolean;
  /** Prefix added to each line produced by a `type:"inset"` block (null = none). */
  insetPrefix?: string | null;
}

/**
 * Canonical 5etools entries → display-paragraph renderer.
 *
 * Replaces the near-identical `renderEntries` helpers that several mappers
 * (items, spells, optional features…) used to hand-roll. The richest behavior
 * (used by items/spells) is the default; simpler consumers opt out of the
 * extra node handling via {@link RenderEntriesOptions} so their output is
 * preserved exactly.
 */
export function renderFiveToolsEntries(
  entries: unknown[],
  options: RenderEntriesOptions = {},
  depth = 0,
): string[] {
  const {
    bullet = "• ",
    renderItemObjects = true,
    boldNamedEntries = true,
    renderTableCaption = true,
    insetPrefix = "» ",
  } = options;

  const result: string[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      const text = parseFiveToolsMarkup(entry).trim();
      if (text) result.push(text);
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj = entry as Record<string, any>;

    if (obj.type === "list" && Array.isArray(obj.items)) {
      for (const item of obj.items as unknown[]) {
        if (typeof item === "string") {
          const text = parseFiveToolsMarkup(item).trim();
          if (text) result.push(`${bullet}${text}`);
        } else if (
          renderItemObjects &&
          typeof item === "object" &&
          item !== null
        ) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const subObj = item as Record<string, any>;
          if (subObj.type === "item" && subObj.name) {
            result.push(
              `${bullet}**${parseFiveToolsMarkup(String(subObj.name))}**: ${parseFiveToolsMarkup(String(subObj.entry ?? "")).trim()}`,
            );
          }
        }
      }
    } else if (boldNamedEntries && obj.type === "entries" && obj.name) {
      result.push(`**${parseFiveToolsMarkup(String(obj.name))}**`);
      if (Array.isArray(obj.entries)) {
        result.push(
          ...renderFiveToolsEntries(obj.entries as unknown[], options, depth + 1),
        );
      }
    } else if (renderTableCaption && obj.type === "table" && obj.caption) {
      result.push(`**${parseFiveToolsMarkup(String(obj.caption))}**`);
    } else if (obj.type === "abilityDc") {
      const text = formatAbilityDcText(
        typeof obj.name === "string" ? obj.name : "Save",
        obj.attributes,
      );
      if (text) result.push(text);
    } else if (obj.type === "inset" && Array.isArray(obj.entries)) {
      const inset = renderFiveToolsEntries(
        obj.entries as unknown[],
        options,
        depth,
      );
      result.push(...(insetPrefix ? inset.map((l) => `${insetPrefix}${l}`) : inset));
    } else if (Array.isArray(obj.entries)) {
      result.push(
        ...renderFiveToolsEntries(obj.entries as unknown[], options, depth),
      );
    }
  }

  return result;
}

/**
 * Preset for mappers that only flatten strings, string list items and nested
 * `entries`/`inset` blocks (no bold headings, tables, item objects or inset
 * prefixes). Matches the legacy optional-feature renderers.
 */
export const PLAIN_ENTRY_OPTIONS: RenderEntriesOptions = {
  renderItemObjects: false,
  boldNamedEntries: false,
  renderTableCaption: false,
  insetPrefix: null,
};
