import type { FoundryItem } from "@/shared/foundry";
import { defaultMidiProperties, foundryId, ensureActivityMidiProperties } from "@/shared/foundry";
import {
  hasWeaponSwitchModes,
  resolveGripModeDamage,
  resolveWeaponModeDefs,
  type WeaponGripMode,
} from "@/features/amellwind/weapons/utils/weapon-mode.utils";
import type { CustomWeapon } from "../types/weapon-forge.types";
import {
  buildAttackActivityBase,
  damageFieldFromFormula,
  emptyDamageField,
  isRangedWeapon,
  slugifyIdentifier,
} from "./weapon-forge-foundry.helpers";

export function applySwitchModeActivities(
  item: FoundryItem,
  weapon: CustomWeapon,
  magical: boolean,
): void {
  if (!hasWeaponSwitchModes(weapon)) return;

  const defs = resolveWeaponModeDefs(weapon);
  if (!defs || defs.length < 2) return;

  const modes: WeaponGripMode[] = defs.map((def, index) => {
    const damageKey: "dmg1" | "dmg2" | undefined =
      index === 0 ? "dmg1" : index === 1 ? "dmg2" : undefined;
    return {
      label: def.label,
      damage: def.damage.trim() || weapon.dmg1,
      damageKey,
      dmgType: def.dmgType?.trim() || weapon.dmgType,
      hasShield: def.hasShield === true,
      isTwoHanded: def.isTwoHanded === true,
      blocksOffHand: def.blocksOffHand === true,
    };
  });

  const system = item.system as Record<string, unknown>;
  const ranged = isRangedWeapon(weapon);
  const primary = modes[0];
  const primaryFormula = resolveGripModeDamage(weapon, primary);

  system.damage = {
    base: damageFieldFromFormula(primaryFormula, primary.dmgType),
    versatile: emptyDamageField(),
  };

  const activities: Record<string, unknown> = {};
  modes.forEach((mode, index) => {
    const id = foundryId();
    const formula = resolveGripModeDamage(weapon, mode);
    const isPrimary = index === 0;
    activities[id] = buildAttackActivityBase({
      id,
      name: mode.label,
      sort: index * 100000,
      ranged,
      includeBase: isPrimary,
      parts: isPrimary
        ? []
        : [damageFieldFromFormula(formula, mode.dmgType)],
      midi: defaultMidiProperties({
        displayActivityName: true,
        identifier: slugifyIdentifier(mode.label),
        magicDamage: magical,
        magicEffect: magical,
      }),
    });
  });

  system.activities = activities;
}

export function applyMidiToExistingActivities(
  item: FoundryItem,
  opts: {
    magical: boolean;
    displayActivityName?: boolean;
    multiMode?: boolean;
  } = { magical: false },
): void {
  ensureActivityMidiProperties(item, {
    magicEffect: opts.magical,
    magicDamage: opts.magical,
    ...(opts.displayActivityName || opts.multiMode
      ? { displayActivityName: true }
      : {}),
  });
}
