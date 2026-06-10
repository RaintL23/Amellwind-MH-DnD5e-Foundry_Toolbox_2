import type { ArmorItem } from "@/shared/types";
import type { NamedProficiencyGrant } from "@/shared/types/proficiency.types";
import { isClothingArmor } from "@/features/builder/data/armor.placeholder";
import { resolveFixedNamedGrants } from "@/shared/utils/named-proficiency.parser";
import {
  getWeaponProficiencyRule,
  type WeaponProficiencyTier,
} from "@/features/weapons/data/weapon-proficiencies.data";

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
  "crossbow heavy",
  "heavy crossbow",
  "longbow",
  "shortbow",
  "net",
  "firearms",
]);

const ARMOR_CATEGORY_LABELS: Record<string, string> = {
  light: "Light",
  medium: "Medium",
  heavy: "Heavy",
};

function normalizeProficiencyKey(value: string): string {
  return value
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/s$/, "");
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

function hasShieldProficiency(proficiencies: string[]): boolean {
  return hasProficiency(proficiencies, "shield");
}

function isMusicalInstrumentProficiency(value: string): boolean {
  const key = normalizeProficiencyKey(value);
  return key.includes("musical instrument");
}

function matchesCompatibleWeapon(
  proficiencies: string[],
  compatibleWeapon: string,
): boolean {
  const compatibleKey = normalizeProficiencyKey(compatibleWeapon);

  if (compatibleKey === "musical instrument") {
    return proficiencies.some(isMusicalInstrumentProficiency);
  }

  if (compatibleKey === "thrown weapons") {
    return proficiencies.some((prof) =>
      normalizeProficiencyKey(prof).includes("thrown"),
    );
  }

  if (hasProficiency(proficiencies, compatibleWeapon)) {
    return true;
  }

  if (hasMartialProficiency(proficiencies) && MARTIAL_WEAPON_NAMES.has(compatibleKey)) {
    return true;
  }

  if (hasSimpleProficiency(proficiencies) && SIMPLE_WEAPON_NAMES.has(compatibleKey)) {
    return true;
  }

  return false;
}

function hasCompatibleWeaponProficiency(
  proficiencies: string[],
  compatible: string[],
): boolean {
  return compatible.some((weapon) => matchesCompatibleWeapon(proficiencies, weapon));
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

export function checkWeaponProficiency(
  weaponName: string,
  weaponProficiencies: string[],
  armorProficiencies: string[],
): WeaponProficiencyCheckResult {
  const rule = getWeaponProficiencyRule(weaponName);
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

  return { allowed: false, reason: buildWeaponDeniedReason(rule) };
}

export function checkArmorProficiency(
  armor: ArmorItem,
  armorProficiencies: string[],
): ArmorProficiencyCheckResult {
  if (isClothingArmor(armor)) {
    return { allowed: true };
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
): string | null {
  const armorProficiencies = resolveProficiencyItems(classArmorGrants);
  const weaponProficiencies = resolveProficiencyItems(classWeaponGrants);
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
): string | null {
  const rule = getWeaponProficiencyRule(weaponName);
  if (!rule || rule.tier !== "martial-or-simple") return null;

  const check = checkWeaponProficiency(
    weaponName,
    weaponProficiencies,
    [],
  );
  if (!check.allowed || check.effectiveTier !== "simple") return null;

  return "Simple mode";
}
