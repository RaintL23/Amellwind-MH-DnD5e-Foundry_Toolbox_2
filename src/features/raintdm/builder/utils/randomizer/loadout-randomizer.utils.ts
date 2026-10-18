/**
 * Weapon / armor loadout for the randomizer (D&D mode equips it; Amellwind
 * only uses the weapon names to steer Weapon Mastery).
 * Basic gear only: mundane 2024+ items, no firearms, no Half Plate / Splint / Plate.
 */
import type {
  AbilityKey,
  AbilityScores,
  ArmorItem,
  StartingEquipmentOption,
  Weapon,
} from "@/shared/types";
import { getWeaponMasteryByWeaponName } from "@/shared/data/weapon-mastery.data";
import { isShieldArmorItem } from "@/features/raintdm/builder/data/shield.data";
import {
  checkArmorProficiency,
  checkPhbWeaponNameProficiency,
} from "@/features/raintdm/builder/utils/equipment-proficiency.utils";
import { abilityModifier } from "./ability-randomizer.utils";
import { hasUnarmoredDefense, type BuildArchetype } from "./build-archetype.utils";
import { pickByRpgbot, type RpgbotRatingGetter } from "./character-randomizer.utils";

export interface LoadoutContext {
  archetype: BuildArchetype;
  className: string;
  subclassName: string | null;
  abilities: Partial<AbilityScores>;
  weaponProficiencies: string[];
  armorProficiencies: string[];
  /** RPGBOT rating for a weapon name in this class guide. */
  weaponRatingOf?: RpgbotRatingGetter<string>;
}

export interface LoadoutWeaponCandidates {
  main: string[];
  offHand: string[];
  backup: string[];
  allowShield: boolean;
}

export interface LoadoutPick {
  mainHand: string | null;
  offHand: string | null;
  backup: string | null;
  useShield: boolean;
}

interface WeaponTable {
  main: readonly string[];
  offHand?: readonly string[];
  backup: readonly string[];
  shield: boolean;
}

const FINESSE_WEAPONS = ["Rapier", "Shortsword", "Scimitar", "Dagger", "Whip"];
const TWO_HANDED_WEAPONS = new Set(
  ["Greatsword", "Greataxe", "Maul", "Glaive", "Halberd", "Pike", "Longbow", "Shortbow", "Heavy Crossbow", "Light Crossbow"].map(
    (name) => name.toLowerCase(),
  ),
);

const ARCHETYPE_WEAPONS: Readonly<Record<BuildArchetype, WeaponTable>> = {
  "great-weapon": {
    main: ["Greatsword", "Greataxe", "Maul", "Glaive", "Halberd", "Pike"],
    backup: ["Javelin", "Handaxe"],
    shield: false,
  },
  "sword-board": {
    main: ["Longsword", "Warhammer", "Flail", "Morningstar", "Battleaxe", "War Pick", "Mace", "Spear"],
    backup: ["Javelin", "Light Crossbow"],
    shield: true,
  },
  "dex-melee": {
    main: ["Rapier", "Shortsword", "Scimitar"],
    backup: ["Shortbow", "Light Crossbow", "Dagger"],
    shield: false,
  },
  "dual-wield": {
    main: ["Shortsword", "Scimitar"],
    offHand: ["Shortsword", "Scimitar", "Dagger"],
    backup: ["Shortbow", "Javelin"],
    shield: false,
  },
  "dex-ranged": {
    main: ["Longbow", "Light Crossbow", "Shortbow", "Heavy Crossbow"],
    backup: ["Shortsword", "Scimitar", "Rapier"],
    shield: false,
  },
  gish: {
    main: ["Longsword", "Rapier", "Shortsword", "Scimitar", "Warhammer"],
    backup: ["Light Crossbow", "Javelin"],
    shield: true,
  },
  caster: {
    main: ["Quarterstaff", "Dagger", "Mace"],
    backup: ["Light Crossbow"],
    shield: false,
  },
};

