/**
 * Curated mechanical effects for D&D conditions / status (prose catalogs have none).
 */
import type { AbilityKey } from "@/shared/types";
import type {
  ConditionEffectFlags,
  PlayConditionInstance,
  RulesEdition,
} from "./play-character.types";

function norm(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

const BASE: Record<string, ConditionEffectFlags> = {
  incapacitated: {
    denyActions: true,
    denyBonusActions: true,
    denyReactions: true,
    denyAttacks: true,
  },
  stunned: {
    denyActions: true,
    denyBonusActions: true,
    denyReactions: true,
    denyAttacks: true,
    autoFailStrDexSaves: true,
    notes: ["Attacks against you have advantage"],
  },
  paralyzed: {
    denyActions: true,
    denyBonusActions: true,
    denyReactions: true,
    denyAttacks: true,
    denyMovement: true,
    speedZero: true,
    autoFailStrDexSaves: true,
    notes: ["Attacks against you have advantage; melee hits within 5 ft are crits"],
  },
  unconscious: {
    denyActions: true,
    denyBonusActions: true,
    denyReactions: true,
    denyAttacks: true,
    denyMovement: true,
    speedZero: true,
    denyConcentration: true,
    autoFailStrDexSaves: true,
    notes: ["Attacks against you have advantage; melee hits within 5 ft are crits"],
  },
  petrified: {
    denyActions: true,
    denyBonusActions: true,
    denyReactions: true,
    denyAttacks: true,
    denyMovement: true,
    speedZero: true,
    autoFailStrDexSaves: true,
  },
  poisoned: {
    attackDisadvantage: true,
    abilityCheckDisadvantage: true,
  },
  blinded: {
    attackDisadvantage: true,
    notes: ["Attacks against you have advantage; fails checks needing sight"],
  },
  deafened: {
    notes: ["Fails checks needing hearing"],
  },
  charmed: {
    notes: ["Can't attack the charmer; charmer has advantage on social checks"],
  },
  frightened: {
    abilityCheckDisadvantage: true,
    attackDisadvantage: true,
    notes: ["Disadvantage while the source is in line of sight"],
  },
  grappled: {
    speedZero: true,
    denyMovement: true,
  },
  restrained: {
    speedZero: true,
    denyMovement: true,
    attackDisadvantage: true,
    notes: ["Attacks against you have advantage; DEX saves at disadvantage"],
    savingThrowDisadvantage: ["dex"],
  },
  prone: {
    attackDisadvantage: true,
    notes: ["Melee attacks against you have advantage; ranged have disadvantage; stand costs half speed"],
  },
  invisible: {
    notes: ["Attacks against you have disadvantage; your attacks have advantage"],
  },
  exhausted: {},
  exhaustion: {},
};

/**
 * Player-facing exhaustion summary for the current level.
 * 2024 scales every level (−2 × level to D20 Tests, −5 × level ft Speed).
 * 2014 stacks discrete effects through the current level.
 */
export function exhaustionLevelSummary(
  level: number,
  edition: RulesEdition,
): string | null {
  const lv = Math.max(0, Math.min(6, Math.floor(level)));
  if (lv <= 0) return null;

  if (edition === "2024") {
    if (lv >= 6) return "Death.";
    const d20 = 2 * lv;
    const speed = 5 * lv;
    return `−${d20} to D20 Tests; Speed −${speed} ft.`;
  }

  const parts: string[] = [];
  if (lv >= 1) parts.push("Disadvantage on ability checks");
  if (lv >= 2) parts.push("Speed halved");
  if (lv >= 3) parts.push("Disadvantage on attack rolls and saving throws");
  if (lv >= 4) parts.push("Hit Point maximum halved");
  if (lv >= 5) parts.push("Speed 0");
  if (lv >= 6) parts.push("Death");
  return parts.join("; ") + ".";
}

/** Exhaustion effects by level for 2014 vs 2024 rules. */
export function exhaustionEffects(
  level: number,
  edition: RulesEdition,
): ConditionEffectFlags {
  const lv = Math.max(0, Math.min(6, Math.floor(level)));
  if (lv <= 0) return {};

  const summary = exhaustionLevelSummary(lv, edition);

  if (edition === "2024") {
    if (lv >= 6) {
      return {
        denyActions: true,
        denyBonusActions: true,
        denyReactions: true,
        denyAttacks: true,
        denyMovement: true,
        speedZero: true,
        notes: summary ? [summary] : ["Death (Exhaustion 6)"],
      };
    }
    return {
      d20TestPenalty: 2 * lv,
      speedReductionFt: 5 * lv,
      notes: summary ? [summary] : undefined,
    };
  }

  // 2014 — discrete stacked levels
  const flags: ConditionEffectFlags = {};
  if (lv >= 1) flags.abilityCheckDisadvantage = true;
  if (lv >= 2) flags.speedHalf = true;
  if (lv >= 3) {
    flags.attackDisadvantage = true;
    flags.savingThrowDisadvantage = "all";
  }
  if (lv >= 4) flags.notes = ["Hit Point maximum halved"];
  if (lv >= 5) flags.speedZero = true;
  if (lv >= 6) {
    flags.denyActions = true;
    flags.denyBonusActions = true;
    flags.denyReactions = true;
    flags.notes = [...(flags.notes ?? []), "Death (Exhaustion 6)"];
  }
  if (summary) {
    flags.notes = [summary];
  }
  return flags;
}

export function lookupConditionEffects(
  name: string,
): ConditionEffectFlags | null {
  const key = norm(name);
  return BASE[key] ?? null;
}

export function resolveInstanceEffects(
  instance: PlayConditionInstance,
  edition: RulesEdition,
): ConditionEffectFlags {
  const baseName = norm(instance.name);
  let base: ConditionEffectFlags = {};

  if (baseName === "exhaustion" || baseName === "exhausted") {
    base = exhaustionEffects(instance.level ?? 1, edition);
  } else {
    base = lookupConditionEffects(instance.name) ?? {};
  }

  return { ...base, ...instance.effectOverride };
}

export interface ActionLocks {
  actions: boolean;
  bonusActions: boolean;
  reactions: boolean;
  movement: boolean;
  attacks: boolean;
  attackDisadvantage: boolean;
  abilityCheckDisadvantage: boolean;
  d20TestDisadvantage: boolean;
  /** Flat penalty subtracted from D20 Tests (2024 Exhaustion: 2 × level) */
  d20TestPenalty: number;
  savingThrowDisadvantage: AbilityKey[] | "all" | null;
  autoFailStrDexSaves: boolean;
  speedZero: boolean;
  speedHalf: boolean;
  /** Feet subtracted from Speed (2024 Exhaustion: 5 × level) */
  speedReductionFt: number;
  denyConcentration: boolean;
  notes: string[];
  reasons: string[];
}

export function deriveActionLocks(
  conditions: PlayConditionInstance[],
  exhaustion: number,
  edition: RulesEdition,
): ActionLocks {
  const locks: ActionLocks = {
    actions: false,
    bonusActions: false,
    reactions: false,
    movement: false,
    attacks: false,
    attackDisadvantage: false,
    abilityCheckDisadvantage: false,
    d20TestDisadvantage: false,
    d20TestPenalty: 0,
    savingThrowDisadvantage: null,
    autoFailStrDexSaves: false,
    speedZero: false,
    speedHalf: false,
    speedReductionFt: 0,
    denyConcentration: false,
    notes: [],
    reasons: [],
  };

  const all: PlayConditionInstance[] = [...conditions];
  if (exhaustion > 0 && !all.some((c) => norm(c.name) === "exhaustion")) {
    all.push({
      id: "exhaustion-level",
      kind: "condition",
      source: "custom",
      name: "Exhaustion",
      level: exhaustion,
    });
  }

  for (const inst of all) {
    const fx = resolveInstanceEffects(inst, edition);
    const label =
      norm(inst.name) === "exhaustion"
        ? `Exhaustion ${inst.level ?? exhaustion}`
        : inst.name;

    if (fx.denyActions) {
      locks.actions = true;
      locks.reasons.push(`${label}: no Actions`);
    }
    if (fx.denyBonusActions) {
      locks.bonusActions = true;
      locks.reasons.push(`${label}: no Bonus Actions`);
    }
    if (fx.denyReactions) {
      locks.reactions = true;
      locks.reasons.push(`${label}: no Reactions`);
    }
    if (fx.denyMovement) {
      locks.movement = true;
      locks.reasons.push(`${label}: no Movement`);
    }
    if (fx.denyAttacks) {
      locks.attacks = true;
      locks.reasons.push(`${label}: no Attacks`);
    }
    if (fx.attackDisadvantage) locks.attackDisadvantage = true;
    if (fx.abilityCheckDisadvantage) locks.abilityCheckDisadvantage = true;
    if (fx.d20TestDisadvantage) locks.d20TestDisadvantage = true;
    if (fx.d20TestPenalty && fx.d20TestPenalty > locks.d20TestPenalty) {
      locks.d20TestPenalty = fx.d20TestPenalty;
      locks.reasons.push(`${label}: −${fx.d20TestPenalty} to D20 Tests`);
    }
    if (fx.autoFailStrDexSaves) locks.autoFailStrDexSaves = true;
    if (fx.speedZero) locks.speedZero = true;
    if (fx.speedHalf) locks.speedHalf = true;
    if (fx.speedReductionFt && fx.speedReductionFt > locks.speedReductionFt) {
      locks.speedReductionFt = fx.speedReductionFt;
      locks.reasons.push(`${label}: Speed −${fx.speedReductionFt} ft`);
    }
    if (fx.denyConcentration) locks.denyConcentration = true;
    if (fx.savingThrowDisadvantage) {
      if (
        locks.savingThrowDisadvantage === "all" ||
        fx.savingThrowDisadvantage === "all"
      ) {
        locks.savingThrowDisadvantage = "all";
      } else if (Array.isArray(fx.savingThrowDisadvantage)) {
        const prev =
          locks.savingThrowDisadvantage === null
            ? []
            : locks.savingThrowDisadvantage;
        locks.savingThrowDisadvantage = [
          ...new Set([...prev, ...fx.savingThrowDisadvantage]),
        ];
      }
    }
    if (fx.notes?.length) locks.notes.push(...fx.notes);
  }

  return locks;
}
