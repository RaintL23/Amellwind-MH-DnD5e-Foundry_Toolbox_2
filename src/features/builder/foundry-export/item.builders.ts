/** Domain Foundry item builders for the character actor export. */
export { parseMagicBonus, sourceBlock, htmlDesc, parseDice } from "./items/item-shared";
export type { FeatSubtype, FeatItemInput } from "./items/feat.item.builder";
export { buildFeatItem } from "./items/feat.item.builder";
export type { WeaponItemOptions } from "./items/weapon.item.builder";
export { buildWeaponItem } from "./items/weapon.item.builder";
export { buildArmorItem, buildTrinketItem } from "./items/equipment.item.builder";
export type { InventoryCatalogMeta } from "./items/inventory.item.builder";
export {
  parseWeightLb,
  buildInventoryItem,
  buildLootItem,
} from "./items/inventory.item.builder";
export type { SpellPreparationMode, SpellItemInput } from "./items/spell.item.builder";
export { buildSpellItem } from "./items/spell.item.builder";
export type {
  ClassItemInput,
  SubclassItemInput,
  RaceItemInput,
  BackgroundItemInput,
} from "./items/identity.item.builder";
export {
  buildClassItem,
  buildSubclassItem,
  buildRaceItem,
  buildBackgroundItem,
} from "./items/identity.item.builder";
