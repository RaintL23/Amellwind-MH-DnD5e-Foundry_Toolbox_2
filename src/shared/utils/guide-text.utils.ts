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
