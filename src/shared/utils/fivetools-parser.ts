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

/** Formats a 5etools table roll range (`exact` or `min`/`max`) for display. */
export function formatFiveToolsRoll(roll: unknown): string {
  if (typeof roll !== "object" || roll === null) return "";
  const obj = roll as Record<string, unknown>;
  if (typeof obj.exact === "number") return String(obj.exact);
  const min = typeof obj.min === "number" ? obj.min : null;
  const max = typeof obj.max === "number" ? obj.max : null;
  if (min != null && max != null) {
    if (min === max) return String(min);
    const pad = Math.max(String(min).length, String(max).length, 2);
    return `${String(min).padStart(pad, "0")}–${String(max).padStart(pad, "0")}`;
  }
  if (min != null) return String(min);
  if (max != null) return String(max);
  return "";
}

/**
 * Flattens a 5etools table cell (string, `{type:"cell"}`, nested entries) to
 * display text. When `parseMarkup` is true, `{@…}` tags are resolved to plain text.
 */
export function formatFiveToolsTableCell(
  cell: unknown,
  parseMarkup = true,
): string {
  const apply = (text: string) =>
    parseMarkup ? parseFiveToolsMarkup(text) : text;

  if (cell == null) return "";
  if (typeof cell === "string") return apply(cell).trim();
  if (typeof cell === "number" || typeof cell === "boolean") {
    return String(cell);
  }
  if (Array.isArray(cell)) {
    return cell
      .map((part) => formatFiveToolsTableCell(part, parseMarkup))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof cell !== "object") return "";

  const obj = cell as Record<string, unknown>;

  if (obj.type === "cell") {
    if (typeof obj.entry === "string" && obj.entry.trim()) {
      return apply(obj.entry).trim();
    }
    if (Array.isArray(obj.entry)) {
      return formatFiveToolsTableCell(obj.entry, parseMarkup);
    }
    const rollText = formatFiveToolsRoll(obj.roll);
    if (rollText) return rollText;
  }

  if (typeof obj.text === "string") return apply(obj.text).trim();
  if (typeof obj.entry === "string") return apply(obj.entry).trim();

  if (Array.isArray(obj.entries)) {
    return (obj.entries as unknown[])
      .map((part) => formatFiveToolsTableCell(part, parseMarkup))
      .filter(Boolean)
      .join(" ");
  }

  const rollText = formatFiveToolsRoll(obj.roll);
  if (rollText) return rollText;

  return "";
}

export interface FiveToolsTableData {
  caption?: string;
  colLabels: string[];
  rows: string[][];
  footnotes?: string[];
}

/** Maps a raw 5etools `{type:"table"}` object into display-ready string cells. */
export function mapFiveToolsTable(
  raw: Record<string, unknown>,
  parseMarkup = true,
): FiveToolsTableData {
  const apply = (text: string) =>
    parseMarkup ? parseFiveToolsMarkup(text) : text;

  const colLabels = Array.isArray(raw.colLabels)
    ? (raw.colLabels as unknown[]).map((label) =>
        apply(String(label ?? "")).trim(),
      )
    : [];

  const rows = Array.isArray(raw.rows)
    ? (raw.rows as unknown[]).map((row) => {
        const cells = Array.isArray(row) ? row : [row];
        return cells.map((cell) => formatFiveToolsTableCell(cell, parseMarkup));
      })
    : [];

  const footnotes = Array.isArray(raw.footnotes)
    ? (raw.footnotes as unknown[])
        .map((note) =>
          typeof note === "string"
            ? apply(note).trim()
            : formatFiveToolsTableCell(note, parseMarkup),
        )
        .filter(Boolean)
    : undefined;

  const caption =
    typeof raw.caption === "string" ? apply(raw.caption).trim() : undefined;

  return {
    caption: caption || undefined,
    colLabels,
    rows,
    footnotes: footnotes?.length ? footnotes : undefined,
  };
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
        if (obj["type"] === "table") {
          const table = mapFiveToolsTable(obj);
          const parts = [
            table.caption,
            table.colLabels.join(" | "),
            ...table.rows.map((row) => row.join(" | ")),
          ].filter(Boolean);
          return parts.join("; ");
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

    if (obj.type === "table") {
      const table = mapFiveToolsTable(obj, false);
      if (table.caption) lines.push(table.caption);
      if (table.colLabels.length) lines.push(table.colLabels.join(" — "));
      for (const row of table.rows) {
        const text = row.filter(Boolean).join(" — ");
        if (text) lines.push(`• ${text}`);
      }
      if (table.footnotes) {
        for (const note of table.footnotes) lines.push(note);
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

export interface RenderEntriesOptions {
  /** Bullet prefix for plain string list items. */
  bullet?: string;
  /** Render `{type:"item", name, entry|entries}` list children as `• **name**: body`. */
  renderItemObjects?: boolean;
  /** Emit a bold `**name**` heading for named `type:"entries"` blocks. */
  boldNamedEntries?: boolean;
  /** Emit a bold `**caption**` line for `type:"table"` blocks. */
  renderTableCaption?: boolean;
  /** Prefix added to each line produced by a `type:"inset"` block (null = none). */
  insetPrefix?: string | null;
}

/** Resolve body text for a `{type:"item"}` from singular `entry` or `entries[]`. */
function resolveItemBody(
  item: Record<string, unknown>,
  options: RenderEntriesOptions,
  depth: number,
): string {
  if (typeof item.entry === "string") {
    return parseFiveToolsMarkup(item.entry).trim();
  }
  if (Array.isArray(item.entries)) {
    return renderFiveToolsEntries(item.entries as unknown[], options, depth + 1)
      .join(" ")
      .trim();
  }
  return "";
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
          // 5etools uses either singular `entry` (string) or `entries` (array).
          if (subObj.type === "item" && subObj.name) {
            const name = parseFiveToolsMarkup(String(subObj.name)).trim();
            const body = resolveItemBody(subObj, options, depth);
            result.push(
              body ? `${bullet}**${name}**: ${body}` : `${bullet}**${name}**`,
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
    } else if (renderTableCaption && obj.type === "table") {
      const table = mapFiveToolsTable(obj);
      if (table.caption) {
        result.push(`**${table.caption}**`);
      }
      if (table.colLabels.length > 0) {
        result.push(`${bullet}${table.colLabels.join(" — ")}`);
      }
      for (const row of table.rows) {
        const text = row.filter(Boolean).join(" — ");
        if (text) result.push(`${bullet}${text}`);
      }
      if (table.footnotes) {
        for (const note of table.footnotes) {
          if (note) result.push(note);
        }
      }
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
