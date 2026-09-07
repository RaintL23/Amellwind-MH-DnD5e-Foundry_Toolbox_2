import type { ArmorItem, Weapon } from "@/shared/types";
import type { NamedProficiencyGrant } from "@/shared/types/proficiency.types";
import { isClothingArmor, isShieldArmor } from "@/features/raintdm/builder/data/armor.data";
import { getChooseableMusicalInstruments } from "@/shared/data/chooseable-musical-instruments";
import { resolveFixedNamedGrants } from "@/shared/utils/named-proficiency.parser";
import { normalizeWeaponProficiencyKey } from "@/shared/utils/weapon-proficiency-name.utils";
import {
  getWeaponProficiencyRule,
  resolveWeaponProficiency,
  type WeaponProficiencyTier,
} from "@/features/amellwind/weapons/data/weapon-proficiencies.data";

/** Fallback when 5etools instruments are not loaded yet (tests / early boot). */
const FALLBACK_MUSICAL_INSTRUMENT_NAMES = ["Lute", "Flute", "Drum", "Horn", "Lyre", "Viol"];

export type EffectiveWeaponTier = "simple" | "martial";

export interface WeaponProficiencyCheckResult {
  allowed: boolean;
  reason?: string;
  effectiveTier?: EffectiveWeaponTier;
}

export interface ArmorProficiencyCheckResult {
  allowed: boolean;
  reason?: string;
}

const SIMPLE_WEAPON_NAMES = new Set([
  "club",
  "dagger",
  "greatclub",
  "handaxe",
  "javelin",
  "light hammer",
  "mace",
  "quarterstaff",
  "sickle",
  "spear",
  "crossbow light",
  "light crossbow",
  "dart",
  "sling",
]);

const MARTIAL_WEAPON_NAMES = new Set([
  "battleaxe",
  "flail",
  "glaive",
  "greataxe",
  "greatsword",
  "halberd",
  "lance",
  "longsword",
  "maul",
  "morningstar",
  "pike",
  "rapier",
  "scimitar",
  "shortsword",
  "trident",
  "war pick",
  "warhammer",
  "whip",
  "blowgun",
  "crossbow hand",
  "hand crossbow",
  "handcrossbow",
  "crossbow heavy",
  "heavy crossbow",
  "heavycrossbow",
  "longbow",
  "shortbow",
  "net",
  "firearms",
  "firearm",
]);

/** PHB/XPHB martial weapons that have the Finesse and/or Light property. */
const MARTIAL_FINESSE_OR_LIGHT_WEAPON_NAMES = [
  "Rapier",
  "Scimitar",
  "Shortsword",
  "Whip",
  "Hand Crossbow",
  "Crossbow Hand",
  "Handcrossbow",
];

const ARMOR_CATEGORY_LABELS: Record<string, string> = {
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
};

function normalizeProficiencyKey(value: string): string {
  return normalizeWeaponProficiencyKey(value);
}

function proficiencyKeys(proficiencies: string[]): Set<string> {
  return new Set(proficiencies.map(normalizeProficiencyKey));
}

function hasProficiency(proficiencies: string[], ...needles: string[]): boolean {
  const keys = proficiencyKeys(proficiencies);
  return needles.some((needle) => keys.has(normalizeProficiencyKey(needle)));
}

function hasSimpleProficiency(proficiencies: string[]): boolean {
  return hasProficiency(proficiencies, "simple");
}

function hasMartialProficiency(proficiencies: string[]): boolean {
  return hasProficiency(proficiencies, "martial");
}

/**
 * XPHB Rogue (and similar) grants: "Martial weapons that have the Finesse or Light property".
 * Stored as prose after 5etools markup stripping — detect by keywords, not exact string.
 */
export function hasMartialFinesseOrLightGrant(proficiencies: string[]): boolean {
  return proficiencies.some((prof) => {
    const lower = prof.toLowerCase();
    return (
      lower.includes("martial") &&
      lower.includes("finesse") &&
      lower.includes("light")
    );
  });
}

function isMartialFinesseOrLightWeaponName(weaponName: string): boolean {
  const key = normalizeProficiencyKey(weaponName);
  return MARTIAL_FINESSE_OR_LIGHT_WEAPON_NAMES.some(
    (name) => normalizeProficiencyKey(name) === key,
  );
}

