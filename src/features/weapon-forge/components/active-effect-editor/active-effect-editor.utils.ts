export function parseCsv(value: string): string[] {
  return value
    .split(/[,;\n]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function joinCsv(values: string[] | undefined): string {
  return values?.join(", ") ?? "";
}

export function parseOptionalNumber(raw: string): number | null | undefined {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}
