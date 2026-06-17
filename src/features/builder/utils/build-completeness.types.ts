import type { BuilderSlotSelection } from "../hooks/useBuilderSlotSelection";
import type {
  AbilityKey,
  BackgroundAsiMode,
  BuilderFeatSelection,
  BuilderOptionalFeatureSelections,
  CartEntry,
  Class,
  DamageType,
  SkillKey,
  Species,
  Subclass,
} from "@/shared/types";
import type { DndBackground } from "@/shared/types/dnd-background.types";
import type {
  DefenseGrant,
  ExpertiseGrant,
  NamedProficiencyGrant,
  SkillProficiencyGrant,
} from "@/shared/types/proficiency.types";
import type { OriginFeatGrant } from "@/shared/utils/origin-feat-grant.parser";
import type { OptionalFeatureOriginFeatSlot } from "./optional-feature-feat-grants.utils";
import type { SpellcastingInfo } from "../hooks/useSpellcasting";

export type BuildCompletenessSection =
  | "identity"
  | "feats"
  | "optional-features"
  | "ability-scores"
  | "skills"
  | "tools"
  | "languages"
  | "defenses"
  | "starting-equipment"
  | "spells";

export interface BuildCompletenessIssue {
  id: string;
  section: BuildCompletenessSection;
  message: string;
  slot?: BuilderSlotSelection;
  highlightKey?: string;
}

export interface BuildCompletenessResult {
  hasStarted: boolean;
  issues: BuildCompletenessIssue[];
  shouldBlockExport: boolean;
}

export interface BuildCompletenessInput {
  species: { id: string; name: string } | null;
  background: { id: string; name: string } | null;
  classSelection: { id: string; name: string } | null;
  subclass: { id: string; name: string } | null;
  level: number;
  classData: Class | null;
  subclassData: Subclass | null;
  speciesData: Species | null;
  dndBackground: DndBackground | null;
  speciesOriginFeatGrant: OriginFeatGrant | null;
  backgroundOriginFeatGrant: OriginFeatGrant | null;
  speciesOriginFeat: BuilderFeatSelection | null;
  backgroundOriginFeat: BuilderFeatSelection | null;
  featSelections: (BuilderFeatSelection | null)[];
  optionalFeatureOriginFeatSlots: OptionalFeatureOriginFeatSlot[];
  optionalFeatureOriginFeats: (BuilderFeatSelection | null)[];
  optionalFeatureSelections: BuilderOptionalFeatureSelections;
  allSkillGrants: SkillProficiencyGrant[];
  allExpertiseGrants: ExpertiseGrant[];
  allToolGrants: NamedProficiencyGrant[];
  allLanguageGrants: NamedProficiencyGrant[];
  allDefenseGrants: DefenseGrant[];
  classSkillChoices: Record<number, SkillKey[]>;
  backgroundSkillChoices: SkillKey[];
  speciesSkillChoices: SkillKey[];
  featSkillChoices: Record<number, SkillKey[]>;
  originFeatSkillChoices: SkillKey[];
  optionalFeatureOriginFeatSkillChoices: Record<number, SkillKey[]>;
  expertiseChoices: Record<string, SkillKey[]>;
  classToolChoices: Record<number, string[]>;
  backgroundToolChoices: string[];
  speciesToolChoices: string[];
  classLanguageChoices: Record<number, string[]>;
  backgroundLanguageChoices: string[];
  speciesLanguageChoices: string[];
  speciesDefenseChoices: Record<number, DamageType[]>;
  speciesAbilityChoices: (AbilityKey | null)[];
  backgroundAsiMode: BackgroundAsiMode | null;
  backgroundAsiPlus2: AbilityKey | null;
  backgroundAsiPlus1: AbilityKey | null;
  useTashaOrigin: boolean;
  tashaPlus2: AbilityKey | null;
  tashaPlus1: AbilityKey | null;
  mainHand: unknown | null;
  offHand: unknown | null;
  armor: unknown | null;
  equippedShield: unknown | null;
  inventoryItems: CartEntry[];
  spellcasting: SpellcastingInfo | null;
}
