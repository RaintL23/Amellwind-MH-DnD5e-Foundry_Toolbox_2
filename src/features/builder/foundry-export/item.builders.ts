import type { Weapon, ArmorItem, EquippedWeapon } from "@/shared/types";
import type { CartEntry } from "@/shared/types";
import type { FoundryActiveEffect, FoundryItem } from "./foundry.types";
import { buildStats, foundryId, DEFAULT_OWNERSHIP } from "./foundry-id.utils";
import {
  kebab,
  mapAmmunitionType,
  mapArmorTypeValue,
  mapDamageType,
  mapRarity,
  mapWeaponProperty,
  mapWeaponTypeValue,
  parseWeaponRange,
  slugify,
} from "./mappings";
import { knownItemEffects } from "./effect.builders";

// ─── Shared helpers ──────────────────────────────────────────────────────────

function sourceBlock(source: string | undefined): Record<string, unknown> {
  return {
    custom: "",
    book: source ?? "",
    page: "",
    license: "",
    rules: "2024",
    revision: 1,
  };
}

function htmlDesc(text: string | undefined): { value: string; chat: string } {
  const trimmed = (text ?? "").trim();
  if (!trimmed) return { value: "", chat: "" };
  const value = trimmed.startsWith("<") ? trimmed : `<p>${trimmed}</p>`;
  return { value, chat: "" };
}

let itemSort = 0;
function nextSort(): number {
  itemSort += 100000;
  return itemSort;
}

function wrapItem(
  partial: Pick<FoundryItem, "name" | "type" | "system"> &
    Partial<Pick<FoundryItem, "img" | "effects" | "_id" | "flags">>,
): FoundryItem {
  return {
    _id: partial._id ?? foundryId(),
    name: partial.name,
    type: partial.type,
    img: partial.img ?? "icons/svg/item-bag.svg",
    system: partial.system,
    effects: partial.effects ?? [],
    folder: null,
    sort: nextSort(),
    ownership: { ...DEFAULT_OWNERSHIP },
    flags: partial.flags ?? {},
    _stats: buildStats(),
  };
}

/** Parses a leading "+N " magic bonus from an item name. */
export function parseMagicBonus(name: string): { bonus: number; clean: string } {
  const prefix = name.match(/^\+(\d+)\s+(.*)$/);
  if (prefix) return { bonus: Number(prefix[1]), clean: prefix[2] };
  const suffix = name.match(/^(.*?)[\s,]+\+(\d+)$/);
  if (suffix) return { bonus: Number(suffix[2]), clean: suffix[1].trim() };
  return { bonus: 0, clean: name };
}

function parseDice(formula: string): { number: number; denomination: number } | null {
  const match = formula.match(/(\d+)\s*d\s*(\d+)/i);
  if (!match) return null;
  return { number: Number(match[1]), denomination: Number(match[2]) };
}

// ─── Feature / feat items ────────────────────────────────────────────────────

export type FeatSubtype = "class" | "race" | "background" | "feat" | "";

export interface FeatItemInput {
  name: string;
  description?: string;
  subtype: FeatSubtype;
  identifier?: string;
  img?: string;
  requirements?: string;
  effects?: FoundryActiveEffect[];
  advancement?: unknown[];
  id?: string;
}

export function buildFeatItem(input: FeatItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    description: htmlDesc(input.description),
    source: sourceBlock(undefined),
    identifier: input.identifier ?? kebab(input.name),
    activation: { type: "", value: null, override: false },
    duration: { value: "", units: "inst", override: false },
    cover: null,
    crewed: false,
    target: { template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" }, affects: { count: "", type: "", choice: false, special: "" }, prompt: true, override: false },
    range: { value: null, long: null, reach: "", units: "", special: "", override: false },
    uses: { spent: 0, max: "", recovery: [] },
    type: { value: input.subtype, subtype: "" },
    requirements: input.requirements ?? "",
    recharge: { value: null, charged: false },
    properties: [],
    prerequisites: { level: null },
    advancement: input.advancement ?? [],
    enchant: {},
    activities: {},
  };
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "feat",
    img: input.img ?? "icons/svg/upgrade.svg",
    system,
    effects: input.effects,
  });
}

