// Page
export { BuilderPage } from "./components/page/BuilderPage";

// Providers & sync
export {
  CharacterBuilderProvider,
  useCharacterBuilder,
} from "./context/CharacterBuilderContext";
export type { CharacterBuilderContextValue } from "./context/character-builder.types";
export {
  BuilderInventoryProvider,
  useBuilderInventory,
} from "./context/BuilderInventoryContext";
export { StartingEquipmentInventorySync } from "./components/StartingEquipmentInventorySync";

// Shared components (re-export for external consumers)
export { SourceVariantSwitcher } from "./components/shared";

// Data catalogs
export type { StandaloneShieldItem } from "./data/shield.data";
export { STANDALONE_SHIELD, findShieldByCartName } from "./data/shield.data";

// Commonly used utilities outside the builder
export {
  STANDARD_ARRAY,
  ABILITY_KEYS,
  rollSixAbilityScores,
} from "./utils/ability-scores";
export { detectNaturalArmorFromTraits } from "./utils/species-natural-armor";

// Hooks barrel
export * from "./hooks";
