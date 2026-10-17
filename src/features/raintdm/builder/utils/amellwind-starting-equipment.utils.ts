/**
 * AGMH starting equipment: Monster Hunter weapons replace every starting
 * weapon a character gets from class/background equipment, and standalone
 * shields do not exist (only weapons with an integrated shield).
 */
import type {
  StartingEquipmentGroup,
  StartingEquipmentItem,
  StartingEquipmentOffers,
} from "@/shared/types";
import { isStandaloneShieldName } from "../data/shield.data";
import { isDndWeaponName } from "./equipment-proficiency.utils";

/** "Handaxe (×4)" / "2 × Martial weapon" → base item name. */
function baseItemName(name: string): string {
  return name
    .replace(/\s*\(×\d+\)\s*$/, "")
    .replace(/^\d+\s*×\s*/, "")
    .trim();
}

export function isReplacedByMonsterHunterWeapon(
  item: StartingEquipmentItem,
): boolean {
  const name = baseItemName(item.name);
  if (isStandaloneShieldName(name)) return true;
  if (/^(simple|martial) weapon$/i.test(name)) return true;
  return isDndWeaponName(name);
}

function optionGroupLabel(keys: string[]): string | undefined {
  if (keys.length > 1) {
    return `Choose an option (${keys.map((key) => key.toUpperCase()).join(", ")})`;
  }
  return keys.length === 1 ? `Option ${keys[0].toUpperCase()}` : undefined;
}

function stripGroup(group: StartingEquipmentGroup): StartingEquipmentGroup | null {
  const keep = (items: StartingEquipmentItem[]) =>
    items.filter((item) => !isReplacedByMonsterHunterWeapon(item));

  const guaranteed = keep(group.guaranteed ?? []);
  const options = (group.options ?? [])
    .map((option) => ({ ...option, items: keep(option.items) }))
    .filter((option) => option.items.length > 0);

  if (guaranteed.length === 0 && options.length === 0) return null;
  // A choice left with a single package is no longer a choice.
  if (options.length === 1 && (group.options?.length ?? 0) > 1) {
    return {
      id: group.id,
      guaranteed: [...guaranteed, ...options[0].items],
    };
  }
  return {
    id: group.id,
    label: options.length
      ? optionGroupLabel(options.map((option) => option.key))
      : undefined,
    guaranteed: guaranteed.length ? guaranteed : undefined,
    options: options.length ? options : undefined,
  };
}

/** Class/background offers as used by the Builder in the current mode. */
export function resolveStartingEquipmentOffers(
  offers: StartingEquipmentOffers | undefined,
  useAmellwindHomebrew: boolean,
): StartingEquipmentOffers {
  if (!offers) return { groups: [] };
  if (!useAmellwindHomebrew) return offers;
  return {
    ...offers,
    groups: offers.groups
      .map(stripGroup)
      .filter((group): group is StartingEquipmentGroup => group !== null),
  };
}

export const AMELLWIND_STARTING_WEAPON_NOTE =
  "Amellwind: starting weapons and shields are replaced by Monster Hunter weapons (level 1–2: one common MH weapon) and you start with two trinkets.";
