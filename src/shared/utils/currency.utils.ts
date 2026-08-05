/** Formats copper-piece value as gold pieces for display (e.g. shops, item cards). */
export function formatGpFromCp(valueCp: number | null | undefined): string {
  if (valueCp == null) return "—";
  const gp = valueCp / 100;
  if (gp >= 1000) return `${gp.toLocaleString("en-US")} gp`;
  return `${gp} gp`;
}
