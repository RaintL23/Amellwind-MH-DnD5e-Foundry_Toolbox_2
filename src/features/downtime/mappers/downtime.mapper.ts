import type { DowntimeActivity, DowntimeContent, DowntimeTable } from "@/shared/types";
import {
  mapFiveToolsTable,
  parseFiveToolsMarkup,
} from "@/shared/utils/fivetools-parser";
import { slugifyKebab } from "@/shared/utils/slugify.utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const DOWNTIME_PREFIX = "Downtime Activity:";

function mapTable(raw: Raw): DowntimeTable {
  return mapFiveToolsTable(raw);
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
    id: slugifyKebab(shortName),
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
