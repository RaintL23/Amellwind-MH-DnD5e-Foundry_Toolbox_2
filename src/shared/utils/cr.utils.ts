export function parseCR(cr: string): number {
  if (cr.includes("/")) {
    const [num, den] = cr.split("/").map(Number);
    return num / den;
  }
  return Number(cr);
}

export function getTier(cr: string): number {
  const value = parseCR(cr);
  if (value < 1) return 0;
  if (value <= 8) return 1;
  if (value <= 16) return 2;
  if (value <= 24) return 3;
  return 4;
}

export function getAbilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function getProficiencyBonus(cr: string): number {
  const value = parseCR(cr);
  return Math.ceil(value / 4) + 1;
}

export const SIZE_MAP: Record<string, string> = {
  T: "Tiny",
  S: "Small",
  M: "Medium",
  L: "Large",
  H: "Huge",
  G: "Gargantuan",
};
