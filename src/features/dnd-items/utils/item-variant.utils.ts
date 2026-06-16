import { DndItem } from "@/shared/types";

export type DndItemVariantField =
  | "rarityLabel"
  | "typeLabel"
  | "category"
  | "valueGp"
  | "weight"
  | "attunement"
  | "damage"
  | "properties"
  | "weaponCategory"
  | "bonusWeapon"
  | "bonusAc"
  | "description";

const FIELD_LABELS: Record<DndItemVariantField, string> = {
  rarityLabel: "Rarity",
  typeLabel: "Type",
  category: "Category",
  valueGp: "Value",
  weight: "Weight",
  attunement: "Attunement",
  damage: "Damage",
  properties: "Properties",
  weaponCategory: "Proficiency",
  bonusWeapon: "Weapon bonus",
  bonusAc: "AC bonus",
  description: "Description",
};

function fieldValue(item: DndItem, field: DndItemVariantField): string {
  switch (field) {
    case "rarityLabel":
      return item.rarityLabel;
    case "typeLabel":
      return item.typeLabel;
    case "category":
      return item.category;
    case "valueGp":
      return item.valueGp ?? "";
    case "weight":
      return item.weight ?? "";
    case "attunement":
      return item.attunement ?? "";
    case "damage":
      return item.damage ?? "";
    case "properties":
      return item.properties ?? "";
    case "weaponCategory":
      return item.weaponCategory ?? "";
    case "bonusWeapon":
      return item.bonusWeapon ?? "";
    case "bonusAc":
      return item.bonusAc ?? "";
    case "description":
      return item.description.join("\n");
  }
}

export function getFieldsThatVaryAcrossVariants(
  variants: DndItem[],
): DndItemVariantField[] {
  if (variants.length < 2) return [];

  const fields = Object.keys(FIELD_LABELS) as DndItemVariantField[];
  return fields.filter((field) => {
    const values = new Set(variants.map((v) => fieldValue(v, field)));
    return values.size > 1;
  });
}

export function getFieldsDifferentFromVariant(
  active: DndItem,
  other: DndItem,
): DndItemVariantField[] {
  const fields = Object.keys(FIELD_LABELS) as DndItemVariantField[];
  return fields.filter(
    (field) => fieldValue(active, field) !== fieldValue(other, field),
  );
}

export function getVariantFieldLabel(field: DndItemVariantField): string {
  return FIELD_LABELS[field];
}

export function formatFieldValue(
  item: DndItem,
  field: DndItemVariantField,
): string {
  switch (field) {
    case "description":
      return item.description.length > 0
        ? `${item.description.length} paragraph(s)`
        : "—";
    case "attunement":
      return item.attunement ?? "—";
    case "weaponCategory":
      return item.weaponCategory === "martial"
        ? "Martial"
        : item.weaponCategory === "simple"
          ? "Simple"
          : "—";
    default:
      return fieldValue(item, field) || "—";
  }
}
