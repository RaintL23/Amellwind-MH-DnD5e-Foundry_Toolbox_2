const GP_RATES: Record<string, number> = {
  pp: 10,
  gp: 1,
  sp: 0.1,
  cp: 0.01,
};

export function parseCostGp(cost: string): number {
  if (!cost || cost === "—") return 0;
  const match = cost.replace(/,/g, "").match(/([\d.]+)\s*(pp|gp|sp|cp)/i);
  if (!match) return 0;
  const amount = parseFloat(match[1]);
  const rate = GP_RATES[match[2].toLowerCase()] ?? 1;
  return amount * rate;
}

export function formatTotalGp(gp: number): string {
  if (gp === 0) return "—";
  if (gp >= 1000) return `${gp.toLocaleString("en-US")} gp`;
  return `${gp % 1 === 0 ? gp : gp.toFixed(2)} gp`;
}
