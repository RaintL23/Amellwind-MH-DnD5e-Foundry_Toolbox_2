export {
  sanitizeTextForPdf,
  estimatePdfFontSize,
} from "./pdf-text.utils";

export {
  PDF_ALIGNMENT_CHECKBOX,
  PDF_ARMOR_TRAINING_CHECKBOXES,
  type ArmorTrainingCategory,
  getArmorTrainingProficiencies,
  resolveAlignmentCode,
  getAlignmentCheckboxField,
} from "./pdf-field-mappings";

export {
  isGoldInventoryEntry,
  getGoldFromInventoryEntry,
  sumInventoryGoldGp,
  formatGoldPiecesForPdf,
  buildEquipmentExport,
  hasShieldEquipped,
} from "./pdf-inventory.utils";

export { buildWeaponsAndCantripsExport } from "./pdf-weapons-export.utils";

export { getSpellSlotTotals } from "./pdf-spell-slots.utils";

export {
  getClassFeaturesExport,
  getSpeciesTraitsExport,
  type OptionalFeatureDescMap,
} from "./pdf-class-features-export.utils";

export {
  collectFeatExportLines,
  formatFeatExportBody,
  buildFeatExportDescLookup,
  formatFeatExportLine,
  loadFeatExportLookups,
  type FeatExportDescLookup,
  type FeatExportLookups,
} from "./pdf-feat-export.utils";

export { getXpForLevel } from "./pdf-xp.utils";

export type {
  CharacterSheetWeaponExport,
  CharacterSheetSpellExport,
  CharacterSheetExportData,
} from "./character-sheet-export.types";
