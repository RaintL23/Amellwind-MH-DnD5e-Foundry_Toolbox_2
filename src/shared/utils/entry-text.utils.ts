import type { Entry } from "@/shared/types";
import { statBlockContentToPlainText } from "@/shared/utils/statblock-entries.mapper";

export function entryToPlainText(entry: Entry): string {
  if (entry.content?.length) {
    return entry.content.map(statBlockContentToPlainText).filter(Boolean).join(" ");
  }
  return entry.entries.join(" ");
}

export function getEntryContent(entry: Entry) {
  if (entry.content?.length) return entry.content;
  return entry.entries.map((text) => ({ type: "paragraph" as const, text }));
}
