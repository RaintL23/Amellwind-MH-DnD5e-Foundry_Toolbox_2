import type { DowntimeActivity, DowntimeContent, DowntimeTable } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const DOWNTIME_PREFIX = "Downtime Activity:";

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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
    caption: typeof raw.caption === "string" ? raw.caption : undefined,
    colLabels,
    rows,
    footnotes,
  };
}

function mapEntries(entries: unknown[]): DowntimeContent[] {
  const result: DowntimeContent[] = [];

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

    if (e.type === "entries" || typeof e.name === "string") {
      const name = typeof e.name === "string" ? e.name.trim() : "";
      const children = mapEntries(
        Array.isArray(e.entries) ? (e.entries as unknown[]) : [],
      );

      if (name) {
        result.push({ type: "section", name, children });
      } else {
        result.push(...children);
      }
    }
  }

  return result;
}

function mapDowntimeActivity(raw: Raw): DowntimeActivity {
  const fullName = String(raw.name ?? "Unknown");
  const shortName = fullName.startsWith(DOWNTIME_PREFIX)
    ? fullName.slice(DOWNTIME_PREFIX.length).trim()
    : fullName;

  return {
    id: slugify(shortName),
    name: fullName,
    shortName,
    page: typeof raw.page === "number" ? raw.page : undefined,
    content: mapEntries(Array.isArray(raw.entries) ? raw.entries : []),
  };
}

export function mapDowntimeActivities(rawData: unknown[]): DowntimeActivity[] {
  return rawData
    .filter((raw): raw is Raw => {
      if (typeof raw !== "object" || raw === null) return false;
      const name = String((raw as Raw).name ?? "");
      return name.startsWith(DOWNTIME_PREFIX);
    })
    .map(mapDowntimeActivity);
}
