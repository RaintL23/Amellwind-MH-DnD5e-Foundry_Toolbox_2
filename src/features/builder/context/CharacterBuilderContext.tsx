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
  EquippedWeapon,
  EquippedArmor,
  EquippedTrinket,
  Rune,
  Weapon,
  ArmorItem,
  CombatCalculation,
  CharacterSelectionRef,
  BuilderFeatSelection,
} from "@/shared/types";
import { getClassById } from "@/features/classes/services/class.service";
import { getSpeciesById } from "@/features/species/services/species.service";
import { getDndRaceById } from "@/features/dnd-races/services/dnd-race.service";
import { resolveDndFeatForRef } from "@/features/dnd-feats/services/dnd-feat.service";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import { getFeatSlotLevels } from "../utils/builder-class.utils";
import { ORIGIN_FEAT_SOURCE_NAME } from "../utils/origin-feat.constants";
import { Character } from "../models/Character";
import { calculateCombat } from "../utils/combat.calculator";
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
  getOffHandBlockReason,
  isDualBladesWeapon,
  isWeaponTwoHanded,
  OffHandBlockReason,
} from "@/features/weapons/utils/weapon-hands.utils";
import type {
  SkillProficiencyGrant,
  ExpertiseGrant,
  SkillAdvantageGrant,
  ProficiencySource,
} from "@/shared/types/proficiency.types";
import {
  resolveFixedGrants,
  resolveFixedExpertiseGrants,
  computeCharacterProficiencies,
} from "../utils/compute-character-proficiencies";
import { getCharacterAcBreakdown } from "../utils/character-armor-class";
import {
  pruneChoicesByHierarchy,
  skillsFromHigherPriority,
} from "../utils/skill-choice-hierarchy.utils";

// ─── Context Value ───────────────────────────────────────────────────────────

interface CharacterBuilderContextValue {
  // Character
  character: Character;
  setName: (name: string) => void;
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
  originFeatSkillChoices: SkillKey[];
  backstoryNotes: string;
  setSpecies: (selection: CharacterSelectionRef | null) => void;
  setBackground: (selection: CharacterSelectionRef | null) => void;
  setClass: (selection: CharacterSelectionRef | null) => void;
  setSubclass: (selection: CharacterSelectionRef | null) => void;
  setFeatAtIndex: (index: number, selection: BuilderFeatSelection | null) => void;
  setSpeciesOriginFeat: (selection: BuilderFeatSelection | null) => void;

  // Ability score origin bonuses (species / Tasha's Cauldron)
  useTashaOrigin: boolean;
  setUseTashaOrigin: (value: boolean) => void;
  tashaPlus2: AbilityKey | null;
  tashaPlus1: AbilityKey | null;
  setTashaPlus2: (ability: AbilityKey | null) => void;
  setTashaPlus1: (ability: AbilityKey | null) => void;
  speciesAbilityChoices: (AbilityKey | null)[];
  setSpeciesAbilityChoice: (index: number, ability: AbilityKey | null) => void;
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

  equipWeapon: (slot: "mainHand" | "offHand", weapon: Weapon, rarity: string) => void;
  unequipWeapon: (slot: "mainHand" | "offHand") => void;
  setWeaponRarity: (slot: "mainHand" | "offHand", rarity: string) => void;
  setVersatileMode: (slot: "mainHand" | "offHand", twoHanded: boolean) => void;
  equipArmor: (armor: ArmorItem) => void;
  unequipArmor: () => void;
  setArmorRarity: (rarity: string) => void;
  equipTrinket: (slot: "trinket1" | "trinket2", name: string) => void;
  unequipTrinket: (slot: "trinket1" | "trinket2") => void;

  // Rune management
  assignWeaponRune: (slot: "mainHand" | "offHand", index: number, rune: Rune) => RuleViolation | null;
  removeWeaponRune: (slot: "mainHand" | "offHand", index: number) => void;
  assignArmorRune: (index: number, rune: Rune) => RuleViolation | null;
  removeArmorRune: (index: number) => void;
  assignTrinketRune: (slot: "trinket1" | "trinket2", rune: Rune) => void;
  removeTrinketRune: (slot: "trinket1" | "trinket2") => void;

