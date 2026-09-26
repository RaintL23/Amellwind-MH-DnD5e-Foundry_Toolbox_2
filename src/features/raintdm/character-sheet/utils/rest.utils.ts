import type { FeatureRecoveryPeriod } from "@/features/raintdm/builder/foundry-export/feature-usage.utils";
import type {
  PlayCharacterCompiled,
  PlaySessionState,
  RulesEdition,
} from "./play-character.types";
import { EMPTY_DEATH_SAVES } from "./play-character.types";
import { rollExpression } from "@/shared/utils/dice.utils";

export interface RestPreview {
  kind: "short" | "long";
  restoreFeatureIds: string[];
  restoreResourceIds: string[];
  restoreSpellSlots: boolean;
  restorePact: boolean;
  hitDiceRecover?: number;
  exhaustionDelta: number;
  hpToMax: boolean;
  clearTemp: boolean;
  clearDeathSaves: boolean;
}

/** Human-readable recovery for Resources / feature uses UI. */
export function formatRecoveryLabel(
  recovery: FeatureRecoveryPeriod | "" | undefined,
): string {
  if (recovery === "lr") return "Recover on Long Rest";
  if (recovery === "sr") return "Recover on Short Rest";
  if (recovery === "day") return "Recover Daily";
  return "—";
}

function recoveryMatches(
  recovery: string,
  rest: "short" | "long",
): boolean {
  if (rest === "short") return recovery === "sr";
  return recovery === "sr" || recovery === "lr" || recovery === "day";
}

export function previewRest(
  compiled: PlayCharacterCompiled,
  session: PlaySessionState,
  kind: "short" | "long",
): RestPreview {
  const restoreFeatureIds = compiled.features
    .filter((f) => f.uses && recoveryMatches(f.uses.recovery, kind))
    .map((f) => f.id);

  // Feature-backed resources restore via featureUsesSpent (restoreFeatureIds).
  const restoreResourceIds = compiled.resources
    .filter((r) => !r.featureId && recoveryMatches(r.recovery, kind))
    .map((r) => r.id);

  const totalHitDice = compiled.hitDice.reduce((s, h) => s + h.max, 0);
  const spent = Object.values(session.hitDiceSpent).reduce((s, n) => s + n, 0);

  let hitDiceRecover = 0;
  if (kind === "long") {
    const edition: RulesEdition = compiled.rulesEdition;
    if (edition === "2024") {
      hitDiceRecover = spent; // regain all
    } else {
      hitDiceRecover = Math.max(1, Math.floor(totalHitDice / 2));
      hitDiceRecover = Math.min(hitDiceRecover, spent);
    }
  }

  return {
    kind,
    restoreFeatureIds,
    restoreResourceIds,
    restoreSpellSlots: kind === "long",
    restorePact: true, // pact recovers on short+long
    hitDiceRecover: kind === "long" ? hitDiceRecover : undefined,
    exhaustionDelta: kind === "long" ? -1 : 0,
    hpToMax: kind === "long",
    clearTemp: kind === "long",
    clearDeathSaves: kind === "long",
    // remaining unused but available for UI
  };
}

/** Spend one hit die during a short rest; returns new session + roll detail. */
export function spendHitDie(
  compiled: PlayCharacterCompiled,
  session: PlaySessionState,
  dieKey: string,
): { session: PlaySessionState; healed: number; detail: string } | null {
  const pool = compiled.hitDice.find((h) => h.die === dieKey);
  if (!pool) return null;
  const spent = session.hitDiceSpent[dieKey] ?? 0;
  if (spent >= pool.max) return null;

  const conMod = compiled.abilities.con.mod;
  const roll = rollExpression(`1${dieKey}`);
  const healed = Math.max(0, roll.total + conMod);
  const newHp = Math.min(
    session.hp.max,
    session.hp.current + healed,
  );

  return {
    session: {
      ...session,
      hp: { ...session.hp, current: newHp },
      hitDiceSpent: {
        ...session.hitDiceSpent,
        [dieKey]: spent + 1,
      },
    },
    healed,
    detail: `${roll.detail} + ${conMod} CON = ${healed}`,
  };
}

