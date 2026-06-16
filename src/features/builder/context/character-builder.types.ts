import type {
  AbilityKey,
  SkillKey,
  AbilityScores,
  BackgroundFaction,
  Class,
  Species,
  BackgroundAsiMode,
  EquippedWeapon,
  EquippedArmor,
  EquippedTrinket,
  Rune,
  Weapon,
  ArmorItem,
  CombatCalculation,
  CharacterSelectionRef,
  BuilderFeatSelection,
  BuilderSpellSelections,
  BuilderSpellSelection,
  BuilderOptionalFeatureSelection,
  BuilderOptionalFeatureSelections,
} from "@/shared/types";
import type {
  BuilderMulticlassEntry,
} from "@/shared/types/character.types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import type { OptionalFeatureOriginFeatSlot } from "../utils/optional-feature-feat-grants.utils";
import type { StandaloneShieldItem } from "../data/shield.data";
import type { RuleViolation } from "@/features/runes/utils/build.validation";
import type { OffHandBlockReason } from "@/features/weapons/utils/weapon-hands.utils";
import type {
  SkillProficiencyGrant,
  ExpertiseGrant,
  SkillAdvantageGrant,
  ProficiencySource,
  NamedProficiencyGrant,
  DefenseGrant,
  DefenseKind,
} from "@/shared/types/proficiency.types";
import type { DamageType } from "@/shared/types";
import type { Character } from "../models/Character";
import type { BuilderPersonality } from "../storage/builder-personality.storage";

export interface CharacterBuilderContextValue {
  // Character
  character: Character;
  setName: (name: string) => void;
  setCreatureSize: (size: "M" | "S") => void;
  setLawChaosAlignment: (axis: "L" | "N" | "C") => void;
  setGoodEvilAlignment: (axis: "G" | "N" | "E") => void;
  setLevel: (level: number) => void;
  setAbilityScore: (ability: AbilityKey, value: number) => void;
  setAbilityScores: (abilities: Partial<AbilityScores>) => void;
  attacksPerTurnOverride: number | null;
  setAttacksPerTurnOverride: (value: number | null) => void;
  effectiveAttacksPerTurn: number;
  useUnarmedStrike: boolean;
  setUseUnarmedStrike: (value: boolean) => void;
  useAmellwindHomebrew: boolean;
  setUseAmellwindHomebrew: (value: boolean) => void;

  // Equipment
  mainHand: EquippedWeapon | null;
  offHand: EquippedWeapon | null;
  armor: EquippedArmor | null;
  trinket1: EquippedTrinket | null;
  trinket2: EquippedTrinket | null;

  // Identity (species / background / class / subclass / feats)
  species: CharacterSelectionRef | null;
  background: CharacterSelectionRef | null;
  class: CharacterSelectionRef | null;
  subclass: CharacterSelectionRef | null;
  featSelections: (BuilderFeatSelection | null)[];
  speciesOriginFeatGrant: OriginFeatGrant | null;
  speciesOriginFeat: BuilderFeatSelection | null;
  backgroundOriginFeatGrant: OriginFeatGrant | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
  originFeatSkillChoices: SkillKey[];
  optionalFeatureOriginFeatSlots: OptionalFeatureOriginFeatSlot[];
  optionalFeatureOriginFeats: (BuilderFeatSelection | null)[];
  optionalFeatureOriginFeatSkillChoices: Record<number, SkillKey[]>;
  backstoryNotes: string;
  personality: BuilderPersonality;
  faction: BackgroundFaction | null;
  setSpecies: (selection: CharacterSelectionRef | null) => void;
  setBackground: (selection: CharacterSelectionRef | null) => void;
  setClass: (selection: CharacterSelectionRef | null) => void;
  setSubclass: (selection: CharacterSelectionRef | null) => void;
  setFeatAtIndex: (index: number, selection: BuilderFeatSelection | null) => void;