  // Computed
  totalAC: number;
  combat: CombatCalculation;

  // Reset
  resetBuild: () => void;

  // ─── Proficiency setters (called by BuilderItemLibraryPanel when identity loads) ──
  applyIdentityGrants: (payload: {
    skillGrants?: SkillProficiencyGrant[];
    expertiseGrants?: ExpertiseGrant[];
    skillAdvantages?: SkillAdvantageGrant[];
    saveProficiencies?: AbilityKey[];
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
}

const CharacterBuilderContext = createContext<CharacterBuilderContextValue | null>(null);

// ─── Provider ────────────────────────────────────────────────────────────────

export function CharacterBuilderProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [character, setCharacter] = useState<Character>(() => new Character());
  const [attacksPerTurnOverride, setAttacksPerTurnOverride] = useState<number | null>(null);
  const [useUnarmedStrike, setUseUnarmedStrike] = useState(false);
  const [mainHand, setMainHand] = useState<EquippedWeapon | null>(null);
  const [offHand, setOffHand] = useState<EquippedWeapon | null>(null);
  const [armor, setArmor] = useState<EquippedArmor | null>(null);
  const [trinket1, setTrinket1] = useState<EquippedTrinket | null>(null);
  const [trinket2, setTrinket2] = useState<EquippedTrinket | null>(null);
  const [species, setSpeciesState] = useState<CharacterSelectionRef | null>(null);
  const [selectedSpeciesData, setSelectedSpeciesData] = useState<Species | null>(null);
  const [backgroundRef, setBackgroundRef] = useState<CharacterSelectionRef | null>(null);
  const setBackground = useCallback((selection: CharacterSelectionRef | null) => {
    setBackgroundRef(selection);
    setBackgroundSkillChoices([]);
    // Clear background grants immediately when background changes/removed
    setBgSkillGrants([]);
  }, []);
  const [classRef, setClassState] = useState<CharacterSelectionRef | null>(null);
  const [selectedClassData, setSelectedClassData] = useState<Class | null>(null);
  const [subclass, setSubclassState] = useState<CharacterSelectionRef | null>(null);
  const [featSelections, setFeatSelections] = useState<
    (BuilderFeatSelection | null)[]
  >([]);
  const [useTashaOrigin, setUseTashaOrigin] = useState(false);
  const [tashaPlus2, setTashaPlus2] = useState<AbilityKey | null>(null);
  const [tashaPlus1, setTashaPlus1] = useState<AbilityKey | null>(null);
  const [speciesAbilityChoices, setSpeciesAbilityChoices] = useState<
    (AbilityKey | null)[]
  >([]);
  const [backstoryNotes, setBackstoryNotesState] = useState(
    () => loadBuilderBackstoryNotes(),
  );

  // ─── Proficiency state (per-source buckets) ──────────────────────────────
  const [classSkillGrants, setClassSkillGrants] = useState<SkillProficiencyGrant[]>([]);
  const [bgSkillGrants, setBgSkillGrants] = useState<SkillProficiencyGrant[]>([]);
  const [speciesSkillGrants, setSpeciesSkillGrants] = useState<SkillProficiencyGrant[]>([]);
  const [featGrantsList, setFeatGrantsList] = useState<SkillProficiencyGrant[]>([]);

  const [classExpertiseGrants, setClassExpertiseGrants] = useState<ExpertiseGrant[]>([]);
  const [featExpertiseGrants, setFeatExpertiseGrants] = useState<ExpertiseGrant[]>([]);

  const [allSkillAdvantages, setAllSkillAdvantages] = useState<SkillAdvantageGrant[]>([]);
  const [saveProficiencyAbilities, setSaveProficiencyAbilities] = useState<AbilityKey[]>([]);

  const allSkillGrants = useMemo(
    () => [...classSkillGrants, ...bgSkillGrants, ...speciesSkillGrants, ...featGrantsList],
    [classSkillGrants, bgSkillGrants, speciesSkillGrants, featGrantsList],
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
  const [expertiseChoices, setExpertiseChoicesState] = useState<Record<string, SkillKey[]>>({});

  const applyIdentityGrants = useCallback((payload: {
    skillGrants?: SkillProficiencyGrant[];
    expertiseGrants?: ExpertiseGrant[];
    skillAdvantages?: SkillAdvantageGrant[];
    saveProficiencies?: AbilityKey[];
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
    setSpeciesOriginFeatGrant(null);
    setSpeciesOriginFeatState(null);
    setOriginFeatSkillChoicesState([]);
    // Clear species grants immediately when species changes/removed
    setSpeciesSkillGrants([]);
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
    // Clear class grants immediately
    setClassSkillGrants([]);
    setClassExpertiseGrants([]);
    setSaveProficiencyAbilities([]);
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
        setSpeciesOriginFeatState({
          id: feat.id,
          name: feat.name,
          source:
            feat.source === "XPHB" || feat.basicRules2024 || feat.srd52
              ? "dnd2024"
              : "dnd2014",
        });
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
          isDualBladesWeapon(weapon)
        ) {
          setOffHand(null);
        }
      } else if (!hasActiveIntegratedShield(mainHand) && !blocksOffHand(mainHand)) {
        setOffHand(equipped);
      }
    },
    [mainHand],
  );

  const unequipWeapon = useCallback((slot: "mainHand" | "offHand") => {
    if (slot === "mainHand") setMainHand(null);
    else setOffHand(null);
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
    if (slot === "mainHand" && twoHanded) setOffHand(null);
  }, []);

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

  const assignTrinketRune = useCallback((slot: "trinket1" | "trinket2", rune: Rune) => {
    const setter = slot === "trinket1" ? setTrinket1 : setTrinket2;
    setter((prev) => (prev ? { ...prev, rune } : prev));
  }, []);

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
      classData: null,
      className: classRef?.name,
      subclass: null,
      speciesName: species?.name,
    }).total;
  }, [
    armor,
    character,
    integratedShieldAcBonus,
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
  }, []);

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
      return next;
    });
  }, [proficiencyResult]);

  const contextValue = useMemo(
    () => ({
      character,
      setName,
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
      isTwoHanded,
      isOffHandBlocked,
      offHandBlockReason,
      hasIntegratedShield,
      integratedShieldAcBonus,
      equipWeapon,
      unequipWeapon,
      setWeaponRarity,
      setVersatileMode,
      equipArmor,
      unequipArmor,
      setArmorRarity,
      equipTrinket,
      unequipTrinket,
      assignWeaponRune,
      removeWeaponRune,
      assignArmorRune,
      removeArmorRune,
      assignTrinketRune,
      removeTrinketRune,
      totalAC,
      combat,
      resetBuild,
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
    }),
    [
      character, setName, setLevel, setAbilityScore, setAbilityScores,
      attacksPerTurnOverride, effectiveAttacksPerTurn, useUnarmedStrike,
      mainHand, offHand, armor, trinket1, trinket2,
      species, backgroundRef, classRef, subclass, featSelections,
      speciesOriginFeatGrant, speciesOriginFeat, originFeatSkillChoices,
      backstoryNotes, setBackstoryNotes, setClass, setSubclass, setFeatAtIndex,
      setSpeciesOriginFeat,
      useTashaOrigin, tashaPlus2, tashaPlus1, speciesAbilityChoices, setSpeciesAbilityChoice,
      isTwoHanded, isOffHandBlocked, offHandBlockReason, hasIntegratedShield, integratedShieldAcBonus,
      equipWeapon, unequipWeapon, setWeaponRarity, setVersatileMode,
      equipArmor, unequipArmor, setArmorRarity, equipTrinket, unequipTrinket,
      assignWeaponRune, removeWeaponRune, assignArmorRune, removeArmorRune,
      assignTrinketRune, removeTrinketRune,
      totalAC, combat, resetBuild,
      applyIdentityGrants,
      allSkillGrants, allExpertiseGrants, allSkillAdvantages, saveProficiencyAbilities,
      classSkillChoices, backgroundSkillChoices, speciesSkillChoices,
      featSkillChoices, originFeatSkillChoices, expertiseChoices,
      setClassSkillChoicesAtIndex, setBackgroundSkillChoices, setSpeciesSkillChoices,
      setFeatSkillChoices, setOriginFeatSkillChoices, setExpertiseChoices,
      proficiencyResult,
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
