import type { Weapon, ArmorItem, EquippedWeapon } from "@/shared/types";
import type { CartEntry } from "@/shared/types";
import type { FoundryActiveEffect, FoundryItem } from "./foundry.types";
import { buildStats, foundryId, DEFAULT_OWNERSHIP } from "./foundry-id.utils";
import { toFoundryDescription } from "./description.enrichers";
import { defaultMidiProperties } from "./midi.utils";
import {
  kebab,
  mapAmmunitionType,
  mapArmorTypeValue,
  mapDamageType,
  mapRarity,
  mapTool,
  mapWeaponProperty,
  mapWeaponTypeValue,
  parseWeaponRange,
  slugify,
  toolAbility,
} from "./mappings";
import {
  FOUNDRY_ITEM_ICONS,
  resolveFeatureIcon,
  resolveInventoryItemIcon,
  resolveSpellIcon,
  resolveWeaponItemIcon,
} from "./foundry-icons";
import {
  featureNeedsActivity,
  parseFeatureUsage,
  plainFeatureText,
  type ParsedFeatureUsage,
} from "./feature-usage.utils";
import {
  buildWeaponMasteryDescriptionBlock,
  getWeaponMasteryKeyByWeaponName,
} from "../data/weapon-mastery.data";

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
  return toFoundryDescription(text);
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

export type FeatSubtype = "class" | "subclass" | "race" | "background" | "feat" | "";

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
  /**
   * Parent class/subclass/race/background item id for sheet grouping
   * (`flags.dnd5e.advancementOrigin`). Without this, Foundry lists the feat
   * under "Other Features".
   */
  advancementOrigin?: string;
}

function buildFeatUses(usage: ParsedFeatureUsage): {
  spent: number;
  max: string;
  recovery: { period: string; type: string }[];
} {
  const recovery =
    usage.usesMax && usage.recoveryPeriod
      ? [{ period: usage.recoveryPeriod, type: "recoverAll" }]
      : [];
  return { spent: 0, max: usage.usesMax, recovery };
}

/** Utility activity so the feature is usable from the Foundry sheet / Midi. */
function buildFeatUtilityActivity(
  name: string,
  usage: ParsedFeatureUsage,
): Record<string, unknown> {
  const id = foundryId();
  const activationType = usage.activationType || "special";
  const activationValue =
    activationType === "special" ? null : (usage.activationValue ?? 1);
  const consumptionTargets = usage.usesMax
    ? [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ]
    : [];

  return {
    [id]: {
      _id: id,
      type: "utility",
      sort: 0,
      name: "",
      activation: {
        type: activationType,
        value: activationValue,
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: consumptionTargets,
      },
      description: { chatFlavor: "" },
      duration: { units: "inst", concentration: false, override: false },
      effects: [],
      range: { units: "self", override: false },
      target: {
        template: { contiguous: false, units: "ft" },
        affects: { choice: false },
        override: false,
        prompt: false,
      },
      uses: { spent: 0, max: "", recovery: [] },
      roll: { formula: "", name: "", prompt: false, visible: false },
      midiProperties: defaultMidiProperties({
        identifier: slugify(name),
      }),
    },
  };
}

export function buildFeatItem(input: FeatItemInput): FoundryItem {
  const usage = parseFeatureUsage(input.description);
  const activities = featureNeedsActivity(usage)
    ? buildFeatUtilityActivity(input.name, usage)
    : {};

  const system: Record<string, unknown> = {
    description: htmlDesc(input.description),
    source: sourceBlock(undefined),
    identifier: input.identifier ?? kebab(input.name),
    activation: {
      type: usage.activationType,
      value: usage.activationValue,
      override: false,
    },
    duration: { value: "", units: "inst", override: false },
    cover: null,
    crewed: false,
    target: { template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" }, affects: { count: "", type: "", choice: false, special: "" }, prompt: true, override: false },
    range: { value: null, long: null, reach: "", units: "", special: "", override: false },
    uses: buildFeatUses(usage),
    // Subclass features use the class feature type; sheet groups via advancementOrigin.
    type: {
      value: input.subtype === "subclass" ? "class" : input.subtype,
      subtype: "",
    },
    requirements: input.requirements ?? "",
    recharge: { value: null, charged: false },
    properties: [],
    prerequisites: { level: null },
    advancement: input.advancement ?? [],
    enchant: {},
    activities,
  };
  const flags: Record<string, unknown> = {};
  if (input.advancementOrigin) {
    flags.dnd5e = { advancementOrigin: input.advancementOrigin };
  }
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "feat",
    img: input.img ?? resolveFeatureIcon(input.subtype),
    system,
    effects: input.effects,
    flags,
  });
}

