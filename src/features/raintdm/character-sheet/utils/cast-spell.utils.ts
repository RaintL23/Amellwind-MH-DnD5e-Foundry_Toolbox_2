import { rollExpression } from "@/shared/utils/dice.utils";
import type { ActionLocks } from "./condition-effects.data";
import type {
  PlaySessionState,
  PlaySpell,
  PlaySpellcasting,
} from "./play-character.types";
import type { PlaySessionAction } from "./play-session-reducer";
import type { ConfirmDialogFn } from "../hooks/useConfirmDialog";
import type { useSheetRoller } from "../hooks/useSheetRoller";
import { spellHasAttackRoll } from "./spell-attack.utils";
import { resolveSpellEffectRoll } from "./spell-effect-dice.utils";

export function spellEconomyLocked(
  spell: PlaySpell,
  locks: ActionLocks,
): boolean {
  if (spell.bucket === "bonus") return locks.bonusActions;
  if (spell.bucket === "reaction") return locks.reactions;
  return locks.actions;
}

export function isSpellReady(
  spell: PlaySpell,
  session: PlaySessionState,
  sc: PlaySpellcasting,
): boolean {
  if (spell.level === 0 || spell.alwaysPrepared) return true;
  if (!sc.isPreparedCaster) return true;
  return session.preparedSpellIds.includes(spell.id);
}

export function canSpendSlotForSpell(
  spell: PlaySpell,
  session: PlaySessionState,
  sc: PlaySpellcasting,
  slotLevel: number,
  asRitual: boolean,
): boolean {
  if (spell.level <= 0 || asRitual) return true;
  if (sc.isPactMagic && sc.pact) {
    return session.pactSpent < sc.pact.max;
  }
  const max = sc.slotMax[slotLevel] ?? 0;
  const spent = session.slotsSpent[slotLevel] ?? 0;
  return max > 0 && spent < max;
}

export function availableUpcastLevels(
  spell: PlaySpell,
  session: PlaySessionState,
  sc: PlaySpellcasting,
): number[] {
  if (spell.level === 0) return [];
  if (sc.isPactMagic && sc.pact) {
    if (session.pactSpent >= sc.pact.max) return [];
    return [sc.pact.level];
  }
  const levels: number[] = [];
  for (let lv = Math.max(spell.level, 1); lv <= 9; lv++) {
    const max = sc.slotMax[lv] ?? 0;
    if (max <= 0) continue;
    const spent = session.slotsSpent[lv] ?? 0;
    if (spent < max) levels.push(lv);
  }
  return levels;
}

export interface CastSpellOpts {
  spell: PlaySpell;
  slotLevel: number;
  /** Cast as ritual without spending a slot */
  asRitual?: boolean;
  sc: PlaySpellcasting;
  session: PlaySessionState;
  locks: ActionLocks;
  dispatch: (a: PlaySessionAction) => void;
  rollD20Test: ReturnType<typeof useSheetRoller>["rollD20Test"];
  logRoll: ReturnType<typeof useSheetRoller>["logRoll"];
  confirm: ConfirmDialogFn;
  /** Require prepared check (Spells tab + Actions) */
  requirePrepared?: boolean;
  /** Character level (cantrip damage bands). Defaults to 1. */
  characterLevel?: number;
}

/**
 * Cast a spell: confirm concentration → roll attack (if any) → only then spend
 * slot / set concentration. Cancelled Adv/Dis does not consume resources.
 */
export async function castPlaySpell(
  opts: CastSpellOpts,
): Promise<"ok" | "aborted" | "locked" | "no-slot" | "unprepared"> {
  const {
    spell,
    slotLevel,
    asRitual = false,
    sc,
    session,
    locks,
    dispatch,
    rollD20Test,
    logRoll,
    confirm,
    requirePrepared = true,
    characterLevel = 1,
  } = opts;

  if (spellEconomyLocked(spell, locks)) return "locked";
  if (requirePrepared && !isSpellReady(spell, session, sc)) return "unprepared";

  const ritual = asRitual && spell.isRitual;
  if (
    spell.level > 0 &&
    !ritual &&
    !canSpendSlotForSpell(spell, session, sc, slotLevel, false)
  ) {
    return "no-slot";
  }

  if (spell.isConcentration) {
    if (session.concentration && session.concentration !== spell.name) {
      const ok = await confirm({
        title: "Break concentration?",
        description: `Cast ${spell.name} and break concentration on ${session.concentration}?`,
        confirmLabel: "Cast",
      });
      if (!ok) return "aborted";
    }
  }

  const slotNote =
    spell.level === 0
      ? "Cantrip"
      : ritual
        ? "Ritual (no slot)"
        : sc.isPactMagic
          ? `Pact Level ${slotLevel}`
          : `Level ${slotLevel} slot`;

  const effect = resolveSpellEffectRoll(spell, {
    slotLevel,
    spellMod: sc.mod,
    characterLevel,
  });
  const hasSave = /\bsaving throw\b/i.test(spell.description ?? "");

  const logEffectRoll = (label: string) => {
    if (!effect) return;
    const rolled = rollExpression(effect.expression);
    const detailParts = [slotNote];
    if (hasSave) detailParts.push(`DC ${sc.saveDc}`);
    detailParts.push(rolled.detail);
    logRoll({
      label,
      expression: effect.expression,
      total: rolled.total,
      detail: detailParts.join(" · "),
      mode: "normal",
    });
  };

  if (spellHasAttackRoll(spell)) {
    const result = await rollD20Test({
      label: `Cast ${spell.name}`,
      modifier: sc.attackBonus,
      kind: "attack",
      locks,
    });
    if (result.aborted) return "aborted";
    if (effect) {
      logEffectRoll(`Cast ${spell.name} ${effect.label}`);
    }
  } else if (effect) {
    logEffectRoll(`Cast ${spell.name}`);
  } else {
    logRoll({
      label: `Cast ${spell.name}`,
      expression: "—",
      total: 0,
      detail: hasSave
        ? `${slotNote} · DC ${sc.saveDc}`
        : slotNote,
      mode: "normal",
    });
  }

  // Spend only after a successful (non-aborted) cast resolution
  if (spell.level > 0 && !ritual) {
    if (sc.isPactMagic && sc.pact) {
      dispatch({ type: "SPEND_PACT", max: sc.pact.max });
    } else {
      const max = sc.slotMax[slotLevel] ?? 0;
      dispatch({ type: "SPEND_SLOT", level: slotLevel, max });
    }
  }
  if (spell.isConcentration) {
    dispatch({ type: "SET_CONCENTRATION", spellName: spell.name });
  }

  return "ok";
}
