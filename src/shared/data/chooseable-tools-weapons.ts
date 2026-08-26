/**
 * Tool / gaming-set / weapon name catalogs for builder "any" proficiency pickers.
 * Tools: items-base + items (AT / GS / T). Weapons: base PHB/XPHB entries only
 * (no adventure/setting variants, no magic/named weapons, no DMG futuristic arms).
 */
import {
  ITEMS_BASE_JSON_URL,
  ITEMS_JSON_URL,
} from "@/shared/constants/api.constants";
import { fetchFiveToolsJson } from "@/shared/data/fivetools-fetch";
import type {
  ItemsBaseJson,
  ItemsJson,
  RawItemEntity,
} from "@/features/dnd/items/utils/item-raw.types";
import { getChooseableMusicalInstruments } from "@/shared/data/chooseable-musical-instruments";

/** Core Player's Handbook sources for base weapon proficiency picks. */
const BASE_WEAPON_SOURCES = new Set(["PHB", "XPHB"]);

/** PHB-style artisan tools (fallback before 5etools loads). */
export const FALLBACK_ARTISAN_TOOLS: readonly string[] = [
  "Alchemist's Supplies",
  "Brewer's Supplies",
  "Calligrapher's Supplies",
  "Carpenter's Tools",
  "Cartographer's Tools",
  "Cobbler's Tools",
  "Cook's Utensils",
  "Glassblower's Tools",
  "Jeweler's Tools",
  "Leatherworker's Tools",
  "Mason's Tools",
  "Painter's Supplies",
  "Potter's Tools",
  "Smith's Tools",
  "Tinker's Tools",
  "Weaver's Tools",
  "Woodcarver's Tools",
] as const;

export const FALLBACK_GAMING_SETS: readonly string[] = [
  "Dice Set",
  "Dragonchess Set",
  "Playing Card Set",
  "Three-Dragon Ante Set",
] as const;

export const FALLBACK_OTHER_TOOLS: readonly string[] = [
  "Disguise Kit",
  "Forgery Kit",
  "Herbalism Kit",
  "Navigator's Tools",
  "Poisoner's Kit",
  "Thieves' Tools",
] as const;

export const FALLBACK_SIMPLE_WEAPONS: readonly string[] = [
  "Club",
  "Dagger",
  "Greatclub",
  "Handaxe",
  "Javelin",
  "Light Hammer",
  "Mace",
  "Quarterstaff",
  "Sickle",
  "Spear",
  "Light Crossbow",
  "Dart",
  "Shortbow",
  "Sling",
] as const;

export const FALLBACK_MARTIAL_WEAPONS: readonly string[] = [
  "Battleaxe",
  "Flail",
  "Glaive",
  "Greataxe",
  "Greatsword",
  "Halberd",
  "Lance",
  "Longsword",
  "Maul",
  "Morningstar",
  "Pike",
  "Rapier",
  "Scimitar",
  "Shortsword",
  "Trident",
  "War Pick",
  "Warhammer",
  "Whip",
  "Blowgun",
  "Hand Crossbow",
  "Heavy Crossbow",
  "Longbow",
  "Net",
] as const;

function typeAbbrev(type?: string): string {
  return (type?.split("|")[0] ?? "").toUpperCase();
}

function collectNamesByType(
  items: RawItemEntity[] | undefined,
  abbreviation: string,
): Set<string> {
  const names = new Set<string>();
  for (const item of items ?? []) {
    if (item.noDisplay) continue;
    if (typeAbbrev(item.type) !== abbreviation) continue;
    const name = item.name?.trim();
    if (name) names.add(name);
  }
  return names;
}

function isBaseRarity(rarity: unknown): boolean {
  if (rarity == null) return true;
  if (typeof rarity !== "string") return false;
  const lower = rarity.trim().toLowerCase();
  return lower === "" || lower === "none" || lower === "unknown";
}

/**
 * Collects only core PHB / XPHB base weapons (non-magic, non-setting).
 * Does not read items.json — that file is full of named/magic variants.
 */
function collectBaseWeaponNames(
  items: RawItemEntity[] | undefined,
  category: "simple" | "martial",
): Set<string> {
  const names = new Set<string>();
  for (const item of items ?? []) {
    if (item.noDisplay) continue;
    if (item.weaponCategory !== category) continue;
    const source = item.source?.trim();
    if (!source || !BASE_WEAPON_SOURCES.has(source)) continue;
    if (!isBaseRarity(item.rarity)) continue;
    const name = item.name?.trim();
    if (name) names.add(name);
  }
  return names;
}

function sorted(names: Iterable<string>): string[] {
  return [...names].sort((a, b) => a.localeCompare(b));
}

