import type { DndItem, Spell } from "@/shared/types";
import { pickRandomDndName } from "@/shared/utils/dnd-name-randomizer.utils";
import {
  ensureSpellUaSourcesLoaded,
  getListSpells,
} from "@/features/dnd/spells/services/spell.service";
import {
  ABILITY_AFFINITIES,
  CLASS_AFFINITIES,
  getAbilityAffinity,
  getClassAffinity,
  getIntendedUseAffinity,
  INTENDED_USE_AFFINITIES,
} from "../data/class-affinity.data";
import type {
  GeneratedShop,
  ShopConfig,
  ShopStockEntry,
  Shopkeeper,
  ShopThemeId,
} from "../data/shop-generator.types";
import {
  getShopTheme,
  itemMatchesShopTheme,
} from "../data/shop-themes.data";
import { getShopTier } from "../data/shop-tier.data";
import { bestAffinityMultiplier } from "./item-affinity.utils";
import { resolveItemPriceGp } from "./price-resolve.utils";
import {
  collectUsedSpellKeysFromStock,
  filterSpellsForShopSources,
  formatSpellScrollName,
  isGenericSpellScrollItem,
  parseSpellScrollLevel,
  pickRandomSpell,
  spellsByLevel,
} from "./spell-scroll.utils";

/** Themes where specialty scroll stock should be common. */
const SCROLL_BOOST_THEMES = new Set<ShopThemeId>([
  "arcane",
  "temple",
  "black-market",
]);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function createRowId(): string {
  return `row-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

function textBlob(item: DndItem): string {
  return `${item.name} ${item.searchText} ${item.attunement ?? ""} ${item.typeLabel}`.toLowerCase();
}

export function filterShopPool(
  items: DndItem[],
  config: ShopConfig,
): DndItem[] {
  let pool = items.filter(
    (item) =>
      !item.isItemGroup &&
      item.name.trim().length > 0 &&
      item.typeLabel !== "—",
  );

  if (config.sources.length > 0) {
    const allowed = new Set(config.sources);
    pool = pool.filter(
      (item) =>
        allowed.has(item.source) ||
        (item.variantSources?.some((s) => allowed.has(s)) ?? false),
    );
  }

  if (config.types.length > 0) {
    const allowed = new Set(config.types);
    pool = pool.filter((item) => allowed.has(item.typeLabel));
  }

  if (config.rarities.length > 0) {
    const allowed = new Set(config.rarities.map((r) => r.toLowerCase()));
    pool = pool.filter((item) => allowed.has(item.rarity.toLowerCase()));
  }

  if (config.magicFilter === "mundane") {
    pool = pool.filter((item) => item.isMundane);
  } else if (config.magicFilter === "magic") {
    pool = pool.filter((item) => item.isMagic);
  }

  if (config.attunementFilter === "yes") {
    pool = pool.filter((item) => item.attunement != null);
  } else if (config.attunementFilter === "no") {
    pool = pool.filter((item) => item.attunement == null);
  }

  // Theme is a hard catalog gate so specialty shops stay distinctive.
  const theme = getShopTheme(config.themeId);
  pool = pool.filter((item) =>
    itemMatchesShopTheme(item.typeLabel, textBlob(item), theme),
  );

  // Class / intended-use / ability affinities are soft biases in scoreItem.

  return pool;
}

function scoreItem(item: DndItem, config: ShopConfig): number {
  const theme = getShopTheme(config.themeId);
  const tier = getShopTier(config.shopTier);
  const rarityKey = item.rarity.toLowerCase();
  let weight = tier.rarityWeights[rarityKey] ?? 0.1;

  if (weight <= 0) return 0;

  const blob = textBlob(item);
  if (theme.keywords.some((k) => blob.includes(k.toLowerCase()))) {
    weight *= theme.keywordWeightBoost;
  }
  if (theme.preferMagic === true && item.isMagic) weight *= 1.4;
  if (theme.preferMagic === true && item.isMundane) weight *= 0.35;
  if (theme.preferMagic === false && item.isMundane) weight *= 1.4;
  if (theme.preferMagic === false && item.isMagic) weight *= 0.45;

  if (
    SCROLL_BOOST_THEMES.has(config.themeId) &&
    isGenericSpellScrollItem(item)
  ) {
    weight *= config.themeId === "arcane" ? 5.5 : 3.5;
  }

  const classProfiles = config.classAffinities
    .map((id) => getClassAffinity(id))
    .filter((p): p is NonNullable<typeof p> => p != null);
  weight *= bestAffinityMultiplier(item, classProfiles);

  const roleProfiles = config.intendedUses
    .map((id) => getIntendedUseAffinity(id))
    .filter((p): p is NonNullable<typeof p> => p != null);
  weight *= bestAffinityMultiplier(item, roleProfiles);

  const abilityProfiles = config.abilityAffinities
    .map((id) => getAbilityAffinity(id))
    .filter((p): p is NonNullable<typeof p> => p != null);
  weight *= bestAffinityMultiplier(item, abilityProfiles);

  // Prefer items that already have a catalog price when possible.
  if (item.valueCp != null && item.valueCp > 0) weight *= 1.05;

  return weight;
}

function weightedSample(
  items: DndItem[],
  config: ShopConfig,
  count: number,
  maxScrollsByLevel: Map<number, number>,
): DndItem[] {
  const scored = items
    .map((item) => ({ item, weight: scoreItem(item, config) }))
    .filter((entry) => entry.weight > 0);

  if (scored.length === 0) return [];

  const picked: DndItem[] = [];
  const usedNames = new Set<string>();
  const scrollPicksByLevel = new Map<number, number>();
  const remaining = [...scored];

  while (picked.length < count && remaining.length > 0) {
    const total = remaining.reduce((sum, e) => sum + e.weight, 0);
    let roll = Math.random() * total;
    let index = 0;
    for (; index < remaining.length; index++) {
      roll -= remaining[index].weight;
      if (roll <= 0) break;
    }
    if (index >= remaining.length) index = remaining.length - 1;
    const [chosen] = remaining.splice(index, 1);
    const item = chosen.item;
    const scrollLevel = parseSpellScrollLevel(item.name);

    if (scrollLevel != null) {
      const already = scrollPicksByLevel.get(scrollLevel) ?? 0;
      const maxForLevel = maxScrollsByLevel.get(scrollLevel) ?? 0;
      // Cap by available distinct spells; 0 means no pool for that level.
      if (maxForLevel <= 0 || already >= maxForLevel) {
        continue;
      }
      const nextCount = already + 1;
      scrollPicksByLevel.set(scrollLevel, nextCount);
      picked.push(item);
      // Scroll templates may be drawn multiple times (one per spell).
      if (nextCount < maxForLevel) {
        remaining.push(chosen);
      }
      continue;
    }

    const key = item.name.toLowerCase();
    if (usedNames.has(key)) continue;
    usedNames.add(key);
    picked.push(item);
  }

  return picked;
}

function toStockEntry(
  item: DndItem,
  spell: Spell | null,
): ShopStockEntry {
  const price = resolveItemPriceGp(item);
  const base: ShopStockEntry = {
    rowId: createRowId(),
    itemId: item.id,
    name: item.name,
    source: item.source,
    typeLabel: item.typeLabel,
    rarity: item.rarity,
    rarityLabel: item.rarityLabel,
    basePriceGp: price.basePriceGp,
    priceSource: price.priceSource,
    priceOverrideGp: null,
  };

  if (!spell) return base;

  return {
    ...base,
    name: formatSpellScrollName(spell.name),
    spellId: spell.id,
    spellName: spell.name,
    spellLevel: spell.level,
  };
}

function materializeStock(
  selected: DndItem[],
  spellsByLvl: Map<number, Spell[]>,
  usedSpellKeys: Set<string>,
): ShopStockEntry[] {
  return selected.map((item) => {
    const level = parseSpellScrollLevel(item.name);
    if (level == null) return toStockEntry(item, null);

    const candidates = spellsByLvl.get(level) ?? [];
    const spell = pickRandomSpell(candidates, usedSpellKeys);
    if (spell) {
      usedSpellKeys.add(spell.name.toLowerCase());
    }
    return toStockEntry(item, spell);
  });
}

async function loadShopSpellPool(
  config: ShopConfig,
): Promise<Map<number, Spell[]>> {
  if (config.sources.length > 0) {
    await ensureSpellUaSourcesLoaded(config.sources);
  }
  const spells = await getListSpells();
  const filtered = filterSpellsForShopSources(spells, config.sources);
  return spellsByLevel(filtered);
}

function maxScrollsFromPool(
  byLevel: Map<number, Spell[]>,
): Map<number, number> {
  const max = new Map<number, number>();
  for (const [level, list] of byLevel) {
    max.set(level, list.length);
  }
  return max;
}

function fillShopName(
  template: string,
  shopkeeperName: string,
): string {
  const first = shopkeeperName.split(/\s+/)[0] || shopkeeperName;
  return template.replace(/\{name\}/g, first);
}

export async function createShopkeeper(
  themeId: ShopThemeId,
): Promise<Shopkeeper> {
  const theme = getShopTheme(themeId);
  const name = await pickRandomDndName({ gender: "random" });
  return {
    name: name || "Unknown Merchant",
    title: pick(theme.shopkeeperTitles),
    flavor: pick(theme.flavorLines),
  };
}

export async function generateShop(
  items: DndItem[],
  config: ShopConfig,
): Promise<GeneratedShop> {
  const theme = getShopTheme(config.themeId);
  const pool = filterShopPool(items, config);
  const spellsByLvl = await loadShopSpellPool(config);
  const selected = weightedSample(
    pool,
    config,
    config.itemCount,
    maxScrollsFromPool(spellsByLvl),
  );
  const shopkeeper = await createShopkeeper(config.themeId);
  const shopName = fillShopName(pick(theme.shopNameTemplates), shopkeeper.name);
  const stock = materializeStock(selected, spellsByLvl, new Set());

  return {
    name: shopName,
    themeId: config.themeId,
    shopTier: config.shopTier,
    shopkeeper,
    stock,
    generatedAt: new Date().toISOString(),
  };
}

export async function replaceStockEntry(
  items: DndItem[],
  config: ShopConfig,
  shop: GeneratedShop,
  rowId: string,
): Promise<GeneratedShop> {
  const existingNames = new Set(
    shop.stock.filter((s) => s.rowId !== rowId).map((s) => s.name.toLowerCase()),
  );
  const pool = filterShopPool(items, config).filter((item) => {
    if (isGenericSpellScrollItem(item)) return true;
    return !existingNames.has(item.name.toLowerCase());
  });

  const spellsByLvl = await loadShopSpellPool(config);
  const usedSpellKeys = collectUsedSpellKeysFromStock(
    shop.stock.filter((s) => s.rowId !== rowId).map((s) => s.name),
  );
  // Also honor explicit spellName fields from persisted stock.
  for (const entry of shop.stock) {
    if (entry.rowId === rowId) continue;
    if (entry.spellName) usedSpellKeys.add(entry.spellName.toLowerCase());
  }

  const [replacement] = weightedSample(
    pool,
    config,
    1,
    maxScrollsFromPool(spellsByLvl),
  );
  if (!replacement) return shop;

  const [entry] = materializeStock(
    [replacement],
    spellsByLvl,
    usedSpellKeys,
  );

  return {
    ...shop,
    stock: shop.stock.map((row) => (row.rowId === rowId ? entry : row)),
  };
}

export function collectTypeLabels(items: DndItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.typeLabel && item.typeLabel !== "—") set.add(item.typeLabel);
  }
  return [...set].sort((a, b) => a.localeCompare(b));
}

export function collectRarityValues(items: DndItem[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.rarity) set.add(item.rarity);
  }
  const order = [
    "none",
    "common",
    "uncommon",
    "rare",
    "very rare",
    "legendary",
    "artifact",
    "varies",
    "unknown",
  ];
  return [...set].sort((a, b) => {
    const ia = order.indexOf(a.toLowerCase());
    const ib = order.indexOf(b.toLowerCase());
    if (ia === -1 && ib === -1) return a.localeCompare(b);
    if (ia === -1) return 1;
    if (ib === -1) return -1;
    return ia - ib;
  });
}

export {
  ABILITY_AFFINITIES,
  CLASS_AFFINITIES,
  INTENDED_USE_AFFINITIES,
};