// ─── Weapon items ────────────────────────────────────────────────────────────

export interface WeaponItemOptions {
  equipped: boolean;
  /** Attack ability override (str/dex/""); "" lets Foundry auto-pick. */
  attackAbility?: string;
  /** Full item description (`system.description.value`). */
  description?: string;
  /** Condensed chat card text (`system.description.chat`). */
  chatDescription?: string;
  /** Foundry `img` (5etools fluff URL or core icon path). */
  img?: string;
}

function isRangedWeapon(weapon: Weapon): boolean {
  if (weapon.properties.some((p) => p.split("|")[0] === "A")) return true;
  if (weapon.ammoType) return true;
  return false;
}

/**
 * Description for Foundry export: Amellwind keeps its dedicated text; D&D 5e
 * base weapons append the Mastery rule (XPHB) when the catalog entry is empty.
 */
function resolveWeaponExportDescription(
  weapon: Weapon,
  override?: string,
): string {
  const base = (override ?? weapon.description ?? "").trim();
  if (weapon.contentSource !== "dnd") return base;

  const masteryKey =
    weapon.mastery?.trim() ||
    getWeaponMasteryKeyByWeaponName(weapon.baseName ?? weapon.name);
  const masteryBlock = buildWeaponMasteryDescriptionBlock(masteryKey);
  if (!masteryBlock) return base;
  if (/\bmastery\s*:/i.test(base)) return base;
  return base ? `${base}\n\n${masteryBlock}` : masteryBlock;
}

export function buildWeaponItem(
  equipped: EquippedWeapon,
  options: WeaponItemOptions,
): FoundryItem {
  const weapon = equipped.weapon;
  const { bonus: magicBonus, clean } = parseMagicBonus(weapon.name);
  const ranged = isRangedWeapon(weapon);
  const masteryKey =
    weapon.mastery?.trim() ||
    (weapon.contentSource === "dnd"
      ? getWeaponMasteryKeyByWeaponName(weapon.baseName ?? weapon.name)
      : undefined) ||
    "";

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
  const description = resolveWeaponExportDescription(
    weapon,
    options.description,
  );

  const activityId = foundryId();
  const system: Record<string, unknown> = {
    source: sourceBlock(weapon.source),
    description: toFoundryDescription(description, {
      chat: options.chatDescription ?? "",
    }),
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
    mastery: masteryKey,
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
        midiProperties: defaultMidiProperties({
          magicDamage: magicBonus > 0,
          magicEffect: magicBonus > 0,
          identifier: slugify(clean),
        }),
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
    img: resolveWeaponItemIcon(weapon.baseName ?? clean, ranged, options.img),
    system,
  });
}

// ─── Armor / shield / trinket equipment items ────────────────────────────────

export function buildArmorItem(
  armor: ArmorItem,
  equipped: boolean,
  description?: string,
  img?: string,
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

  const fallbackImg = isShield
    ? FOUNDRY_ITEM_ICONS.shield
    : FOUNDRY_ITEM_ICONS.armor;
  return wrapItem({
    name: armor.name,
    type: "equipment",
    img: img ?? fallbackImg,
    system,
  });
}

export function buildTrinketItem(
  name: string,
  description?: string,
  img?: string,
): FoundryItem {
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
    img: img ?? FOUNDRY_ITEM_ICONS.trinket,
    system,
  });
}

// ─── Inventory items from cart entries (tools / clothing / consumables / loot)