  // Multiclassing
  multiclassEnabled: boolean;
  multiclassEntries: BuilderMulticlassEntry[];
  multiclassClassData: (Class | null)[];
  primaryClassLevel: number;
  setMulticlassEnabled: (enabled: boolean) => void;
  addMulticlassEntry: () => void;
  removeMulticlassEntry: (index: number) => void;
  setMulticlassEntryClass: (
    index: number,
    selection: CharacterSelectionRef | null,
  ) => void;
  setMulticlassEntryLevel: (index: number, level: number) => void;
  setMulticlassEntrySubclass: (
    index: number,
    selection: CharacterSelectionRef | null,
  ) => void;
  setPrimaryClassLevel: (level: number) => void;

  setSpeciesOriginFeat: (selection: BuilderFeatSelection | null) => void;
  setBackgroundOriginFeat: (selection: BuilderFeatSelection | null) => void;
  setOptionalFeatureOriginFeatAtIndex: (
    index: number,
    selection: BuilderFeatSelection | null,
  ) => void;

  // Loaded identity data (shared — avoids duplicate fetches)
  classData: Class | null;
  classDataLoading: boolean;
  speciesData: Species | null;
  speciesDataLoading: boolean;

  // Ability score origin bonuses
  useTashaOrigin: boolean;
  setUseTashaOrigin: (value: boolean) => void;
  tashaPlus2: AbilityKey | null;
  tashaPlus1: AbilityKey | null;
  setTashaPlus2: (ability: AbilityKey | null) => void;
  setTashaPlus1: (ability: AbilityKey | null) => void;
  speciesAbilityChoices: (AbilityKey | null)[];
  setSpeciesAbilityChoice: (index: number, ability: AbilityKey | null) => void;
  backgroundAsiMode: BackgroundAsiMode | null;
  setBackgroundAsiMode: (mode: BackgroundAsiMode | null) => void;
  backgroundAsiPlus2: AbilityKey | null;
  backgroundAsiPlus1: AbilityKey | null;
  setBackgroundAsiPlus2: (ability: AbilityKey | null) => void;
  setBackgroundAsiPlus1: (ability: AbilityKey | null) => void;
  setPersonality: (
    value: BuilderPersonality | ((current: BuilderPersonality) => BuilderPersonality),
  ) => void;
  setPersonalityField: (field: keyof BuilderPersonality, value: string) => void;
  setFaction: (faction: BackgroundFaction | null) => void;
  setBackstoryNotes: (
    value: string | ((current: string) => string),
  ) => void;

  // Weapon handling
  isTwoHanded: boolean;
  isOffHandBlocked: boolean;
  offHandBlockReason: OffHandBlockReason | null;
  hasIntegratedShield: boolean;
  integratedShieldAcBonus: number;
  equippedShield: StandaloneShieldItem | null;
  standaloneShieldAcBonus: number;
  shieldAcBonus: number;

  equipWeapon: (slot: "mainHand" | "offHand", weapon: Weapon, rarity: string) => void;
  unequipWeapon: (slot: "mainHand" | "offHand") => void;
  setWeaponRarity: (slot: "mainHand" | "offHand", rarity: string) => void;
  setVersatileMode: (slot: "mainHand" | "offHand", twoHanded: boolean) => void;
  equipArmor: (armor: ArmorItem) => void;
  unequipArmor: () => void;
  equipShield: (shield: StandaloneShieldItem) => void;
  unequipShield: () => void;
  setArmorRarity: (rarity: string) => void;
  equipTrinket: (slot: "trinket1" | "trinket2", name: string) => void;
  unequipTrinket: (slot: "trinket1" | "trinket2") => void;
  clearEquipment: () => void;

  // Rune management
  assignWeaponRune: (slot: "mainHand" | "offHand", index: number, rune: Rune) => RuleViolation | null;
  removeWeaponRune: (slot: "mainHand" | "offHand", index: number) => void;
  assignArmorRune: (index: number, rune: Rune) => RuleViolation | null;
  removeArmorRune: (index: number) => void;
  assignTrinketRune: (
    slot: "trinket1" | "trinket2",
    rune: Rune,
    materialEffectKind?: "weapon" | "armor",
  ) => void;
  removeTrinketRune: (slot: "trinket1" | "trinket2") => void;

  // Computed
  totalAC: number;
  combat: CombatCalculation;

