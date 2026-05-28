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
  tags: string[];
}