// ─── Weapon items ────────────────────────────────────────────────────────────

export interface WeaponItemOptions {
  equipped: boolean;
  /** Attack ability override (str/dex/""); "" lets Foundry auto-pick. */
  attackAbility?: string;
  description?: string;
}

function isRangedWeapon(weapon: Weapon): boolean {
  if (weapon.properties.some((p) => p.split("|")[0] === "A")) return true;
  if (weapon.ammoType) return true;
  return false;
}

export function buildWeaponItem(
  equipped: EquippedWeapon,
  options: WeaponItemOptions,
): FoundryItem {
  const weapon = equipped.weapon;
  const { bonus: magicBonus, clean } = parseMagicBonus(weapon.name);
  const ranged = isRangedWeapon(weapon);

  const properties = [
    ...new Set(
      weapon.properties
        .map(mapWeaponProperty)
        .filter((p): p is string => p !== null),
    ),
  ];
  if (magicBonus > 0 && !properties.includes("mgc")) properties.push("mgc");

  const dmgType = mapDamageType(weapon.dmgType);
  const baseDice = parseDice(weapon.dmg1) ?? { number: 1, denomination: 4 };
  const versatileDice = weapon.dmg2 ? parseDice(weapon.dmg2) : null;
  const rangeInfo = parseWeaponRange(weapon.range);
  const hasRange = rangeInfo.value !== null;

  const activityId = foundryId();
  const system: Record<string, unknown> = {
    source: sourceBlock(weapon.source),
    description: htmlDesc(options.description ?? weapon.description),
    identifier: slugify(clean),
    quantity: 1,
    weight: { value: weapon.weight ?? 0, units: "lb" },
    price: { value: (weapon.valueCp ?? 0) / 100, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped: options.equipped,
    rarity: mapRarity(weapon.itemRarityLabel),
    identified: true,
    type: {
      value: mapWeaponTypeValue(weapon.weaponCategory, ranged),
      baseItem: slugify(weapon.baseName ?? clean),
    },
    damage: {
      base: {
        number: baseDice.number,
        denomination: baseDice.denomination,
        types: dmgType ? [dmgType] : [],
        custom: { enabled: false },
        scaling: { mode: "", number: 1 },
        bonus: "",
      },
      versatile: versatileDice
        ? {
            number: versatileDice.number,
            denomination: versatileDice.denomination,
            types: dmgType ? [dmgType] : [],
            custom: { enabled: false },
            scaling: { number: 1 },
            bonus: "",
          }
        : { number: null, denomination: null, types: [], custom: { enabled: false }, scaling: { number: 1 } },
    },
    magicalBonus: magicBonus || null,
    properties,
    proficient: null,
    range: {
      value: rangeInfo.value,
      long: rangeInfo.long,
      reach: null,
      units: hasRange || ranged ? "ft" : "",
    },
    mastery: weapon.mastery ?? "",
    ammunition: { type: mapAmmunitionType(weapon.ammoType) },
    armor: { value: null },
    uses: { spent: 0, max: "", recovery: [] },
    activities: {
      [activityId]: {
        _id: activityId,
        type: "attack",
        sort: 0,
        name: "",
        activation: { type: "action", value: 1, override: false },
        consumption: { scaling: { allowed: false }, spellSlot: true, targets: [] },
        description: {},
        duration: { units: "inst", concentration: false, override: false },
        effects: [],
        range: { units: "self", override: false },
        target: {
          template: { contiguous: false, units: "ft" },
          affects: { choice: false },
          override: false,
          prompt: true,
        },
        uses: { spent: 0, recovery: [] },
        attack: {
          ability: options.attackAbility ?? "",
          type: {
            value: ranged ? "ranged" : "melee",
            classification: "weapon",
          },
          critical: { threshold: null },
          flat: false,
          bonus: "",
        },
        damage: { critical: { bonus: "" }, includeBase: true, parts: [] },
      },
    },
    container: null,
    cover: null,
    crewed: false,
    unidentified: { description: "" },
  };

  return wrapItem({
    name: weapon.name,
    type: "weapon",
    img: "icons/weapons/swords/sword-broad-steel.webp",
    system,
  });
}

// ─── Armor / shield / trinket equipment items ────────────────────────────────

export function buildArmorItem(
  armor: ArmorItem,
  equipped: boolean,
  description?: string,
): FoundryItem {
  const { bonus: magicBonus } = parseMagicBonus(armor.name);
  const isShield = armor.category === "shield";
  const properties: string[] = [];
  if (magicBonus > 0) properties.push("mgc");
  if (armor.stealthDisadvantage) properties.push("stealthDisadvantage");

  const system: Record<string, unknown> = {
    source: sourceBlock(armor.source),
    description: htmlDesc(description ?? armor.description),
    identifier: slugify(armor.name),
    quantity: 1,
    weight: { value: armor.weight ?? 0, units: "lb" },
    price: { value: 0, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped,
    rarity: mapRarity(armor.itemRarityLabel),
    identified: true,
    type: {
      value: mapArmorTypeValue(armor.category),
      baseItem: slugify(armor.baseName ?? armor.name),
    },
    armor: {
      value: armor.baseAC,
      magicalBonus: magicBonus || null,
      dex: isShield ? null : armor.maxDexBonus,
    },
    properties,
    proficient: null,
    strength: null,
    uses: { spent: 0, max: "", recovery: [] },
    activities: {},
    container: null,
    cover: null,
    crewed: false,
    unidentified: { description: "" },
  };

  return wrapItem({
    name: armor.name,
    type: "equipment",
    img: isShield
      ? "icons/equipment/shield/heater-steel-boss.webp"
      : "icons/equipment/chest/breastplate-banded-steel.webp",
    system,
  });
}

export function buildTrinketItem(name: string, description?: string): FoundryItem {
  const system: Record<string, unknown> = {
    source: sourceBlock(undefined),
    description: htmlDesc(description),
    identifier: slugify(name),
    quantity: 1,
    weight: { value: 0, units: "lb" },
    price: { value: 0, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped: true,
    rarity: "",
    identified: true,
    type: { value: "trinket", baseItem: "" },
    armor: { value: null, dex: null, magicalBonus: null },
    properties: [],
    proficient: null,
    strength: null,
    activities: {},
    container: null,
    cover: null,
    crewed: false,
    unidentified: { description: "" },
  };
  return wrapItem({
    name,
    type: "equipment",
    img: "icons/commodities/treasure/token-gold-gems.webp",
    system,
    effects: knownItemEffects(name, "icons/commodities/treasure/token-gold-gems.webp"),
  });
}

// ─── Inventory (loot) items from cart entries ────────────────────────────────

function parseGpCost(cost: string): number {
  const match = cost.match(/([\d.]+)\s*(pp|gp|ep|sp|cp)/i);
  if (!match) return 0;
  const value = Number(match[1]);
  const unit = match[2].toLowerCase();
  switch (unit) {
    case "pp":
      return value * 10;
    case "gp":
      return value;
    case "ep":
      return value / 2;
    case "sp":
      return value / 10;
    case "cp":
      return value / 100;
    default:
      return value;
  }
}

export function buildLootItem(entry: CartEntry, description?: string): FoundryItem {
  const img = "icons/containers/bags/pack-leather-brown.webp";
  const system: Record<string, unknown> = {
    source: sourceBlock(entry.source),
    description: htmlDesc(description),
    identifier: slugify(entry.name),
    quantity: Math.max(1, entry.quantity ?? 1),
    weight: { value: Number(entry.weight) || 0, units: "lb" },
    price: { value: parseGpCost(entry.cost ?? ""), denomination: "gp" },
    rarity: "",
    identified: true,
    type: { value: "gear", subtype: "" },
    properties: [],
    unidentified: { description: "" },
    container: null,
  };
  return wrapItem({
    name: entry.name,
    type: "loot",
    img,
    system,
    effects: knownItemEffects(entry.name, img),
  });
}

// ─── Spell items (minimal) ───────────────────────────────────────────────────

export interface SpellItemInput {
  name: string;
  level: number;
  ability?: string;
  prepared?: boolean;
  description?: string;
}

export function buildSpellItem(input: SpellItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    source: sourceBlock(undefined),
    description: htmlDesc(input.description),
    identifier: slugify(input.name),
    level: input.level,
    school: "",
    ability: input.ability ?? "",
    properties: [],
    materials: { value: "", consumed: false, cost: 0, supply: 0 },
    preparation: {
      mode: "prepared",
      prepared: input.prepared ?? input.level === 0,
    },
    activation: { type: "action", value: 1, override: false },
    duration: { value: "", units: "inst" },
    range: { value: null, long: null, units: "" },
    target: { template: { count: "", contiguous: false, type: "", size: "", units: "ft" }, affects: { count: "", type: "", choice: false } },
    uses: { spent: 0, max: "", recovery: [] },
    activities: {},
    sourceClass: "",
  };
  return wrapItem({
    name: input.name,
    type: "spell",
    img: "icons/magic/symbols/runes-star-blue.webp",
    system,
  });
}

// ─── Identity items: class / subclass / race / background ─────────────────────

export interface ClassItemInput {
  name: string;
  identifier: string;
  source?: string;
  levels: number;
  hitDie: string;
  spellcastingProgression: string;
  spellcastingAbility: string;
  primaryAbilities: string[];
  description?: string;
  advancement: unknown[];
  id?: string;
}

export function buildClassItem(input: ClassItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    identifier: input.identifier,
    description: htmlDesc(input.description),
    source: sourceBlock(input.source),
    levels: input.levels,
    hd: { denomination: input.hitDie, spent: 0, additional: "" },
    spellcasting: {
      progression: input.spellcastingProgression,
      ability: input.spellcastingAbility,
      preparation: { formula: "" },
    },
    primaryAbility: {
      value: input.primaryAbilities,
      all: input.primaryAbilities.length > 1,
    },
    wealth: "",
    advancement: input.advancement,
    startingEquipment: [],
  };
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "class",
    img: "icons/skills/melee/weapons-crossed-swords-yellow.webp",
    system,
  });
}