let artisanTools: readonly string[] = [];
let gamingSets: readonly string[] = [];
let otherTools: readonly string[] = [];
let simpleWeapons: readonly string[] = [];
let martialWeapons: readonly string[] = [];
let loadPromise: Promise<void> | null = null;

/** Fetch and cache tool/weapon pick lists from 5etools (idempotent). */
export async function loadChooseableToolsAndWeapons(): Promise<void> {
  if (
    artisanTools.length &&
    gamingSets.length &&
    otherTools.length &&
    simpleWeapons.length &&
    martialWeapons.length
  ) {
    return;
  }
  if (!loadPromise) {
    loadPromise = (async () => {
      const [base, items] = await Promise.all([
        fetchFiveToolsJson<ItemsBaseJson>(ITEMS_BASE_JSON_URL, "items-base.json"),
        fetchFiveToolsJson<ItemsJson>(ITEMS_JSON_URL, "items.json"),
      ]);

      const at = collectNamesByType(base.baseitem, "AT");
      for (const name of collectNamesByType(items.item, "AT")) at.add(name);

      const gs = collectNamesByType(items.item, "GS");
      for (const name of collectNamesByType(base.baseitem, "GS")) gs.add(name);

      const tools = collectNamesByType(items.item, "T");
      for (const name of collectNamesByType(base.baseitem, "T")) tools.add(name);

      const simple = collectBaseWeaponNames(base.baseitem, "simple");
      const martial = collectBaseWeaponNames(base.baseitem, "martial");

      artisanTools = at.size ? sorted(at) : [...FALLBACK_ARTISAN_TOOLS];
      gamingSets = gs.size ? sorted(gs) : [...FALLBACK_GAMING_SETS];
      otherTools = tools.size ? sorted(tools) : [...FALLBACK_OTHER_TOOLS];
      simpleWeapons = simple.size ? sorted(simple) : [...FALLBACK_SIMPLE_WEAPONS];
      martialWeapons = martial.size
        ? sorted(martial)
        : [...FALLBACK_MARTIAL_WEAPONS];
    })();
  }
  await loadPromise;
}

export function getChooseableArtisanTools(): readonly string[] {
  return artisanTools.length ? artisanTools : FALLBACK_ARTISAN_TOOLS;
}

export function getChooseableGamingSets(): readonly string[] {
  return gamingSets.length ? gamingSets : FALLBACK_GAMING_SETS;
}

export function getChooseableOtherTools(): readonly string[] {
  return otherTools.length ? otherTools : FALLBACK_OTHER_TOOLS;
}

export function getChooseableSimpleWeapons(): readonly string[] {
  return simpleWeapons.length ? simpleWeapons : FALLBACK_SIMPLE_WEAPONS;
}

export function getChooseableMartialWeapons(): readonly string[] {
  return martialWeapons.length ? martialWeapons : FALLBACK_MARTIAL_WEAPONS;
}

/** All non-weapon tools a character might pick (artisan + kits + gaming + instruments). */
export function getChooseableAllTools(): readonly string[] {
  const names = new Set<string>([
    ...getChooseableArtisanTools(),
    ...getChooseableOtherTools(),
    ...getChooseableGamingSets(),
    ...getChooseableMusicalInstruments(),
  ]);
  return sorted(names);
}

/**
 * Resolves the catalog for an `any` named-proficiency grant from its display label
 * (e.g. "Artisan's tools", "Martial weapons").
 * Known categories always use the live curated catalogs (ignore stale options
 * baked at parse time, which may include magic/setting weapons).
 */
export function resolveAnyProficiencyOptions(
  label: string,
  existingOptions?: readonly string[],
): string[] {
  const lower = label.toLowerCase();
  if (lower.includes("language")) {
    return existingOptions?.length ? [...existingOptions] : [];
  }
  if (lower.includes("musical")) {
    const instruments = getChooseableMusicalInstruments();
    return instruments.length
      ? [...instruments]
      : existingOptions?.length
        ? [...existingOptions]
        : [];
  }
  if (lower.includes("gaming")) return [...getChooseableGamingSets()];
  if (lower.includes("artisan")) return [...getChooseableArtisanTools()];
  if (lower.includes("martial")) return [...getChooseableMartialWeapons()];
  if (lower.includes("simple")) return [...getChooseableSimpleWeapons()];
  if (lower.includes("weapon")) {
    return sorted([
      ...getChooseableSimpleWeapons(),
      ...getChooseableMartialWeapons(),
    ]);
  }
  if (lower.includes("tool") || lower === "proficiency") {
    return [...getChooseableAllTools()];
  }
  if (existingOptions?.length) return [...existingOptions];
  return [...getChooseableAllTools()];
}
