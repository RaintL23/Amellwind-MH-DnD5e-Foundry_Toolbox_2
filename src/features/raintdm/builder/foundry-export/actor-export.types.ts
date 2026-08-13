import type {
  AbilityKey,
  AbilityScores,
  ArmorItem,
  CartEntry,
  DamageType,
  EquippedWeapon,
  Rune,
  SkillKey,
  Speed,
} from "@/shared/types";
import type { BuilderChoiceSnapshot } from "./builder-snapshot";
import type { FeatSubtype, InventoryCatalogMeta, SpellItemInput } from "./item.builders";

export interface FeatureInput {
  name: string;
  description?: string;
  subtype: FeatSubtype;
  level: number;
  identifier?: string;
  img?: string;
  /**
   * When set, standalone feats (e.g. Metamagic picks) are grouped under this
   * origin on the Foundry sheet instead of "Other Features".
   */
  originKind?: "class" | "subclass" | "race" | "background";
}

export interface ClassInfoInput {
  name: string;
  identifier: string;
  source?: string;
  hitDie: string;
  levels: number;
  spellcastingProgression: string;
  spellcastingAbility: string;
  primaryAbilities: string[];
  description?: string;
  img?: string;
  saveProficiencies: AbilityKey[];
  features: FeatureInput[];
}

export interface SubclassInfoInput {
  name: string;
  identifier: string;
  classIdentifier: string;
  source?: string;
  spellcastingProgression: string;
  spellcastingAbility: string;
  description?: string;
  img?: string;
  features: FeatureInput[];
}

export interface RaceInfoInput {
  name: string;
  identifier: string;
  source?: string;
  walkSpeed: number;
  creatureType: string;
  subtype?: string;
  size: string;
  darkvision?: number | null;
  description?: string;
  img?: string;
  features: FeatureInput[];
}

export interface BackgroundInfoInput {
  name: string;
  identifier: string;
  source?: string;
  description?: string;
  img?: string;
  features: FeatureInput[];
}

export interface FoundryExportInput {
  name: string;
  size: string;
  alignment: string;
  level: number;
  xp: number;
  abilities: AbilityScores;
  saveProficiencies: AbilityKey[];
  skillProficiencies: Partial<Record<SkillKey, 1 | 2>>;
  proficiencyBonus: number;
  hp: number;
  speed: Speed;
  acCalc: string;
  acFlat: number | null;
  initiativeAbility: string;
  darkvision: number | null;
  languages: string[];
  tools: string[];
  weaponProficiencies: string[];
  /**
   * Foundry `traits.weaponProf.mastery.value` — baseItem slugs the character
   * has Weapon Mastery for (e.g. `spear`, `longsword`).
   */
  weaponMasteryBaseItems?: string[];
  armorProficiencies: string[];
  resistances: DamageType[];
  immunities: DamageType[];
  currency: { pp: number; gp: number; ep: number; sp: number; cp: number };
  spellcastingAbility: string;
  casterProgression: string;
  casterLevel: number;
  pactSlots: { count: number; level: number } | null;
  attunementMax: number;
  biography: string;
  classInfo: ClassInfoInput | null;
  subclassInfo: SubclassInfoInput | null;
  raceInfo: RaceInfoInput | null;
  backgroundInfo: BackgroundInfoInput | null;
  feats: FeatureInput[];
  weapons: { equipped: EquippedWeapon; isEquipped: boolean; attackAbility?: string }[];
  armors: { armor: ArmorItem; equipped: boolean }[];
  trinkets: string[];
  loot: CartEntry[];
  spells: SpellItemInput[];
  /** Rune items to embed on the actor (from equipped weapon/armor/trinket slots). */
  runes: { rune: Rune; slotContext: "Weapon" | "Armor" | "Trinket" }[];
  /** Base64 data URL for the actor's main art (system img). */
  portraitImage?: string | null;
  /** Base64 data URL for the prototype token texture. Falls back to portraitImage. */
  tokenImage?: string | null;
  /** Lookup (lowercased item name → HTML/plain description) for armor/trinket/loot. */
  itemDescriptions?: Record<string, string>;
  /** Catalog metadata (type/weight/value/…) for inventory item routing. */
  itemCatalog?: Record<string, InventoryCatalogMeta>;
  /** Lookup (lowercased item/feat name → Foundry img URL or path). */
  itemImages?: Record<string, string>;
  /** Lossless builder choice snapshot embedded as a namespaced actor flag. */
  builderSnapshot?: BuilderChoiceSnapshot;
}

