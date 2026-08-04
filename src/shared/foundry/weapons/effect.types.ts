/**
 * Foundry v12 Active Effect surface for weapon-feature automation.
 * Mirrors the AE config sheet (Details / Duration / Changes / Auras) plus
 * DAE + Active Auras fields that appear in the exported JSON.
 */

import type { FoundryEffectChange } from "../types";

/** Foundry `CONST.ACTIVE_EFFECT_MODES` labels for editors. */
export const EFFECT_MODE_OPTIONS = [
  { mode: 0, label: "Custom (0)" },
  { mode: 1, label: "Multiply (1)" },
  { mode: 2, label: "Add (2)" },
  { mode: 3, label: "Downgrade (3)" },
  { mode: 4, label: "Upgrade (4)" },
  { mode: 5, label: "Override (5)" },
] as const;

/** Common DAE `flags.dae.specialDuration` values. */
export const DAE_SPECIAL_DURATION_OPTIONS = [
  "1Attack",
  "1Attack:mwak",
  "1Attack:rwak",
  "1Hit",
  "1Action",
  "1Spell",
  "turnStart",
  "turnEnd",
  "turnStartSource",
  "turnEndSource",
  "isAttacked",
  "isDamaged",
  "isSave",
  "isCheck",
  "isSkill",
  "isInitiative",
  "shortRest",
  "longRest",
  "newDay",
] as const;

/** DAE stackable dropdown values (Foundry AE sheet via DAE). */
export const DAE_STACKABLE_OPTIONS = [
  { value: "noneName", label: "Do not stack with same name" },
  { value: "noneNameOnly", label: "Do not stack with same name (count uses)" },
  { value: "none", label: "Do not stack" },
  { value: "multi", label: "Stacking effects apply the effect multiple times" },
  { value: "count", label: "Count stacks" },
] as const;

export const ACTIVE_AURA_TARGET_OPTIONS = [
  { value: "All", label: "All" },
  { value: "Allies", label: "Allies" },
  { value: "Enemy", label: "Enemy" },
] as const;

export type ActiveAuraTarget = (typeof ACTIVE_AURA_TARGET_OPTIONS)[number]["value"];

export type DaeStackable = (typeof DAE_STACKABLE_OPTIONS)[number]["value"];

export type DaeMacroRepeat = "" | "startEveryTurn" | "endEveryTurn";

/**
 * Editable Active Effect payload (maps 1:1 onto exported Foundry AE fields /
 * DAE + Active Auras flags). Merged with legacy flat WeaponActivityParams in
 * `resolveWeaponActiveEffectConfig`.
 */
export interface WeaponActiveEffectConfig {
  // ── Details ──────────────────────────────────────────────────────────
  /** Override effect display name (defaults to feature / chain leaf name). */
  name?: string;
  img?: string;
  tint?: string;
  description?: string;
  /** Effect Suspended → `disabled`. */
  disabled?: boolean;
  /** Apply Effect to Actor → `transfer`. */
  transfer?: boolean;
  /** DAE: expression which if true disables the effect. */
  disableCondition?: string;
  /** DAE: Effect disabled if actor incapacitated. */
  disableIncapacitated?: boolean;
  /** DAE stackable. */
  stackable?: DaeStackable | string;
  /** Core statuses applied while affected. */
  statuses?: string[];
  /** DAE: status conditions applied separately on apply. */
  statusesSeparate?: string[];
  /** DAE: Always Show Effect Icon. */
  showIcon?: boolean;
  /** Core: Display the effect status icon as an overlay (`flags.core.overlay`). */
  overlay?: boolean;

  // ── Duration ─────────────────────────────────────────────────────────
  durationSeconds?: number | null;
  /** Roll expression in seconds (DAE `flags.dae.durationExpression`). */
  durationSecondsFormula?: string;
  durationRounds?: number | null;
  durationTurns?: number | null;
  startTime?: number | null;
  combat?: string | null;
  startRound?: number | null;
  startTurn?: number | null;
  /** DAE macro repeat on the Duration tab. */
  macroRepeat?: DaeMacroRepeat | string;
  /** DAE specialDuration chips. */
  specialDuration?: string[];

  // ── Changes ──────────────────────────────────────────────────────────
  changes?: Array<{
    key: string;
    mode: number;
    value: string;
    priority?: number;
  }>;

  // ── Auras (Active Auras on Foundry v12 — "Effect is Aura?") ───────────
  isAura?: boolean;
  auraTargets?: ActiveAuraTarget | string;
  auraRadius?: string;
  auraAlignment?: string;
  auraType?: string;
  auraIgnoreSelf?: boolean;
  auraHeight?: boolean;
  auraHidden?: boolean;
  auraDisplayTemp?: boolean;
  auraHostile?: boolean;
  auraOnlyOnce?: boolean;

  // ── Extra DAE ────────────────────────────────────────────────────────
  selfTargetAlways?: boolean;
}

export type WeaponEffectChangeDraft = NonNullable<
  WeaponActiveEffectConfig["changes"]
>[number];

export function effectModeLabel(mode: number): string {
  return EFFECT_MODE_OPTIONS.find((o) => o.mode === mode)?.label ?? String(mode);
}

export function emptyEffectChange(): WeaponEffectChangeDraft {
  return { key: "", mode: 2, value: "", priority: 20 };
}

export function toFoundryChanges(
  changes: WeaponActiveEffectConfig["changes"] | undefined,
): FoundryEffectChange[] {
  if (!changes?.length) return [];
  return changes
    .filter((c) => c.key.trim())
    .map((c) => ({
      key: c.key.trim(),
      mode: c.mode,
      value: c.value,
      priority: c.priority ?? 20,
    }));
}