const CLASS_WEAPON_OVERRIDES: Readonly<
  Record<string, Partial<Record<BuildArchetype, WeaponTable>>>
> = {
  monk: {
    "dex-melee": {
      main: ["Shortsword", "Quarterstaff", "Spear", "Scimitar"],
      backup: ["Shortbow", "Dart"],
      shield: false,
    },
  },
  barbarian: {
    "dual-wield": {
      main: ["Handaxe", "Scimitar", "Light Hammer"],
      offHand: ["Handaxe", "Light Hammer", "Scimitar"],
      backup: ["Javelin"],
      shield: false,
    },
  },
  wizard: { caster: { main: ["Quarterstaff", "Dagger"], backup: ["Light Crossbow", "Dagger"], shield: false } },
  sorcerer: { caster: { main: ["Quarterstaff", "Dagger"], backup: ["Light Crossbow"], shield: false } },
  warlock: { caster: { main: ["Dagger", "Quarterstaff"], backup: ["Light Crossbow"], shield: false } },
  cleric: { caster: { main: ["Mace", "Warhammer", "Spear"], backup: ["Light Crossbow", "Javelin"], shield: true } },
  druid: {
    caster: { main: ["Quarterstaff", "Sickle", "Scimitar", "Spear"], backup: ["Sling", "Javelin"], shield: true },
    "sword-board": { main: ["Scimitar", "Spear", "Mace"], backup: ["Javelin", "Sling"], shield: true },
  },
  bard: { caster: { main: ["Rapier", "Dagger", "Shortsword"], backup: ["Light Crossbow", "Shortbow"], shield: false } },
  artificer: {
    caster: { main: ["Mace", "Spear", "Quarterstaff"], backup: ["Light Crossbow"], shield: true },
    "sword-board": { main: ["Mace", "Spear", "Warhammer", "Longsword"], backup: ["Light Crossbow"], shield: true },
  },
};

/** Bladesong forbids shields; Pact of the Blade warlocks have no shield proficiency anyway. */
function subclassForbidsShield(subclassName: string | null): boolean {
  return !!subclassName && /bladesing/i.test(subclassName);
}

function normalize(name: string): string {
  return name.trim().toLowerCase();
}

export function isProficientWithWeaponName(
  weaponName: string,
  weaponProficiencies: string[],
): boolean {
  const entry = getWeaponMasteryByWeaponName(weaponName);
  if (!entry) return false;
  return checkPhbWeaponNameProficiency(
    entry.name,
    entry.category,
    weaponProficiencies,
  ).allowed;
}

export function isTwoHandedWeaponName(weaponName: string): boolean {
  return TWO_HANDED_WEAPONS.has(normalize(weaponName));
}

/** Weapon names the archetype wants, filtered by proficiency (DEX builds try finesse first). */
export function resolveArchetypeWeaponCandidates(
  ctx: LoadoutContext,
): LoadoutWeaponCandidates {
  const classKey = normalize(ctx.className);
  const table =
    CLASS_WEAPON_OVERRIDES[classKey]?.[ctx.archetype] ??
    ARCHETYPE_WEAPONS[ctx.archetype];
  const prefersDex = (ctx.abilities.dex ?? 0) > (ctx.abilities.str ?? 0);

  const orderForStat = (names: readonly string[]) =>
    prefersDex && ctx.archetype !== "dex-ranged"
      ? [
          ...names.filter((name) => FINESSE_WEAPONS.includes(name)),
          ...names.filter((name) => !FINESSE_WEAPONS.includes(name)),
        ]
      : [...names];

  const proficient = (names: readonly string[]) =>
    orderForStat(names).filter((name) =>
      isProficientWithWeaponName(name, ctx.weaponProficiencies),
    );

  const hasShieldProficiency = ctx.armorProficiencies.some((item) =>
    /shield/i.test(item),
  );

  return {
    main: proficient(table.main),
    offHand: proficient(table.offHand ?? []),
    backup: proficient(table.backup),
    allowShield:
      table.shield &&
      hasShieldProficiency &&
      !subclassForbidsShield(ctx.subclassName),
  };
}

