/**
 * Element-level validators for `normalizeBuilderSnapshot`. Each helper keeps
 * valid entries, drops (or nulls, when the index is meaningful) malformed ones
 * and reports every repair through `warn`, so imports of hand-edited or older
 * files restore what they can and explain what they could not.
 */
import { ABILITY_KEYS, SKILL_KEYS } from "@/shared/constants/dnd";
import type {
  AbilityKey,
  ArmorRarityProperty,
  BackgroundAsiMode,
  BackgroundFaction,
  BuilderFeatSelection,
  BuilderFeatSource,
  BuilderOptionalFeatureSelection,
  BuilderSpellSelection,
  CartEntry,
  DamageType,
  EquippedArmor,
  EquippedTrinket,
  EquippedWeapon,
  Rune,
  SkillKey,
} from "@/shared/types";
import type { AbilityScoreGenerationMethod } from "@/shared/utils/ability-scores";
import type { StandaloneShieldItem } from "../data/shield.data";

export type SnapshotWarn = (message: string) => void;

type UnknownRecord = Record<string, unknown>;

export function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

const DAMAGE_TYPES: readonly DamageType[] = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "necrotic",
  "piercing",
  "poison",
  "psychic",
  "radiant",
  "slashing",
  "thunder",
];
const FEAT_SOURCES: readonly BuilderFeatSource[] = ["asi", "amellwind", "dnd2014", "dnd2024"];
const FACTIONS: readonly BackgroundFaction[] = [
  "helix-commission",
  "hunters-guild",
  "royal-scrivener",
  "talon-society",
  "wycademy",
  "handlers-guild",
];
const ABILITY_METHODS: readonly AbilityScoreGenerationMethod[] = [
  "manual",
  "standard",
  "pointbuy",
  "dice",
];
const BACKGROUND_ASI_MODES: readonly BackgroundAsiMode[] = ["plus2plus1", "plus1each"];

function oneOf<T extends string>(list: readonly T[], value: unknown): value is T {
  return typeof value === "string" && (list as readonly string[]).includes(value);
}

export const isAbilityKey = (value: unknown): value is AbilityKey =>
  oneOf(ABILITY_KEYS, value);
export const isSkillKey = (value: unknown): value is SkillKey => oneOf(SKILL_KEYS, value);
export const isDamageType = (value: unknown): value is DamageType =>
  oneOf(DAMAGE_TYPES, value);

function describe(value: unknown): string {
  if (typeof value === "string") return `"${value}"`;
  if (isRecord(value) && typeof value.name === "string") return `"${value.name}"`;
  return JSON.stringify(value) ?? String(value);
}

// ─── Scalars ─────────────────────────────────────────────────────────────────

export function enumOr<T extends string>(
  list: readonly T[],
  value: unknown,
  fallback: T,
  label: string,
  warn: SnapshotWarn,
): T {
  if (oneOf(list, value)) return value;
  if (value !== undefined && value !== null) {
    warn(`${label}: unknown value ${describe(value)}, using "${fallback}".`);
  }
  return fallback;
}

export function nullableEnum<T extends string>(
  list: readonly T[],
  value: unknown,
  label: string,
  warn: SnapshotWarn,
): T | null {
  if (value === undefined || value === null) return null;
  if (oneOf(list, value)) return value;
  warn(`${label}: unknown value ${describe(value)} was dropped.`);
  return null;
}

export const abilityMethodOr = (value: unknown, warn: SnapshotWarn) =>
  enumOr(ABILITY_METHODS, value, "manual", "Ability score method", warn);
export const factionOr = (value: unknown, warn: SnapshotWarn) =>
  nullableEnum(FACTIONS, value, "Faction", warn);
export const backgroundAsiModeOr = (value: unknown, warn: SnapshotWarn) =>
  nullableEnum(BACKGROUND_ASI_MODES, value, "Background ASI mode", warn);
export const abilityOr = (value: unknown, label: string, warn: SnapshotWarn) =>
  nullableEnum(ABILITY_KEYS, value, label, warn);

export function nullableString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

// ─── Lists ───────────────────────────────────────────────────────────────────

/** Keeps entries passing `guard`; warns once per dropped entry. */
export function listOf<T>(
  value: unknown,
  guard: (item: unknown) => item is T,
  label: string,
  warn: SnapshotWarn,
): T[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    warn(`${label}: expected a list, ignored.`);
    return [];
  }
  const out: T[] = [];
  for (const item of value) {
    if (guard(item)) out.push(item);
    else warn(`${label}: invalid entry ${describe(item)} was dropped.`);
  }
  return out;
}

