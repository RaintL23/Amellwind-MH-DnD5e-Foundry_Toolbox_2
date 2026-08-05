export function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

export function dash(value: string | null | undefined): string {
  return value && value.trim() ? value : "—";
}

export function formatDamageField(field: unknown): string {
  const p = asRecord(field);
  if (!p) return "—";
  const custom = asRecord(p.custom);
  if (custom?.enabled && typeof custom.formula === "string" && custom.formula) {
    return custom.formula;
  }
  const n = p.number;
  const d = p.denomination;
  const bonus =
    typeof p.bonus === "string" && p.bonus.trim() ? p.bonus.trim() : "";
  const types = Array.isArray(p.types)
    ? p.types.filter((t): t is string => typeof t === "string").join("/")
    : "";
  if (typeof n === "number" && typeof d === "number") {
    const formula = `${n}d${d}${bonus}`;
    return types ? `${formula} ${types}` : formula;
  }
  return types || "—";
}

export function formatDamageParts(parts: unknown): string {
  if (!Array.isArray(parts) || parts.length === 0) return "—";
  return parts.map((part) => formatDamageField(part)).join(", ");
}
