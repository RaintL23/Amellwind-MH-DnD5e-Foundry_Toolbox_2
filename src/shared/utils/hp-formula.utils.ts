/**
 * Parses 5e-style HP dice formulas (e.g. "5d12+35") and returns the maximum
 * possible roll. Supports multiple dice groups separated by "+".
 */
export function getMaxHpFromFormula(formula: string): number | null {
  const trimmed = formula.trim();
  if (!trimmed) return null;

  let total = 0;
  const parts = trimmed.split("+").map((part) => part.trim());

  for (const part of parts) {
    const diceMatch = /^(\d+)d(\d+)$/i.exec(part);
    if (diceMatch) {
      const count = Number.parseInt(diceMatch[1], 10);
      const sides = Number.parseInt(diceMatch[2], 10);
      if (Number.isFinite(count) && Number.isFinite(sides) && count > 0 && sides > 0) {
        total += count * sides;
        continue;
      }
    }

    const flat = Number.parseInt(part, 10);
    if (Number.isFinite(flat)) {
      total += flat;
      continue;
    }

    return null;
  }

  return total;
}

export function getMonsterMaxHp(hp: {
  formula?: string;
  average?: number;
}): number | null {
  if (hp.formula) {
    const fromFormula = getMaxHpFromFormula(hp.formula);
    if (fromFormula != null) return fromFormula;
  }
  if (hp.average != null && Number.isFinite(hp.average)) return hp.average;
  return null;
}
