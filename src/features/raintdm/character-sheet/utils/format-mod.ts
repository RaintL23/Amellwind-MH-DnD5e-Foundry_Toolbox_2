/** Format a D&D modifier as "+N" / "−N" / "+0". */
export function formatMod(n: number): string {
  return `${n >= 0 ? "+" : ""}${n}`;
}