function weaponHasFinesseOrLightProperty(properties: string[]): boolean {
  return properties.some((prop) => {
    const code = String(prop).split("|")[0].trim().toUpperCase();
    return (
      code === "F" ||
      code === "L" ||
      code === "FIN" ||
      code === "FINESSE" ||
      code === "LIGHT"
    );
  });
}

function matchesMartialFinesseOrLightWeapon(
  proficiencies: string[],
  weaponName: string,
  weapon?: Pick<Weapon, "properties" | "weaponCategory" | "contentSource">,
): boolean {
  if (!hasMartialFinesseOrLightGrant(proficiencies)) return false;

  if (weapon?.contentSource === "dnd") {
    return (
      weapon.weaponCategory === "martial" &&
      weaponHasFinesseOrLightProperty(weapon.properties)
    );
  }

  return isMartialFinesseOrLightWeaponName(weaponName);
}

function hasShieldProficiency(proficiencies: string[]): boolean {
  return hasProficiency(proficiencies, "shield");
}

function musicalInstrumentNameKeys(): Set<string> {
  const names = getChooseableMusicalInstruments();
  const list = names.length > 0 ? names : FALLBACK_MUSICAL_INSTRUMENT_NAMES;
  return new Set(list.map((name) => normalizeProficiencyKey(name)));
}

/** True for category labels ("Musical Instruments") or a specific instrument (Lute, Horn, …). */
export function isMusicalInstrumentProficiency(value: string): boolean {
  const key = normalizeProficiencyKey(value);
  if (key.includes("musical instrument")) return true;
  return musicalInstrumentNameKeys().has(key);
}

/**
 * Tool items that can unlock Musical Instrument–compatible MH weapons (Hunting Horn).
 * Includes pending Bard-style "N musical instruments" grants before the picker is filled.
 */
export function resolveToolProficienciesForWeaponGate(
  resolvedToolItems: string[],
  toolGrants: NamedProficiencyGrant[] = [],
): string[] {
  const tools = [...resolvedToolItems];
  if (tools.some(isMusicalInstrumentProficiency)) return tools;

  const hasMusicalGrant = toolGrants.some((grant) => {
    if (grant.kind === "any") {
      return /musical\s+instrument/i.test(grant.label);
    }
    if (grant.kind === "fixed") {
      return grant.items.some(isMusicalInstrumentProficiency);
    }
    if (grant.kind === "choose") {
      return grant.from.some(isMusicalInstrumentProficiency);
    }
    return false;
  });

  if (hasMusicalGrant) tools.push("Musical Instrument");
  return tools;
}

function matchesCompatibleWeapon(
  weaponProficiencies: string[],
  compatibleWeapon: string,
  toolProficiencies: string[] = [],
): boolean {
  const compatibleKey = normalizeProficiencyKey(compatibleWeapon);

  if (compatibleKey === "musical instrument") {
    return [...weaponProficiencies, ...toolProficiencies].some(
      isMusicalInstrumentProficiency,
    );
  }

  if (compatibleKey === "thrown weapons") {
    return weaponProficiencies.some((prof) =>
      normalizeProficiencyKey(prof).includes("thrown"),
    );
  }

  if (hasProficiency(weaponProficiencies, compatibleWeapon)) {
    return true;
  }

  if (
    hasMartialFinesseOrLightGrant(weaponProficiencies) &&
    isMartialFinesseOrLightWeaponName(compatibleWeapon)
  ) {
    return true;
  }

  if (hasMartialProficiency(weaponProficiencies) && MARTIAL_WEAPON_NAMES.has(compatibleKey)) {
    return true;
  }

  if (hasSimpleProficiency(weaponProficiencies) && SIMPLE_WEAPON_NAMES.has(compatibleKey)) {
    return true;
  }

  return false;
}

function hasCompatibleWeaponProficiency(
  weaponProficiencies: string[],
  compatible: string[],
  toolProficiencies: string[] = [],
): boolean {
  return compatible.some((weapon) =>
    matchesCompatibleWeapon(weaponProficiencies, weapon, toolProficiencies),
  );
}

function resolveEffectiveTier(
  proficiencies: string[],
  ruleTier: WeaponProficiencyTier,
): EffectiveWeaponTier | undefined {
  const hasSimple = hasSimpleProficiency(proficiencies);
  const hasMartial = hasMartialProficiency(proficiencies);

  if (ruleTier === "simple") return "simple";
  if (ruleTier === "martial") return "martial";

  if (hasSimple && !hasMartial) return "simple";
  if (hasMartial) return "martial";
  if (hasSimple) return "simple";

  return undefined;
}

