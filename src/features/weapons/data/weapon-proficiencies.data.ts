/**
 * D&D weapon proficiencies compatible with each Monster Hunter weapon.
 * Source: AGMH "Weapon Proficiencies" table (Player's Guide).
 */
export interface WeaponProficiencyRule {
  /** Any one of these PHB proficiencies grants MH weapon proficiency. */
  compatible: string[];
  /** Also requires shield proficiency (integrated shield weapons). */
  requiresShield?: boolean;
}

export const WEAPON_PROFICIENCIES: Record<string, WeaponProficiencyRule> = {
  "Accel Axe": { compatible: ["Battleaxe", "Greataxe"] },
  "Charge Blade": {
    compatible: ["Greataxe", "Shortsword", "Longsword", "Scimitar"],
    requiresShield: true,
  },
  "Dual Blades": { compatible: ["Longsword", "Scimitar", "Shortsword"] },
  "Great Sword": { compatible: ["Greatsword"] },
  Gunlance: { compatible: ["Lance", "Halberd"], requiresShield: true },
  Hammer: { compatible: ["Warhammer", "Maul"] },
  "Hunting Horn": { compatible: ["Musical Instrument", "Maul", "Warhammer"] },
  "Insect Glaive": { compatible: ["Halberd", "Glaive", "Trident", "Javelin", "Spear"] },
  Lance: { compatible: ["Lance", "Halberd"], requiresShield: true },
  Longsword: { compatible: ["Greatsword", "Longsword"] },
  "Magnet Spike": { compatible: ["Greatsword", "Maul"] },
  "Magus Staff": { compatible: ["Quarterstaff"] },
  "Splint Rapier": { compatible: ["Longsword", "Rapier", "Shortsword"] },
  "Switch Axe": { compatible: ["Greataxe", "Greatsword"] },
  "Sword and Shield": {
    compatible: ["Shortsword", "Longsword", "Scimitar", "Light Hammer", "Mace"],
    requiresShield: true,
  },
  Tonfas: {
    compatible: ["Club", "Flail", "Handaxe", "Light Hammer", "Mace", "Quarterstaff", "Warhammer"],
  },
  "Wyvern Boomerang": { compatible: ["Greatsword", "Thrown weapons"] },
  Bow: { compatible: ["Shortbow", "Longbow"] },
  "Dual Repeaters": { compatible: ["Firearms", "Hand Crossbow"] },
  "Heavy Bowgun": { compatible: ["Heavy Crossbow"] },
  "Light Bowgun": { compatible: ["Light Crossbow"] },
};

export function getWeaponProficiencyRule(weaponName: string): WeaponProficiencyRule | undefined {
  return WEAPON_PROFICIENCIES[weaponName];
}

/** Compact hint for cards; full list is available via the native title tooltip. */
export function formatWeaponProficiencyHint(rule: WeaponProficiencyRule): string {
  const weapons = rule.compatible.join(", ");
  if (rule.requiresShield) {
    return `Shield + ${weapons}`;
  }
  return weapons;
}