  // Spellcasting
  spellSelections: BuilderSpellSelections;
  addSpell: (level: number, spell: BuilderSpellSelection) => void;
  removeSpell: (level: number, spellId: string) => void;
  clearSpells: () => void;

  // Optional class features
  optionalFeatureSelections: BuilderOptionalFeatureSelections;
  setOptionalFeaturesForProgression: (
    progressionId: string,
    picks: BuilderOptionalFeatureSelection[],
  ) => void;
  clearOptionalFeatureProgression: (progressionId: string) => void;

  // Reset
  resetBuild: () => void;

  // Proficiency
  applyIdentityGrants: (payload: {
    skillGrants?: SkillProficiencyGrant[];
    expertiseGrants?: ExpertiseGrant[];
    skillAdvantages?: SkillAdvantageGrant[];
    saveProficiencies?: AbilityKey[];
    toolGrants?: NamedProficiencyGrant[];
    armorGrants?: NamedProficiencyGrant[];
    weaponGrants?: NamedProficiencyGrant[];
    languageGrants?: NamedProficiencyGrant[];
    defenseGrants?: DefenseGrant[];
    source: "class" | "background" | "species" | "feats";
  }) => void;

  allSkillGrants: SkillProficiencyGrant[];
  allExpertiseGrants: ExpertiseGrant[];
  allSkillAdvantages: SkillAdvantageGrant[];
  saveProficiencyAbilities: AbilityKey[];

  classSkillChoices: Record<number, SkillKey[]>;
  backgroundSkillChoices: SkillKey[];
  speciesSkillChoices: SkillKey[];
  featSkillChoices: Record<number, SkillKey[]>;
  expertiseChoices: Record<string, SkillKey[]>;

  setClassSkillChoicesAtIndex: (grantIndex: number, choices: SkillKey[]) => void;
  setBackgroundSkillChoices: (choices: SkillKey[]) => void;
  setSpeciesSkillChoices: (choices: SkillKey[]) => void;
  setFeatSkillChoices: (slotIndex: number, choices: SkillKey[]) => void;
  setOriginFeatSkillChoices: (choices: SkillKey[]) => void;
  setOptionalFeatureOriginFeatSkillChoicesAtIndex: (
    slotIndex: number,
    choices: SkillKey[],
  ) => void;
  setExpertiseChoices: (grantId: string, choices: SkillKey[]) => void;

  skillSources: Partial<Record<SkillKey, ProficiencySource[]>>;
  expertiseSources: Partial<Record<SkillKey, ProficiencySource>>;

  allToolGrants: NamedProficiencyGrant[];
  allLanguageGrants: NamedProficiencyGrant[];
  allDefenseGrants: DefenseGrant[];
  classToolChoices: Record<number, string[]>;
  backgroundToolChoices: string[];
  speciesToolChoices: string[];
  classLanguageChoices: Record<number, string[]>;
  backgroundLanguageChoices: string[];
  speciesLanguageChoices: string[];
  speciesDefenseChoices: Record<number, DamageType[]>;
  setClassToolChoicesAtIndex: (grantIndex: number, choices: string[]) => void;
  setBackgroundToolChoices: (choices: string[]) => void;
  setSpeciesToolChoices: (choices: string[]) => void;
  setClassLanguageChoicesAtIndex: (grantIndex: number, choices: string[]) => void;
  setBackgroundLanguageChoices: (choices: string[]) => void;
  setSpeciesLanguageChoices: (choices: string[]) => void;
  setSpeciesDefenseChoicesAtIndex: (grantIndex: number, choices: DamageType[]) => void;
  toolSources: Partial<Record<string, ProficiencySource[]>>;
  languageSources: Partial<Record<string, ProficiencySource[]>>;
  defenseSources: Partial<
    Record<string, Array<{ source: ProficiencySource; defenseKind: DefenseKind }>>
  >;
  resolvedToolItems: string[];
  resolvedArmorItems: string[];
  resolvedWeaponItems: string[];
  armorSources: Partial<Record<string, ProficiencySource[]>>;
  weaponSources: Partial<Record<string, ProficiencySource[]>>;
  resolvedLanguageItems: string[];
  resolvedResistances: DamageType[];
  resolvedImmunities: DamageType[];
}
