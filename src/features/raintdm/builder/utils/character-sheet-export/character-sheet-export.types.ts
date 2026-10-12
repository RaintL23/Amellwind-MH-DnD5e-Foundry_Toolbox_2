import type { BuilderPersonality } from "@/features/raintdm/builder/storage/builder.storage";
import type { SkillKey, AbilityKey } from "@/shared/types";
import type { ArmorTrainingCategory } from "./pdf-field-mappings";
import type { ExportTextSection } from "./pdf-text-layout.utils";

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
  isConcentration?: boolean;
  isRitual?: boolean;
  hasMaterial?: boolean;
  /** Costly material component, or a short tag such as "Always prepared". */
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
  armorTrainingProficiencies?: Partial<Record<ArmorTrainingCategory, boolean>>;
  toolProficiencies: string;
  feats: ExportTextSection[];
  classFeatures: ExportTextSection[];
  speciesTraits: ExportTextSection[];
  /** One inventory line per entry (equipped items first). */
  equipment: string[];
  weapons: CharacterSheetWeaponExport[];
  spells: CharacterSheetSpellExport[];
  spellcastingAbility?: string;
  spellcastingMod?: string;
  spellSaveDc?: string;
  spellAttackBonus?: string;
  spellSlotTotals?: Record<number, number>;
  hasShield?: boolean;
  /** Human-readable alignment; the 2024 sheet has no field, so it opens Personality. */
  alignment?: string;
  goldPieces?: string;
  personality: BuilderPersonality & { notes: string };
  skillProficiencies?: Partial<Record<SkillKey, boolean>>;
  saveProficiencies?: Partial<Record<AbilityKey, boolean>>;
  /** Base64 data URL for the character portrait, placed in the sheet's portrait box. */
  portraitImage?: string | null;
}