function formatCompatibleList(compatible: string[]): string {
  return compatible.join(", ");
}

function buildWeaponDeniedReason(
  rule: NonNullable<ReturnType<typeof getWeaponProficiencyRule>>,
): string {
  const compatible = formatCompatibleList(rule.compatible);
  if (rule.requiresShield) {
    return `Requires Shield proficiency and proficiency in one of: ${compatible}.`;
  }
  if (rule.tier === "martial-or-simple") {
    return `Requires Simple or Martial weapon proficiency (counts as Simple when your class only grants Simple).`;
  }
  if (rule.tier === "simple") {
    return `Requires Simple weapon proficiency or proficiency in one of: ${compatible}.`;
  }
  return `Requires Martial weapon proficiency or proficiency in one of: ${compatible}.`;
}

export function resolveProficiencyItems(
  grants: NamedProficiencyGrant[],
): string[] {
  return [...new Set(resolveFixedNamedGrants(grants).map((entry) => entry.item))];
}

function checkDndWeaponCategoryProficiency(
  weapon: Weapon,
  weaponProficiencies: string[],
): WeaponProficiencyCheckResult {
  const category = weapon.weaponCategory;
  if (!category) return { allowed: true };

  if (hasProficiency(weaponProficiencies, weapon.name)) {
    return { allowed: true, effectiveTier: category };
  }

  if (category === "simple" && hasSimpleProficiency(weaponProficiencies)) {
    return { allowed: true, effectiveTier: "simple" };
  }

  if (category === "martial" && hasMartialProficiency(weaponProficiencies)) {
    return { allowed: true, effectiveTier: "martial" };
  }

  if (
    category === "martial" &&
    matchesMartialFinesseOrLightWeapon(weaponProficiencies, weapon.name, weapon)
  ) {
    return { allowed: true, effectiveTier: "martial" };
  }

  const label = category === "simple" ? "Simple" : "Martial";
  return {
    allowed: false,
    reason: `Requires ${label} weapon proficiency to use ${weapon.name}.`,
  };
}

function checkPhbCategoryWeaponProficiency(
  weaponName: string,
  category: "simple" | "martial",
  weaponProficiencies: string[],
): WeaponProficiencyCheckResult {
  if (hasProficiency(weaponProficiencies, weaponName)) {
    return { allowed: true, effectiveTier: category };
  }

  if (category === "simple") {
    if (hasSimpleProficiency(weaponProficiencies)) {
      return { allowed: true, effectiveTier: "simple" };
    }
    return {
      allowed: false,
      reason: `Requires Simple weapon proficiency to use ${weaponName}.`,
    };
  }

  if (hasMartialProficiency(weaponProficiencies)) {
    return { allowed: true, effectiveTier: "martial" };
  }

  if (matchesMartialFinesseOrLightWeapon(weaponProficiencies, weaponName)) {
    return { allowed: true, effectiveTier: "martial" };
  }

  return {
    allowed: false,
    reason: `Requires Martial weapon proficiency to use ${weaponName}.`,
  };
}

export function checkPhbWeaponNameProficiency(
  weaponName: string,
  category: "simple" | "martial",
  weaponProficiencies: string[],
): WeaponProficiencyCheckResult {
  return checkPhbCategoryWeaponProficiency(
    weaponName,
    category,
    weaponProficiencies,
  );
}

