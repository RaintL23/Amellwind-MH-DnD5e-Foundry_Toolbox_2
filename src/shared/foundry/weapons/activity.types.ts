/**
 * Weapon feature → Foundry Activity automation contract (dnd5e 4.4.4 + Midi).
 *
 * Principle: one upgrade chain → one Activity/AE whose params merge along the
 * chain at the export rarity (last link wins). `upgrade_scaler` never emits.
 */

import type { WeaponActiveEffectConfig } from "./effect.types";

export type { WeaponActiveEffectConfig } from "./effect.types";

export const WEAPON_ACTIVITY_TEMPLATE_KINDS = [
  "mode_switch",
  "mastery",
  "on_hit_extra_damage",
  "on_hit_condition",
  "on_miss",
  "bonus_action",
  "action_ability",
  "reaction",
  "limited_use",
  "resource_gauge",
  /**
   * Counter pool spend: optional item uses + optional Gather + ×N (or scaled)
   * activities that consume counters and deal damagePerCharge × N.
   * Alias: `charge_pool_attack` (legacy name for the same emit path).
   */
  "counter_spend",
  "charge_pool_attack",
  "mode_aura_or_stance",
  "passive_stat",
  "upgrade_scaler",
  "unmapped",
] as const;

export type WeaponActivityTemplateKind =
  (typeof WEAPON_ACTIVITY_TEMPLATE_KINDS)[number];

export type WeaponActivityActivation =
  | "action"
  | "bonus"
  | "reaction"
  | "special"
  | "";

export type WeaponActivityEmitType =
  | "attack"
  | "damage"
  | "save"
  | "utility"
  | "heal";

export type WeaponUsesRecoveryPeriod = "lr" | "sr" | "day" | "recharge";

/** Params for a single chain link; merged base→leaf at export (deep, last wins). */
export interface WeaponActivityParams {
  activation?: WeaponActivityActivation;
  activationCondition?: string;
  /** Prefer when the template supports multiple emit shapes. */
  activityType?: WeaponActivityEmitType;
  damageFormula?: string;
  damageType?: string;
  saveAbility?: string;
  saveDcFormula?: string;
  saveDcCalculation?: string;
  onSave?: "half" | "none" | "full";
  templateType?: string;
  templateSize?: string;
  templateWidth?: string;
  rangeValue?: string;
  rangeUnits?: string;
  /** Activity duration value (e.g. `"1"` with `durationUnits: "minute"`). */
  durationValue?: string;
  /** Activity duration units (`inst`, `minute`, `round`, …). */
  durationUnits?: string;
  /** `target.affects.type` (e.g. `"self"`). */
  targetAffectsType?: string;
  /** `target.prompt` — when set, overrides the template default. */
  targetPrompt?: boolean;
  /** Activity sheet icon path. */
  activityImg?: string;
  /** Midi `otherActivityCompatible` override. */
  otherActivityCompatible?: boolean;
  /** Midi / activity `effectConditionText` (e.g. `"false"` to block AE apply). */
  effectConditionText?: string;
  usesMax?: string;
  usesRecoveryPeriod?: WeaponUsesRecoveryPeriod;
  usesRecoveryFormula?: string;
  consumeItemUses?: boolean;
  consumeAmount?: string;
  itemUsesMax?: string;
  itemUsesRecoveryPeriod?: Exclude<WeaponUsesRecoveryPeriod, "recharge">;
  /**
   * When configuring item uses: start empty (spent = max).
   * Default for `counter_spend` / `charge_pool_attack` when owning uses and no recovery.
   */
  poolStartsEmpty?: boolean;
  /**
   * When false, do not write `system.uses` (shared counter from another feature).
   * Default true when `itemUsesMax` is set.
   */
  ownsItemUses?: boolean;
  /** Emit a Gather/Build utility that documents recovering 1 counter. */
  emitGather?: boolean;
  gatherLabel?: string;
  gatherChatFlavor?: string;
  /** Inclusive spend range for ×N / scaled counter activities. */
  spendMin?: number;
  spendMax?: number;
  /**
   * Midi advantage AE (1Attack). When `emitGather` is on, the AE is linked to
   * Gather (selfTarget) like RaintDM Charged Slash; otherwise to each ×N spend.
   */
  advantageOnUse?: boolean;
  /** Midi `useConditionText` on the Gather utility (defaults when max is set). */
  gatherUseConditionText?: string;
  /** Midi `useConditionReason` when Gather is blocked (at max charges). */
  gatherUseConditionReason?: string;
  magicDamage?: boolean;
  magicEffect?: boolean;
  ignoreCover?: boolean;
  includeBaseDamage?: boolean;
  rollFormula?: string;
  chatFlavor?: string;
  /** Weapon mastery id for system.mastery (e.g. "sap", "nick"). */
  mastery?: string;
  acBonus?: string;
  speedBonus?: string;
  statuses?: string[];
  effectTransfer?: boolean;
  specialDuration?: string[];
  durationSeconds?: number | null;
  durationRounds?: number | null;
  effectChanges?: Array<{
    key: string;
    mode: number;
    value: string;
    priority?: number;
  }>;
  /**
   * Nested Active Effect sheet config (Details / Duration / Changes / Auras +
   * DAE flags). Preferred over the flat AE fields above when both are set;
   * `resolveWeaponActiveEffectConfig` merges them.
   */
  activeEffect?: WeaponActiveEffectConfig;
  /** Wire this activity as midi triggeredActivity on weapon Attack activities. */
  triggerFromAttack?: boolean;
  /**
   * Restrict `triggerFromAttack` to Attack activities matching this name /
   * midi identifier (e.g. `"^axe$"` for Switch Axe). Omit to wire every Attack.
   */
  triggerFromAttackMatch?: string;
  triggeredActivityCondition?: string;
  automationOnly?: boolean;
  toggleEffect?: boolean;
}

export interface WeaponFeatureFoundryOverrides {
  activities?: Record<string, unknown>;
  effects?: unknown[];
  itemUses?: unknown;
  flags?: Record<string, unknown>;
}

export interface WeaponFeatureAutomationSpec {
  template: WeaponActivityTemplateKind;
  /**
   * When `false`, this feature is not mapped for Foundry export (no Activity/AE).
   * Template/params are kept so re-enabling restores the prior config.
   * Default / omitted = enabled.
   */
  enabled?: boolean;
  /**
   * Stable identity of the activity chain (usually root feature id).
   * Foundry activity _id / midi identifier derive from this.
   */
  chainKey?: string;
  /** Params for this link; merged base→…→leaf at export rarity. */
  params?: WeaponActivityParams;
  foundryOverrides?: WeaponFeatureFoundryOverrides;
  notes?: string;
}

export type WeaponFeatureAutomationStatus =
  | "unmapped"
  | "partial"
  | "ready"
  | "resource_skipped";

export const TEMPLATE_LABELS: Record<WeaponActivityTemplateKind, string> = {
  mode_switch: "Mode switch",
  mastery: "Mastery",
  on_hit_extra_damage: "On-hit extra damage",
  on_hit_condition: "On-hit condition",
  on_miss: "On miss",
  bonus_action: "Bonus action",
  action_ability: "Action ability",
  reaction: "Reaction",
  limited_use: "Limited use",
  resource_gauge: "Resource gauge (item uses)",
  counter_spend: "Counter spend (gather + ×N / scale)",
  charge_pool_attack: "Counter spend (legacy alias)",
  mode_aura_or_stance: "Mode / stance",
  passive_stat: "Passive stat",
  upgrade_scaler: "Upgrade scaler (delta only)",
  unmapped: "Unmapped (description only)",
};
