export type RuneSlot = "A" | "W";

export type RuneTier = 1 | 2 | 3 | 4;

export interface Rune {
  name: string;
  monsterName: string;
  monsterSource: string;
  monsterCr: string;
  /** Tier calculado desde el CR del monstruo (1=CR 1-4, 2=CR 5-10, 3=CR 11-16, 4=CR 17+). */
  tier: RuneTier;
  carveChance: string;
  captureChance: string;
  rolls: number;
  slots: RuneSlot[];
  armorEffect: string | null;
  weaponEffect: string | null;
  /** Tags combinados de ambos efectos (para display). */
  tags: string[];
  /** Tags extraídos únicamente del weaponEffect (para validación de reglas de arma). */
  weaponTags: string[];
  /** Tags extraídos únicamente del armorEffect (para validación de reglas de armadura). */
  armorTags: string[];
}