/** Positional list: invalid entries become null so later indices keep meaning. */
export function slotListOf<T>(
  value: unknown,
  normalize: (item: unknown, label: string) => T | null,
  label: string,
  warn: SnapshotWarn,
): (T | null)[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    warn(`${label}: expected a list, ignored.`);
    return [];
  }
  return value.map((item, index) => {
    if (item === null || item === undefined) return null;
    const normalized = normalize(item, `${label} #${index + 1}`);
    if (!normalized) warn(`${label} #${index + 1}: invalid entry ${describe(item)} was dropped.`);
    return normalized;
  });
}

export const isString = (value: unknown): value is string =>
  typeof value === "string" && value.trim().length > 0;

/**
 * Record of lists. `numericKeys` enforces the positional-index keys used by
 * grant choice records (`classSkillChoices`, `spellSelections`, …).
 */
export function recordOfLists<T>(
  value: unknown,
  normalizeList: (list: unknown, label: string) => T[],
  label: string,
  warn: SnapshotWarn,
  numericKeys = true,
): Record<string, T[]> {
  if (value === undefined || value === null) return {};
  if (!isRecord(value)) {
    warn(`${label}: expected an object, ignored.`);
    return {};
  }
  const out: Record<string, T[]> = {};
  for (const [key, list] of Object.entries(value)) {
    if (numericKeys && !/^-?\d+$/.test(key)) {
      warn(`${label}: non-numeric key "${key}" was dropped.`);
      continue;
    }
    out[key] = normalizeList(list, `${label}[${key}]`);
  }
  return out;
}

// ─── Feats / spells / optional features ──────────────────────────────────────

export function normalizeFeatSelection(
  value: unknown,
  label: string,
  warn: SnapshotWarn,
): BuilderFeatSelection | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return null;
  if (!oneOf(FEAT_SOURCES, value.source)) return null;

  const feat: BuilderFeatSelection = { id: value.id, name: value.name, source: value.source };
  const asi = value.asiChoices;
  if (isRecord(asi)) {
    if (asi.mode === "plus2" || asi.mode === "plus1plus1") {
      feat.asiChoices = {
        mode: asi.mode,
        plus2: abilityOr(asi.plus2, `${label} ASI +2`, warn),
        plus1a: abilityOr(asi.plus1a, `${label} ASI +1`, warn),
        plus1b: abilityOr(asi.plus1b, `${label} ASI +1`, warn),
      };
    } else {
      warn(`${label}: malformed ASI choices were dropped.`);
    }
  }
  if (Array.isArray(value.abilityIncreaseChoices)) {
    feat.abilityIncreaseChoices = value.abilityIncreaseChoices
      .filter(isRecord)
      .map((choice) => ({
        ability: abilityOr(choice.ability, `${label} ability increase`, warn),
        amount: typeof choice.amount === "number" && Number.isFinite(choice.amount) ? choice.amount : 1,
      }));
  }
  if (value.spellListClassChoice !== undefined) {
    feat.spellListClassChoice = nullableString(value.spellListClassChoice);
  }
  if (value.damageTypeChoice !== undefined) {
    feat.damageTypeChoice = nullableEnum(DAMAGE_TYPES, value.damageTypeChoice, `${label} damage type`, warn);
  }
  return feat;
}

export function isSpellSelection(value: unknown): value is BuilderSpellSelection {
  return (
    isRecord(value) &&
    isString(value.id) &&
    isString(value.name) &&
    typeof value.level === "number" &&
    Number.isInteger(value.level) &&
    value.level >= 0 &&
    value.level <= 9 &&
    typeof value.source === "string"
  );
}

export function normalizeOptionalFeature(
  value: unknown,
  progressionId: string,
): BuilderOptionalFeatureSelection | null {
  if (!isRecord(value) || !isString(value.id) || !isString(value.name)) return null;
  return {
    id: value.id,
    name: value.name,
    source: typeof value.source === "string" ? value.source : "",
    progressionId: isString(value.progressionId) ? value.progressionId : progressionId,
    featureTypes: Array.isArray(value.featureTypes)
      ? value.featureTypes.filter((t): t is string => typeof t === "string")
      : [],
  };
}

// ─── Equipment ───────────────────────────────────────────────────────────────

function isRune(value: unknown): value is Rune {
  return isRecord(value) && isString(value.name);
}

function runeSlots(value: unknown, label: string, warn: SnapshotWarn): (Rune | null)[] {
  if (!Array.isArray(value)) return [];
  return value.map((rune, index) => {
    if (rune === null || rune === undefined) return null;
    if (isRune(rune)) return rune;
    warn(`${label} rune #${index + 1}: invalid rune was dropped.`);
    return null;
  });
}

function slotCount(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0 ? value : fallback;
}

