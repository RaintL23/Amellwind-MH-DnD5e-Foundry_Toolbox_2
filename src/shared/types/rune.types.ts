export type RuneSlot = "A" | "W";

export type RuneTier = 1 | 2 | 3 | 4;

export interface Rune {
  name: string;
  monsterName: string;
  monsterSource: string;
  monsterCr: string;
  /** Tier calculated from the monster's CR (1=CR 1-4, 2=CR 5-10, 3=CR 11-16, 4=CR 17+). */
  tier: RuneTier;
  carveChance: string;
  captureChance: string;
  rolls: number;
  slots: RuneSlot[];
  armorEffect: string | null;
  weaponEffect: string | null;
  /** Tags combined from both effects (for display). */
  tags: string[];
  /** Tags extracted only from the weaponEffect (for weapon rule validation). */
  weaponTags: string[];
  /** Tags extracted only from the armorEffect (for armor rule validation). */
  armorTags: string[];
}
