export { buildFoundryActor } from "./actor.builder";
export type { FoundryExportInput, FeatureInput } from "./actor.builder";
export type { FoundryActor } from "@/shared/foundry";
export {
  TOOLBOX_FLAG_NAMESPACE,
  BUILDER_SNAPSHOT_VERSION,
  readBuilderSnapshot,
  toBuilderSnapshotFlags,
} from "./builder-snapshot";
export type {
  BuilderChoiceSnapshot,
  BuilderSnapshotEquipment,
} from "./builder-snapshot";
export {
  FOUNDRY_EXPORT_TARGET,
  getFoundryModuleRequirements,
  formatModuleRequirementsSummary,
  FoundryModuleRequirementsNotice,
  toFoundryDescriptionHtml,
  toFoundryDescription,
  convertFiveToolsTagsToFoundry,
  foundryDividerHtml,
  foundryRarityColor,
  foundryRarityTitleHtml,
  FOUNDRY_RARITY_COLORS,
  defaultMidiProperties,
  ensureActivityMidiProperties,
  linkNonTransferEffectsToActivities,
  foundryId,
  foundryIdFromSeed,
  downloadFoundryJson,
  downloadFoundryActor,
} from "@/shared/foundry";
export type {
  FoundryExportKind,
  FoundryModuleRequirement,
} from "@/shared/foundry";
export {
  compileWeaponFeatureActivities,
} from "@/shared/foundry/weapons";
export {
  buildCombatFeatureChains,
  resolveChainAtRarity,
  resolveCombatChainsAtRarity,
  catalogWeaponToFeatureDefs,
} from "@/shared/foundry/weapons";
export {
  lookupWeaponFeatureAutomation,
  parseWeaponMasteryAutomation,
} from "@/shared/foundry/weapons";
export {
  mergeAutomationSpecs,
  stripFeatureAutomationUpgradeSuffix,
} from "@/shared/foundry/weapons";
export {
  buildWeaponActiveEffect,
  hasWeaponActiveEffectPayload,
  resolveWeaponActiveEffectConfig,
  previewWeaponActiveEffectJson,
} from "@/shared/foundry/weapons";
export type { WeaponActiveEffectConfig } from "@/shared/foundry/weapons";
export type {
  WeaponActivityTemplateKind,
  WeaponFeatureAutomationSpec,
  WeaponActivityParams,
  WeaponFeatureAutomationStatus,
} from "@/shared/foundry/weapons";
export {
  WEAPON_ACTIVITY_TEMPLATE_KINDS,
  TEMPLATE_LABELS,
} from "@/shared/foundry/weapons";
