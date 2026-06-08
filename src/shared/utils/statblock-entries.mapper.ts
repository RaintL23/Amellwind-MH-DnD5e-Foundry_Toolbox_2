import type {
  StatBlockContent,
  StatBlockListItem,
} from "@/shared/types/statblock-content.types";
import type { DowntimeTable } from "@/shared/types/downtime.types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

function mapTable(raw: Raw): DowntimeTable {
  const colLabels = Array.isArray(raw.colLabels)
    ? raw.colLabels.map(String)
    : [];
  const rows = Array.isArray(raw.rows)
    ? (raw.rows as unknown[][]).map((row) =>
        row.map((cell) =>
          typeof cell === "string"
            ? parseFiveToolsMarkup(cell)
            : String(cell ?? ""),
        ),
      )
    : [];
  const footnotes = Array.isArray(raw.footnotes)
    ? raw.footnotes.map((note: unknown) =>
        typeof note === "string" ? parseFiveToolsMarkup(note) : String(note),
      )
    : undefined;

  return {
    caption: typeof raw.caption === "string" ? parseFiveToolsMarkup(raw.caption) : undefined,
    colLabels: colLabels.map((l) => parseFiveToolsMarkup(l)),
    rows,
    footnotes,
  };
}

function mapListItems(items: unknown[]): StatBlockListItem[] {
  const result: StatBlockListItem[] = [];

  for (const item of items) {
    if (typeof item === "string") {
      result.push({ type: "text", text: parseFiveToolsMarkup(item) });
      continue;
    }
    if (typeof item !== "object" || item === null) continue;

    const entry = item as Raw;
    if (entry.type === "item" || typeof entry.name === "string") {
      const name = parseFiveToolsMarkup(String(entry.name ?? "")).trim();
      const children = mapStatBlockEntries(
        Array.isArray(entry.entries) ? (entry.entries as unknown[]) : [],
      );
      result.push({ type: "named", name, children });
      continue;
    }

    const text = mapStatBlockEntries([item])
      .map((block) => statBlockContentToPlainText(block))
      .filter(Boolean)
      .join(" ");
    if (text) result.push({ type: "text", text });
  }

  return result;
}

export function statBlockContentToPlainText(block: StatBlockContent): string {
  switch (block.type) {
    case "paragraph":
      return block.text;
    case "table":
      return block.table.caption ?? block.table.colLabels.join(" ");
    case "section":
      return [block.name, ...block.children.map(statBlockContentToPlainText)]
        .filter(Boolean)
        .join(" ");
    case "list":
      return block.items
        .map((item) =>
          item.type === "text"
            ? item.text
            : [item.name, ...item.children.map(statBlockContentToPlainText)].join(" "),
        )
        .join(" ");
    default:
      return "";
  }
}

export function mapStatBlockEntries(entries: unknown[]): StatBlockContent[] {
  const result: StatBlockContent[] = [];

  for (const entry of entries) {
    if (typeof entry === "string") {
      result.push({ type: "paragraph", text: parseFiveToolsMarkup(entry) });
      continue;
    }
    if (typeof entry !== "object" || entry === null) continue;

    const e = entry as Raw;

    if (e.type === "table") {
      result.push({ type: "table", table: mapTable(e) });
      continue;
    }

    if (e.type === "list" && Array.isArray(e.items)) {
      result.push({
        type: "list",
        items: mapListItems(e.items as unknown[]),
        style: typeof e.style === "string" ? e.style : undefined,
      });
      continue;
    }

    if (e.type === "abilityDc") {
      const name = typeof e.name === "string" ? parseFiveToolsMarkup(e.name) : "Save";
      const attrs = Array.isArray(e.attributes)
        ? e.attributes.map(String).join(" + ")
        : "ability modifier";
      result.push({
        type: "paragraph",
        text: `${name} DC = 8 + proficiency bonus + ${attrs}`,
      });
      continue;
    }

    if (e.type === "inset" && Array.isArray(e.entries)) {
      const insetName =
        typeof e.name === "string" ? parseFiveToolsMarkup(e.name).trim() : "Note";
      result.push({
        type: "section",
        name: insetName,
        children: mapStatBlockEntries(e.entries as unknown[]),
      });
      continue;
    }

    if (e.type === "entries" || typeof e.name === "string") {
      const name =
        typeof e.name === "string" ? parseFiveToolsMarkup(e.name).trim() : "";
      const children = mapStatBlockEntries(
        Array.isArray(e.entries) ? (e.entries as unknown[]) : [],
      );

      if (name) {
        result.push({ type: "section", name, children });
      } else {
        result.push(...children);
      }
      continue;
    }

    if (Array.isArray(e.entries)) {
      result.push(...mapStatBlockEntries(e.entries as unknown[]));
    }
  }

  return result;
}
