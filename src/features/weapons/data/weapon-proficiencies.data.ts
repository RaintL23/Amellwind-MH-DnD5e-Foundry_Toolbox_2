/**
 * D&D weapon proficiencies compatible with each Monster Hunter weapon.
 * Source: AGMH "Weapon Proficiencies" table (Player's Guide).
 */
export type WeaponProficiencyTier = "martial" | "simple" | "martial-or-simple";
export type WeaponProficiencyRange = "melee" | "ranged";

export interface WeaponProficiencyRule {
  /** Any one of these PHB proficiencies grants MH weapon proficiency. */
  compatible: string[];
  /** Also requires shield proficiency (integrated shield weapons). */
  requiresShield?: boolean;
  /** Martial / Simple classification from the Player's Guide table. */
  tier: WeaponProficiencyTier;
  /** Melee vs ranged classification from the Player's Guide table. */
  range: WeaponProficiencyRange;
}

export const WEAPON_PROFICIENCIES: Record<string, WeaponProficiencyRule> = {
  "Accel Axe": { compatible: ["Battleaxe", "Greataxe"], tier: "martial", range: "melee" },
  "Charge Blade": {
    compatible: ["Greataxe", "Shortsword", "Longsword", "Scimitar"],
    requiresShield: true,
    tier: "martial",
    range: "melee",
  },
  "Dual Blades": {
    compatible: ["Longsword", "Scimitar", "Shortsword"],
    tier: "martial",
    range: "melee",
  },
  "Great Sword": { compatible: ["Greatsword"], tier: "martial", range: "melee" },
  Gunlance: {
    compatible: ["Lance", "Halberd"],
    requiresShield: true,
    tier: "martial",
    range: "melee",
  },
  Hammer: { compatible: ["Warhammer", "Maul"], tier: "martial", range: "melee" },
  "Hunting Horn": {
    compatible: ["Musical Instrument", "Maul", "Warhammer"],
    tier: "martial",
    range: "melee",
  },
  "Insect Glaive": {
    compatible: ["Halberd", "Glaive", "Trident", "Javelin", "Spear"],
    tier: "martial-or-simple",
    range: "melee",
  },
  Lance: {
    compatible: ["Lance", "Halberd"],
    requiresShield: true,
    tier: "martial",
    range: "melee",
  },
  Longsword: { compatible: ["Greatsword", "Longsword"], tier: "martial", range: "melee" },
  "Magnet Spike": { compatible: ["Greatsword", "Maul"], tier: "martial", range: "melee" },
  "Magus Staff": { compatible: ["Quarterstaff"], tier: "simple", range: "melee" },
  "Splint Rapier": {
    compatible: ["Longsword", "Rapier", "Shortsword"],
    tier: "martial",
    range: "melee",
  },
  "Switch Axe": { compatible: ["Greataxe", "Greatsword"], tier: "martial", range: "melee" },
  "Sword and Shield": {
    compatible: ["Shortsword", "Longsword", "Scimitar", "Light Hammer", "Mace"],
    requiresShield: true,
    tier: "martial-or-simple",
    range: "melee",
  },
  Tonfas: {
    compatible: ["Club", "Flail", "Handaxe", "Light Hammer", "Mace", "Quarterstaff", "Warhammer"],
    tier: "martial-or-simple",
    range: "melee",
  },
  "Wyvern Boomerang": {
    compatible: ["Greatsword", "Thrown weapons"],
    tier: "martial-or-simple",
    range: "melee",
  },
  Bow: { compatible: ["Shortbow", "Longbow"], tier: "martial-or-simple", range: "ranged" },
  "Dual Repeaters": {
    compatible: ["Firearms", "Hand Crossbow"],
    tier: "martial",
    range: "ranged",
  },
  "Heavy Bowgun": { compatible: ["Heavy Crossbow"], tier: "martial", range: "ranged" },
  "Light Bowgun": { compatible: ["Light Crossbow"], tier: "simple", range: "ranged" },
};

export function getWeaponProficiencyRule(weaponName: string): WeaponProficiencyRule | undefined {
  return WEAPON_PROFICIENCIES[weaponName];
}

const TIER_LABELS: Record<WeaponProficiencyTier, string> = {
  martial: "Martial",
  simple: "Simple",
  "martial-or-simple": "Martial or Simple",
};

const RANGE_LABELS: Record<WeaponProficiencyRange, string> = {
  melee: "Melee",
  ranged: "Ranged",
};

/** Category label as shown in the Player's Guide table (e.g. "Martial Melee Weapon"). */
export function formatWeaponCategory(rule: WeaponProficiencyRule): string {
  return `${TIER_LABELS[rule.tier]} ${RANGE_LABELS[rule.range]} Weapon`;
}

/** Short badges for cards and compact layouts. */
export function getWeaponCategoryBadges(rule: WeaponProficiencyRule): string[] {
  if (rule.tier === "martial-or-simple") {
    return [RANGE_LABELS[rule.range], "Martial/Simple"];
  }
  return [RANGE_LABELS[rule.range], TIER_LABELS[rule.tier]];
}

/** Compact hint for cards; full list is available via the native title tooltip. */
export function formatWeaponProficiencyHint(rule: WeaponProficiencyRule): string {
  const weapons = rule.compatible.join(", ");
  if (rule.requiresShield) {
    return `Shield + ${weapons}`;
  }
  return weapons;
}

/** Full sentence for dialog and library detail panels. */
export function formatWeaponProficiencyDescription(rule: WeaponProficiencyRule): string {
  const weapons = rule.compatible.join(", ");
  if (rule.requiresShield) {
    return `Requires Shield proficiency and proficiency in one of: ${weapons}.`;
  }
  return `Requires proficiency in one of: ${weapons}.`;
}