/** Catalog enrichment looked up by lowercased item name during Foundry export. */
export interface InventoryCatalogMeta {
  description?: string;
  /** 5etools type code, e.g. `T|XPHB`, `G`, `P`. */
  typeCode?: string;
  weightLb?: number;
  valueGp?: number;
  rarity?: string;
  attunement?: string | null;
  source?: string;
}

const TOOL_TYPE_ABBREVS = new Set(["T", "AT", "GS", "INS"]);
const CONSUMABLE_TYPE_ABBREVS = new Set(["P", "SC", "EXP", "FD"]);
const CLOTHING_NAME_RE =
  /\b(clothes|clothing|costume|robe|outfit|gown|vestments|uniform)\b/i;

const ABILITY_WORD_TO_KEY: Record<string, string> = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
};

function typeAbbrev(typeCode: string | undefined): string {
  if (!typeCode) return "";
  return typeCode.split("|")[0].trim().toUpperCase();
}

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

/** Parses `"5 lb."` / `"0.5"` / numeric weights into pounds. */
export function parseWeightLb(raw: string | number | null | undefined): number {
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.max(0, raw);
  if (raw == null) return 0;
  const match = String(raw).match(/([\d.]+)/);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : 0;
}

function resolveInventoryWeight(
  entry: CartEntry,
  meta?: InventoryCatalogMeta,
): number {
  if (meta?.weightLb != null && meta.weightLb > 0) return meta.weightLb;
  return parseWeightLb(entry.weight);
}

function resolveInventoryPriceGp(
  entry: CartEntry,
  meta?: InventoryCatalogMeta,
): number {
  if (meta?.valueGp != null && meta.valueGp > 0) return meta.valueGp;
  return parseGpCost(entry.cost ?? "");
}

function resolveAttunement(meta?: InventoryCatalogMeta): string {
  if (!meta?.attunement) return "";
  return /required/i.test(meta.attunement) ? "required" : "";
}

function mapToolCategory(abbrev: string): string {
  switch (abbrev) {
    case "AT":
      return "art";
    case "GS":
      return "game";
    case "INS":
      return "music";
    default:
      return "";
  }
}