export function normalizeEquippedWeapon(
  value: unknown,
  label: string,
  warn: SnapshotWarn,
): EquippedWeapon | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || !isRecord(value.weapon) || !isString(value.weapon.name)) {
    warn(`${label}: invalid weapon was dropped.`);
    return null;
  }
  const weapon = {
    ...value.weapon,
    properties: Array.isArray(value.weapon.properties) ? value.weapon.properties : [],
  } as unknown as EquippedWeapon["weapon"];
  const runes = runeSlots(value.runes, label, warn);
  return {
    weapon,
    rarity: typeof value.rarity === "string" ? value.rarity : "Common",
    runeSlots: slotCount(value.runeSlots, runes.length),
    runes,
    activeModeIndex: slotCount(value.activeModeIndex, 0),
  };
}

function normalizeArmorRarityProperty(
  value: unknown,
): ArmorRarityProperty | null {
  if (!isRecord(value)) return null;
  switch (value.kind) {
    case "ac":
    case "unproficient-saves":
      return { kind: value.kind };
    case "save":
      return {
        kind: "save",
        ability:
          typeof value.ability === "string" &&
          (ABILITY_KEYS as string[]).includes(value.ability)
            ? (value.ability as AbilityKey)
            : null,
      };
    case "skills":
      return {
        kind: "skills",
        skills: [0, 1].map((i) => {
          const skill = Array.isArray(value.skills) ? value.skills[i] : null;
          return typeof skill === "string" &&
            (SKILL_KEYS as string[]).includes(skill)
            ? (skill as SkillKey)
            : null;
        }),
      };
    default:
      return null;
  }
}

export function normalizeEquippedArmor(value: unknown, warn: SnapshotWarn): EquippedArmor | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || !isRecord(value.armor) || !isString(value.armor.name)) {
    warn("Armor: invalid armor was dropped.");
    return null;
  }
  const runes = runeSlots(value.runes, "Armor", warn);
  const rarityProperties = Array.isArray(value.rarityProperties)
    ? value.rarityProperties.map(normalizeArmorRarityProperty)
    : undefined;
  return {
    armor: value.armor as unknown as EquippedArmor["armor"],
    rarity: typeof value.rarity === "string" ? value.rarity : "Common",
    runeSlots: slotCount(value.runeSlots, runes.length),
    runes,
    ...(rarityProperties ? { rarityProperties } : {}),
  };
}

export function normalizeShield(value: unknown, warn: SnapshotWarn): StandaloneShieldItem | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || !isString(value.name)) {
    warn("Shield: invalid shield was dropped.");
    return null;
  }
  return {
    name: value.name,
    acBonus: typeof value.acBonus === "number" ? value.acBonus : 2,
    weight: typeof value.weight === "number" ? value.weight : 6,
    rarity: typeof value.rarity === "string" ? value.rarity : "Standard",
  };
}

export function normalizeTrinket(
  value: unknown,
  label: string,
  warn: SnapshotWarn,
): EquippedTrinket | null {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || !isString(value.name)) {
    warn(`${label}: invalid trinket was dropped.`);
    return null;
  }
  const rune = value.rune === null || value.rune === undefined ? null : isRune(value.rune) ? value.rune : null;
  if (value.rune && !rune) warn(`${label}: invalid rune was dropped.`);
  return {
    name: value.name,
    rune,
    ...(value.runeMaterialEffect === "weapon" || value.runeMaterialEffect === "armor"
      ? { runeMaterialEffect: value.runeMaterialEffect }
      : {}),
    ...(typeof value.active === "boolean" ? { active: value.active } : {}),
  };
}

function textOf(value: unknown): string {
  if (typeof value === "string") return value;
  return typeof value === "number" && Number.isFinite(value) ? String(value) : "";
}

export function normalizeCartEntry(value: unknown): CartEntry | null {
  if (!isRecord(value) || !isString(value.name)) return null;
  const quantity =
    typeof value.quantity === "number" && Number.isFinite(value.quantity) && value.quantity >= 1
      ? Math.round(value.quantity)
      : 1;
  const entry: CartEntry = {
    name: value.name,
    cost: textOf(value.cost),
    weight: textOf(value.weight),
    quantity,
  };
  for (const key of ["source", "shopName", "startingEquipmentId", "linkedWeaponName"] as const) {
    if (typeof value[key] === "string") entry[key] = value[key] as string;
  }
  if (
    value.inventoryRole === "integrated-shield" ||
    value.inventoryRole === "default-ammo" ||
    value.inventoryRole === "trinket"
  ) {
    entry.inventoryRole = value.inventoryRole;
  }
  return entry;
}

export function inventoryOf(value: unknown, warn: SnapshotWarn): CartEntry[] {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    warn("Inventory: expected a list, ignored.");
    return [];
  }
  const out: CartEntry[] = [];
  for (const item of value) {
    const entry = normalizeCartEntry(item);
    if (entry) out.push(entry);
    else warn(`Inventory: invalid entry ${describe(item)} was dropped.`);
  }
  return out;
}
