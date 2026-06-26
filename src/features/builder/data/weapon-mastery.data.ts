import type { FeatureChoiceOption } from "@/shared/types";
import { parseFiveToolsMarkup } from "@/shared/utils/fivetools-parser";
import { checkPhbWeaponNameProficiency } from "../utils/equipment-proficiency.utils";

/** Weapon Mastery property names (D&D 2024). */
export type WeaponMasteryProperty =
  | "Cleave"
  | "Graze"
  | "Nick"
  | "Push"
  | "Sap"
  | "Slow"
  | "Topple"
  | "Vex";

export type WeaponMasteryCategory = "simple" | "martial";
export type WeaponMasteryRange = "melee" | "ranged";

export interface WeaponMasteryWeaponEntry {
  id: string;
  name: string;
  mastery: WeaponMasteryProperty;
  category: WeaponMasteryCategory;
  range: WeaponMasteryRange;
}

export interface WeaponMasteryGroup {
  mastery: WeaponMasteryProperty;
  description: string;
  weapons: Array<{
    id: string;
    name: string;
    category: WeaponMasteryCategory;
    range: WeaponMasteryRange;
  }>;
}

/** Display order for mastery groups in the library panel. */
export const WEAPON_MASTERY_PROPERTY_ORDER: WeaponMasteryProperty[] = [
  "Cleave",
  "Graze",
  "Nick",
  "Push",
  "Sap",
  "Slow",
  "Topple",
  "Vex",
];

/** XPHB p.214 — weapon mastery property descriptions. */
const WEAPON_MASTERY_DESCRIPTIONS_RAW: Record<WeaponMasteryProperty, string> =
  {
    Cleave:
      "If you hit a creature with a melee attack roll using this weapon, you can make a melee attack roll with the weapon against a second creature within 5 feet of the first that is also within your reach. On a hit, the second creature takes the weapon's damage, but don't add your ability modifier to that damage unless that modifier is negative. You can make this extra attack only once per turn.",
    Graze:
      "If your attack roll with this weapon misses a creature, you can deal damage to that creature equal to the ability modifier you used to make the attack roll. This damage is the same type dealt by the weapon, and the damage can be increased only by increasing the ability modifier.",
    Nick: "When you make the extra attack of the Light property, you can make it as part of the Attack action instead of as a Bonus Action. You can make this extra attack only once per turn.",
    Push:
      "If you hit a creature with this weapon, you can push the creature up to 10 feet straight away from yourself if it is Large or smaller.",
    Sap: "If you hit a creature with this weapon, that creature has Disadvantage on its next attack roll before the start of your next turn.",
    Slow:
      "If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. If the creature is hit more than once by weapons that have this property, the Speed reduction doesn't exceed 10 feet.",
    Topple:
      "If you hit a creature with this weapon, you can force the creature to make a Constitution saving throw (DC 8 plus the ability modifier used to make the attack roll and your Proficiency Bonus). On a failed save, the creature has the Prone condition.",
    Vex: "If you hit a creature with this weapon and deal damage to the creature, you have Advantage on your next attack roll against that creature before the end of your next turn.",
  };

export const WEAPON_MASTERY_DESCRIPTIONS: Record<
  WeaponMasteryProperty,
  string
> = Object.fromEntries(
  Object.entries(WEAPON_MASTERY_DESCRIPTIONS_RAW).map(([key, value]) => [
    key,
    parseFiveToolsMarkup(value),
  ]),
) as Record<WeaponMasteryProperty, string>;

