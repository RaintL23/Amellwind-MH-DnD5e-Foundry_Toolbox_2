import type { SubclassSpellBlock } from "./class.types";

/** Reference to an optional feature entry in 5etools (name|source). */
export interface DndOptionalFeatureRef {
  name: string;
  source: string;
}

export type OptionalFeatureCatalog = "optionalfeature" | "feat";

/** Progression of pickable optional features (EI, MM, MV:B, Fighting Style, etc.). */
export interface OptionalFeatureProgression {
  /** Stable key for builder state, e.g. class_Warlock_XPHB_EI */
  id: string;
  /** Display label, e.g. "Eldritch Invocations" */
  name: string;
  featureTypes: string[];
  /** When set, picks come from feats.json instead of optionalfeatures.json. */
  catalog?: OptionalFeatureCatalog;
  /** Feat categories for catalog === "feat" (FS, FS:R, FS:P, …). */
  featCategories?: string[];
  scope: "class" | "subclass";
  /** Class or subclass entity id this progression belongs to. */
  ownerId: string;
  /** Raw 5etools progression (array per level or breakpoint object). */
  progression: number[] | Record<string, number>;
}

/** Feat picks granted when this optional feature is selected (e.g. Origin Feat from Lessons of the First Ones). */
export interface OptionalFeatureFeatProgression {
  name: string;
  categories: string[];
  /** Feats granted per time this optional feature is selected (`progression["*"]` in 5etools). */
  countPerSelection: number;
}

export interface DndOptionalFeaturePrerequisite {
  kind: "level" | "feature" | "pact" | "other";
  summary: string;
  /** Minimum character level in class (when kind === "level"). */
  minClassLevel?: number;
  /** Required optional feature names (when kind === "feature"). */
  requiredFeatures?: string[];
  /** Pact boon name fragment, e.g. "Pact of the Chain" (when kind === "pact"). */
  pactName?: string;
}

export interface DndOptionalFeature {
  id: string;
  name: string;
  source: string;
  page?: number;
  featureType: string[];
  entries: string[];
  prerequisites: DndOptionalFeaturePrerequisite[];
  additionalSpells?: SubclassSpellBlock[];
  featProgression?: OptionalFeatureFeatProgression[];
  /** Can be taken more than once (e.g. Lessons of the First Ones). */
  isRepeatable?: boolean;
  /** Metamagic / maneuver cost text when present. */
  consumes?: string;
}

export interface BuilderOptionalFeatureSelection {
  id: string;
  name: string;
  source: string;
  progressionId: string;
  featureTypes: string[];
}

/** Selections keyed by progression id. Array index = slot index. */
export type BuilderOptionalFeatureSelections = Record<
  string,
  (BuilderOptionalFeatureSelection | null)[]
>;
