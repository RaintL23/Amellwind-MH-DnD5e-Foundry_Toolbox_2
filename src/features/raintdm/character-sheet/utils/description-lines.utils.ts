/**
 * Turn dense play-sheet prose into lines for `DescriptionLines`.
 * Splits paragraphs and inline `•` bullets; bold-labels option titles
 * like "Heavenly Wings. …".
 */
export function toDescriptionLines(text: string): string[] {
  const normalized = text
    .replace(/\r\n/g, "\n")
    .replace(/\s*•\s*/g, "\n• ")
    .trim();
  if (!normalized) return [];

  const lines: string[] = [];
  for (const raw of normalized.split(/\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    lines.push(formatOptionBullet(line));
  }
  return lines;
}

/** `• Name. Rest` → `• **Name.** Rest` when the title looks like a proper name. */
function formatOptionBullet(line: string): string {
  if (!line.startsWith("•")) return line;
  const body = line.replace(/^•\s*/, "");
  const m = body.match(/^([A-Z][A-Za-z0-9' /-]*[.!?])\s+(.+)$/);
  if (!m) return line.startsWith("• ") ? line : `• ${body}`;
  return `• **${m[1]}** ${m[2]}`;
}

export function spellLevelLabel(level: number): string {
  if (level <= 0) return "Cantrip";
  return `Level ${level}`;
}
