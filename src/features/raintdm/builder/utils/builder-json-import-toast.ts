import { toast } from "sonner";

const MAX_LISTED_WARNINGS = 5;

/**
 * Success toast for a Builder JSON import (Builder or Character Sheet roster):
 * plain when the file restored cleanly, otherwise lists the first repairs and
 * catalog re-links so the player knows what to double-check.
 */
export function showBuilderJsonImportToast(
  title: string,
  result: { warnings: string[]; migratedFrom: number | null },
): void {
  const notes = [
    ...(result.migratedFrom !== null
      ? [`Upgraded from Builder JSON v${result.migratedFrom}.`]
      : []),
    ...result.warnings,
  ];
  if (result.warnings.length === 0) {
    toast.message(title, notes.length > 0 ? { description: notes[0] } : undefined);
    return;
  }
  const listed = notes.slice(0, MAX_LISTED_WARNINGS).map((note) => `• ${note}`);
  const more = notes.length - listed.length;
  toast.warning(`${title} — ${result.warnings.length} warning${result.warnings.length === 1 ? "" : "s"}`, {
    description: [...listed, ...(more > 0 ? [`…and ${more} more.`] : [])].join("\n"),
    duration: 12_000,
  });
}
