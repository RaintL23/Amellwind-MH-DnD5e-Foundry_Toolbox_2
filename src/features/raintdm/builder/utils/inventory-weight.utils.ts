import { CartEntry } from "@/shared/types";

/** Parses shop/cart weight strings such as "1.5 lb.", "1/2 lb.", or "—". */
export function parseWeightLb(weight: string | undefined): number {
  if (!weight || weight === "—") return 0;

  const normalized = weight
    .toLowerCase()
    .replace(/\s*\(.*\)\s*$/, "")
    .replace(/\s*lb\.?\s*$/i, "")
    .trim();

  if (!normalized) return 0;

  const fractionMatch = normalized.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    const numerator = Number.parseFloat(fractionMatch[1]);
    const denominator = Number.parseFloat(fractionMatch[2]);
    if (denominator > 0) return numerator / denominator;
  }

  const value = Number.parseFloat(normalized.replace(/,/g, ""));
  return Number.isFinite(value) ? value : 0;
}

export function getEntryWeightLb(entry: CartEntry): number {
  return parseWeightLb(entry.weight) * entry.quantity;
}

export function sumInventoryWeightLb(entries: CartEntry[]): number {
  return entries.reduce((sum, entry) => sum + getEntryWeightLb(entry), 0);
}

export function formatWeightLb(total: number): string {
  if (total <= 0) return "0 lb.";
  const rounded = Math.round(total * 100) / 100;
  return `${rounded % 1 === 0 ? rounded : rounded.toFixed(2)} lb.`;
}

export function formatInventoryWeightTooltip(entries: CartEntry[]): string {
  const lines = entries
    .map((entry) => {
      const weight = getEntryWeightLb(entry);
      if (weight <= 0) return null;
      const quantity =
        entry.quantity > 1 ? ` ×${entry.quantity}` : "";
      return `${entry.name}${quantity}: ${formatWeightLb(weight)}`;
    })
    .filter((line): line is string => line !== null);

  const total = sumInventoryWeightLb(entries);
  return [...lines, "", `Total: ${formatWeightLb(total)}`].join("\n");
}
