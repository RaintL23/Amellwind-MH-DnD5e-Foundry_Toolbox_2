import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  ReactNode,
} from "react";
import {
  loadBuilderBackstoryNotes,
  persistBuilderBackstoryNotes,
} from "../storage/builder-backstory.storage";
import {
  AbilityKey,
  SkillKey,
  AbilityScores,
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
} from "@/shared/types";
import { getClassById } from "@/features/classes/services/class.service";
import { getSpeciesById } from "@/features/species/services/species.service";
import { getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
import { getDndBackgroundById } from "@/features/dnd-backgrounds/services/dnd-background.service";
import { resolveDndFeatForRef } from "@/features/dnd-feats/services/dnd-feat.service";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { dndFeatToBuilderSelection } from "../utils/origin-feat.utils";
import { getFeatSlotLevels } from "../utils/builder-class.utils";
import { ORIGIN_FEAT_SOURCE_NAME } from "../utils/origin-feat.constants";
import { Character } from "../models/Character";
import {
  composeAlignment,
  parseAlignmentAxes,
  type GoodEvilAxis,
  type LawChaosAxis,
} from "../utils/alignment.utils";
import { calculateCombat } from "../utils/combat.calculator";
import type { StandaloneShieldItem } from "../data/shield.placeholder";
import {
  makeWeaponSlot,
  makeArmorSlot,
  resizeRunesForRarity,
} from "../utils/equipment.factory";
import { wouldViolateRule, RuleViolation } from "@/features/runes/utils/build.validation";
import {
  getWeaponShieldAcBonus,
  hasActiveIntegratedShield,
  weaponIncludesShield,
} from "@/features/weapons/utils/shield.utils";
import {
  blocksOffHand,
  canEquipInOffHand,
  getOffHandBlockReason,
  occupiesBothGripSlots,
  isWeaponTwoHanded,
  OffHandBlockReason,
} from "@/features/weapons/utils/weapon-hands.utils";
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
import {
  resolveFixedGrants,
  resolveFixedExpertiseGrants,
  computeCharacterProficiencies,
} from "../utils/compute-character-proficiencies";
import { resolveFixedNamedGrants } from "@/shared/utils/named-proficiency.parser";
import { resolveFixedDefenseGrants } from "@/shared/utils/defense-grant.parser";
import { getCharacterAcBreakdown } from "../utils/character-armor-class";
import {
  pruneChoicesByHierarchy,
  skillsFromHigherPriority,
} from "../utils/skill-choice-hierarchy.utils";
import { useBuilderInventory } from "./BuilderInventoryContext";

// ─── Context Value ───────────────────────────────────────────────────────────

interface CharacterBuilderContextValue {
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
  /** Species-granted origin feat (D&D 2024 Human Versatile, etc.). */
  speciesOriginFeatGrant: OriginFeatGrant | null;
  speciesOriginFeat: BuilderFeatSelection | null;
  /** Background-granted origin feat (D&D 2024 backgrounds). */
  backgroundOriginFeatGrant: OriginFeatGrant | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
  originFeatSkillChoices: SkillKey[];
  backstoryNotes: string;
  setSpecies: (selection: CharacterSelectionRef | null) => void;
  setBackground: (selection: CharacterSelectionRef | null) => void;
  setClass: (selection: CharacterSelectionRef | null) => void;
  setSubclass: (selection: CharacterSelectionRef | null) => void;
  setFeatAtIndex: (index: number, selection: BuilderFeatSelection | null) => void;
  setSpeciesOriginFeat: (selection: BuilderFeatSelection | null) => void;

  // Ability score origin bonuses (species / Tasha's Cauldron / 2024 background)
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
  setBackstoryNotes: (
    value: string | ((current: string) => string),
  ) => void;

  // Weapon handling
  isTwoHanded: boolean;
  isOffHandBlocked: boolean;
  offHandBlockReason: OffHandBlockReason | null;
  /** Main-hand weapon includes a shield and off-hand is occupied by it. */
  hasIntegratedShield: boolean;
  integratedShieldAcBonus: number;
  /** Standalone shield (e.g. PHB Shield) equipped in the off-hand. */
  equippedShield: StandaloneShieldItem | null;
  standaloneShieldAcBonus: number;
  /** Combined shield AC from integrated and/or standalone sources. */
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

  // Reset
  resetBuild: () => void;

  // ─── Proficiency setters (called by BuilderItemLibraryPanel when identity loads) ──
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

  // ─── Proficiency choices ─────────────────────────────────────────────────
  /** All skill grants coming from selected identity (species/background/class/feats). */
  allSkillGrants: SkillProficiencyGrant[];
  /** All expertise grants coming from selected identity. */
  allExpertiseGrants: ExpertiseGrant[];
  /** All skill advantage/disadvantage grants. */
  allSkillAdvantages: SkillAdvantageGrant[];
  /** Save proficiency ability keys from class. */
  saveProficiencyAbilities: AbilityKey[];

  /** Class skill picks keyed by choose-grant index (supports multiple grants and count > 2). */
  classSkillChoices: Record<number, SkillKey[]>;
  backgroundSkillChoices: SkillKey[];
  speciesSkillChoices: SkillKey[];
  featSkillChoices: Record<number, SkillKey[]>;
  /** Player's chosen skills for each expertise grant (keyed by grant index in allExpertiseGrants). */
  expertiseChoices: Record<string, SkillKey[]>;

  setClassSkillChoicesAtIndex: (grantIndex: number, choices: SkillKey[]) => void;
  setBackgroundSkillChoices: (choices: SkillKey[]) => void;
  setSpeciesSkillChoices: (choices: SkillKey[]) => void;
  setFeatSkillChoices: (slotIndex: number, choices: SkillKey[]) => void;
  setOriginFeatSkillChoices: (choices: SkillKey[]) => void;
  setExpertiseChoices: (grantId: string, choices: SkillKey[]) => void;

  /** Aggregated skill sources for tooltip display */
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

const CharacterBuilderContext = createContext<CharacterBuilderContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function CharacterBuilderProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { clearInventory } = useBuilderInventory();
  const [character, setCharacter] = useState<Character>(() => new Character());
  const [attacksPerTurnOverride, setAttacksPerTurnOverride] = useState<number | null>(null);
  const [useUnarmedStrike, setUseUnarmedStrike] = useState(false);
  const [mainHand, setMainHand] = useState<EquippedWeapon | null>(null);
  const [offHand, setOffHand] = useState<EquippedWeapon | null>(null);
  const [equippedShield, setEquippedShield] =
    useState<StandaloneShieldItem | null>(null);
  const [armor, setArmor] = useState<EquippedArmor | null>(null);
  const [trinket1, setTrinket1] = useState<EquippedTrinket | null>(null);
  const [trinket2, setTrinket2] = useState<EquippedTrinket | null>(null);
  const [species, setSpeciesState] = useState<CharacterSelectionRef | null>(null);
  const [selectedSpeciesData, setSelectedSpeciesData] = useState<Species | null>(null);
  const [backgroundRef, setBackgroundRef] = useState<CharacterSelectionRef | null>(null);
  const setBackground = useCallback((selection: CharacterSelectionRef | null) => {
    setBackgroundRef(selection);
    setBackgroundSkillChoices([]);
    setBackgroundToolChoices([]);
    setBackgroundLanguageChoices([]);
    setBackgroundAsiMode(null);
    setBackgroundAsiPlus2(null);
    setBackgroundAsiPlus1(null);
    setBackgroundOriginFeatGrant(null);
    setBackgroundOriginFeatState(null);
    // Clear background grants immediately when background changes/removed
    setBgSkillGrants([]);
    setBgToolGrants([]);
    setBgLanguageGrants([]);
  }, []);
  const [classRef, setClassState] = useState<CharacterSelectionRef | null>(null);
  const [selectedClassData, setSelectedClassData] = useState<Class | null>(null);
  const [subclass, setSubclassState] = useState<CharacterSelectionRef | null>(null);
  const [featSelections, setFeatSelections] = useState<
    (BuilderFeatSelection | null)[]
  >([]);
  const [spellSelections, setSpellSelections] = useState<BuilderSpellSelections>({});

  const addSpell = useCallback((level: number, spell: BuilderSpellSelection) => {
    setSpellSelections((prev) => {
      const base = prev ?? {};
      const existing = base[level] ?? [];
      if (existing.some((s) => s.id === spell.id)) return base;
      return { ...base, [level]: [...existing, spell] };
    });
  }, []);

  const removeSpell = useCallback((level: number, spellId: string) => {
    setSpellSelections((prev) => {
      const base = prev ?? {};
      const existing = base[level] ?? [];
      const filtered = existing.filter((s) => s.id !== spellId);
      return { ...base, [level]: filtered };
    });
  }, []);

  const clearSpells = useCallback(() => {
    setSpellSelections({});
  }, []);

  const [useTashaOrigin, setUseTashaOrigin] = useState(false);
  const [tashaPlus2, setTashaPlus2] = useState<AbilityKey | null>(null);
  const [tashaPlus1, setTashaPlus1] = useState<AbilityKey | null>(null);
  const [speciesAbilityChoices, setSpeciesAbilityChoices] = useState<
    (AbilityKey | null)[]
  >([]);
  const [backgroundAsiMode, setBackgroundAsiMode] =
    useState<BackgroundAsiMode | null>(null);
  const [backgroundAsiPlus2, setBackgroundAsiPlus2] =
    useState<AbilityKey | null>(null);
  const [backgroundAsiPlus1, setBackgroundAsiPlus1] =
    useState<AbilityKey | null>(null);
  const [backstoryNotes, setBackstoryNotesState] = useState(
    () => loadBuilderBackstoryNotes(),
  );

  // ─── Proficiency state (per-source buckets) ──────────────────────────────
  const [classSkillGrants, setClassSkillGrants] = useState<SkillProficiencyGrant[]>([]);
  const [bgSkillGrants, setBgSkillGrants] = useState<SkillProficiencyGrant[]>([]);
  const [speciesSkillGrants, setSpeciesSkillGrants] = useState<SkillProficiencyGrant[]>([]);
  const [featGrantsList, setFeatGrantsList] = useState<SkillProficiencyGrant[]>([]);

  const [classToolGrants, setClassToolGrants] = useState<NamedProficiencyGrant[]>([]);
  const [classArmorGrants, setClassArmorGrants] = useState<NamedProficiencyGrant[]>([]);
  const [classWeaponGrants, setClassWeaponGrants] = useState<NamedProficiencyGrant[]>([]);
  const [bgToolGrants, setBgToolGrants] = useState<NamedProficiencyGrant[]>([]);
  const [speciesToolGrants, setSpeciesToolGrants] = useState<NamedProficiencyGrant[]>([]);
  const [classLanguageGrants, setClassLanguageGrants] = useState<NamedProficiencyGrant[]>([]);
  const [bgLanguageGrants, setBgLanguageGrants] = useState<NamedProficiencyGrant[]>([]);
  const [speciesLanguageGrants, setSpeciesLanguageGrants] = useState<NamedProficiencyGrant[]>([]);
  const [speciesDefenseGrants, setSpeciesDefenseGrants] = useState<DefenseGrant[]>([]);

  const [classExpertiseGrants, setClassExpertiseGrants] = useState<ExpertiseGrant[]>([]);
  const [featExpertiseGrants, setFeatExpertiseGrants] = useState<ExpertiseGrant[]>([]);

  const [allSkillAdvantages, setAllSkillAdvantages] = useState<SkillAdvantageGrant[]>([]);
  const [saveProficiencyAbilities, setSaveProficiencyAbilities] = useState<AbilityKey[]>([]);

  const allSkillGrants = useMemo(
    () => [...classSkillGrants, ...bgSkillGrants, ...speciesSkillGrants, ...featGrantsList],
    [classSkillGrants, bgSkillGrants, speciesSkillGrants, featGrantsList],
  );
  const allToolGrants = useMemo(
    () => [...classToolGrants, ...bgToolGrants, ...speciesToolGrants],
    [classToolGrants, bgToolGrants, speciesToolGrants],
  );
  const allLanguageGrants = useMemo(
    () => [...classLanguageGrants, ...bgLanguageGrants, ...speciesLanguageGrants],
    [classLanguageGrants, bgLanguageGrants, speciesLanguageGrants],
  );
  const allDefenseGrants = useMemo(
    () => [...speciesDefenseGrants],
    [speciesDefenseGrants],
  );
  const allExpertiseGrants = useMemo(
    () => [...classExpertiseGrants, ...featExpertiseGrants],
    [classExpertiseGrants, featExpertiseGrants],
  );

  const [classSkillChoices, setClassSkillChoicesState] = useState<
    Record<number, SkillKey[]>
  >({});
  const [backgroundSkillChoices, setBackgroundSkillChoices] = useState<SkillKey[]>([]);
  const [speciesSkillChoices, setSpeciesSkillChoices] = useState<SkillKey[]>([]);
  const [featSkillChoices, setFeatSkillChoicesState] = useState<Record<number, SkillKey[]>>({});
  const [originFeatSkillChoices, setOriginFeatSkillChoicesState] = useState<SkillKey[]>([]);
  const [speciesOriginFeatGrant, setSpeciesOriginFeatGrant] =
    useState<OriginFeatGrant | null>(null);
  const [speciesOriginFeat, setSpeciesOriginFeatState] =
    useState<BuilderFeatSelection | null>(null);
  const [backgroundOriginFeatGrant, setBackgroundOriginFeatGrant] =
    useState<OriginFeatGrant | null>(null);
  const [backgroundOriginFeat, setBackgroundOriginFeatState] =
    useState<BuilderFeatSelection | null>(null);
  const [expertiseChoices, setExpertiseChoicesState] = useState<Record<string, SkillKey[]>>({});

  const [classToolChoices, setClassToolChoicesState] = useState<Record<number, string[]>>({});
  const [backgroundToolChoices, setBackgroundToolChoices] = useState<string[]>([]);
  const [speciesToolChoices, setSpeciesToolChoices] = useState<string[]>([]);
  const [classLanguageChoices, setClassLanguageChoicesState] = useState<Record<number, string[]>>({});
  const [backgroundLanguageChoices, setBackgroundLanguageChoices] = useState<string[]>([]);
  const [speciesLanguageChoices, setSpeciesLanguageChoices] = useState<string[]>([]);
  const [speciesDefenseChoices, setSpeciesDefenseChoicesState] = useState<
    Record<number, DamageType[]>
  >({});

  const applyIdentityGrants = useCallback((payload: {
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
  }) => {
    const { source } = payload;
    if (payload.skillGrants !== undefined) {
      if (source === "class") setClassSkillGrants(payload.skillGrants);
      else if (source === "background") setBgSkillGrants(payload.skillGrants);
      else if (source === "species") setSpeciesSkillGrants(payload.skillGrants);
      else setFeatGrantsList(payload.skillGrants);
    }
    if (payload.expertiseGrants !== undefined) {
      if (source === "class") setClassExpertiseGrants(payload.expertiseGrants);
      else setFeatExpertiseGrants(payload.expertiseGrants);
    }
    if (payload.skillAdvantages !== undefined) {
      setAllSkillAdvantages(payload.skillAdvantages);
    }
    if (payload.saveProficiencies !== undefined) {
      setSaveProficiencyAbilities(payload.saveProficiencies);
    }
    if (payload.toolGrants !== undefined) {
      if (source === "class") setClassToolGrants(payload.toolGrants);
      else if (source === "background") setBgToolGrants(payload.toolGrants);
      else if (source === "species") setSpeciesToolGrants(payload.toolGrants);
    }
    if (payload.armorGrants !== undefined && source === "class") {
      setClassArmorGrants(payload.armorGrants);
    }
    if (payload.weaponGrants !== undefined && source === "class") {
      setClassWeaponGrants(payload.weaponGrants);
    }
    if (payload.languageGrants !== undefined) {
      if (source === "class") setClassLanguageGrants(payload.languageGrants);
      else if (source === "background") setBgLanguageGrants(payload.languageGrants);
      else if (source === "species") setSpeciesLanguageGrants(payload.languageGrants);
    }
    if (payload.defenseGrants !== undefined && source === "species") {
      setSpeciesDefenseGrants(payload.defenseGrants);
    }
  }, []);

  useEffect(() => {
    persistBuilderBackstoryNotes(backstoryNotes);
  }, [backstoryNotes]);

  const setBackstoryNotes = useCallback(
    (value: string | ((current: string) => string)) => {
      setBackstoryNotesState(value);
    },
    [],
  );

  const setSpecies = useCallback((selection: CharacterSelectionRef | null) => {
    setSpeciesState(selection);
    setSelectedSpeciesData(null);
    setSpeciesAbilityChoices([]);
    setSpeciesSkillChoices([]);
    setSpeciesToolChoices([]);
    setSpeciesLanguageChoices([]);
    setSpeciesDefenseChoicesState({});
    setSpeciesOriginFeatGrant(null);
    setSpeciesOriginFeatState(null);
    setOriginFeatSkillChoicesState([]);
    // Clear species grants immediately when species changes/removed
    setSpeciesSkillGrants([]);
    setSpeciesToolGrants([]);
    setSpeciesLanguageGrants([]);
    setSpeciesDefenseGrants([]);
    setAllSkillAdvantages([]);
    if (!selection) {
      setUseTashaOrigin(false);
      setTashaPlus2(null);
      setTashaPlus1(null);
    }
  }, []);

  const setSpeciesOriginFeat = useCallback((selection: BuilderFeatSelection | null) => {
    setSpeciesOriginFeatState(selection);
    if (!selection)     setOriginFeatSkillChoicesState([]);
  }, []);

  const setClass = useCallback((selection: CharacterSelectionRef | null) => {
    setClassState(selection);
    setSelectedClassData(null);
    setSubclassState(null);
    setFeatSelections([]);
    setClassSkillChoicesState({});
    setExpertiseChoicesState({});
    setSpellSelections({});
    // Clear class grants immediately
    setClassSkillGrants([]);
    setClassExpertiseGrants([]);
    setSaveProficiencyAbilities([]);
    setClassToolGrants([]);
    setClassArmorGrants([]);
    setClassWeaponGrants([]);
    setClassLanguageGrants([]);
    setClassToolChoicesState({});
    setClassLanguageChoicesState({});
  }, []);

  useEffect(() => {
    if (!classRef) {
      setSelectedClassData(null);
      return;
    }

    let cancelled = false;
    getClassById(classRef.id)
      .then((data) => {
        if (!cancelled) setSelectedClassData(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setSelectedClassData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [classRef?.id]);

  useEffect(() => {
    if (!species) {
      setSelectedSpeciesData(null);
      return;
    }

    let cancelled = false;
    getSpeciesById(species.id)
      .then((data) => {
        if (!cancelled) setSelectedSpeciesData(data ?? null);
      })
      .catch(() => {
        if (!cancelled) setSelectedSpeciesData(null);
      });

    return () => {
      cancelled = true;
    };
  }, [species?.id]);

  useEffect(() => {
    if (!species) {
      setSpeciesOriginFeatGrant(null);
      setSpeciesOriginFeatState(null);
      setOriginFeatSkillChoicesState([]);
      return;
    }

    let cancelled = false;

    async function loadOriginFeatGrant() {
      const [mhSpecies, dndRace, dndSubrace] = await Promise.all([
        getSpeciesById(species!.id),
        getDndRaceById(species!.id),
        species!.subraceId
          ? getDndRaceById(species!.subraceId)
          : Promise.resolve(null),
      ]);
      if (cancelled) return;

      const base = mhSpecies ?? dndRace;
      const grant =
        base?.originFeatGrant ?? dndSubrace?.originFeatGrant ?? null;
      setSpeciesOriginFeatGrant(grant);

      if (!grant) {
        setSpeciesOriginFeatState(null);
        setOriginFeatSkillChoicesState([]);
        return;
      }

      if (grant.kind === "fixed" && grant.featRefs[0]) {
        const feat = await resolveDndFeatForRef(grant.featRefs[0]);
        if (cancelled || !feat) return;
        setSpeciesOriginFeatState(dndFeatToBuilderSelection(feat));
        return;
      }

      if (grant.kind === "choose") {
        setSpeciesOriginFeatState(null);
        setOriginFeatSkillChoicesState([]);
      }
    }

    void loadOriginFeatGrant();

    return () => {
      cancelled = true;
    };
  }, [species?.id, species?.subraceId]);

  useEffect(() => {
    if (!backgroundRef) {
      setBackgroundOriginFeatGrant(null);
      setBackgroundOriginFeatState(null);
      return;
    }

    let cancelled = false;

    async function loadBackgroundOriginFeat() {
      const dndBackground = await getDndBackgroundById(backgroundRef!.id);
      if (cancelled) return;

      const grant = dndBackground?.originFeatGrant ?? null;
      setBackgroundOriginFeatGrant(grant);

      if (!grant) {
        setBackgroundOriginFeatState(null);
        return;
      }

      if (grant.kind === "fixed" && grant.featRefs[0]) {
        const feat = await resolveDndFeatForRef(grant.featRefs[0]);
        if (cancelled || !feat) return;
        setBackgroundOriginFeatState({
          ...dndFeatToBuilderSelection(feat),
          name: grant.featRefs[0].displayLabel,
        });
        return;
      }

      setBackgroundOriginFeatState(null);
    }

    void loadBackgroundOriginFeat();

    return () => {
      cancelled = true;
    };
  }, [backgroundRef?.id]);

  const setClassSkillChoicesAtIndex = useCallback(
    (grantIndex: number, choices: SkillKey[]) => {
      setClassSkillChoicesState((prev) => ({ ...prev, [grantIndex]: choices }));
    },
    [],
  );

  const setFeatSkillChoices = useCallback((slotIndex: number, choices: SkillKey[]) => {
    setFeatSkillChoicesState((prev) => ({ ...prev, [slotIndex]: choices }));
  }, []);

  const setOriginFeatSkillChoices = useCallback((choices: SkillKey[]) => {
    setOriginFeatSkillChoicesState(choices);
  }, []);

  const setExpertiseChoices = useCallback((grantId: string, choices: SkillKey[]) => {
    setExpertiseChoicesState((prev) => ({ ...prev, [grantId]: choices }));
  }, []);

  const setClassToolChoicesAtIndex = useCallback((grantIndex: number, choices: string[]) => {
    setClassToolChoicesState((prev) => ({ ...prev, [grantIndex]: choices }));
  }, []);

  const setClassLanguageChoicesAtIndex = useCallback(
    (grantIndex: number, choices: string[]) => {
      setClassLanguageChoicesState((prev) => ({ ...prev, [grantIndex]: choices }));
    },
    [],
  );

  const setSpeciesDefenseChoicesAtIndex = useCallback(
    (grantIndex: number, choices: DamageType[]) => {
      setSpeciesDefenseChoicesState((prev) => ({ ...prev, [grantIndex]: choices }));
    },
    [],
  );

  const setSubclass = useCallback((selection: CharacterSelectionRef | null) => {
    setSubclassState(selection);
  }, []);

  const setFeatAtIndex = useCallback(
    (index: number, selection: BuilderFeatSelection | null) => {
      setFeatSelections((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push(null);
        next[index] = selection;
        return next;
      });
    },
    [],
  );

  const setSpeciesAbilityChoice = useCallback(
    (index: number, ability: AbilityKey | null) => {
      setSpeciesAbilityChoices((prev) => {
        const next = [...prev];
        while (next.length <= index) next.push(null);
        next[index] = ability;
        return next;
      });
    },
    [],
  );

  // ─── Character mutations ─────────────────────────────────────────────────

  const setName = useCallback((name: string) => {
    setCharacter((prev) => prev.withUpdates({ name }));
  }, []);

  const setCreatureSize = useCallback((size: "M" | "S") => {
    setCharacter((prev) => prev.withUpdates({ size }));
  }, []);

  const setLawChaosAlignment = useCallback((lawChaos: LawChaosAxis) => {
    setCharacter((prev) => {
      const { goodEvil } = parseAlignmentAxes(prev.alignment);
      return prev.withUpdates({
        alignment: composeAlignment(lawChaos, goodEvil),
      });
    });
  }, []);

  const setGoodEvilAlignment = useCallback((goodEvil: GoodEvilAxis) => {
    setCharacter((prev) => {
      const { lawChaos } = parseAlignmentAxes(prev.alignment);
      return prev.withUpdates({
        alignment: composeAlignment(lawChaos, goodEvil),
      });
    });
  }, []);

  const setLevel = useCallback((level: number) => {
    setCharacter((prev) => prev.withUpdates({ level }));
    setFeatSelections((prev) => {
      const maxSlots = getFeatSlotLevels(classRef?.name ?? "", level).length;
      return prev.slice(0, maxSlots);
    });
  }, [classRef?.name]);

  const setAbilityScore = useCallback((ability: AbilityKey, value: number) => {
    const clamped = Math.max(1, Math.min(30, value));
    setCharacter((prev) =>
      prev.withUpdates({ abilities: { [ability]: clamped } as Partial<AbilityScores> })
    );
  }, []);

  const setAbilityScores = useCallback((abilities: Partial<AbilityScores>) => {
    const clamped = Object.fromEntries(
      Object.entries(abilities).map(([key, value]) => [
        key,
        Math.max(1, Math.min(30, value as number)),
      ])
    ) as Partial<AbilityScores>;
    setCharacter((prev) =>
      prev.withUpdates({ abilities: { ...prev.abilities, ...clamped } })
    );
  }, []);

  // ─── Equipment mutations ─────────────────────────────────────────────────

  const equipWeapon = useCallback(
    (slot: "mainHand" | "offHand", weapon: Weapon, rarity: string) => {
      const equipped = makeWeaponSlot(weapon, rarity);
      if (slot === "mainHand") {
        setMainHand(equipped);
        if (
          isWeaponTwoHanded(equipped) ||
          weaponIncludesShield(weapon) ||
          occupiesBothGripSlots(weapon)
        ) {
          setOffHand(null);
          setEquippedShield(null);
        }
      } else if (
        !hasActiveIntegratedShield(mainHand) &&
        !blocksOffHand(mainHand) &&
        canEquipInOffHand(weapon)
      ) {
        setEquippedShield(null);
        setOffHand(equipped);
      }
    },
    [mainHand],
  );

  const unequipWeapon = useCallback((slot: "mainHand" | "offHand") => {
    if (slot === "mainHand") setMainHand(null);
    else {
      setOffHand(null);
      setEquippedShield(null);
    }
  }, []);

  const setWeaponRarity = useCallback((slot: "mainHand" | "offHand", rarity: string) => {
    const setter = slot === "mainHand" ? setMainHand : setOffHand;
    setter((prev) => {
      if (!prev) return prev;
      return { ...prev, ...resizeRunesForRarity(prev.runes, rarity) };
    });
  }, []);

  const setVersatileMode = useCallback((slot: "mainHand" | "offHand", twoHanded: boolean) => {
    const setter = slot === "mainHand" ? setMainHand : setOffHand;
    setter((prev) => {
      if (!prev) return prev;
      return { ...prev, useVersatile: twoHanded };
    });
    // If switching to two-handed on main hand, clear off-hand
    if (slot === "mainHand" && twoHanded) {
      setOffHand(null);
      setEquippedShield(null);
    }
  }, []);

  const equipShield = useCallback(
    (shield: StandaloneShieldItem) => {
      if (hasActiveIntegratedShield(mainHand) || blocksOffHand(mainHand)) return;
      setOffHand(null);
      setEquippedShield(shield);
    },
    [mainHand],
  );

  const unequipShield = useCallback(() => setEquippedShield(null), []);

  const equipArmor = useCallback((armorItem: ArmorItem) => {
    setArmor(makeArmorSlot(armorItem, armorItem.rarity));
  }, []);

  const unequipArmor = useCallback(() => setArmor(null), []);

  const setArmorRarity = useCallback((rarity: string) => {
    setArmor((prev) => {
      if (!prev) return prev;
      return { ...prev, ...resizeRunesForRarity(prev.runes, rarity) };
    });
  }, []);

  const equipTrinket = useCallback((slot: "trinket1" | "trinket2", name: string) => {
    const trinket: EquippedTrinket = { name, rune: null };
    if (slot === "trinket1") setTrinket1(trinket);
    else setTrinket2(trinket);
  }, []);

  const unequipTrinket = useCallback((slot: "trinket1" | "trinket2") => {
    if (slot === "trinket1") setTrinket1(null);
    else setTrinket2(null);
  }, []);

  const clearEquipment = useCallback(() => {
    setMainHand(null);
    setOffHand(null);
    setEquippedShield(null);
    setArmor(null);
    setTrinket1(null);
    setTrinket2(null);
  }, []);

  // ─── Rune mutations ──────────────────────────────────────────────────────

  const assignWeaponRune = useCallback(
    (slot: "mainHand" | "offHand", index: number, rune: Rune): RuleViolation | null => {
      const setter = slot === "mainHand" ? setMainHand : setOffHand;
      let violation: RuleViolation | null = null;

      setter((prev) => {
        if (!prev || index >= prev.runeSlots) return prev;
        violation = wouldViolateRule(rune, prev.runes, "weapon");
        if (violation) return prev;
        const newRunes = [...prev.runes];
        newRunes[index] = rune;
        return { ...prev, runes: newRunes };
      });

      return violation;
    },
    [],
  );

  const removeWeaponRune = useCallback((slot: "mainHand" | "offHand", index: number) => {
    const setter = slot === "mainHand" ? setMainHand : setOffHand;
    setter((prev) => {
      if (!prev) return prev;
      const newRunes = [...prev.runes];
      newRunes[index] = null;
      return { ...prev, runes: newRunes };
    });
  }, []);

  const assignArmorRune = useCallback(
    (index: number, rune: Rune): RuleViolation | null => {
      let violation: RuleViolation | null = null;
      setArmor((prev) => {
        if (!prev || index >= prev.runeSlots) return prev;
        violation = wouldViolateRule(rune, prev.runes, "armor");
        if (violation) return prev;
        const newRunes = [...prev.runes];
        newRunes[index] = rune;
        return { ...prev, runes: newRunes };
      });
      return violation;
    },
    [],
  );

  const removeArmorRune = useCallback((index: number) => {
    setArmor((prev) => {
      if (!prev) return prev;
      const newRunes = [...prev.runes];
      newRunes[index] = null;
      return { ...prev, runes: newRunes };
    });
  }, []);

  const assignTrinketRune = useCallback(
    (
      slot: "trinket1" | "trinket2",
      rune: Rune,
      materialEffectKind?: "weapon" | "armor",
    ) => {
      const setter = slot === "trinket1" ? setTrinket1 : setTrinket2;
      setter((prev) =>
        prev
          ? {
              ...prev,
              rune,
              runeMaterialEffect: materialEffectKind ?? prev.runeMaterialEffect,
            }
          : prev,
      );
    },
    [],
  );

  const removeTrinketRune = useCallback((slot: "trinket1" | "trinket2") => {
    const setter = slot === "trinket1" ? setTrinket1 : setTrinket2;
    setter((prev) => (prev ? { ...prev, rune: null } : prev));
  }, []);

  // ─── Computed values ─────────────────────────────────────────────────────

  const isTwoHanded = isWeaponTwoHanded(mainHand);
  const isOffHandBlocked = blocksOffHand(mainHand);
  const offHandBlockReason = getOffHandBlockReason(mainHand);
  const hasIntegratedShield = hasActiveIntegratedShield(mainHand);
  const integratedShieldAcBonus = useMemo(() => {
    if (!hasIntegratedShield || !mainHand) return 0;
    return getWeaponShieldAcBonus(mainHand.weapon, mainHand.rarity);
  }, [hasIntegratedShield, mainHand]);

  const standaloneShieldAcBonus = equippedShield?.acBonus ?? 0;
  const shieldAcBonus = integratedShieldAcBonus + standaloneShieldAcBonus;

  const effectiveAttacksPerTurn = attacksPerTurnOverride ?? character.getAttacksPerTurn();

  const totalAC = useMemo(() => {
    const modifiers = {
      str: character.getModifier("str"),
      dex: character.getModifier("dex"),
      con: character.getModifier("con"),
      int: character.getModifier("int"),
      wis: character.getModifier("wis"),
      cha: character.getModifier("cha"),
    };

    return getCharacterAcBreakdown({
      modifiers,
      level: character.level,
      armor,
      integratedShieldAcBonus,
      standaloneShieldAcBonus,
      classData: null,
      className: classRef?.name,
      subclass: null,
      speciesName: species?.name,
    }).total;
  }, [
    armor,
    character,
    integratedShieldAcBonus,
    standaloneShieldAcBonus,
    classRef?.name,
    species?.name,
  ]);

  const combat = useMemo(
    () =>
      calculateCombat(
        character,
        mainHand,
        offHand,
        effectiveAttacksPerTurn,
        useUnarmedStrike,
        classRef?.name,
        selectedClassData,
        selectedSpeciesData,
      ),
    [
      character,
      mainHand,
      offHand,
      effectiveAttacksPerTurn,
      useUnarmedStrike,
      classRef?.name,
      selectedClassData,
      selectedSpeciesData,
    ],
  );

  // ─── Reset ───────────────────────────────────────────────────────────────

  const resetBuild = useCallback(() => {
    setCharacter(new Character());
    setMainHand(null);
    setOffHand(null);
    setEquippedShield(null);
    setArmor(null);
    setTrinket1(null);
    setTrinket2(null);
    setSpecies(null);
    setSelectedSpeciesData(null);
    setBackground(null);
    setClassState(null);
    setSelectedClassData(null);
    setSubclassState(null);
    setFeatSelections([]);
    setBackstoryNotesState("");
    setAttacksPerTurnOverride(null);
    setUseUnarmedStrike(false);
    setUseTashaOrigin(false);
    setTashaPlus2(null);
    setTashaPlus1(null);
    setSpeciesAbilityChoices([]);
    setBackgroundAsiMode(null);
    setBackgroundAsiPlus2(null);
    setBackgroundAsiPlus1(null);
    setBackgroundOriginFeatGrant(null);
    setBackgroundOriginFeatState(null);
    setClassSkillGrants([]);
    setBgSkillGrants([]);
    setSpeciesSkillGrants([]);
    setFeatGrantsList([]);
    setClassExpertiseGrants([]);
    setFeatExpertiseGrants([]);
    setAllSkillAdvantages([]);
    setSaveProficiencyAbilities([]);
    setClassSkillChoicesState({});
    setBackgroundSkillChoices([]);
    setSpeciesSkillChoices([]);
    setFeatSkillChoicesState({});
    setOriginFeatSkillChoicesState([]);
    setSpeciesOriginFeatGrant(null);
    setSpeciesOriginFeatState(null);
    setExpertiseChoicesState({});
    setClassToolGrants([]);
    setClassArmorGrants([]);
    setClassWeaponGrants([]);
    setBgToolGrants([]);
    setSpeciesToolGrants([]);
    setClassLanguageGrants([]);
    setBgLanguageGrants([]);
    setSpeciesLanguageGrants([]);
    setSpeciesDefenseGrants([]);
    setClassToolChoicesState({});
    setBackgroundToolChoices([]);
    setSpeciesToolChoices([]);
    setClassLanguageChoicesState({});
    setBackgroundLanguageChoices([]);
    setSpeciesLanguageChoices([]);
    setSpeciesDefenseChoicesState({});
    setSpellSelections({});
    clearInventory();
  }, [clearInventory]);

  // ─── Hierarchy: Species → Background → Class ─────────────────────────────

  const higherThanBackground = useMemo(
    () =>
      skillsFromHigherPriority(
        "background",
        speciesSkillGrants,
        speciesSkillChoices,
        [],
        [],
        [],
        [],
      ),
    [speciesSkillGrants, speciesSkillChoices],
  );

  const higherThanClass = useMemo(
    () =>
      skillsFromHigherPriority(
        "class",
        speciesSkillGrants,
        speciesSkillChoices,
        bgSkillGrants,
        backgroundSkillChoices,
        [],
        [],
      ),
    [
      speciesSkillGrants,
      speciesSkillChoices,
      bgSkillGrants,
      backgroundSkillChoices,
    ],
  );

  useEffect(() => {
    const covered = new Set(Object.keys(higherThanBackground) as SkillKey[]);
    setBackgroundSkillChoices((prev) => {
      const next = pruneChoicesByHierarchy(prev, covered);
      if (next.length === prev.length && next.every((s, i) => s === prev[i])) {
        return prev;
      }
      return next;
    });
  }, [higherThanBackground]);

  useEffect(() => {
    const covered = new Set(Object.keys(higherThanClass) as SkillKey[]);
    setClassSkillChoicesState((prev) => {
      let changed = false;
      const next: Record<number, SkillKey[]> = {};
      for (const [idx, choices] of Object.entries(prev)) {
        const pruned = pruneChoicesByHierarchy(choices, covered);
        next[Number(idx)] = pruned;
        if (
          pruned.length !== choices.length ||
          pruned.some((s, i) => s !== choices[i])
        ) {
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [higherThanClass]);

  // ─── Aggregated proficiency computation ──────────────────────────────────

  const proficiencyResult = useMemo(() => {
    // All fixed grants (automatically applied)
    const fixedSkills = resolveFixedGrants(allSkillGrants);

    // Choices made by the player for choose/any grants
    const classChooseGrants = allSkillGrants.filter(
      (g) => g.kind !== "fixed" && g.source.type === "class",
    );
    const chosenSkillsFromClass: Array<{ skill: SkillKey; source: import("@/shared/types/proficiency.types").ProficiencySource }> =
      Object.entries(classSkillChoices).flatMap(([idx, skills]) =>
        skills.map((sk) => ({
          skill: sk,
          source:
            classChooseGrants[Number(idx)]?.source ?? {
              type: "class" as const,
              name: "Class",
            },
        })),
      );
    const chosenSkillsFromBackground: Array<{ skill: SkillKey; source: import("@/shared/types/proficiency.types").ProficiencySource }> =
      backgroundSkillChoices.map((sk) => {
        const grant = allSkillGrants.find((g) => g.kind !== "fixed" && g.source.type === "background");
        return { skill: sk, source: grant?.source ?? { type: "background", name: "Background" } };
      });
    const chosenSkillsFromSpecies: Array<{ skill: SkillKey; source: import("@/shared/types/proficiency.types").ProficiencySource }> =
      speciesSkillChoices.map((sk) => {
        const grant = allSkillGrants.find((g) => g.kind !== "fixed" && g.source.type === "species");
        return { skill: sk, source: grant?.source ?? { type: "species", name: "Species" } };
      });
    const chosenSkillsFromFeats: Array<{ skill: SkillKey; source: import("@/shared/types/proficiency.types").ProficiencySource }> =
      Object.entries(featSkillChoices).flatMap(([idx, skills]) =>
        skills.map((sk) => ({
          skill: sk,
          source: { type: "feat" as const, name: `Feat slot ${Number(idx) + 1}` },
        })),
      );
    const chosenSkillsFromOriginFeat: Array<{ skill: SkillKey; source: import("@/shared/types/proficiency.types").ProficiencySource }> =
      originFeatSkillChoices.map((sk) => ({
        skill: sk,
        source: { type: "feat" as const, name: ORIGIN_FEAT_SOURCE_NAME },
      }));

    const resolvedSkillGrants = [
      ...fixedSkills,
      ...chosenSkillsFromClass,
      ...chosenSkillsFromBackground,
      ...chosenSkillsFromSpecies,
      ...chosenSkillsFromOriginFeat,
      ...chosenSkillsFromFeats,
    ];

    // Expertise: fixed + chosen
    const fixedExpertise = resolveFixedExpertiseGrants(allExpertiseGrants);
    const chosenExpertise: Array<{ skill: SkillKey; source: import("@/shared/types/proficiency.types").ProficiencySource }> =
      Object.entries(expertiseChoices).flatMap(([grantId, skills]) =>
        skills.map((sk) => ({
          skill: sk,
          source: { type: "feature" as const, name: grantId },
        })),
      );
    const resolvedExpertiseGrants = [...fixedExpertise, ...chosenExpertise];

    return computeCharacterProficiencies(
      saveProficiencyAbilities,
      resolvedSkillGrants,
      resolvedExpertiseGrants,
      allSkillAdvantages,
    );
  }, [
    allSkillGrants, allExpertiseGrants, allSkillAdvantages, saveProficiencyAbilities,
    classSkillChoices, backgroundSkillChoices, speciesSkillChoices,
    originFeatSkillChoices, featSkillChoices, expertiseChoices,
  ]);

  const identityGrantsResult = useMemo(() => {
    function resolveFixedGrantList(grants: NamedProficiencyGrant[]) {
      const fixed = resolveFixedNamedGrants(grants);
      const sources: Partial<Record<string, ProficiencySource[]>> = {};
      for (const { item, source } of fixed) {
        const key = item.toLowerCase();
        if (!sources[key]) sources[key] = [];
        if (!sources[key]!.some((s) => s.type === source.type && s.name === source.name)) {
          sources[key]!.push(source);
        }
      }
      const items = [...new Set(fixed.map((entry) => entry.item))];
      return { items, sources };
    }

    function resolveNamedWithChoices(
      grants: NamedProficiencyGrant[],
      classChoices: Record<number, string[]>,
      backgroundChoices: string[],
      speciesChoices: string[],
    ) {
      const fixed = resolveFixedNamedGrants(grants);
      const classChooseGrants = grants.filter(
        (g) => g.kind !== "fixed" && g.source.type === "class",
      );
      const fromClass = Object.entries(classChoices).flatMap(([idx, items]) =>
        items.map((item) => ({
          item,
          source:
            classChooseGrants[Number(idx)]?.source ?? {
              type: "class" as const,
              name: "Class",
            },
        })),
      );
      const bgGrant = grants.find((g) => g.kind !== "fixed" && g.source.type === "background");
      const fromBackground = backgroundChoices.map((item) => ({
        item,
        source: bgGrant?.source ?? { type: "background" as const, name: "Background" },
      }));
      const speciesGrant = grants.find((g) => g.kind !== "fixed" && g.source.type === "species");
      const fromSpecies = speciesChoices.map((item) => ({
        item,
        source: speciesGrant?.source ?? { type: "species" as const, name: "Species" },
      }));

      const all = [...fixed, ...fromClass, ...fromBackground, ...fromSpecies];
      const sources: Partial<Record<string, ProficiencySource[]>> = {};
      for (const { item, source } of all) {
        const key = item.toLowerCase();
        if (!sources[key]) sources[key] = [];
        if (!sources[key]!.some((s) => s.type === source.type && s.name === source.name)) {
          sources[key]!.push(source);
        }
      }
      const items = [...new Set(all.map((e) => e.item))];
      return { items, sources };
    }

    const tools = resolveNamedWithChoices(
      allToolGrants,
      classToolChoices,
      backgroundToolChoices,
      speciesToolChoices,
    );
    const armor = resolveFixedGrantList(classArmorGrants);
    const weapons = resolveFixedGrantList(classWeaponGrants);
    const languages = resolveNamedWithChoices(
      allLanguageGrants,
      classLanguageChoices,
      backgroundLanguageChoices,
      speciesLanguageChoices,
    );

    const fixedDefenses = resolveFixedDefenseGrants(allDefenseGrants);
    const chooseDefenseGrants = allDefenseGrants.filter((g) => g.kind === "choose");
    const chosenDefenses = Object.entries(speciesDefenseChoices).flatMap(([idx, types]) =>
      types.map((type) => ({
        type,
        defenseKind:
          chooseDefenseGrants[Number(idx)]?.defenseKind ?? ("resistance" as DefenseKind),
        source:
          chooseDefenseGrants[Number(idx)]?.source ?? {
            type: "species" as const,
            name: "Species",
          },
      })),
    );
    const allDefenses = [...fixedDefenses, ...chosenDefenses];
    const defenseSources: Partial<
      Record<string, Array<{ source: ProficiencySource; defenseKind: DefenseKind }>>
    > = {};
    for (const entry of allDefenses) {
      const key = entry.type;
      if (!defenseSources[key]) defenseSources[key] = [];
      defenseSources[key]!.push({
        source: entry.source,
        defenseKind: entry.defenseKind,
      });
    }

    return {
      tools: tools.items,
      toolSources: tools.sources,
      armor: armor.items,
      armorSources: armor.sources,
      weapons: weapons.items,
      weaponSources: weapons.sources,
      languages: languages.items,
      languageSources: languages.sources,
      resistances: allDefenses
        .filter((d) => d.defenseKind === "resistance")
        .map((d) => d.type),
      immunities: allDefenses
        .filter((d) => d.defenseKind === "immunity")
        .map((d) => d.type),
      defenseSources,
    };
  }, [
    allToolGrants,
    classArmorGrants,
    classWeaponGrants,
    allLanguageGrants,
    allDefenseGrants,
    classToolChoices,
    backgroundToolChoices,
    speciesToolChoices,
    classLanguageChoices,
    backgroundLanguageChoices,
    speciesLanguageChoices,
    speciesDefenseChoices,
  ]);

  // Sync Character.skills and Character.savingThrows whenever proficiencies change
  useEffect(() => {
    setCharacter((prev) => {
      // Create a shallow clone so React detects the state change
      const next = Object.assign(
        Object.create(Object.getPrototypeOf(prev)) as Character,
        prev,
      );
      next.skills = proficiencyResult.skills;
      next.savingThrows = proficiencyResult.savingThrows;
      next.passivePerception = 10 + next.getSkillModifier("prc");
      next.languages =
        identityGrantsResult.languages.length > 0
          ? identityGrantsResult.languages
          : ["Common"];
      next.damageResistances = identityGrantsResult.resistances;
      next.damageImmunities = identityGrantsResult.immunities;
      return next;
    });
  }, [proficiencyResult, identityGrantsResult]);

  const contextValue = useMemo(
    () => ({
      character,
      setName,
      setCreatureSize,
      setLawChaosAlignment,
      setGoodEvilAlignment,
      setLevel,
      setAbilityScore,
      setAbilityScores,
      attacksPerTurnOverride,
      setAttacksPerTurnOverride,
      effectiveAttacksPerTurn,
      useUnarmedStrike,
      setUseUnarmedStrike,
      mainHand,
      offHand,
      armor,
      trinket1,
      trinket2,
      species,
      background: backgroundRef,
      class: classRef,
      subclass,
      featSelections,
      speciesOriginFeatGrant,
      speciesOriginFeat,
      backgroundOriginFeatGrant,
      backgroundOriginFeat,
      originFeatSkillChoices,
      backstoryNotes,
      setSpecies,
      setBackground,
      setClass,
      setSubclass,
      setFeatAtIndex,
      setSpeciesOriginFeat,
      setBackstoryNotes,
      useTashaOrigin,
      setUseTashaOrigin,
      tashaPlus2,
      tashaPlus1,
      setTashaPlus2,
      setTashaPlus1,
      speciesAbilityChoices,
      setSpeciesAbilityChoice,
      backgroundAsiMode,
      setBackgroundAsiMode,
      backgroundAsiPlus2,
      backgroundAsiPlus1,
      setBackgroundAsiPlus2,
      setBackgroundAsiPlus1,
      isTwoHanded,
      isOffHandBlocked,
      offHandBlockReason,
      hasIntegratedShield,
      integratedShieldAcBonus,
      equippedShield,
      standaloneShieldAcBonus,
      shieldAcBonus,
      equipWeapon,
      unequipWeapon,
      setWeaponRarity,
      setVersatileMode,
      equipArmor,
      unequipArmor,
      equipShield,
      unequipShield,
      setArmorRarity,
      equipTrinket,
      unequipTrinket,
      clearEquipment,
      assignWeaponRune,
      removeWeaponRune,
      assignArmorRune,
      removeArmorRune,
      assignTrinketRune,
      removeTrinketRune,
      totalAC,
      combat,
      resetBuild,
      spellSelections,
      addSpell,
      removeSpell,
      clearSpells,
      applyIdentityGrants,
      allSkillGrants,
      allExpertiseGrants,
      allSkillAdvantages,
      saveProficiencyAbilities,
      classSkillChoices,
      backgroundSkillChoices,
      speciesSkillChoices,
      featSkillChoices,
      expertiseChoices,
      setClassSkillChoicesAtIndex,
      setBackgroundSkillChoices,
      setSpeciesSkillChoices,
      setFeatSkillChoices,
      setOriginFeatSkillChoices,
      setExpertiseChoices,
      skillSources: proficiencyResult.skillSources,
      expertiseSources: proficiencyResult.expertiseSources,
      allToolGrants,
      allLanguageGrants,
      allDefenseGrants,
      classToolChoices,
      backgroundToolChoices,
      speciesToolChoices,
      classLanguageChoices,
      backgroundLanguageChoices,
      speciesLanguageChoices,
      speciesDefenseChoices,
      setClassToolChoicesAtIndex,
      setBackgroundToolChoices,
      setSpeciesToolChoices,
      setClassLanguageChoicesAtIndex,
      setBackgroundLanguageChoices,
      setSpeciesLanguageChoices,
      setSpeciesDefenseChoicesAtIndex,
      toolSources: identityGrantsResult.toolSources,
      languageSources: identityGrantsResult.languageSources,
      defenseSources: identityGrantsResult.defenseSources,
      resolvedToolItems: identityGrantsResult.tools,
      resolvedArmorItems: identityGrantsResult.armor,
      resolvedWeaponItems: identityGrantsResult.weapons,
      armorSources: identityGrantsResult.armorSources,
      weaponSources: identityGrantsResult.weaponSources,
      resolvedLanguageItems: identityGrantsResult.languages,
      resolvedResistances: identityGrantsResult.resistances,
      resolvedImmunities: identityGrantsResult.immunities,
    }),
    [
      character, setName, setCreatureSize, setLawChaosAlignment, setGoodEvilAlignment,
      setLevel, setAbilityScore, setAbilityScores,
      attacksPerTurnOverride, effectiveAttacksPerTurn, useUnarmedStrike,
      mainHand, offHand, equippedShield, armor, trinket1, trinket2,
      species, backgroundRef, classRef, subclass, featSelections,
      speciesOriginFeatGrant, speciesOriginFeat, backgroundOriginFeatGrant,
      backgroundOriginFeat, originFeatSkillChoices,
      backstoryNotes, setBackstoryNotes, setClass, setSubclass, setFeatAtIndex,
      setSpeciesOriginFeat,
      useTashaOrigin, tashaPlus2, tashaPlus1, speciesAbilityChoices, setSpeciesAbilityChoice,
      backgroundAsiMode, backgroundAsiPlus2, backgroundAsiPlus1,
      isTwoHanded, isOffHandBlocked, offHandBlockReason, hasIntegratedShield,
      integratedShieldAcBonus, standaloneShieldAcBonus, shieldAcBonus,
      equipWeapon, unequipWeapon, setWeaponRarity, setVersatileMode,
      equipArmor, unequipArmor, equipShield, unequipShield, setArmorRarity,
      equipTrinket, unequipTrinket, clearEquipment,
      assignWeaponRune, removeWeaponRune, assignArmorRune, removeArmorRune,
      assignTrinketRune, removeTrinketRune,
      totalAC, combat, resetBuild,
      spellSelections, addSpell, removeSpell, clearSpells,
      applyIdentityGrants,
      allSkillGrants, allExpertiseGrants, allSkillAdvantages, saveProficiencyAbilities,
      classSkillChoices, backgroundSkillChoices, speciesSkillChoices,
      featSkillChoices, originFeatSkillChoices, expertiseChoices,
      setClassSkillChoicesAtIndex, setBackgroundSkillChoices, setSpeciesSkillChoices,
      setFeatSkillChoices, setOriginFeatSkillChoices, setExpertiseChoices,
      proficiencyResult,
      allToolGrants, allLanguageGrants, allDefenseGrants,
      classToolChoices, backgroundToolChoices, speciesToolChoices,
      classLanguageChoices, backgroundLanguageChoices, speciesLanguageChoices,
      speciesDefenseChoices,
      setClassToolChoicesAtIndex, setBackgroundToolChoices, setSpeciesToolChoices,
      setClassLanguageChoicesAtIndex, setBackgroundLanguageChoices,
      setSpeciesLanguageChoices, setSpeciesDefenseChoicesAtIndex,
      identityGrantsResult,
    ],
  );

  return (
    <CharacterBuilderContext.Provider value={contextValue}>
      {children}
    </CharacterBuilderContext.Provider>
  );
}

export function useCharacterBuilder(): CharacterBuilderContextValue {
  const ctx = useContext(CharacterBuilderContext);
  if (!ctx)
    throw new Error("useCharacterBuilder must be used inside CharacterBuilderProvider");
  return ctx;
}
