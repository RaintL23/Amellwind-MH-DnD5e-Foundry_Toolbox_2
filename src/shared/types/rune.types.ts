export type RuneSlot = "A" | "W";

export interface Rune {
  name: string;
  monsterName: string;
  monsterSource: string;
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
