/** Strips 5etools-style {@tag ...} markup into readable plain text. */
export function parseGuideText(text: string): string {
  return text
    .replace(/\{@i ([^}]+)\}/g, "$1")
    .replace(/\{@\w+ ([^|}]+)[^}]*\}/g, "$1")
    .replace(/\{@\w+[^}]*\}/g, "")
    .trim();
}

/** Maps character level to the AGMH starting-equipment bracket. */
export function getLevelBracket(level: number): "1-2" | "3-8" | "9-15" | "16-20" {
  if (level <= 2) return "1-2";
  if (level <= 8) return "3-8";
  if (level <= 15) return "9-15";
  return "16-20";
}

/** Maps character level to the XPHB "Starting Equipment at Higher Levels" bracket. */
export function getDndLevelBracket(
  level: number,
): "2-4" | "5-10" | "11-16" | "17-20" {
  if (level <= 4) return "2-4";
  if (level <= 10) return "5-10";
  if (level <= 16) return "11-16";
  return "17-20";
}
