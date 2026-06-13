import type { BuilderPersonality } from "../storage/builder-personality.storage";

export interface CharacterSheetWeaponExport {
  name: string;
  attackBonus: string;
  damage: string;
  notes?: string;
}

export interface CharacterSheetSpellExport {
  name: string;
  level: number;
  range?: string;
  castingTime?: string;
  notes?: string;
}

export interface CharacterSheetExportData {
  name: string;
  species: string;
  background: string;
  className: string;
  subclass: string;
  level: number;
  xp: number;
  size: string;
  speed: string;
  initiative: string;
  passivePerception: number;
  proficiencyBonus: number;
  armorClass: number;
  maxHp: number;
  hitDice: string;
  abilities: {
    str: { score: number; mod: string };
    dex: { score: number; mod: string };
    con: { score: number; mod: string };
    int: { score: number; mod: string };
    wis: { score: number; mod: string };
    cha: { score: number; mod: string };
  };
  savingThrows: Record<string, string>;
  skills: Record<string, string>;
  languages: string;
  weaponProficiencies: string;
  armorProficiencies: string;
  toolProficiencies: string;
  feats: string;
  classFeatures: string;
  classFeatures2?: string;
  speciesTraits: string;
  equipment: string;
  attunementSlots: string[];
  weapons: CharacterSheetWeaponExport[];
  spells: CharacterSheetSpellExport[];
  spellcastingAbility?: string;
  spellcastingMod?: string;
  spellSaveDc?: string;
  spellAttackBonus?: string;
  spellSlotTotals?: Record<number, number>;
  hasShield?: boolean;
  alignmentCheckbox?: string;
  goldPieces?: string;
  personality: BuilderPersonality & { notes: string };
}