export interface SubclassItemInput {
  name: string;
  identifier: string;
  classIdentifier: string;
  source?: string;
  spellcastingProgression: string;
  spellcastingAbility: string;
  description?: string;
  advancement: unknown[];
  id?: string;
}

export function buildSubclassItem(input: SubclassItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    identifier: input.identifier,
    classIdentifier: input.classIdentifier,
    description: htmlDesc(input.description),
    source: sourceBlock(input.source),
    spellcasting: {
      progression: input.spellcastingProgression,
      ability: input.spellcastingAbility,
      preparation: { formula: "" },
    },
    advancement: input.advancement,
  };
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "subclass",
    img: "icons/skills/melee/weapons-crossed-swords-purple.webp",
    system,
  });
}

export interface RaceItemInput {
  name: string;
  identifier: string;
  source?: string;
  walkSpeed: number;
  creatureType: string;
  subtype?: string;
  size: string;
  senses?: { darkvision?: number | null };
  description?: string;
  advancement: unknown[];
  id?: string;
}

export function buildRaceItem(input: RaceItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    description: htmlDesc(input.description),
    source: sourceBlock(input.source),
    identifier: input.identifier,
    movement: {
      burrow: null,
      climb: null,
      fly: null,
      swim: null,
      walk: input.walkSpeed,
      units: "ft",
      hover: false,
    },
    type: { value: input.creatureType, subtype: input.subtype ?? "", custom: "" },
    senses: {
      darkvision: input.senses?.darkvision ?? null,
      blindsight: null,
      truesight: null,
      tremorsense: null,
      units: "ft",
      special: "",
    },
    advancement: input.advancement,
  };
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "race",
    img: "icons/environment/people/group.webp",
    system,
  });
}

export interface BackgroundItemInput {
  name: string;
  identifier: string;
  source?: string;
  description?: string;
  advancement: unknown[];
  id?: string;
}

export function buildBackgroundItem(input: BackgroundItemInput): FoundryItem {
  const system: Record<string, unknown> = {
    description: htmlDesc(input.description),
    source: sourceBlock(input.source),
    identifier: input.identifier,
    advancement: input.advancement,
    startingEquipment: [],
    wealth: "",
  };
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "background",
    img: "icons/environment/people/commoner.webp",
    system,
  });
}
