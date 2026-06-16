/** Ensure Common is always present in the resolved language list (D&D 2024 baseline). */
export function ensureCommonLanguage(languages: readonly string[]): string[] {
  const hasCommon = languages.some(
    (language) => language.toLowerCase() === "common",
  );
  if (hasCommon) return [...languages];
  return ["Common", ...languages];
}
