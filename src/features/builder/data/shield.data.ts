/** D&D 5e standalone shield (PHB / items catalog). */
export interface StandaloneShieldItem {
  name: string;
  acBonus: number;
  weight: number;
  rarity: string;
}

export const STANDALONE_SHIELD: StandaloneShieldItem = {
  name: "Shield",
  acBonus: 2,
  weight: 6,
  rarity: "Common",
};

export function isStandaloneShieldName(name: string): boolean {
  return name.trim().toLowerCase() === "shield";
}

export function findShieldByCartName(name: string): StandaloneShieldItem | null {
  return isStandaloneShieldName(name) ? STANDALONE_SHIELD : null;
}
