export { sanitizeTextForPdf } from "./pdf-text.utils";

export {
  wrapTextLines,
  fitTextToBox,
  fitSingleLine,
  formatSectionText,
  layoutSectionsIntoBoxes,
  pdfLineHeight,
  linesThatFit,
  type PdfTextMeasurer,
  type PdfTextBox,
  type ExportTextSection,
  type WrappedLine,
  type FitTextResult,
  type SectionLayoutOptions,
  type SectionLayoutResult,
} from "./pdf-text-layout.utils";

export {
  PDF_ARMOR_TRAINING_CHECKBOXES,
  PDF_SPELL_ROWS,
  type ArmorTrainingCategory,
  type PdfSpellRow,
  getArmorTrainingProficiencies,
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

export { buildSpellListExport } from "./pdf-spell-list.utils";

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
  formatFeatExportSection,
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