export function checkWeaponProficiency(
  weaponName: string,
  weaponProficiencies: string[],
  armorProficiencies: string[],
  weapon?: Weapon,
  toolProficiencies: string[] = [],
): WeaponProficiencyCheckResult {
  if (weapon?.contentSource === "dnd") {
    return checkDndWeaponCategoryProficiency(weapon, weaponProficiencies);
  }

  const rule = weapon
    ? resolveWeaponProficiency(weapon)
    : getWeaponProficiencyRule(weaponName);
  if (!rule) return { allowed: true };

  if (rule.requiresShield && !hasShieldProficiency(armorProficiencies)) {
    return {
      allowed: false,
      reason: `Requires Shield proficiency to use ${weaponName}.`,
    };
  }

  const hasCompatible = hasCompatibleWeaponProficiency(
    weaponProficiencies,
    rule.compatible,
    toolProficiencies,
  );
  const hasSimple = hasSimpleProficiency(weaponProficiencies);
  const hasMartial = hasMartialProficiency(weaponProficiencies);

  if (rule.tier === "martial-or-simple") {
    if (hasCompatible || hasSimple || hasMartial) {
      return {
        allowed: true,
        effectiveTier: resolveEffectiveTier(weaponProficiencies, rule.tier),
      };
    }
    return { allowed: false, reason: buildWeaponDeniedReason(rule) };
  }

  if (rule.tier === "simple") {
    if (hasCompatible || hasSimple) {
      return { allowed: true, effectiveTier: "simple" };
    }
    return { allowed: false, reason: buildWeaponDeniedReason(rule) };
  }

  if (hasCompatible || hasMartial) {
    return { allowed: true, effectiveTier: "martial" };
  }

  // Direct property match for forge / MH weapons (grant + martial tier + Finesse/Light).
  // Compatible-name chain above already covers Dual Repeaters via Hand Crossbow.
  if (
    hasMartialFinesseOrLightGrant(weaponProficiencies) &&
    weapon &&
    weaponHasFinesseOrLightProperty(weapon.properties)
  ) {
    return { allowed: true, effectiveTier: "martial" };
  }

  return { allowed: false, reason: buildWeaponDeniedReason(rule) };
}

export function checkArmorProficiency(
  armor: ArmorItem,
  armorProficiencies: string[],
): ArmorProficiencyCheckResult {
  if (isClothingArmor(armor)) {
    return { allowed: true };
  }

  if (isShieldArmor(armor)) {
    if (hasShieldProficiency(armorProficiencies)) {
      return { allowed: true };
    }

    if (!armorProficiencies.length) {
      return {
        allowed: false,
        reason: "Your class does not grant Shield proficiency.",
      };
    }

    return {
      allowed: false,
      reason: "Requires Shield proficiency.",
    };
  }

  const requiredCategory = ARMOR_CATEGORY_LABELS[armor.category];
  if (!requiredCategory) {
    return { allowed: true };
  }

  if (hasProficiency(armorProficiencies, requiredCategory)) {
    return { allowed: true };
  }

  if (!armorProficiencies.length) {
    return {
      allowed: false,
      reason: `Your class does not grant ${requiredCategory} armor proficiency.`,
    };
  }

  return {
    allowed: false,
    reason: `Requires ${requiredCategory} armor proficiency.`,
  };
}

export function getClassEquipmentConflictReason(
  mainHandName: string | null,
  offHandName: string | null,
  equippedArmor: ArmorItem | null,
  classArmorGrants: NamedProficiencyGrant[],
  classWeaponGrants: NamedProficiencyGrant[],
  classToolGrants: NamedProficiencyGrant[] = [],
): string | null {
  const armorProficiencies = resolveProficiencyItems(classArmorGrants);
  const weaponProficiencies = resolveProficiencyItems(classWeaponGrants);
  const toolProficiencies = resolveToolProficienciesForWeaponGate(
    resolveProficiencyItems(classToolGrants),
    classToolGrants,
  );
  const conflicts: string[] = [];

  if (equippedArmor && !isClothingArmor(equippedArmor)) {
    const armorCheck = checkArmorProficiency(equippedArmor, armorProficiencies);
    if (!armorCheck.allowed && armorCheck.reason) {
      conflicts.push(`${equippedArmor.name}: ${armorCheck.reason}`);
    }
  }

  for (const weaponName of [mainHandName, offHandName]) {
    if (!weaponName) continue;
    const weaponCheck = checkWeaponProficiency(
      weaponName,
      weaponProficiencies,
      armorProficiencies,
      undefined,
      toolProficiencies,
    );
    if (!weaponCheck.allowed && weaponCheck.reason) {
      conflicts.push(`${weaponName}: ${weaponCheck.reason}`);
    }
  }

  if (!conflicts.length) return null;
  return `Incompatible with your equipped gear — ${conflicts.join(" ")}`;
}

export function getWeaponEffectiveTierLabel(
  weaponName: string,
  weaponProficiencies: string[],
  weapon?: Weapon,
  toolProficiencies: string[] = [],
): string | null {
  const rule = weapon
    ? resolveWeaponProficiency(weapon)
    : getWeaponProficiencyRule(weaponName);
  if (!rule || rule.tier !== "martial-or-simple") return null;

  const check = checkWeaponProficiency(
    weaponName,
    weaponProficiencies,
    [],
    weapon,
    toolProficiencies,
  );
  if (!check.allowed || check.effectiveTier !== "simple") return null;

  return "Simple mode";
}
