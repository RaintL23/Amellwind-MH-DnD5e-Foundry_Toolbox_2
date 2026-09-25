import type { ArmorItem, MHItem, Weapon } from "@/shared/types";
import type { DndItem } from "@/shared/types/dnd-item.types";
import type { StatBlockContent } from "@/shared/types/statblock-content.types";
import type {
  PlayInventoryItem,
  PlayInventoryItemKind,
  PlayInventoryItemSource,
} from "./play-character.types";

function parseWeightLb(raw: string | number | null | undefined): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return raw;
  if (typeof raw === "string") {
    const n = parseFloat(raw.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function dndTypeAbbrev(item: DndItem): string {
  return (item.typeCode ?? "").split("|")[0]?.toUpperCase() ?? "";
}

function isDndWeapon(item: DndItem): boolean {
  const t = dndTypeAbbrev(item);
  return t === "M" || t === "R" || t === "A" || Boolean(item.weaponCategory);
}

function isDndShield(item: DndItem): boolean {
  return dndTypeAbbrev(item) === "S" || /shield/i.test(item.typeLabel);
}

function isDndArmor(item: DndItem): boolean {
  const t = dndTypeAbbrev(item);
  return t === "LA" || t === "MA" || t === "HA" || Boolean(item.armorClass);
}

function maxDexFromDndType(item: DndItem): number | null {
  const t = dndTypeAbbrev(item);
  if (t === "LA") return null;
  if (t === "MA") return 2;
  if (t === "HA") return 0;
  return null;
}

function parseArmorAc(item: DndItem): number | undefined {
  if (!item.armorClass) return undefined;
  const m = item.armorClass.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : undefined;
}

function parseShieldBonus(item: DndItem): number {
  if (!item.armorClass) return 2;
  const plus = item.armorClass.match(/\+(\d+)/);
  if (plus) return parseInt(plus[1], 10);
  const n = parseArmorAc(item);
  return n ?? 2;
}

function basePlayItem(
  partial: Omit<PlayInventoryItem, "id" | "quantity" | "equipped" | "attuned"> & {
    id?: string;
  },
): PlayInventoryItem {
  return {
    id: partial.id ?? crypto.randomUUID(),
    name: partial.name,
    quantity: 1,
    weightLb: partial.weightLb,
    equipped: false,
    attuned: false,
    requiresAttunement: partial.requiresAttunement,
    notes: partial.notes,
    summary: partial.summary,
    kind: partial.kind,
    source: partial.source,
    catalogId: partial.catalogId,
    isWeapon: partial.isWeapon,
    attackBonus: partial.attackBonus,
    damageExpression: partial.damageExpression,
    properties: partial.properties,
    armorAc: partial.armorAc,
    armorMaxDex: partial.armorMaxDex,
    shieldBonus: partial.shieldBonus,
  };
}

export function playItemFromCustom(
  name: string,
  weightLb: number,
): PlayInventoryItem {
  return basePlayItem({
    name: name.trim(),
    weightLb: Number.isFinite(weightLb) ? weightLb : 0,
    requiresAttunement: false,
    kind: "custom",
    source: "custom",
  });
}

export function playItemFromDndItem(
  item: DndItem,
  opts?: { attackAbilityMod?: number; proficiencyBonus?: number },
): PlayInventoryItem {
  const requiresAttunement = Boolean(item.attunement);
  const weightLb = parseWeightLb(item.weight);
  const source: PlayInventoryItemSource = "dnd";
  const summary = [
    item.typeLabel,
    item.rarityLabel !== "None" ? item.rarityLabel : null,
    item.attunement ? `Attunement: ${item.attunement}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  if (isDndShield(item)) {
    return basePlayItem({
      name: item.name,
      weightLb: weightLb || 6,
      requiresAttunement,
      kind: "shield",
      source,
      catalogId: item.id,
      summary,
      shieldBonus: parseShieldBonus(item),
    });
  }

  if (isDndArmor(item) && !isDndWeapon(item)) {
    const armorAc = parseArmorAc(item) ?? 10;
    return basePlayItem({
      name: item.name,
      weightLb,
      requiresAttunement,
      kind: "armor",
      source,
      catalogId: item.id,
      summary,
      armorAc,
      armorMaxDex: maxDexFromDndType(item),
    });
  }

  if (isDndWeapon(item)) {
    const mod = opts?.attackAbilityMod ?? 0;
    const pb = opts?.proficiencyBonus ?? 0;
    const dmg = item.damage ?? "1d4";
    return basePlayItem({
      name: item.name,
      weightLb,
      requiresAttunement,
      kind: item.isMagic ? "magic" : "weapon",
      source,
      catalogId: item.id,
      summary,
      isWeapon: true,
      attackBonus: mod + pb,
      damageExpression: `${dmg}${mod >= 0 ? "+" : ""}${mod}`,
      properties: item.properties ? [item.properties] : undefined,
    });
  }

  const kind: PlayInventoryItemKind = item.isMagic ? "magic" : "gear";
  return basePlayItem({
    name: item.name,
    weightLb,
    requiresAttunement,
    kind,
    source,
    catalogId: item.id,
    summary,
  });
}

export function playItemFromWeapon(
  weapon: Weapon,
  opts?: {
    source?: PlayInventoryItemSource;
    attackAbilityMod?: number;
    proficiencyBonus?: number;
  },
): PlayInventoryItem {
  const mod = opts?.attackAbilityMod ?? 0;
  const pb = opts?.proficiencyBonus ?? 0;
  const source =
    opts?.source ??
    (weapon.contentSource === "dnd" ? "dnd" : "amellwind");
  return basePlayItem({
    name: weapon.name,
    weightLb: Number(weapon.weight) || 0,
    requiresAttunement: false,
    kind: "weapon",
    source,
    catalogId: weapon.id,
    summary: [weapon.weaponCategory, weapon.dmg1, weapon.dmgType]
      .filter(Boolean)
      .join(" · "),
    isWeapon: true,
    attackBonus: mod + pb,
    damageExpression: `${weapon.dmg1 || "1d4"}${mod >= 0 ? "+" : ""}${mod}`,
    properties: (weapon.properties ?? []).map(String),
  });
}

export function playItemFromArmor(
  armor: ArmorItem,
  opts?: { source?: PlayInventoryItemSource },
): PlayInventoryItem {
  const source: PlayInventoryItemSource =
    opts?.source ?? (armor.contentSource === "dnd" ? "dnd" : "amellwind");

  if (armor.category === "shield") {
    return basePlayItem({
      name: armor.name,
      weightLb: armor.weight || 6,
      requiresAttunement: false,
      kind: "shield",
      source,
      summary: `Shield +${armor.baseAC} AC`,
      shieldBonus: armor.baseAC,
    });
  }

  return basePlayItem({
    name: armor.name,
    weightLb: armor.weight || 0,
    requiresAttunement: false,
    kind: "armor",
    source,
    summary: `AC ${armor.baseAC}`,
    armorAc: armor.baseAC,
    armorMaxDex: armor.maxDexBonus,
  });
}

export function playItemFromMhItem(item: MHItem): PlayInventoryItem {
  return basePlayItem({
    name: item.name,
    weightLb: item.weight ?? 0,
    requiresAttunement: false,
    kind: "gear",
    source: "amellwind",
    summary: [item.typeLabel, item.rarity !== "none" ? item.rarity : null]
      .filter(Boolean)
      .join(" · "),
  });
}

/** Catalog row shown in the inventory add picker. */
export interface PlayInventoryCatalogEntry {
  key: string;
  name: string;
  summary?: string;
  source: PlayInventoryItemSource;
  tab: "dnd" | "amellwind";
  /** Structured 5etools-style description when available (D&D items). */
  descriptionContent?: StatBlockContent[];
  /** Plain-text fallback description (weapons, armor, MH gear). */
  descriptionText?: string;
  toItem: (opts?: {
    attackAbilityMod?: number;
    proficiencyBonus?: number;
  }) => PlayInventoryItem;
}
