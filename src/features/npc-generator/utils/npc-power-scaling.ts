import {
  getRarityLabel,
  NPC_TIER_POWER_BANDS,
  type NpcPowerBand,
} from "../data/npc-power-scaling.data";

export interface NpcPowerProfile extends NpcPowerBand {
  hitDiceCount: number;
  crLabel: string;
  weaponRarityLabel: string;
  proficiencyBonus: number;
}

function formatCrStringLocal(value: number): string {
  if (value <= 0.125) return "1/8";
  if (value <= 0.25) return "1/4";
  if (value <= 0.5) return "1/2";
  if (value <= 0.75) return "3/4";
  if (Number.isInteger(value)) return String(value);
  return value.toFixed(1).replace(/\.0$/, "");
}

function normalizeTier(tier: number): number {
  return Math.min(3, Math.max(0, Math.round(tier)));
}

function getBandsForTier(tier: number): NpcPowerBand[] {
  return NPC_TIER_POWER_BANDS[normalizeTier(tier)] ?? NPC_TIER_POWER_BANDS[1];
}

function findBandForHitDice(
  bands: NpcPowerBand[],
  hitDiceCount: number,
): NpcPowerBand {
  const match = bands.find(
    (band) => hitDiceCount >= band.hitDiceMin && hitDiceCount <= band.hitDiceMax,
  );
  if (match) return match;

  if (hitDiceCount < bands[0].hitDiceMin) return bands[0];
  return bands[bands.length - 1];
}

export function resolveNpcPowerProfile(
  templateTier: number,
  hitDiceCount: number,
): NpcPowerProfile {
  const bands = getBandsForTier(templateTier);
  const band = findBandForHitDice(bands, hitDiceCount);
  const crLabel = formatCrStringLocal(band.cr);
  const proficiencyBonus = Math.ceil(band.cr / 4) + 1;

  return {
    ...band,
    hitDiceCount,
    crLabel,
    weaponRarityLabel: getRarityLabel(band.weaponRarityIndex),
    proficiencyBonus,
  };
}

/** Distinct hit-dice anchors offered in the form for a template tier. */
export function getHitDiceOptionsForTier(templateTier: number): number[] {
  const bands = getBandsForTier(templateTier);
  const values = new Set<number>();

  for (const band of bands) {
    values.add(band.hitDiceMin);
    values.add(band.hitDiceMax);
  }

  return [...values].sort((a, b) => a - b);
}

export function clampHitDiceForTier(
  templateTier: number,
  hitDiceCount: number,
): number {
  const options = getHitDiceOptionsForTier(templateTier);
  if (options.length === 0) return hitDiceCount;

  if (options.includes(hitDiceCount)) return hitDiceCount;

  return options.reduce((closest, value) =>
    Math.abs(value - hitDiceCount) < Math.abs(closest - hitDiceCount)
      ? value
      : closest,
  );
}

export function getDefaultHitDiceForTier(templateTier: number): number {
  const options = getHitDiceOptionsForTier(templateTier);
  if (options.length === 0) return 8;
  return options[Math.floor(options.length / 2)];
}

export function formatHitDiceOptionLabel(
  templateTier: number,
  hitDiceCount: number,
): string {
  const profile = resolveNpcPowerProfile(templateTier, hitDiceCount);
  return `${hitDiceCount} HD — CR ${profile.crLabel} (${profile.mmReference}) · ${profile.weaponRarityLabel} gear`;
}