function parseToolAbilityFromDescription(
  description: string | undefined,
  toolId: string | null,
): string {
  if (description) {
    const text = plainFeatureText(description);
    const labeled = text.match(
      /\bAbility:\s*(Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\b/i,
    );
    if (labeled) {
      return ABILITY_WORD_TO_KEY[labeled[1].toLowerCase()] ?? "int";
    }
  }
  return toolId ? toolAbility(toolId) : "int";
}

function parseHealingDice(
  description: string | undefined,
): { number: number; denomination: number; bonus: string } | null {
  if (!description) return null;
  const text = plainFeatureText(description);
  if (!/\b(hit\s+points?|regain|restore|heal)/i.test(text)) return null;
  const match = text.match(/(\d+)\s*d\s*(\d+)\s*([+-]\s*\d+)?/i);
  if (!match) return null;
  return {
    number: Number(match[1]),
    denomination: Number(match[2]),
    bonus: match[3] ? match[3].replace(/\s+/g, "") : "",
  };
}

function isClothingItem(
  name: string,
  abbrev: string,
  description: string | undefined,
): boolean {
  if (CLOTHING_NAME_RE.test(name)) return true;
  if (abbrev !== "G" && abbrev !== "") return false;
  if (!description) return false;
  return /\bwhile\s+wearing\b/i.test(plainFeatureText(description));
}

function sharedPhysicalFields(
  entry: CartEntry,
  meta: InventoryCatalogMeta | undefined,
  description: string | undefined,
): Record<string, unknown> {
  return {
    source: sourceBlock(meta?.source ?? entry.source),
    description: htmlDesc(description ?? meta?.description),
    identifier: slugify(entry.name),
    quantity: Math.max(1, entry.quantity ?? 1),
    weight: { value: resolveInventoryWeight(entry, meta), units: "lb" },
    price: {
      value: resolveInventoryPriceGp(entry, meta),
      denomination: "gp",
    },
    rarity: mapRarity(meta?.rarity),
    identified: true,
    attuned: false,
    attunement: resolveAttunement(meta),
    unidentified: { description: "" },
    container: null,
  };
}

function buildCheckActivity(
  ability: string,
  activationType: string = "action",
): Record<string, unknown> {
  const id = foundryId();
  return {
    [id]: {
      _id: id,
      type: "check",
      sort: 0,
      name: "",
      activation: {
        type: activationType,
        value: activationType === "special" ? null : 1,
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: [],
      },
      description: { chatFlavor: "" },
      duration: { units: "inst", concentration: false, override: false },
      effects: [],
      range: { units: "self", override: false },
      target: {
        template: { contiguous: false, units: "ft" },
        affects: { choice: false },
        override: false,
        prompt: false,
      },
      uses: { spent: 0, max: "", recovery: [] },
      check: {
        ability,
        associated: [],
        dc: { calculation: "", formula: "" },
      },
      midiProperties: defaultMidiProperties({ identifier: "tool-check" }),
    },
  };
}

function buildItemUtilityActivity(opts: {
  activationType: string;
  activationValue: number | null;
  consumeUses: boolean;
  name?: string;
}): Record<string, unknown> {
  const id = foundryId();
  const activationType = opts.activationType || "action";
  return {
    [id]: {
      _id: id,
      type: "utility",
      sort: 0,
      name: opts.name ?? "",
      activation: {
        type: activationType,
        value:
          activationType === "special" ? null : (opts.activationValue ?? 1),
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: opts.consumeUses
          ? [
              {
                type: "itemUses",
                target: "",
                value: "1",
                scaling: { mode: "", formula: "" },
              },
            ]
          : [],
      },
      description: { chatFlavor: "" },
      duration: { units: "inst", concentration: false, override: false },
      effects: [],
      range: { units: "self", override: false },
      target: {
        template: { contiguous: false, units: "ft" },
        affects: { choice: false },
        override: false,
        prompt: false,
      },
      uses: { spent: 0, max: "", recovery: [] },
      roll: { formula: "", name: "", prompt: false, visible: false },
      midiProperties: defaultMidiProperties({
        identifier: slugify(opts.name || "utility"),
      }),
    },
  };
}

function buildHealActivity(opts: {
  number: number;
  denomination: number;
  bonus: string;
  activationType: string;
}): Record<string, unknown> {
  const id = foundryId();
  const activationType = opts.activationType || "action";
  return {
    [id]: {
      _id: id,
      type: "heal",
      sort: 0,
      name: "",
      activation: {
        type: activationType,
        value: 1,
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: [
          {
            type: "itemUses",
            target: "",
            value: "1",
            scaling: { mode: "", formula: "" },
          },
        ],
      },
      description: { chatFlavor: "" },
      duration: { units: "inst", concentration: false, override: false },
      effects: [],
      range: { units: "touch", override: false },
      target: {
        template: { contiguous: false, units: "ft" },
        affects: { choice: false, type: "creature", count: "1" },
        override: false,
        prompt: true,
      },
      uses: { spent: 0, max: "", recovery: [] },
      healing: {
        number: opts.number,
        denomination: opts.denomination,
        types: ["healing"],
        custom: { enabled: false },
        scaling: { mode: "", number: null, formula: "" },
        bonus: opts.bonus,
      },
      midiProperties: defaultMidiProperties({ identifier: "potion-heal" }),
    },
  };
}

function buildToolInventoryItem(
  entry: CartEntry,
  meta: InventoryCatalogMeta | undefined,
  description: string | undefined,
  img: string | undefined,
  abbrev: string,
): FoundryItem {
  const toolId = mapTool(entry.name);
  const ability = parseToolAbilityFromDescription(description, toolId);
  const system: Record<string, unknown> = {
    ...sharedPhysicalFields(entry, meta, description),
    equipped: false,
    type: {
      value: mapToolCategory(abbrev),
      baseItem: toolId ?? "",
    },
    ability,
    chatFlavor: "",
    proficient: null,
    properties: [],
    bonus: "",
    uses: { spent: 0, max: "", recovery: [] },
    activities: buildCheckActivity(ability),
  };
  return wrapItem({
    name: entry.name,
    type: "tool",
    img: resolveInventoryItemIcon(entry.name, meta?.typeCode ?? abbrev, img),
    system,
  });
}

function buildClothingInventoryItem(
  entry: CartEntry,
  meta: InventoryCatalogMeta | undefined,
  description: string | undefined,
  img: string | undefined,
): FoundryItem {
  const usage = parseFeatureUsage(description);
  const explicitRecovery = hasExplicitRecovery(description);
  const activities =
    usage.activationType || usage.usesMax
      ? buildItemUtilityActivity({
          activationType: usage.activationType || "special",
          activationValue: usage.activationValue,
          consumeUses: Boolean(usage.usesMax),
        })
      : {};

  const system: Record<string, unknown> = {
    ...sharedPhysicalFields(entry, meta, description),
    equipped: false,
    type: { value: "clothing", baseItem: "" },
    armor: { value: null, dex: null, magicalBonus: null },
    properties: [],
    proficient: null,
    strength: null,
    uses: {
      spent: 0,
      max: usage.usesMax,
      recovery:
        usage.usesMax && usage.recoveryPeriod && explicitRecovery
          ? [{ period: usage.recoveryPeriod, type: "recoverAll" }]
          : [],
    },
    activities,
    cover: null,
    crewed: false,
  };
  return wrapItem({
    name: entry.name,
    type: "equipment",
    img: resolveInventoryItemIcon(entry.name, meta?.typeCode, img),
    system,
  });
}

function hasExplicitRecovery(description: string | undefined): boolean {
  if (!description) return false;
  return /\b(long\s+rest|short\s+rest|dawn|once\s+per\s+day)\b/i.test(
    plainFeatureText(description),
  );
}

function buildConsumableInventoryItem(
  entry: CartEntry,
  meta: InventoryCatalogMeta | undefined,
  description: string | undefined,
  img: string | undefined,
  abbrev: string,
): FoundryItem {
  const usage = parseFeatureUsage(description);
  const healing = parseHealingDice(description);
  const usesMax = usage.usesMax || (healing ? "1" : "");
  const activationType =
    usage.activationType || (healing ? "bonus" : usesMax ? "action" : "");
  const autoDestroy = Boolean(healing) || abbrev === "P";
  const explicitRecovery = hasExplicitRecovery(description);

  let activities: Record<string, unknown> = {};
  if (healing) {
    activities = buildHealActivity({
      number: healing.number,
      denomination: healing.denomination,
      bonus: healing.bonus,
      activationType: activationType || "bonus",
    });
  } else if (usesMax || usage.activationType) {
    activities = buildItemUtilityActivity({
      activationType: activationType || "action",
      activationValue: usage.activationValue,
      consumeUses: Boolean(usesMax),
    });
  }

  const consumableType =
    abbrev === "P" ? "potion" : abbrev === "SC" ? "scroll" : "trinket";

  const system: Record<string, unknown> = {
    ...sharedPhysicalFields(entry, meta, description),
    equipped: false,
    type: { value: consumableType, subtype: "" },
    damage: {
      base: {
        number: null,
        denomination: null,
        types: [],
        custom: { enabled: false },
        scaling: { mode: "", number: null },
        bonus: "",
      },
      replace: false,
    },
    magicalBonus: null,
    properties: meta?.rarity && meta.rarity !== "none" && meta.rarity !== ""
      ? ["mgc"]
      : [],
    uses: {
      spent: 0,
      max: usesMax,
      recovery:
        usesMax && usage.recoveryPeriod && explicitRecovery && !autoDestroy
          ? [{ period: usage.recoveryPeriod, type: "recoverAll" }]
          : [],
      autoDestroy,
    },
    activities,
  };
  return wrapItem({
    name: entry.name,
    type: "consumable",
    img: resolveInventoryItemIcon(entry.name, meta?.typeCode ?? abbrev, img),
    system,
  });
}

function buildGearLootItem(
  entry: CartEntry,
  meta: InventoryCatalogMeta | undefined,
  description: string | undefined,
  img: string | undefined,
): FoundryItem {
  // Limited-use adventuring gear (e.g. Healer's Kit) needs activities/uses,
  // which loot items lack — promote to a non-destroying consumable.
  const usage = parseFeatureUsage(description);
  if (usage.usesMax || usage.activationType) {
    return buildConsumableInventoryItem(
      entry,
      meta,
      description,
      img,
      typeAbbrev(meta?.typeCode) || "G",
    );
  }

  const system: Record<string, unknown> = {
    ...sharedPhysicalFields(entry, meta, description),
    type: { value: "gear", subtype: "" },
    properties: [],
  };
  // Loot schema has no attunement/equipped fields — drop them.
  delete system.attuned;
  delete system.attunement;
  return wrapItem({
    name: entry.name,
    type: "loot",
    img: resolveInventoryItemIcon(entry.name, meta?.typeCode, img),
    system,
  });
}

function isGamingSetItem(name: string, abbrev: string): boolean {
  if (abbrev === "GS") return true;
  const lower = name.trim().toLowerCase();
  return (
    lower === "setgaming" ||
    lower === "gaming set" ||
    /\b(dice set|playing card|dragonchess|three-dragon ante)\b/.test(lower)
  );
}

/**
 * Builds a Foundry inventory item from a cart entry, routing by 5etools type:
 * tools → `tool` + check activity; clothing → `equipment` clothing; potions /
 * limited-use gear → `consumable` with heal/utility + uses; else `loot`.
 */
export function buildInventoryItem(
  entry: CartEntry,
  meta?: InventoryCatalogMeta,
  img?: string,
): FoundryItem {
  const description = meta?.description;
  const abbrev = typeAbbrev(meta?.typeCode);

  if (
    TOOL_TYPE_ABBREVS.has(abbrev) ||
    mapTool(entry.name) ||
    isGamingSetItem(entry.name, abbrev)
  ) {
    return buildToolInventoryItem(
      entry,
      meta,
      description,
      img,
      abbrev || (isGamingSetItem(entry.name, abbrev) ? "GS" : "T"),
    );
  }
  if (isClothingItem(entry.name, abbrev, description)) {
    return buildClothingInventoryItem(entry, meta, description, img);
  }
  if (CONSUMABLE_TYPE_ABBREVS.has(abbrev)) {
    return buildConsumableInventoryItem(entry, meta, description, img, abbrev);
  }
  return buildGearLootItem(entry, meta, description, img);
}

/** @deprecated Prefer {@link buildInventoryItem}. */
export function buildLootItem(
  entry: CartEntry,
  description?: string,
  img?: string,
): FoundryItem {
  return buildInventoryItem(
    entry,
    description ? { description } : undefined,
    img,
  );
}

// ─── Spell items ─────────────────────────────────────────────────────────────

const SPELL_SCHOOL_MAP: Record<string, string> = {
  A: "abj",
  C: "con",
  D: "div",
  E: "enc",
  I: "evo",
  N: "nec",
  T: "trs",
  V: "ill",
  abjuration: "abj",
  conjuration: "con",
  divination: "div",
  enchantment: "enc",
  evocation: "evo",
  necromancy: "nec",
  transmutation: "trs",
  illusion: "ill",
};

const SAVE_ABILITY_MAP: Record<string, string> = {
  strength: "str",
  dexterity: "dex",
  constitution: "con",
  intelligence: "int",
  wisdom: "wis",
  charisma: "cha",
  str: "str",
  dex: "dex",
  con: "con",
  int: "int",
  wis: "wis",
  cha: "cha",
};

function mapSpellSchool(school: string | undefined): string {
  if (!school) return "";
  return SPELL_SCHOOL_MAP[school] ?? SPELL_SCHOOL_MAP[school.toLowerCase()] ?? "";
}

function parseActivation(castingTime: string | undefined): {
  type: string;
  value: number | null;
} {
  const raw = (castingTime ?? "").toLowerCase();
  if (raw.includes("bonus")) return { type: "bonus", value: 1 };
  if (raw.includes("reaction")) return { type: "reaction", value: 1 };
  if (raw.includes("minute")) {
    const n = Number(raw.match(/(\d+)/)?.[1] ?? 1);
    return { type: "minute", value: n };
  }
  if (raw.includes("hour")) {
    const n = Number(raw.match(/(\d+)/)?.[1] ?? 1);
    return { type: "hour", value: n };
  }
  if (raw.includes("action") || !raw) return { type: "action", value: 1 };
  return { type: "special", value: null };
}

function parseSpellDuration(duration: string | undefined): {
  value: string;
  units: string;
  concentration: boolean;
} {
  const raw = (duration ?? "").trim();
  const concentration = /concentration/i.test(raw);
  const instant = /instant/i.test(raw) || !raw;
  if (instant) return { value: "", units: "inst", concentration };
  const round = raw.match(/(\d+)\s*round/i);
  if (round) return { value: round[1], units: "round", concentration };
  const minute = raw.match(/(\d+)\s*minute/i);
  if (minute) return { value: minute[1], units: "minute", concentration };
  const hour = raw.match(/(\d+)\s*hour/i);
  if (hour) return { value: hour[1], units: "hour", concentration };
  const day = raw.match(/(\d+)\s*day/i);
  if (day) return { value: day[1], units: "day", concentration };
  return { value: "", units: "spec", concentration };
}

function parseSpellRange(range: string | undefined): {
  value: number | null;
  long: number | null;
  units: string;
} {
  const raw = (range ?? "").trim().toLowerCase();
  if (!raw) return { value: null, long: null, units: "" };
  if (raw === "self") return { value: null, long: null, units: "self" };
  if (raw === "touch") return { value: null, long: null, units: "touch" };
  if (raw.includes("sight")) return { value: null, long: null, units: "spec" };
  const ft = raw.match(/(\d+)\s*(?:feet|foot|ft)/i);
  if (ft) return { value: Number(ft[1]), long: null, units: "ft" };
  return { value: null, long: null, units: "spec" };
}

function mapSaveAbility(label: string): string {
  const key = label.trim().toLowerCase();
  return SAVE_ABILITY_MAP[key] ?? "";
}

/** dnd5e `system.preparation.mode` values used by the export. */
export type SpellPreparationMode =
  | "prepared"
  | "always"
  | "pact"
  | "innate"
  | "atwill";

export interface SpellItemInput {
  name: string;
  level: number;
  ability?: string;
  prepared?: boolean;
  /** Defaults to `"prepared"`. Use `"pact"` for Warlock, `"always"` for always-prepared grants. */
  preparationMode?: SpellPreparationMode;
  description?: string;
  source?: string;
  school?: string;
  castingTime?: string;
  range?: string;
  duration?: string;
  isRitual?: boolean;
  isConcentration?: boolean;
  components?: { v?: boolean; s?: boolean; m?: string };
  spellAttack?: string[];
  savingThrows?: string[];
  damageTypes?: string[];
  /** Foundry `img` (5etools fluff URL or school fallback path). */
  img?: string;
}

function buildSpellActivities(input: SpellItemInput): Record<string, unknown> {
  const activation = parseActivation(input.castingTime);
  const duration = parseSpellDuration(input.duration);
  if (input.isConcentration) duration.concentration = true;
  const range = parseSpellRange(input.range);
  const activities: Record<string, unknown> = {};

  const base = {
    activation: {
      type: activation.type,
      value: activation.value,
      override: false,
    },
    consumption: {
      scaling: { allowed: false },
      spellSlot: true,
      targets: [],
    },
    description: { chatFlavor: "" },
    duration: {
      value: duration.value || "",
      units: duration.units,
      concentration: duration.concentration,
      override: false,
    },
    effects: [] as { _id: string }[],
    range: {
      value: range.value,
      units: range.units || "self",
      override: false,
    },
    target: {
      template: { contiguous: false, units: "ft" },
      affects: { choice: false },
      override: false,
      prompt: true,
    },
    uses: { spent: 0, recovery: [] },
  };

  const attacks = input.spellAttack ?? [];
  const saves = (input.savingThrows ?? [])
    .map(mapSaveAbility)
    .filter(Boolean);
  const dmgType = mapDamageType(input.damageTypes?.[0] ?? "");

  if (attacks.length > 0) {
    const id = foundryId();
    const isRanged = attacks.some((a) => /ranged/i.test(a));
    activities[id] = {
      _id: id,
      type: "attack",
      sort: 0,
      name: "",
      ...base,
      attack: {
        ability: input.ability ?? "",
        type: {
          value: isRanged ? "ranged" : "melee",
          classification: "spell",
        },
        critical: { threshold: null },
        flat: false,
        bonus: "",
      },
      damage: {
        critical: { bonus: "" },
        includeBase: false,
        parts: dmgType
          ? [
              {
                number: null,
                denomination: null,
                types: [dmgType],
                custom: { enabled: false },
                scaling: { mode: "", number: 1 },
                bonus: "",
              },
            ]
          : [],
      },
      midiProperties: defaultMidiProperties({
        identifier: slugify(input.name),
      }),
    };
    return activities;
  }

  if (saves.length > 0) {
    const id = foundryId();
    activities[id] = {
      _id: id,
      type: "save",
      sort: 0,
      name: "",
      ...base,
      damage: {
        parts: dmgType
          ? [
              {
                number: null,
                denomination: null,
                types: [dmgType],
                custom: { enabled: false },
                scaling: { mode: "", number: 1 },
                bonus: "",
              },
            ]
          : [],
        onSave: "half",
      },
      save: {
        ability: saves[0],
        dc: {
          calculation: input.ability ? "spellcasting" : "",
          formula: "",
        },
      },
      midiProperties: defaultMidiProperties({
        identifier: slugify(input.name),
      }),
    };
    return activities;
  }

  const id = foundryId();
  activities[id] = {
    _id: id,
    type: "utility",
    sort: 0,
    name: "",
    ...base,
    roll: { formula: "", name: "", prompt: false, visible: false },
    midiProperties: defaultMidiProperties({
      identifier: slugify(input.name),
    }),
  };
  return activities;
}

export function buildSpellItem(input: SpellItemInput): FoundryItem {
  const activation = parseActivation(input.castingTime);
  const duration = parseSpellDuration(input.duration);
  if (input.isConcentration) duration.concentration = true;
  const range = parseSpellRange(input.range);
  const properties: string[] = [];
  if (input.components?.v) properties.push("vocal");
  if (input.components?.s) properties.push("somatic");
  if (input.components?.m) properties.push("material");
  if (input.isConcentration || duration.concentration) {
    properties.push("concentration");
  }
  if (input.isRitual) properties.push("ritual");

  const system: Record<string, unknown> = {
    source: sourceBlock(input.source),
    description: htmlDesc(input.description),
    identifier: slugify(input.name),
    level: input.level,
    school: mapSpellSchool(input.school),
    ability: input.ability ?? "",
    properties,
    materials: {
      value: input.components?.m ?? "",
      consumed: false,
      cost: 0,
      supply: 0,
    },
    preparation: {
      mode: input.preparationMode ?? "prepared",
      prepared: input.prepared ?? input.level === 0,
    },
    activation: {
      type: activation.type,
      value: activation.value,
      override: false,
    },
    duration: {
      value: duration.value,
      units: duration.units,
      concentration: duration.concentration,
    },
    range: {
      value: range.value,
      long: range.long,
      units: range.units,
    },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        units: "ft",
      },
      affects: { count: "", type: "", choice: false },
    },
    uses: { spent: 0, max: "", recovery: [] },
    activities: buildSpellActivities(input),
    sourceClass: "",
  };
  return wrapItem({
    name: input.name,
    type: "spell",
    img: input.img ?? resolveSpellIcon(input.school),
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
  img?: string;
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
    img: input.img ?? "icons/skills/melee/weapons-crossed-swords-yellow.webp",
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
  img?: string;
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
    img: input.img ?? "icons/skills/melee/weapons-crossed-swords-purple.webp",
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
  img?: string;
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
    img: input.img ?? "icons/environment/people/group.webp",
    system,
  });
}

export interface BackgroundItemInput {
  name: string;
  identifier: string;
  source?: string;
  description?: string;
  img?: string;
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
    img: input.img ?? "icons/environment/people/commoner.webp",
    system,
  });
}
