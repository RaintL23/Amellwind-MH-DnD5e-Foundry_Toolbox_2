import type { WeaponMasteryWeaponEntry } from "@/shared/data/weapon-mastery.data";
import { checkPhbWeaponNameProficiency } from "./equipment-proficiency.utils";

export interface WeaponMasteryAvailabilityOptions {
  /** Barbarian and similar features restrict picks to melee weapons. */
  meleeOnly?: boolean;
}

export function getWeaponMasteryAvailability(
  weapon: Pick<WeaponMasteryWeaponEntry, "name" | "category" | "range">,
  weaponProficiencies: string[],
  options: WeaponMasteryAvailabilityOptions = {},
): { allowed: boolean; reason?: string } {
  const proficiency = checkPhbWeaponNameProficiency(
    weapon.name,
    weapon.category,
    weaponProficiencies,
  );
  if (!proficiency.allowed) {
    return {
      allowed: false,
      reason: proficiency.reason ?? "Not proficient with this weapon.",
    };
  }

  if (options.meleeOnly && weapon.range === "ranged") {
    return {
      allowed: false,
      reason: "Your class only allows melee weapons for Weapon Mastery.",
    };
  }

  return { allowed: true };
}
