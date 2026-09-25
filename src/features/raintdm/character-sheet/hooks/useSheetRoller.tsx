import { useCallback, type ReactNode } from "react";
import { toast } from "sonner";
import type { AbilityKey } from "@/shared/types";
import { rollD20 } from "@/shared/utils/dice.utils";
import type { ActionLocks } from "../utils/condition-effects.data";
import {
  applyD20TestPenalty,
  attackRollMode,
  checkRollMode,
} from "../utils/derive-action-locks";
import type { PlayRollEntry, RollMode } from "../utils/play-character.types";
import {
  usePromptRollMode,
  type PromptRollModeFn,
} from "./usePromptRollMode";

export type SheetRollKind = "attack" | "check" | "save" | "init" | "death";

export interface SheetRollOpts {
  label: string;
  modifier: number;
  kind: SheetRollKind;
  /** Required for save auto-fail / save-specific disadvantage */
  ability?: AbilityKey;
  locks: ActionLocks;
}

export interface SheetRollResult {
  total: number;
  detail: string;
  mode: RollMode;
  natural?: number;
  expression: string;
  aborted: boolean;
}

type AddRollFn = (entry: Omit<PlayRollEntry, "id" | "at">) => void;

function modeBadge(mode: RollMode): string {
  if (mode === "advantage") return "Adv";
  if (mode === "disadvantage") return "Dis";
  return "";
}

function showRollToast(entry: {
  label: string;
  total: number;
  mode: RollMode;
  natural?: number;
  detail: string;
}) {
  const badge = modeBadge(entry.mode);
  const nat =
    entry.natural === 20
      ? " · Nat 20"
      : entry.natural === 1
        ? " · Nat 1"
        : "";
  toast(
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">
        {entry.label}
        {badge ? ` · ${badge}` : ""}
        {nat}
      </span>
      <span
        className={
          entry.natural === 20
            ? "text-lg font-bold text-emerald-500"
            : entry.natural === 1
              ? "text-lg font-bold text-destructive"
              : "text-lg font-bold"
        }
      >
        {entry.total}
      </span>
      <span className="text-[10px] text-muted-foreground">{entry.detail}</span>
    </div>,
    { duration: 3000 },
  );
}

/**
 * Centralizes d20 tests for the play sheet: prompt mode, locks, penalty, log, toast.
 */
export function useSheetRoller(addRoll: AddRollFn): {
  rollD20Test: (opts: SheetRollOpts) => Promise<SheetRollResult>;
  logRoll: (entry: Omit<PlayRollEntry, "id" | "at">) => void;
  promptRollMode: PromptRollModeFn;
  rollModeDialog: ReactNode;
} {
  const { promptRollMode, rollModeDialog } = usePromptRollMode();

  const logRoll = useCallback(
    (entry: Omit<PlayRollEntry, "id" | "at">) => {
      addRoll(entry);
      showRollToast(entry);
    },
    [addRoll],
  );

  const rollD20Test = useCallback(
    async (opts: SheetRollOpts): Promise<SheetRollResult> => {
      const { label, modifier, kind, ability, locks } = opts;

      if (
        kind === "save" &&
        ability &&
        locks.autoFailStrDexSaves &&
        (ability === "str" || ability === "dex")
      ) {
        const entry = {
          label,
          expression: "auto-fail",
          total: 0,
          detail: "Auto-fail (condition)",
          mode: "normal" as const,
        };
        logRoll(entry);
        return {
          total: 0,
          detail: entry.detail,
          mode: "normal",
          expression: entry.expression,
          aborted: false,
        };
      }

      const userMode = await promptRollMode(label);
      if (userMode == null) {
        return {
          total: 0,
          detail: "",
          mode: "normal",
          expression: "",
          aborted: true,
        };
      }

      let mode: RollMode =
        kind === "attack"
          ? attackRollMode(userMode, locks)
          : checkRollMode(userMode, locks);

      if (kind === "save" && ability) {
        const saveDis = locks.savingThrowDisadvantage;
        const forced =
          saveDis === "all" ||
          (Array.isArray(saveDis) && saveDis.includes(ability)) ||
          locks.d20TestDisadvantage;
        if (forced && mode === "advantage") mode = "normal";
        else if (forced && mode === "normal") mode = "disadvantage";
      }

      const d20 = rollD20(mode);
      const natural = d20.rolls[0];
      const raw = d20.total + modifier;
      const { total, detailSuffix } = applyD20TestPenalty(raw, locks);
      const modStr = `${modifier >= 0 ? "+" : ""}${modifier}`;
      const expression = `1d20${modStr}`;
      const detail = `${d20.detail} ${modStr}${detailSuffix} = ${total}`;

      logRoll({
        label,
        expression,
        total,
        detail,
        mode,
        natural,
      });

      return {
        total,
        detail,
        mode,
        natural,
        expression,
        aborted: false,
      };
    },
    [logRoll, promptRollMode],
  );

  return { rollD20Test, logRoll, promptRollMode, rollModeDialog };
}
