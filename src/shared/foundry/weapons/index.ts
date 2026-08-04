export type {
  WeaponActivityTemplateKind,
  WeaponActivityActivation,
  WeaponActivityEmitType,
  WeaponUsesRecoveryPeriod,
  WeaponActivityParams,
  WeaponFeatureFoundryOverrides,
  WeaponFeatureAutomationSpec,
  WeaponFeatureAutomationStatus,
} from "./activity.types";
export {
  WEAPON_ACTIVITY_TEMPLATE_KINDS,
  TEMPLATE_LABELS,
} from "./activity.types";

export type {
  WeaponFeatureDef,
  WeaponActivityCompileSource,
} from "./weapon-source.types";

export { isPrimaryFeaturesColumn } from "./feature-columns";

export {
  buildColumnChains,
  getBaseFeatureName,
  resolveFeatureChainKey,
  normalizeFeatureMatchKey,
  getUnlockColumnLabels,
  getAccumulatedUnlocks,
} from "./feature-chains";
export type {
  FeatureAtRarity,
  FeatureChain,
  ColumnChains,
  FeatureUpgradeLink,
  BuildColumnChainsOptions,
} from "./feature-chains";

export {
  mergeAutomationSpecs,
  stripFeatureAutomationUpgradeSuffix,
  normalizeFeatureAutomationName,
  deepMergeRecords,
} from "./activity-merge";

export {
  buildCombatFeatureChains,
  resolveChainAtRarity,
  resolveCombatChainsAtRarity,
  ensureAutomationChainKeys,
  catalogWeaponToFeatureDefs,
} from "./activity-chains";
export type {
  CombatFeatureChainLink,
  CombatFeatureChain,
  ResolvedCombatChain,
} from "./activity-chains";

export {
  compileWeaponFeatureActivities,
} from "./activity.compiler";
export type { CompileWeaponFeatureActivitiesOptions } from "./activity.compiler";

export {
  lookupWeaponFeatureAutomation,
  parseWeaponMasteryAutomation,
} from "./feature-automation.data";

export {
  buildWeaponActiveEffect,
  hasWeaponActiveEffectPayload,
  resolveWeaponActiveEffectConfig,
  previewWeaponActiveEffectJson,
} from "./effect.utils";

export {
  EFFECT_MODE_OPTIONS,
  DAE_SPECIAL_DURATION_OPTIONS,
  DAE_STACKABLE_OPTIONS,
  ACTIVE_AURA_TARGET_OPTIONS,
  toFoundryChanges,
  effectModeLabel,
  emptyEffectChange,
} from "./effect.types";
export type {
  WeaponActiveEffectConfig,
  WeaponEffectChangeDraft,
  ActiveAuraTarget,
  DaeStackable,
  DaeMacroRepeat,
} from "./effect.types";

export { applyItemAutomation } from "./automation.builders";
export {
  lookupAutomation,
} from "./automation.data";
export type {
  AutomationChange,
  AutomationEffect,
  AutomationOverlay,
} from "./automation.data";
