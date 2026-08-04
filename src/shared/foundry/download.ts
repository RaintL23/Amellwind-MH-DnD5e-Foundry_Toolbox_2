/** Serializes and downloads a Foundry JSON document in the browser. */
export function downloadFoundryJson(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

/** @deprecated Prefer `downloadFoundryJson` — same implementation. */
export const downloadFoundryActor = downloadFoundryJson;
