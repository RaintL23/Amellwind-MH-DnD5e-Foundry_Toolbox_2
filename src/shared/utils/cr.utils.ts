interface CrObject {
  cr?: string | number;
  lair?: string | number;
  coven?: string | number;
}

function isCrObject(cr: unknown): cr is CrObject {
  return (
    typeof cr === "object" &&
    cr !== null &&
    ("cr" in cr || "lair" in cr || "coven" in cr)
  );
}

/** All challenge ratings represented by a creature entry (base, lair, coven). */
export function getCrValues(cr: unknown): string[] {
  if (isCrObject(cr)) {
    const values: string[] = [];
    if (cr.cr != null && String(cr.cr) !== "") values.push(String(cr.cr));
    if (cr.lair != null && String(cr.lair) !== "") values.push(String(cr.lair));
    if (cr.coven != null && String(cr.coven) !== "")
      values.push(String(cr.coven));
    return values.length > 0 ? values : ["0"];
  }
  if (cr == null || cr === "") return ["0"];
  return [String(cr)];
}

/** Primary CR used for tier calculations and simple labels. */
export function getBaseCr(cr: unknown): string {
  return getCrValues(cr)[0] ?? "0";
}

/** Human-readable CR label, including lair/coven variants when present. */
export function formatCrDisplay(cr: unknown): string {
  if (isCrObject(cr)) {
    const parts: string[] = [];
    if (cr.cr != null) parts.push(String(cr.cr));
    if (cr.lair) parts.push(`${cr.lair} (lair)`);
    if (cr.coven) parts.push(`${cr.coven} (coven)`);
    return parts.join(" / ") || "0";
  }
  return String(cr ?? "0");
}

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

/** Carve DC = 10 + half the creature's CR (rounded down). */
export function getCarveDc(cr: string): number {
  return 10 + Math.floor(parseCR(cr) / 2);
}

export const SIZE_MAP: Record<string, string> = {
  T: "Tiny",
  S: "Small",
  M: "Medium",
  L: "Large",
  H: "Huge",
  G: "Gargantuan",
};
