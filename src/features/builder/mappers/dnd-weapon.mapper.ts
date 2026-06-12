import type { Weapon } from "@/shared/types";
import type { RawItemEntity } from "@/features/dnd-items/utils/item-raw.types";

function normalizeProperty(prop: unknown): string {
  const raw = String(prop);
  const pipe = raw.indexOf("|");
  return pipe >= 0 ? raw.slice(0, pipe) : raw;
}

function parseWeaponCategory(
  raw: RawItemEntity,
): "simple" | "martial" | undefined {
  const category = raw.weaponCategory;
  if (category === "simple" || category === "martial") return category;
  return undefined;
}

export function mapDndBaseItemToWeapon(raw: RawItemEntity): Weapon {
  const properties = Array.isArray(raw.property)
    ? raw.property.map(normalizeProperty)
    : [];

  return {
    name: String(raw.name ?? "Unknown"),
    source: String(raw.source ?? "PHB"),
    contentSource: "dnd",
    weaponCategory: parseWeaponCategory(raw),
    page: typeof raw.page === "number" ? raw.page : undefined,
    dmg1: String(raw.dmg1 ?? ""),
    dmg2: raw.dmg2 ? String(raw.dmg2) : undefined,
    dmgType: String(raw.dmgType ?? ""),
    properties,
    weight: typeof raw.weight === "number" ? raw.weight : 0,
    valueCp: typeof raw.value === "number" ? raw.value : 0,
    range: typeof raw.range === "string" ? raw.range : undefined,
    description: "",
    supplementaryNotes: [],
    rarityRows: [],
    baseFeatureNames: [],
  };
}

const SOURCE_PRIORITY_2024 = ["XPHB", "PHB"];
const SOURCE_PRIORITY_2014 = ["PHB", "XPHB"];

export function dedupeDndWeaponsByName(
  weapons: Weapon[],
  prefer2024: boolean,
): Weapon[] {
  const priority = prefer2024 ? SOURCE_PRIORITY_2024 : SOURCE_PRIORITY_2014;
  const byName = new Map<string, Weapon>();

  for (const weapon of weapons) {
    const existing = byName.get(weapon.name);
    if (!existing) {
      byName.set(weapon.name, weapon);
      continue;
    }

    const existingRank = priority.indexOf(existing.source);
    const nextRank = priority.indexOf(weapon.source);
    const existingScore = existingRank >= 0 ? existingRank : priority.length;
    const nextScore = nextRank >= 0 ? nextRank : priority.length;

    if (nextScore < existingScore) {
      byName.set(weapon.name, weapon);
    }
  }

  return Array.from(byName.values()).sort((a, b) =>
    a.name.localeCompare(b.name),
  );
}