function pickWeaponName(
  candidates: string[],
  owned: ReadonlySet<string>,
  ctx: LoadoutContext,
  exclude: ReadonlySet<string> = new Set(),
): string | null {
  const pool = candidates.filter((name) => !exclude.has(normalize(name)));
  if (pool.length === 0) return null;
  const ownedPool = pool.filter((name) => owned.has(normalize(name)));
  return pickByRpgbot(
    ownedPool.length > 0 ? ownedPool : pool,
    (name) => ctx.weaponRatingOf?.(name) ?? null,
  );
}

/**
 * Main / off-hand / backup weapon names. Weapons already in the chosen
 * starting equipment (`ownedNames`, lowercase) win over buying new ones.
 */
export function pickLoadoutWeapons(
  candidates: LoadoutWeaponCandidates,
  ownedNames: ReadonlySet<string>,
  ctx: LoadoutContext,
): LoadoutPick {
  const mainHand = pickWeaponName(candidates.main, ownedNames, ctx);
  const isTwoHanded = !!mainHand && isTwoHandedWeaponName(mainHand);

  const offHand =
    !isTwoHanded && candidates.offHand.length > 0
      ? pickWeaponName(candidates.offHand, ownedNames, ctx)
      : null;

  const backup = pickWeaponName(
    candidates.backup,
    ownedNames,
    ctx,
    new Set([mainHand, offHand].filter((n): n is string => !!n).map(normalize)),
  );

  return {
    mainHand,
    offHand,
    backup,
    useShield: candidates.allowShield && !isTwoHanded && !offHand,
  };
}

// ─── Starting equipment option choice ────────────────────────────────────────

const GOLD_ITEM_PATTERN = /^\d+(\.\d+)?\s*gp$/i;

export function isGoldOnlyOption(option: StartingEquipmentOption): boolean {
  return (
    option.items.length > 0 &&
    option.items.every((item) => GOLD_ITEM_PATTERN.test(item.name.trim()))
  );
}

/**
 * Score for a starting-equipment package: weapons / armor that fit the
 * loadout count up, a gold-only package counts down.
 */
export function scoreStartingEquipmentOption(
  option: StartingEquipmentOption,
  candidates: LoadoutWeaponCandidates | null,
  isWearableArmorName: (name: string) => boolean,
): number {
  if (isGoldOnlyOption(option)) return -10;
  if (!candidates) return 0;

  const main = new Set(candidates.main.map(normalize));
  const secondary = new Set(
    [...candidates.offHand, ...candidates.backup].map(normalize),
  );
  let score = 0;
  for (const item of option.items) {
    const name = normalize(item.name);
    if (main.has(name)) score += 4;
    else if (secondary.has(name)) score += 2;
    else if (name === "shield" && candidates.allowShield) score += 1;
    else if (isWearableArmorName(item.name)) score += 3;
  }
  return score;
}

// ─── Armor ───────────────────────────────────────────────────────────────────

const EXCLUDED_ARMOR = new Set(["half plate armor", "half plate", "splint armor", "splint", "plate armor", "plate"]);
const CHAIN_MAIL_STR = 13;

/** Mundane, starting-level armor (no shields: they go through the shield slot). */
export function isBasicArmor(armor: ArmorItem): boolean {
  if (isShieldArmorItem(armor)) return false;
  if (armor.category === "clothing") return false;
  if (armor.baseName) return false;
  if ((armor.itemRarityLabel ?? armor.rarity) !== "Standard") return false;
  return !EXCLUDED_ARMOR.has(normalize(armor.name));
}

export function isBasicShield(armor: ArmorItem): boolean {
  if (!isShieldArmorItem(armor) || armor.baseName) return false;
  return (armor.itemRarityLabel ?? armor.rarity) === "Standard";
}

