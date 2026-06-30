/**
 * Slug / identifier maps translating the builder's human-readable data into the
 * canonical Foundry VTT dnd5e identifiers used in the example actors.
 */
import { toAbilityKey } from "@/shared/constants/dnd";

/** Lowercase, alphanumeric-only slug (Foundry baseItem / identifier style). */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "");
}

/** Kebab-case identifier used by class/feature `system.identifier`. */
export function kebab(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ─── Damage types ────────────────────────────────────────────────────────────

const DAMAGE_TYPE_MAP: Record<string, string> = {
  s: "slashing",
  p: "piercing",
  b: "bludgeoning",
  a: "acid",
  c: "cold",
  f: "fire",
  l: "lightning",
  n: "necrotic",
  o: "force",
  i: "poison",
  y: "psychic",
  r: "radiant",
  t: "thunder",
};

export function mapDamageType(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const trimmed = raw.trim().toLowerCase();
  if (!trimmed) return null;
  if (DAMAGE_TYPE_MAP[trimmed]) return DAMAGE_TYPE_MAP[trimmed];
  // Already a full word (e.g. "fire", "bludgeoning").
  const full = [
    "acid", "bludgeoning", "cold", "fire", "force", "lightning", "necrotic",
    "piercing", "poison", "psychic", "radiant", "slashing", "thunder",
  ];
  return full.includes(trimmed) ? trimmed : null;
}

// ─── Weapon properties (5etools abbrev → Foundry key) ────────────────────────

const WEAPON_PROPERTY_MAP: Record<string, string> = {
  A: "amm",
  F: "fin",
  H: "hvy",
  L: "lgt",
  LD: "lod",
  R: "rch",
  RLD: "lod",
  "2H": "two",
  T: "thr",
  V: "ver",
  S: "spc",
};

export function mapWeaponProperty(raw: string): string | null {
  const key = raw.split("|")[0];
  return WEAPON_PROPERTY_MAP[key] ?? null;
}

/**
 * Parses a 5etools weapon range string (e.g. "20/60", "120/360", "30") into the
 * Foundry `{ value, long }` shape. Returns nulls when no range is present.
 */
export function parseWeaponRange(
  range: string | undefined,
): { value: number | null; long: number | null } {
  if (!range) return { value: null, long: null };
  const match = range.match(/(\d+)\s*(?:\/\s*(\d+))?/);
  if (!match) return { value: null, long: null };
  return {
    value: Number(match[1]),
    long: match[2] ? Number(match[2]) : null,
  };
}

// ─── Ammunition type (5etools ammoType uid → Foundry baseItem ammo key) ───────

const AMMO_TYPE_MAP: Record<string, string> = {
  arrow: "arrow",
  bolt: "crossbowBolt",
  "crossbow bolt": "crossbowBolt",
  "sling bullet": "slingBullet",
  needle: "blowgunNeedle",
  "blowgun needle": "blowgunNeedle",
  "firearm bullet": "firearmBullet",
  "energy cell": "energyCell",
};

/**
 * Maps a 5etools ammoType uid (e.g. "arrow|xphb", "firearm bullet|xphb") to the
 * Foundry dnd5e ammunition base-item key (e.g. "arrow", "firearmBullet").
 * Returns "" when the ammo type has no known Foundry equivalent.
 */
export function mapAmmunitionType(ammoType: string | undefined): string {
  if (!ammoType) return "";
  const key = ammoType.split("|")[0].trim().toLowerCase();
  return AMMO_TYPE_MAP[key] ?? "";
}

// ─── Weapon type.value ───────────────────────────────────────────────────────

export function mapWeaponTypeValue(
  category: "simple" | "martial" | undefined,
  isRanged: boolean,
): string {
  const cat = category === "martial" ? "martial" : "simple";
  const suffix = isRanged ? "R" : "M";
  return `${cat}${suffix}`;
}

// ─── Armor type.value ────────────────────────────────────────────────────────

export function mapArmorTypeValue(
  category: "light" | "medium" | "heavy" | "shield" | "clothing",
): string {
  switch (category) {
    case "light":
      return "light";
    case "medium":
      return "medium";
    case "heavy":
      return "heavy";
    case "shield":
      return "shield";
    default:
      return "clothing";
  }
}

// ─── Size ────────────────────────────────────────────────────────────────────

export function mapSize(size: string): string {
  switch (size) {
    case "T":
      return "tiny";
    case "S":
      return "sm";
    case "L":
      return "lg";
    case "H":
      return "huge";
    case "G":
      return "grg";
    default:
      return "med";
  }
}

// ─── Languages ───────────────────────────────────────────────────────────────

const LANGUAGE_MAP: Record<string, string> = {
  common: "common",
  "common sign language": "commonSign",
  dwarvish: "dwarvish",
  elvish: "elvish",
  giant: "giant",
  gnomish: "gnomish",
  goblin: "goblin",
  halfling: "halfling",
  orc: "orc",
  abyssal: "abyssal",
  celestial: "celestial",
  draconic: "draconic",
  "deep speech": "deep",
  infernal: "infernal",
  primordial: "primordial",
  aquan: "primordial",
  auran: "primordial",
  ignan: "primordial",
  terran: "primordial",
  sylvan: "sylvan",
  undercommon: "undercommon",
  druidic: "druidic",
  "thieves' cant": "cant",
  "thieves cant": "cant",
  aarakocra: "aarakocra",
  gith: "gith",
};

/** Returns `{ value: knownKey } | { custom: rawLabel }`. */
export function mapLanguage(label: string): { key?: string; custom?: string } {
  const key = LANGUAGE_MAP[label.trim().toLowerCase()];
  return key ? { key } : { custom: label.trim() };
}

// ─── Tools ───────────────────────────────────────────────────────────────────

const TOOL_MAP: Record<string, string> = {
  "alchemist's supplies": "alchemist",
  "brewer's supplies": "brewer",
  "calligrapher's supplies": "calligrapher",
  "carpenter's tools": "carpenter",
  "cartographer's tools": "cartographer",
  "cobbler's tools": "cobbler",
  "cook's utensils": "cook",
  "glassblower's tools": "glassblower",
  "jeweler's tools": "jeweler",
  "leatherworker's tools": "leatherworker",
  "mason's tools": "mason",
  "painter's supplies": "painter",
  "potter's tools": "potter",
  "smith's tools": "smith",
  "tinker's tools": "tinker",
  "weaver's tools": "weaver",
  "woodcarver's tools": "woodcarver",
  "disguise kit": "disg",
  "forgery kit": "forg",
  "herbalism kit": "herb",
  "navigator's tools": "navg",
  "poisoner's kit": "pois",
  "thieves' tools": "thief",
  "thieves tools": "thief",
  "dice set": "dice",
  "playing card set": "card",
  "chess set": "chess",
  "dragonchess set": "chess",
  "three-dragon ante set": "card",
};

const INSTRUMENT_MAP: Record<string, string> = {
  bagpipes: "bagpipes",
  drum: "drum",
  dulcimer: "dulcimer",
  flute: "flute",
  lute: "lute",
  lyre: "lyre",
  horn: "horn",
  "pan flute": "panflute",
  shawm: "shawm",
  viol: "viol",
};

/** Maps a tool/gaming-set/instrument label to its Foundry tool id. */
export function mapTool(label: string): string | null {
  const key = label.trim().toLowerCase();
  return TOOL_MAP[key] ?? INSTRUMENT_MAP[key] ?? null;
}

export function toolAbility(toolId: string): string {
  // Most artisan tools use Intelligence by default in dnd5e; instruments use
  // Charisma, thieves' tools Dexterity. Foundry recomputes anyway.
  if (toolId === "thief") return "dex";
  if (Object.values(INSTRUMENT_MAP).includes(toolId)) return "cha";
  return "int";
}

// ─── Weapon proficiency traits ──────────────────────────────────────────────

export function mapWeaponProficiency(label: string): string {
  const lower = label.trim().toLowerCase();
  if (lower.includes("simple")) return "sim";
  if (lower.includes("martial")) return "mar";
  return slugify(label);
}

// ─── Armor proficiency traits ───────────────────────────────────────────────

export function mapArmorProficiency(label: string): string | null {
  const lower = label.trim().toLowerCase();
  if (lower.includes("light")) return "lgt";
  if (lower.includes("medium")) return "med";
  if (lower.includes("heavy")) return "hvy";
  if (lower.includes("shield")) return "shl";
  return null;
}

// ─── Caster progression ──────────────────────────────────────────────────────

export function mapCasterProgression(
  casterProgression: string | undefined,
): string {
  switch (casterProgression) {
    case "full":
      return "full";
    case "1/2":
    case "half":
      return "half";
    case "1/3":
    case "third":
      return "third";
    case "pact":
      return "pact";
    case "artificer":
      return "artificer";
    default:
      return "none";
  }
}

export function mapAbilityLabel(label: string | null | undefined): string {
  return toAbilityKey(label) ?? "";
}

// ─── Rarity ──────────────────────────────────────────────────────────────────

export function mapRarity(label: string | undefined): string {
  switch ((label ?? "").trim().toLowerCase()) {
    case "common":
      return "common";
    case "uncommon":
      return "uncommon";
    case "rare":
      return "rare";
    case "very rare":
      return "veryRare";
    case "legendary":
      return "legendary";
    case "artifact":
      return "artifact";
    default:
      return "";
  }
}

// ─── Spell slot table (single-class full caster) ─────────────────────────────

/** Standard Player's Handbook spell slots for a full caster, by class level. */
export const FULL_CASTER_SLOTS: Record<number, number[]> = {
  1: [2],
  2: [3],
  3: [4, 2],
  4: [4, 3],
  5: [4, 3, 2],
  6: [4, 3, 3],
  7: [4, 3, 3, 1],
  8: [4, 3, 3, 2],
  9: [4, 3, 3, 3, 1],
  10: [4, 3, 3, 3, 2],
  11: [4, 3, 3, 3, 2, 1],
  12: [4, 3, 3, 3, 2, 1],
  13: [4, 3, 3, 3, 2, 1, 1],
  14: [4, 3, 3, 3, 2, 1, 1],
  15: [4, 3, 3, 3, 2, 1, 1, 1],
  16: [4, 3, 3, 3, 2, 1, 1, 1],
  17: [4, 3, 3, 3, 2, 1, 1, 1, 1],
  18: [4, 3, 3, 3, 3, 1, 1, 1, 1],
  19: [4, 3, 3, 3, 3, 2, 1, 1, 1],
  20: [4, 3, 3, 3, 3, 2, 2, 1, 1],
};

/** Warlock Pact Magic: [slotCount, slotLevel] by warlock level. */
export const PACT_MAGIC_TABLE: Record<number, [number, number]> = {
  1: [1, 1], 2: [2, 1], 3: [2, 2], 4: [2, 2], 5: [2, 3], 6: [2, 3],
  7: [2, 4], 8: [2, 4], 9: [2, 5], 10: [2, 5], 11: [3, 5], 12: [3, 5],
  13: [3, 5], 14: [3, 5], 15: [3, 5], 16: [3, 5], 17: [4, 5], 18: [4, 5],
  19: [4, 5], 20: [4, 5],
};

/** Effective caster level for slot purposes given a progression multiplier. */
export function effectiveCasterLevel(
  level: number,
  progression: string,
): number {
  switch (progression) {
    case "full":
      return level;
    case "half":
      return level >= 2 ? Math.floor(level / 2) : 0;
    case "third":
      return level >= 3 ? Math.floor(level / 3) : 0;
    case "artificer":
      return Math.ceil(level / 2);
    default:
      return 0;
  }
}
