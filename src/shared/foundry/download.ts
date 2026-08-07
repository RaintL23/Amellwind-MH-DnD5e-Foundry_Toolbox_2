import {
  ensureFoundryItemFilename,
  isFoundryItemDocument,
} from "./item-naming";

/** Serializes and downloads a Foundry JSON document in the browser. */
export function downloadFoundryJson(data: unknown, filename: string): void {
  const resolvedFilename = isFoundryItemDocument(data)
    ? ensureFoundryItemFilename(filename)
    : filename;
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = resolvedFilename;
  anchor.click();
  URL.revokeObjectURL(url);
}
