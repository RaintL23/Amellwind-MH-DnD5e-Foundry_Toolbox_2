import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import type { Weapon } from "@/shared/types";
import type { RawItemEntity } from "../utils/item-raw.types";
import {
  buildEquipmentSourcePriority,
  pickPreferredBySource,
} from "../utils/item-dedupe.utils";
import { mapDndRarityLabel } from "../utils/dnd-equipment-rarity.utils";
import { parseWeaponCategory } from "./item.mapper";

function normalizeProperty(prop: unknown): string {
  const raw = String(prop);
  const pipe = raw.indexOf("|");
  return pipe >= 0 ? raw.slice(0, pipe) : raw;
}

/**
 * Extracts the Foundry weapon-mastery key from 5etools `mastery` data.
 * 5etools stores it as `["Vex|XPHB"]`; Foundry expects the lowercase name
 * (e.g. "vex"). Returns undefined when the weapon has no mastery.
 */
function parseMastery(raw: unknown): string | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;
  const first = raw[0];
  if (typeof first !== "string") return undefined;
  const key = first.split("|")[0].trim().toLowerCase();
  return key || undefined;
}

export function buildDndWeaponId(name: string, source: string): string {
  return `${name}|${source}`;
}

function renderWeaponDescription(raw: RawItemEntity): string {
  const entries = [
    ...(Array.isArray(raw.entries) ? raw.entries : []),
    ...(Array.isArray(raw.additionalEntries) ? raw.additionalEntries : []),
  ];

  return entries
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => parseFiveToolsMarkup(entry).trim())
    .filter(Boolean)
    .join("\n\n");
}

export function isBuilderDndWeapon(raw: RawItemEntity): boolean {
  if (raw.weapon !== true) return false;
  if (raw.age === "futuristic") return false;
  if (raw.firearm === true) return false;
  if (!raw._isBaseItem && !raw._variantName) return false;
  return true;
}

export function mapDndBaseItemToWeapon(raw: RawItemEntity): Weapon {
  const properties = Array.isArray(raw.property)
    ? raw.property.map(normalizeProperty)
    : [];
  const itemRarityLabel = mapDndRarityLabel(
    typeof raw.rarity === "string" ? raw.rarity : undefined,
  );
  const name = String(raw.name ?? "Unknown");
  const source = String(raw.source ?? "PHB");
  const description = renderWeaponDescription(raw);

  return {
    id: buildDndWeaponId(name, source),
    name,
    source,
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
    ammoType: typeof raw.ammoType === "string" ? raw.ammoType : undefined,
    mastery: parseMastery(raw.mastery),
    description,
    supplementaryNotes: [],
    rarityRows: [],
    baseFeatureNames: [],
    itemRarityLabel,
    baseName:
      typeof raw._baseName === "string" ? raw._baseName : undefined,
  };
}

export function groupDndWeaponsForCatalog(
  weapons: Weapon[],
  prefer2024: boolean,
): Weapon[] {
  const priority = buildEquipmentSourcePriority(prefer2024);
  const byName = new Map<string, Weapon[]>();

  for (const weapon of weapons) {
    const group = byName.get(weapon.name) ?? [];
    group.push(weapon);
    byName.set(weapon.name, group);
  }

  return Array.from(byName.values())
    .map((group) => {
      const canonical = pickPreferredBySource(group, priority);
      const variantSources = [...new Set(group.map((w) => w.source))].sort(
        (a, b) => a.localeCompare(b),
      );

      return {
        ...canonical,
        variantSources:
          variantSources.length > 1 ? variantSources : undefined,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function weaponsToSourceVariants(weapons: Weapon[]) {
  return [...weapons]
    .sort((a, b) => a.source.localeCompare(b.source))
    .map((weapon) => ({
      id: weapon.id ?? buildDndWeaponId(weapon.name, weapon.source),
      source: weapon.source,
      page: weapon.page,
    }));
}
