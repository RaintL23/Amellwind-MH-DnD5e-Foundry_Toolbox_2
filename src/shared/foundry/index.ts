export type {
  FoundryStats,
  FoundryEffectChange,
  FoundryActiveEffect,
  FoundryItem,
  FoundryActor,
} from "./types";

export { FOUNDRY_EXPORT_TARGET } from "./target";

export {
  foundryId,
  foundryIdFromSeed,
  buildStats,
  DEFAULT_OWNERSHIP,
  buildPrototypeToken,
  CORE_VERSION,
  SYSTEM_VERSION,
} from "./id";

export { downloadFoundryJson, downloadFoundryActor } from "./download";

export { wrapItem, nextFoundryItemSort, resetFoundryItemSort } from "./wrap-item";

export {
  defaultMidiProperties,
  ensureActivityMidiProperties,
  linkNonTransferEffectsToActivities,
} from "./midi";

export {
  escapeHtml,
  buildFiveToolsItemUrl,
  buildFiveToolsFilterUrl,
  convertFiveToolsTagsToFoundry,
  wrapBareDiceFormulas,
  toFoundryDescriptionHtml,
  toFoundryDescription,
  foundryDividerHtml,
  FOUNDRY_RARITY_COLORS,
  foundryRarityColor,
  foundryRarityTitleHtml,
} from "./description";
export type { FoundryDescriptionOptions } from "./description";

export { buildEffect, EFFECT_MODE, acCalcEffect } from "./effects";

export {
  slugify,
  kebab,
  mapDamageType,
  mapWeaponProperty,
  parseWeaponRange,
  mapAmmunitionType,
  mapWeaponTypeValue,
  mapArmorTypeValue,
  mapSize,
  mapLanguage,
  mapTool,
  toolAbility,
  mapWeaponProficiency,
  mapArmorProficiency,
  mapCasterProgression,
  mapAbilityLabel,
  mapRarity,
  FULL_CASTER_SLOTS,
  PACT_MAGIC_TABLE,
  effectiveCasterLevel,
} from "./mappings";

export {
  FOUNDRY_ITEM_ICONS,
  resolveFeatureIcon,
  resolveSpellIcon,
  resolveItemIcon,
  resolveWeaponItemIcon,
  resolveInventoryItemIcon,
} from "./icons";

export {
  getFoundryModuleRequirements,
  formatModuleRequirementsSummary,
} from "./module-requirements";
export type {
  FoundryModuleTier,
  FoundryModuleRequirement,
  FoundryExportKind,
} from "./module-requirements";

export { FoundryModuleRequirementsNotice } from "./FoundryModuleRequirementsNotice";
