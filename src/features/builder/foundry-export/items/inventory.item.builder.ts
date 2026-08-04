import type { FoundryItem } from "@/shared/foundry";
import {
  foundryId,
  wrapItem,
  defaultMidiProperties,
  mapRarity,
  mapTool,
  toolAbility,
  resolveInventoryItemIcon,
  slugify,
} from "@/shared/foundry";
import type { CartEntry } from "@/shared/types";
import { plainFeatureText, parseFeatureUsage } from "../feature-usage.utils";
import { sourceBlock, htmlDesc } from "./item-shared";

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

