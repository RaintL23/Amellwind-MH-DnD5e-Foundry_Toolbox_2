import { RARITY_ORDER, type RarityTier } from "@/shared/types";

/** Template tier 0–3 (shown to users as Power Tier 1–4). */
export interface NpcPowerBand {
  hitDiceMin: number;
  hitDiceMax: number;
  /** Challenge rating as a decimal (0.125 = 1/8). */
  cr: number;
  /** MM / MPMM stat block used as a baseline for this band. */
  mmReference: string;
  weaponRarityIndex: number;
  /** Flat AC bonus for upgraded armor quality at this band. */
  acBonus: number;
}

export const NPC_TEMPLATE_TIER_LABELS: Record<number, string> = {
  0: "Tier 1 — Minion (Guard, Commoner)",
  1: "Tier 2 — Skirmisher (Scout, Bandit, Thug)",
  2: "Tier 3 — Professional (Veteran, Knight, Priest, Druid)",
  3: "Tier 4 — Elite (Assassin, Gladiator, Mage, Archmage)",
};

/**
 * MM-inspired power bands per template tier.
 * Hit dice pick the band; CR drives proficiency, XP, and MH gear rarity.
 */
export const NPC_TIER_POWER_BANDS: Record<number, NpcPowerBand[]> = {
  0: [
    {
      hitDiceMin: 1,
      hitDiceMax: 2,
      cr: 0.125,
      mmReference: "Guard",
      weaponRarityIndex: 0,
      acBonus: 0,
    },
    {
      hitDiceMin: 3,
      hitDiceMax: 3,
      cr: 0.25,
      mmReference: "Tribal Warrior",
      weaponRarityIndex: 0,
      acBonus: 0,
    },
    {
      hitDiceMin: 4,
      hitDiceMax: 4,
      cr: 0.5,
      mmReference: "Scout",
      weaponRarityIndex: 0,
      acBonus: 0,
    },
  ],
  1: [
    {
      hitDiceMin: 3,
      hitDiceMax: 3,
      cr: 0.5,
      mmReference: "Scout",
      weaponRarityIndex: 0,
      acBonus: 0,
    },
    {
      hitDiceMin: 4,
      hitDiceMax: 4,
      cr: 1,
      mmReference: "Warrior",
      weaponRarityIndex: 1,
      acBonus: 0,
    },
    {
      hitDiceMin: 5,
      hitDiceMax: 6,
      cr: 2,
      mmReference: "Thug",
      weaponRarityIndex: 1,
      acBonus: 0,
    },
    {
      hitDiceMin: 7,
      hitDiceMax: 7,
      cr: 2,
      mmReference: "Berserker",
      weaponRarityIndex: 2,
      acBonus: 1,
    },
  ],
  2: [
    {
      hitDiceMin: 5,
      hitDiceMax: 6,
      cr: 2,
      mmReference: "Priest / Druid",
      weaponRarityIndex: 1,
      acBonus: 0,
    },
    {
      hitDiceMin: 7,
      hitDiceMax: 7,
      cr: 2,
      mmReference: "Spy",
      weaponRarityIndex: 1,
      acBonus: 0,
    },
    {
      hitDiceMin: 8,
      hitDiceMax: 9,
      cr: 3,
      mmReference: "Knight / Veteran",
      weaponRarityIndex: 2,
      acBonus: 0,
    },
    {
      hitDiceMin: 10,
      hitDiceMax: 10,
      cr: 4,
      mmReference: "Veteran",
      weaponRarityIndex: 2,
      acBonus: 1,
    },
    {
      hitDiceMin: 11,
      hitDiceMax: 12,
      cr: 5,
      mmReference: "Gladiator",
      weaponRarityIndex: 3,
      acBonus: 1,
    },
  ],
  3: [
    {
      hitDiceMin: 8,
      hitDiceMax: 9,
      cr: 5,
      mmReference: "Gladiator",
      weaponRarityIndex: 3,
      acBonus: 0,
    },
    {
      hitDiceMin: 10,
      hitDiceMax: 11,
      cr: 6,
      mmReference: "Mage",
      weaponRarityIndex: 3,
      acBonus: 0,
    },
    {
      hitDiceMin: 12,
      hitDiceMax: 12,
      cr: 8,
      mmReference: "Assassin",
      weaponRarityIndex: 3,
      acBonus: 0,
    },
    {
      hitDiceMin: 13,
      hitDiceMax: 15,
      cr: 10,
      mmReference: "Archmage (lower)",
      weaponRarityIndex: 4,
      acBonus: 1,
    },
    {
      hitDiceMin: 16,
      hitDiceMax: 20,
      cr: 12,
      mmReference: "Archmage",
      weaponRarityIndex: 4,
      acBonus: 2,
    },
  ],
};

export function getRarityLabel(index: number): RarityTier {
  return RARITY_ORDER[Math.min(RARITY_ORDER.length - 1, Math.max(0, index))];
}
