/** Title-case each whitespace-delimited word. */
export function titleCase(value: string): string {
  return value
    .split(" ")
    .map((word) => (word ? word.charAt(0).toUpperCase() + word.slice(1) : word))
    .join(" ");
}

/** Trim and collapse internal whitespace for entity name comparison/display. */
export function normalizeEntityName(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}
