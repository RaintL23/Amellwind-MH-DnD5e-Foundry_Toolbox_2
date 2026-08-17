export type {
  FoundryStats,
  FoundryEffectChange,
  FoundryActiveEffect,
  FoundryItem,
  FoundryActor,
} from "./types";

export {
  FOUNDRY_EXPORT_TARGET,
  inferFoundryRulesVersion,
  foundrySourceBlock,
} from "./target";
export type { FoundryRulesVersion } from "./target";

export {
  foundryId,
  foundryIdFromSeed,
  buildStats,
  DEFAULT_OWNERSHIP,
  buildPrototypeToken,
  CORE_VERSION,
  SYSTEM_VERSION,
} from "./id";

export { downloadFoundryJson } from "./download";

export {
  FOUNDRY_ITEM_FILE_PREFIX,
  isFoundryItemDocument,
  ensureFoundryItemFilename,
  buildFoundryItemFilename,
  stripFoundryWeaponRaritySuffix,
  formatWeaponFoundryItemName,
} from "./item-naming";

export { wrapItem, nextFoundryItemSort, resetFoundryItemSort } from "./wrap-item";

export {
  defaultMidiProperties,
  ensureActivityMidiProperties,
  ensureMidiActivityIdentifiers,
  midiOverridesForItem,
  linkNonTransferEffectsToActivities,
} from "./midi";

export {
  MIDI_ON_USE_PASSES,
  midiOnUseMacroName,
  midiOnUseMacroParts,
  parseMidiOnUseMacroName,
  buildItemMacroDocument,
  itemMacroFlagBundle,
  embedItemMacro,
  normalizeItemMacroFlags,
} from "./item-macro";
export type { MidiOnUsePass, EmbedItemMacroOptions } from "./item-macro";

export { applyFoundryModuleCompat } from "./module-compat";
export type { ApplyFoundryModuleCompatOptions } from "./module-compat";

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
  foundryActivationLeadHtml,
  foundryActivationLabelFromType,
  formatFeatureBodyHtml,
  foundryFeatureCardHtml,
  foundryChatFeatureCardHtml,
  foundryUpgradeBlockHtml,
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
  resolveNamedGearIcon,
  resolveArmorItemIcon,
  resolveInventoryItemIcon,
} from "./icons";

export {
  getFoundryModuleRequirements,
  formatModuleRequirementsSummary,
  groupFoundryModuleRequirements,
} from "./module-requirements";
export type {
  FoundryModuleTier,
  FoundryModuleGroup,
  FoundryModuleRequirement,
  FoundryExportKind,
} from "./module-requirements";

export { FoundryModuleRequirementsNotice } from "./FoundryModuleRequirementsNotice";
