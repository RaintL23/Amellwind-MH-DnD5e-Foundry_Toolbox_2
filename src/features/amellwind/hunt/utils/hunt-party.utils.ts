import type { Monster } from "@/shared/types";
import { getBaseCr, parseCR } from "@/shared/utils/cr.utils";
import { getMonsterMaxHp } from "@/shared/utils/hp-formula.utils";

export const DEFAULT_HUNTER_COUNT = 4;
export const MIN_HUNTER_COUNT = 1;
export const MAX_HUNTER_COUNT = 6;

export type HuntCombatDifficultyRating =
  | "trivial"
  | "easy"
  | "medium"
  | "hard"
  | "deadly"
  | "beyond-deadly";

export interface HuntCombatDifficultyResult {
  rating: HuntCombatDifficultyRating;
  label: string;
  description: string;
  tierAligned: boolean | null;
  tierNote: string | null;
}

export interface ScaledBossHpResult {
  baseMaxHp: number | null;
  averageHp: number | null;
  scaledHp: number | null;
  multiplier: number | null;
  multiplierLabel: string | null;
  note: string | null;
}

export function getMonsterKey(monster: Pick<Monster, "name" | "source">): string {
  return `${monster.name}::${monster.source ?? ""}`;
}

export function resolveMonsterKey(
  key: string,
  catalog: Monster[],
): Monster | undefined {
  const [name, source] = key.split("::");
  return (
    catalog.find((m) => m.name === name && (m.source ?? "") === (source ?? "")) ??
    catalog.find((m) => m.name === name)
  );
}

export function getAveragePartyLevel(levels: number[]): number {
  if (levels.length === 0) return 1;
  const sum = levels.reduce((acc, level) => acc + level, 0);
  return Math.floor(sum / levels.length);
}

export function getTotalTargetCr(monsters: Monster[]): number {
  return monsters.reduce((sum, monster) => sum + parseCR(getBaseCr(monster.cr)), 0);
}

export function getHuntHpMultiplier(hunterCount: number): {
  multiplier: number | null;
  label: string | null;
} {
  switch (hunterCount) {
    case 3:
      return { multiplier: 1, label: "Max HP (3 PCs)" };
    case 4:
      return { multiplier: 1.5, label: "Max HP + 50% (4 PCs)" };
    case 5:
      return { multiplier: 2, label: "Max HP × 2 (5 PCs)" };
    default:
      return { multiplier: null, label: null };
  }
}

export function getScaledBossHp(
  monster: Monster,
  hunterCount: number,
): ScaledBossHpResult {
  const baseMaxHp = getMonsterMaxHp(monster.hp);
  const averageHp = monster.hp.average ?? null;
  const { multiplier, label } = getHuntHpMultiplier(hunterCount);

  if (baseMaxHp == null) {
    return {
      baseMaxHp: null,
      averageHp,
      scaledHp: null,
      multiplier,
      multiplierLabel: label,
      note: "No HP data available for this monster.",
    };
  }

  if (multiplier == null) {
    return {
      baseMaxHp,
      averageHp,
      scaledHp: baseMaxHp,
      multiplier: null,
      multiplierLabel: null,
      note:
        hunterCount < 3 || hunterCount > 5
          ? "Amellwind solo-boss HP scaling is defined for 3–5 PCs. Showing max HP without party-size multiplier."
          : null,
    };
  }

  return {
    baseMaxHp,
    averageHp,
    scaledHp: Math.round(baseMaxHp * multiplier),
    multiplier,
    multiplierLabel: label,
    note: null,
  };
}

/**
 * Heuristic: compares total quarry CR against party APL and hunter count.
 * A single quarry at CR ≈ APL is roughly a medium encounter per PC guidelines;
 * multiple targets sum CR for a rough deadly-hunt check.
 */
export function getHuntCombatDifficulty(
  apl: number,
  totalCr: number,
  hunterCount: number,
  tierLevelRange?: string,
): HuntCombatDifficultyResult {
  const perHunterCr = totalCr / Math.max(hunterCount, 1);
  const ratio = perHunterCr / Math.max(apl, 1);

  let rating: HuntCombatDifficultyRating;
  let description: string;

  if (ratio < 0.5) {
    rating = "trivial";
    description = "Total quarry CR is well below the party's level per hunter.";
  } else if (ratio < 0.85) {
    rating = "easy";
    description = "Quarry CR per hunter is lower than average party level.";
  } else if (ratio <= 1.15) {
    rating = "medium";
    description = "Quarry CR per hunter is roughly on par with party level.";
  } else if (ratio <= 1.5) {
    rating = "hard";
    description = "Quarry CR per hunter exceeds average party level.";
  } else if (ratio <= 2) {
    rating = "deadly";
    description = "High total CR — typical Amellwind boss-hunt difficulty.";
  } else {
    rating = "beyond-deadly";
    description = "Total quarry CR greatly exceeds what the party level suggests.";
  }

  const tierAligned = tierLevelRange
    ? isAplWithinTier(apl, tierLevelRange)
    : null;
  const tierNote =
    tierAligned === false
      ? `APL ${apl} may not match environment tier "${tierLevelRange}".`
      : null;

  return {
    rating,
    label: formatDifficultyLabel(rating),
    description,
    tierAligned,
    tierNote,
  };
}

function formatDifficultyLabel(rating: HuntCombatDifficultyRating): string {
  switch (rating) {
    case "trivial":
      return "Trivial";
    case "easy":
      return "Easy";
    case "medium":
      return "Medium";
    case "hard":
      return "Hard";
    case "deadly":
      return "Deadly";
    case "beyond-deadly":
      return "Beyond Deadly";
  }
}

function isAplWithinTier(apl: number, tierLevelRange: string): boolean {
  const rangeMatch = /^(\d+)\s*-\s*(\d+)$/.exec(tierLevelRange.trim());
  if (rangeMatch) {
    const min = Number.parseInt(rangeMatch[1], 10);
    const max = Number.parseInt(rangeMatch[2], 10);
    return apl >= min && apl <= max;
  }

  const single = Number.parseInt(tierLevelRange.trim(), 10);
  if (Number.isFinite(single)) return apl === single;
  return true;
}

export function createDefaultHunterLevels(count: number, defaultLevel = 1): number[] {
  return Array.from({ length: count }, () => defaultLevel);
}

export function resizeHunterLevels(
  current: number[],
  count: number,
  defaultLevel = 1,
): number[] {
  if (count <= current.length) return current.slice(0, count);
  return [
    ...current,
    ...Array.from({ length: count - current.length }, () => defaultLevel),
  ];
}

export interface HuntTargetProgress {
  signsFound: number;
  found: boolean;
}

export function createEmptyTargetProgress(): HuntTargetProgress {
  return { signsFound: 0, found: false };
}

export function createTargetProgressMap(
  monsters: Monster[],
  existing: Record<string, HuntTargetProgress> = {},
): Record<string, HuntTargetProgress> {
  const next: Record<string, HuntTargetProgress> = {};
  for (const monster of monsters) {
    const key = getMonsterKey(monster);
    next[key] = existing[key] ?? createEmptyTargetProgress();
  }
  return next;
}

export const HUNT_DIFFICULTY_BADGE_CLASS: Record<HuntCombatDifficultyRating, string> = {
  trivial: "bg-slate-500/15 text-slate-300 border-slate-500/30",
  easy: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  medium: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  hard: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  deadly: "bg-rose-500/15 text-rose-400 border-rose-500/30",
  "beyond-deadly": "bg-fuchsia-500/15 text-fuchsia-400 border-fuchsia-500/30",
};