const WEAPON_MASTERY_WEAPONS: WeaponMasteryWeaponEntry[] = [
  // Simple
  { id: "wm-club", name: "Club", mastery: "Slow", category: "simple", range: "melee" },
  { id: "wm-dagger", name: "Dagger", mastery: "Nick", category: "simple", range: "melee" },
  { id: "wm-dart", name: "Dart", mastery: "Vex", category: "simple", range: "ranged" },
  { id: "wm-greatclub", name: "Greatclub", mastery: "Push", category: "simple", range: "melee" },
  { id: "wm-handaxe", name: "Handaxe", mastery: "Vex", category: "simple", range: "melee" },
  { id: "wm-javelin", name: "Javelin", mastery: "Slow", category: "simple", range: "melee" },
  { id: "wm-light-crossbow", name: "Light Crossbow", mastery: "Slow", category: "simple", range: "ranged" },
  { id: "wm-light-hammer", name: "Light Hammer", mastery: "Nick", category: "simple", range: "melee" },
  { id: "wm-mace", name: "Mace", mastery: "Sap", category: "simple", range: "melee" },
  { id: "wm-quarterstaff", name: "Quarterstaff", mastery: "Topple", category: "simple", range: "melee" },
  { id: "wm-shortbow", name: "Shortbow", mastery: "Vex", category: "simple", range: "ranged" },
  { id: "wm-sickle", name: "Sickle", mastery: "Nick", category: "simple", range: "melee" },
  { id: "wm-sling", name: "Sling", mastery: "Slow", category: "simple", range: "ranged" },
  { id: "wm-spear", name: "Spear", mastery: "Sap", category: "simple", range: "melee" },
  { id: "wm-wooden-staff", name: "Wooden Staff", mastery: "Topple", category: "simple", range: "melee" },
  // Martial
  { id: "wm-battleaxe", name: "Battleaxe", mastery: "Topple", category: "martial", range: "melee" },
  { id: "wm-blowgun", name: "Blowgun", mastery: "Vex", category: "martial", range: "ranged" },
  { id: "wm-flail", name: "Flail", mastery: "Sap", category: "martial", range: "melee" },
  { id: "wm-glaive", name: "Glaive", mastery: "Graze", category: "martial", range: "melee" },
  { id: "wm-greataxe", name: "Greataxe", mastery: "Cleave", category: "martial", range: "melee" },
  { id: "wm-greatsword", name: "Greatsword", mastery: "Graze", category: "martial", range: "melee" },
  { id: "wm-halberd", name: "Halberd", mastery: "Cleave", category: "martial", range: "melee" },
  { id: "wm-hand-crossbow", name: "Hand Crossbow", mastery: "Vex", category: "martial", range: "ranged" },
  { id: "wm-heavy-crossbow", name: "Heavy Crossbow", mastery: "Push", category: "martial", range: "ranged" },
  { id: "wm-lance", name: "Lance", mastery: "Topple", category: "martial", range: "melee" },
  { id: "wm-longbow", name: "Longbow", mastery: "Slow", category: "martial", range: "ranged" },
  { id: "wm-longsword", name: "Longsword", mastery: "Sap", category: "martial", range: "melee" },
  { id: "wm-maul", name: "Maul", mastery: "Topple", category: "martial", range: "melee" },
  { id: "wm-morningstar", name: "Morningstar", mastery: "Sap", category: "martial", range: "melee" },
  { id: "wm-pike", name: "Pike", mastery: "Push", category: "martial", range: "melee" },
  { id: "wm-rapier", name: "Rapier", mastery: "Vex", category: "martial", range: "melee" },
  { id: "wm-scimitar", name: "Scimitar", mastery: "Nick", category: "martial", range: "melee" },
  { id: "wm-shortsword", name: "Shortsword", mastery: "Vex", category: "martial", range: "melee" },
  { id: "wm-trident", name: "Trident", mastery: "Topple", category: "martial", range: "melee" },
  { id: "wm-war-pick", name: "War Pick", mastery: "Sap", category: "martial", range: "melee" },
  { id: "wm-warhammer", name: "Warhammer", mastery: "Push", category: "martial", range: "melee" },
  { id: "wm-whip", name: "Whip", mastery: "Slow", category: "martial", range: "melee" },
];

const WEAPON_MASTERY_WEAPON_BY_ID = new Map(
  WEAPON_MASTERY_WEAPONS.map((weapon) => [weapon.id, weapon]),
);

/** Flat options for progression state and PDF export (one pick = one weapon). */
export const WEAPON_MASTERY_OPTIONS: FeatureChoiceOption[] =
  WEAPON_MASTERY_WEAPONS.map((weapon) => ({
    id: weapon.id,
    name: weapon.name,
    source: "XPHB",
    entries: [`Mastery: ${weapon.mastery}`],
  }));

/** Weapons grouped by mastery property for the library UI. */
export const WEAPON_MASTERY_GROUPS: WeaponMasteryGroup[] =
  WEAPON_MASTERY_PROPERTY_ORDER.map((mastery) => ({
    mastery,
    description: WEAPON_MASTERY_DESCRIPTIONS[mastery],
    weapons: WEAPON_MASTERY_WEAPONS.filter((w) => w.mastery === mastery).map(
      ({ id, name, category, range }) => ({ id, name, category, range }),
    ),
  })).filter((group) => group.weapons.length > 0);

export function getWeaponMasteryWeapon(
  weaponId: string,
): WeaponMasteryWeaponEntry | undefined {
  return WEAPON_MASTERY_WEAPON_BY_ID.get(weaponId);
}

export function getWeaponMasteryProperty(
  weaponId: string,
): WeaponMasteryProperty | undefined {
  return WEAPON_MASTERY_WEAPON_BY_ID.get(weaponId)?.mastery;
}

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

/** True when the class Weapon Mastery feature text limits picks to melee weapons. */
export function isMeleeOnlyWeaponMasteryClass(
  classFeatureDescriptions: string[],
): boolean {
  const text = classFeatureDescriptions.join(" ").toLowerCase();
  return (
    /weapon mastery|mastery properties/.test(text) &&
    /melee weapons?/.test(text) &&
    !/type=simple weapon;martial weapon/.test(text)
  );
}