export function armorClassWith(
  armor: Pick<ArmorItem, "baseAC" | "maxDexBonus">,
  dexMod: number,
): number {
  const dex =
    armor.maxDexBonus === null ? dexMod : Math.min(dexMod, armor.maxDexBonus);
  return armor.baseAC + dex;
}

function meetsStrengthRequirement(armor: ArmorItem, str: number): boolean {
  return !/^chain mail/i.test(armor.name) || str >= CHAIN_MAIL_STR;
}

export function canWearArmor(
  armor: ArmorItem,
  ctx: Pick<LoadoutContext, "armorProficiencies" | "abilities">,
): boolean {
  return (
    isBasicArmor(armor) &&
    checkArmorProficiency(armor, ctx.armorProficiencies).allowed &&
    meetsStrengthRequirement(armor, ctx.abilities.str ?? 10)
  );
}

function scoreOf(abilities: Partial<AbilityScores>, key: AbilityKey): number {
  return abilities[key] ?? 10;
}

/** Unarmored Defense AC (Barbarian: DEX + CON, Monk: DEX + WIS); null for other classes. */
export function unarmoredDefenseAc(
  className: string,
  abilities: Partial<AbilityScores>,
): number | null {
  const kind = hasUnarmoredDefense(className);
  if (!kind) return null;
  const second = kind === "barbarian" ? "con" : "wis";
  return (
    10 +
    abilityModifier(scoreOf(abilities, "dex")) +
    abilityModifier(scoreOf(abilities, second))
  );
}

/**
 * Armor to equip: starting-equipment armor when wearable, else the best
 * basic armor by AC. Monks never wear armor; Barbarians only when it beats
 * Unarmored Defense; DEX builds skip Stealth disadvantage when possible.
 */
export function pickLoadoutArmor(
  ctx: LoadoutContext,
  armorCatalog: ArmorItem[],
  ownedNames: ReadonlySet<string>,
): ArmorItem | null {
  if (hasUnarmoredDefense(ctx.className) === "monk") return null;

  const wearable = armorCatalog.filter((armor) => canWearArmor(armor, ctx));
  if (wearable.length === 0) return null;

  const dexMod = abilityModifier(scoreOf(ctx.abilities, "dex"));
  const isDexBuild =
    ctx.archetype === "dex-melee" ||
    ctx.archetype === "dex-ranged" ||
    ctx.archetype === "dual-wield";

  const owned = wearable.filter((armor) => ownedNames.has(normalize(armor.name)));
  const quiet = wearable.filter((armor) => !armor.stealthDisadvantage);
  const pool =
    owned.length > 0
      ? owned
      : isDexBuild && quiet.length > 0
        ? quiet
        : wearable;

  const best = [...pool].sort((a, b) => {
    const byAc = armorClassWith(b, dexMod) - armorClassWith(a, dexMod);
    if (byAc !== 0) return byAc;
    if (a.stealthDisadvantage !== b.stealthDisadvantage) {
      return a.stealthDisadvantage ? 1 : -1;
    }
    return a.weight - b.weight;
  })[0];
  if (!best) return null;

  const unarmored = unarmoredDefenseAc(ctx.className, ctx.abilities);
  if (unarmored !== null && armorClassWith(best, dexMod) <= unarmored) {
    return null;
  }
  return best;
}

// ─── Catalog lookups ─────────────────────────────────────────────────────────

/** Mundane catalog weapon for a name (no magic variants). */
export function findBasicWeapon(
  weapons: Weapon[],
  name: string | null,
): Weapon | null {
  if (!name) return null;
  const key = normalize(name);
  return (
    weapons.find(
      (weapon) =>
        normalize(weapon.name) === key &&
        !weapon.baseName &&
        (weapon.itemRarityLabel ?? "Standard") === "Standard",
    ) ?? null
  );
}
