import type { Weapon } from "@/shared/types";
import { isBaseRarity } from "@/shared/types";
import { mapDamageType } from "@/shared/foundry";
import { getTypedBonusValue } from "../utils/weapon-forge-features.utils";
import type { CustomWeapon } from "../types/weapon-forge.types";

export const DEFAULT_FOUNDRY_WEAPON_IMG =
  "icons/weapons/swords/sword-broad-steel.webp";

export function parseBonusNumber(raw: string): number {
  const match = raw.trim().match(/([+-]?\d+)/);
  if (!match) return 0;
  return Math.abs(Number.parseInt(match[1], 10)) || 0;
}

export function parseDice(
  formula: string,
): { number: number; denomination: number } | null {
  const match = formula.match(/(\d+)\s*d\s*(\d+)/i);
  if (!match) return null;
  return { number: Number(match[1]), denomination: Number(match[2]) };
}

export function slugifyIdentifier(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function resolveMagicalBonus(
  weapon: CustomWeapon,
  rarityIndex: number,
): number {
  const row = weapon.rarityRows[rarityIndex];
  if (!row || isBaseRarity(row.rarity)) return 0;
  const toHit = parseBonusNumber(getTypedBonusValue(row, "toHit"));
  const damage = parseBonusNumber(getTypedBonusValue(row, "damage"));
  return Math.max(toHit, damage);
}

export function isRangedWeapon(weapon: Weapon): boolean {
  if (weapon.properties.some((p) => p.split("|")[0] === "A")) return true;
  if (weapon.ammoType) return true;
  return false;
}

export function emptyDamageField(): Record<string, unknown> {
  return {
    number: null,
    denomination: null,
    types: [],
    custom: { enabled: false },
    scaling: { number: 1 },
  };
}

export function damageFieldFromFormula(
  formula: string,
  dmgType: string | undefined,
): Record<string, unknown> {
  const dice = parseDice(formula) ?? { number: 1, denomination: 4 };
  const mapped = mapDamageType(dmgType);
  return {
    number: dice.number,
    denomination: dice.denomination,
    types: mapped ? [mapped] : [],
    custom: { enabled: false },
    scaling: { mode: "", number: 1 },
    bonus: "",
  };
}

export function buildAttackActivityBase(opts: {
  id: string;
  name: string;
  sort: number;
  ranged: boolean;
  includeBase: boolean;
  parts: Record<string, unknown>[];
  midi: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    _id: opts.id,
    type: "attack",
    sort: opts.sort,
    name: opts.name,
    activation: { type: "action", value: 1, override: false },
    consumption: {
      scaling: { allowed: false },
      spellSlot: true,
      targets: [],
    },
    description: {},
    duration: { units: "inst", concentration: false, override: false },
    effects: [],
    range: { units: "self", override: false },
    target: {
      template: { contiguous: false, units: "ft" },
      affects: { choice: false },
      override: false,
      prompt: true,
    },
    uses: { spent: 0, recovery: [] },
    attack: {
      ability: "",
      type: {
        value: opts.ranged ? "ranged" : "melee",
        classification: "weapon",
      },
      critical: { threshold: null },
      flat: false,
      bonus: "",
    },
    damage: {
      critical: { bonus: "" },
      includeBase: opts.includeBase,
      parts: opts.parts,
    },
    midiProperties: opts.midi,
  };
}


