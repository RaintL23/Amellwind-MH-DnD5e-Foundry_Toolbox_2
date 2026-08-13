import type { AbilityKey } from "@/shared/types";

export type NpcAmmoAttackKind = "weapon" | "save" | "area-save";

export interface NpcAmmoAttackSpec {
  displayName: string;
  kind: NpcAmmoAttackKind;
  flatDamageBonus?: number;
  damageDice?: string;
  damageType?: string;
  saveAbility?: AbilityKey;
  /** Base dice before rarity scaling above Rare (index 2). */
  saveBaseDice?: string;
  saveDamageType?: string;
  /** Appended after a standard hit line, or sole text for save attacks. */
  effect?: string;
}

/** Keys from {@link normalizeAmmoKey} — AGMH bowgun ammunition types. */
export const NPC_AMMO_ATTACKS: Record<string, NpcAmmoAttackSpec> = {
  normal: {
    displayName: "Normal Ammo",
    kind: "weapon",
  },
  tranq: {
    displayName: "Tranq Ammo",
    kind: "weapon",
    effect:
      "On a hit, the target is affected as if hit by a tranq bomb (see AGMH capturing rules).",
  },
  cluster: {
    displayName: "Cluster Ammo",
    kind: "weapon",
    effect:
      "On a hit, this ammo deals no weapon damage. Instead, the target and each creature within 5 feet of it take fire damage (see Cluster Burst).",
  },
  spread: {
    displayName: "Spread Ammo",
    kind: "weapon",
    effect:
      "If the target is within half the bowgun's normal range, the damage is split evenly between it and each creature adjacent to it.",
  },
  "pierce lvl 1": {
    displayName: "Pierce Ammo (Level 1)",
    kind: "weapon",
    flatDamageBonus: 1,
  },
  "pierce lvl 2": {
    displayName: "Pierce Ammo (Level 2)",
    kind: "weapon",
    flatDamageBonus: 2,
  },
  "pierce lvl 3": {
    displayName: "Pierce Ammo (Level 3)",
    kind: "weapon",
    flatDamageBonus: 3,
  },
  poison: {
    displayName: "Poison Ammo",
    kind: "weapon",
    effect:
      "On a hit, the target must succeed on a Constitution saving throw or be poisoned for 1 minute. The target can repeat the save at the end of each of its turns, ending the effect on a success.",
  },
  "recover lvl 1": {
    displayName: "Recover Ammo (Level 1)",
    kind: "weapon",
    effect: "On a hit, the target regains 4 (1d4) hit points instead of taking damage.",
  },
  "recover lvl 2": {
    displayName: "Recover Ammo (Level 2)",
    kind: "weapon",
    effect: "On a hit, the target regains 4 (1d6) hit points instead of taking damage.",
  },
  paralysis: {
    displayName: "Paralysis Ammo",
    kind: "weapon",
    effect:
      "On a hit, the target must succeed on a Constitution saving throw or be incapacitated and have its speed reduced to 0 until the end of the artillerist's next turn. If it fails by 5 or more, it is paralyzed instead until the end of the artillerist's next turn.",
  },
  sticky: {
    displayName: "Sticky Ammo",
    kind: "weapon",
    effect:
      "On a hit, the target must succeed on a Strength saving throw or be restrained for 1 minute. The target can use its action to attempt to escape (Escape DC equal to the artillerist's ammo save DC).",
  },
  slicing: {
    displayName: "Slicing Ammo",
    kind: "save",
    saveAbility: "dex",
    saveBaseDice: "4d6",
    saveDamageType: "slashing",
    effect:
      "The artillerist chooses a target within the bowgun's maximum range. If the target is beyond normal range, it has advantage on the save.",
  },
  wyvern: {
    displayName: "Wyvern Ammo",
    kind: "area-save",
    saveAbility: "dex",
    saveBaseDice: "2d12",
    saveDamageType: "fire",
    effect:
      "Each creature in a 15-foot cone must make the save, taking fire damage on a failed save, or half as much on a success.",
  },
  // Light Bowgun elemental / support ammo (shared keys where applicable)
  dragon: {
    displayName: "Dragon Ammo",
    kind: "weapon",
    damageType: "fire",
    effect: "On a hit, the target takes an extra 7 (2d6) fire damage.",
  },
  flaming: {
    displayName: "Flaming Ammo",
    kind: "weapon",
    damageType: "fire",
  },
  thunder: {
    displayName: "Thunder Ammo",
    kind: "weapon",
    damageType: "thunder",
  },
  water: {
    displayName: "Water Ammo",
    kind: "weapon",
    damageType: "cold",
  },
  sleep: {
    displayName: "Sleep Ammo",
    kind: "weapon",
    effect:
      "On a hit, the target must succeed on a Wisdom saving throw or fall unconscious for 1 minute. The target wakes if it takes damage or if another creature uses an action to wake it.",
  },
  armor: {
    displayName: "Armor Ammo",
    kind: "weapon",
    effect:
      "On a hit, the artillerist or one ally within 30 feet gains a +2 bonus to AC until the start of the artillerist's next turn.",
  },
  demon: {
    displayName: "Demon Ammo",
    kind: "weapon",
    effect:
      "On a hit, the artillerist or one ally within 30 feet deals an extra 7 (2d6) damage on its next weapon hit before the end of the artillerist's next turn.",
  },
};

/** Meta HWF entries that should not appear as NPC action dumps. */
export const NPC_WEAPON_META_FEATURE =
  /^(ammo\s+\([^)]+\)|capacity increase\b.*|melody|single note melody)$/i;

export const NPC_VARIANT_WEAPON_NAMES = new Set([
  "heavy bowgun",
  "light bowgun",
  "hunting horn",
]);

export function isVariantPrimaryWeapon(weaponName: string): boolean {
  return NPC_VARIANT_WEAPON_NAMES.has(weaponName.toLowerCase());
}

/** Max ammo / melody-note variants shown on an NPC stat block (3–5 range). */
export const NPC_MAX_VARIANT_ATTACKS = 4;

/** Prefer these ammo types when culling long unlock lists. Higher = more likely kept. */
export const NPC_AMMO_PRIORITY: Record<string, number> = {
  normal: 100,
  wyvern: 92,
  cluster: 90,
  paralysis: 88,
  sticky: 86,
  slicing: 84,
  poison: 82,
  sleep: 80,
  "pierce lvl 3": 78,
  "pierce lvl 2": 77,
  "pierce lvl 1": 76,
  spread: 74,
  dragon: 72,
  flaming: 70,
  thunder: 68,
  water: 66,
  demon: 64,
  armor: 62,
  tranq: 20,
  "recover lvl 2": 15,
  "recover lvl 1": 14,
};

/** Prefer support/buff notes for War Chanter NPC actions. */
export const NPC_MELODY_NOTE_PRIORITY: Record<string, number> = {
  "damage up (s)": 90,
  "damage up (m)": 89,
  "defense up (s)": 88,
  "attack up (s)": 87,
  "attack up (m)": 86,
  "movement up (s)": 80,
  "skill up (s)": 78,
  "earplugs": 75,
  "health recovery (s)": 74,
  "health recovery (m)": 73,
};
