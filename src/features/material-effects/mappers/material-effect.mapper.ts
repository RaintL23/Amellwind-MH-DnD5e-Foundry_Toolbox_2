import type { MaterialEffect, MaterialEffectSlot } from "@/shared/types";
import type { ResourceRarity } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>;

const MATERIAL_LIST_SECTION = "Monster Hunter Monster Loot Table Material List";
const CHAPTER_4_PREFIX = "Chapter 4:";

const RARITIES: ResourceRarity[] = [
  "Common",
  "Uncommon",
  "Rare",
  "Very Rare",
  "Legendary",
];

function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function normalizeName(name: string): string {
  return name.replace(/\.$/, "").trim();
}

function parseRarity(sectionName: string): ResourceRarity | null {
  for (const rarity of RARITIES) {
    if (sectionName.startsWith(rarity)) return rarity;
  }
  return null;
}

function findEntryByName(entries: unknown[], target: string): Raw | null {
  for (const entry of entries) {
    if (typeof entry !== "object" || entry === null) continue;
    const raw = entry as Raw;
    if (raw.name === target) return raw;
    const nested = findEntryByName(
      Array.isArray(raw.entries) ? raw.entries : [],
      target,
    );
    if (nested) return nested;
  }
  return null;
}

function mapSectionEffects(
  section: Raw,
  slot: MaterialEffectSlot,
): MaterialEffect[] {
  const effects: MaterialEffect[] = [];

  for (const child of section.entries ?? []) {
    if (typeof child !== "object" || child === null) continue;
    const group = child as Raw;
    const rarity = parseRarity(String(group.name ?? ""));
    if (!rarity) continue;

    const table = (group.entries ?? []).find(
      (entry: Raw) => entry?.type === "table",
    ) as Raw | undefined;
    if (!Array.isArray(table?.rows)) continue;

    for (const row of table.rows as unknown[][]) {
      const rawName = String(row[0] ?? "").trim();
      const rawEffect = String(row[1] ?? "").trim();
      if (!rawName || !rawEffect) continue;

      const name = normalizeName(rawName);
      const effect = parseFiveToolsMarkup(rawEffect);

      effects.push({
        id: `${slot}-${rarity}-${slugify(name)}`,
        name,
        effect,
        summary: effect.length > 140 ? `${effect.slice(0, 137)}…` : effect,
        slot,
        rarity,
        isReference: /see the|loot table/i.test(rawEffect),
      });
    }
  }

  return effects;
}

export function mapMaterialEffectsFromBookData(
  bookData: Record<string, unknown>,
): MaterialEffect[] {
  const root = (bookData["0"] ?? bookData[0]) as Raw | undefined;
  const sections = root?.data;
  if (!Array.isArray(sections)) return [];

  const chapter4 = sections.find(
    (section: Raw) =>
      typeof section?.name === "string" &&
      section.name.startsWith(CHAPTER_4_PREFIX),
  ) as Raw | undefined;
  if (!chapter4?.entries) return [];

  const materialList = findEntryByName(
    chapter4.entries as unknown[],
    MATERIAL_LIST_SECTION,
  );
  if (!materialList?.entries) return [];

  const weaponSection = findEntryByName(
    materialList.entries as unknown[],
    "Weapon Materials",
  );
  const armorSection = findEntryByName(
    materialList.entries as unknown[],
    "Armor Materials",
  );

  const effects: MaterialEffect[] = [];
  if (weaponSection) effects.push(...mapSectionEffects(weaponSection, "weapon"));
  if (armorSection) effects.push(...mapSectionEffects(armorSection, "armor"));

  return effects.sort((a, b) => {
    const slotOrder = a.slot === b.slot ? 0 : a.slot === "armor" ? -1 : 1;
    if (slotOrder !== 0) return slotOrder;
    const rarityOrder = RARITIES.indexOf(a.rarity) - RARITIES.indexOf(b.rarity);
    if (rarityOrder !== 0) return rarityOrder;
    return a.name.localeCompare(b.name);
  });
}