export function applyRest(
  compiled: PlayCharacterCompiled,
  session: PlaySessionState,
  kind: "short" | "long",
): PlaySessionState {
  const preview = previewRest(compiled, session, kind);
  let next: PlaySessionState = { ...session };

  const featureUsesSpent = { ...next.featureUsesSpent };
  for (const id of preview.restoreFeatureIds) {
    delete featureUsesSpent[id];
  }
  const resourcesSpent = { ...next.resourcesSpent };
  for (const id of preview.restoreResourceIds) {
    delete resourcesSpent[id];
  }

  next = {
    ...next,
    featureUsesSpent,
    resourcesSpent,
  };

  if (preview.restorePact) {
    next = { ...next, pactSpent: 0 };
  }

  if (kind === "long") {
    const slotsSpent = preview.restoreSpellSlots ? {} : next.slotsSpent;
    let hitDiceSpent = { ...next.hitDiceSpent };
    if (preview.hitDiceRecover && preview.hitDiceRecover > 0) {
      let toRecover = preview.hitDiceRecover;
      // Prefer recovering from largest die pools first (d12 before d10, …)
      const dieSize = (key: string) => {
        const m = key.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      };
      const keys = Object.keys(hitDiceSpent).sort(
        (a, b) => dieSize(b) - dieSize(a),
      );
      for (const key of keys) {
        if (toRecover <= 0) break;
        const cur = hitDiceSpent[key] ?? 0;
        const take = Math.min(cur, toRecover);
        hitDiceSpent[key] = cur - take;
        if (hitDiceSpent[key] <= 0) delete hitDiceSpent[key];
        toRecover -= take;
      }
    } else if (compiled.rulesEdition === "2024") {
      hitDiceSpent = {};
    }

    next = {
      ...next,
      slotsSpent,
      hitDiceSpent,
      hp: {
        current: preview.hpToMax ? next.hp.max : next.hp.current,
        max: next.hp.max,
        temp: preview.clearTemp ? 0 : next.hp.temp,
      },
      deathSaves: preview.clearDeathSaves
        ? { ...EMPTY_DEATH_SAVES }
        : next.deathSaves,
      exhaustion: Math.max(0, next.exhaustion + preview.exhaustionDelta),
      concentration: null,
    };
  }

  return next;
}

/** Build a Roll Log summary of what this rest actually restored. */
export function summarizeRestRecovery(
  compiled: PlayCharacterCompiled,
  sessionBefore: PlaySessionState,
  kind: "short" | "long",
): { label: string; detail: string; total: number } {
  const preview = previewRest(compiled, sessionBefore, kind);
  const parts: string[] = [];
  let total = 0;

  if (preview.hpToMax) {
    const healed = Math.max(0, sessionBefore.hp.max - sessionBefore.hp.current);
    total = healed;
    if (healed > 0) {
      parts.push(`HP ${sessionBefore.hp.current} → ${sessionBefore.hp.max}`);
    } else {
      parts.push("HP already at max");
    }
  }

  if (preview.clearTemp && sessionBefore.hp.temp > 0) {
    parts.push(`cleared ${sessionBefore.hp.temp} temp HP`);
  }

  if (preview.clearDeathSaves) {
    const { successes, failures } = sessionBefore.deathSaves;
    if (successes > 0 || failures > 0) {
      parts.push("death saves cleared");
    }
  }

  if (preview.exhaustionDelta < 0 && sessionBefore.exhaustion > 0) {
    const nextEx = Math.max(0, sessionBefore.exhaustion + preview.exhaustionDelta);
    parts.push(`exhaustion ${sessionBefore.exhaustion} → ${nextEx}`);
  }

  if (preview.restoreSpellSlots) {
    const spentSlots = Object.values(sessionBefore.slotsSpent).reduce(
      (s, n) => s + n,
      0,
    );
    if (spentSlots > 0) parts.push("spell slots restored");
  }

  if (preview.restorePact && sessionBefore.pactSpent > 0) {
    parts.push("pact slots restored");
  }

  if (preview.hitDiceRecover && preview.hitDiceRecover > 0) {
    parts.push(`Hit Dice +${preview.hitDiceRecover}`);
  } else if (
    kind === "long" &&
    compiled.rulesEdition === "2024" &&
    Object.values(sessionBefore.hitDiceSpent).some((n) => n > 0)
  ) {
    parts.push("Hit Dice fully restored");
  }

  const featureNames = preview.restoreFeatureIds
    .filter((id) => (sessionBefore.featureUsesSpent[id] ?? 0) > 0)
    .map((id) => compiled.features.find((f) => f.id === id)?.name ?? id);
  if (featureNames.length > 0) {
    parts.push(
      featureNames.length <= 3
        ? `features: ${featureNames.join(", ")}`
        : `${featureNames.length} features restored`,
    );
  }

  const resourceNames = preview.restoreResourceIds
    .filter((id) => (sessionBefore.resourcesSpent[id] ?? 0) > 0)
    .map((id) => compiled.resources.find((r) => r.id === id)?.label ?? id);
  if (resourceNames.length > 0) {
    parts.push(
      resourceNames.length <= 3
        ? `resources: ${resourceNames.join(", ")}`
        : `${resourceNames.length} resources restored`,
    );
  }

  if (kind === "long" && sessionBefore.concentration) {
    parts.push("concentration ended");
  }

  const label = kind === "short" ? "Short Rest" : "Long Rest";
  const detail =
    parts.length > 0
      ? parts.join(" · ")
      : kind === "short"
        ? "SR features / resources / pact recovered"
        : "Fully rested";

  return { label, detail, total };
}

