import type { FoundryItem } from "../types";
import { foundryIdFromSeed } from "../id";
import { defaultMidiProperties } from "../midi";
import type { WeaponActivityParams, WeaponFeatureAutomationSpec } from "./activity.types";
import {
  baseActivityFields,
  damagePartFromParams,
  defaultActivation,
  midiFor,
  parseDice,
} from "./activity-payload";
import { applyItemUses } from "./activity-uses";
import {
  buildWeaponActiveEffect,
  hasWeaponActiveEffectPayload,
} from "./effect.utils";
import { compileCounterSpend, isCounterSpendTemplate } from "./activity-counter-spend";
import type { ResolvedCombatChain } from "./activity-chains";
import { emitActivityOntoItem, linkEffectsToActivity } from "./activity-write";

export function wireTriggeredFromAttacks(
  item: FoundryItem,
  triggeredId: string,
  condition: string,
  opts?: {
    /**
     * When set, only wire Attack activities whose name or midi identifier
     * matches (case-insensitive). Full-string match if the pattern has no
     * regexp metacharacters; otherwise treated as a RegExp source.
     */
    attackNameMatch?: string;
  },
): void {
  const system = item.system as Record<string, unknown>;
  const activities = system.activities;
  if (!activities || typeof activities !== "object") return;

  const matchRaw = opts?.attackNameMatch?.trim();
  const matcher = matchRaw
    ? new RegExp(
        /[\\^$.*+?()[\]{}|]/.test(matchRaw) ? matchRaw : `^${matchRaw}$`,
        "i",
      )
    : null;

  for (const activity of Object.values(
    activities as Record<string, Record<string, unknown>>,
  )) {
    if (!activity || activity.type !== "attack") continue;
    if (matcher) {
      const name = String(activity.name ?? "");
      const midiId = String(
        (activity.midiProperties as { identifier?: string } | undefined)
          ?.identifier ?? "",
      );
      if (!matcher.test(name) && !matcher.test(midiId)) continue;
    }
    const midi =
      (activity.midiProperties as Record<string, unknown> | undefined) ??
      defaultMidiProperties();
    activity.midiProperties = {
      ...midi,
      triggeredActivityId: triggeredId,
      triggeredActivityConditionText: condition || "hits > 0",
      triggeredActivityTargets: "hit",
      triggeredActivityRollAs: "self",
    };
  }
}

export function buildEffectFromParams(
  name: string,
  params: WeaponActivityParams,
  stableSeed: string,
): ReturnType<typeof buildWeaponActiveEffect> {
  return buildWeaponActiveEffect(name, params, { stableSeed });
}

export function inferEmitType(
  template: WeaponFeatureAutomationSpec["template"],
  params: WeaponActivityParams,
): "attack" | "damage" | "save" | "utility" | "heal" | "effect_only" | "item_uses" | "counter_spend" | "skip" {
  if (template === "unmapped" || template === "upgrade_scaler") return "skip";
  if (template === "resource_gauge") return "item_uses";
  if (isCounterSpendTemplate(template)) return "counter_spend";
  if (template === "passive_stat" || template === "mastery") {
    if (params.activityType) return params.activityType;
    return "effect_only";
  }
  if (template === "on_hit_condition") return "effect_only";
  if (params.activityType) return params.activityType;
  if (params.saveAbility) return "save";
  if (params.damageFormula && template === "on_hit_extra_damage") return "damage";
  if (params.damageFormula && (template === "action_ability" || template === "bonus_action" || template === "reaction")) {
    return params.saveAbility ? "save" : "attack";
  }
  return "utility";
}

export function compileResolvedChain(
  item: FoundryItem,
  resolved: ResolvedCombatChain,
  opts: { magical: boolean; sortBase: number },
): void {
  const { effective, displayName, chain } = resolved;
  if (!effective || effective.enabled === false) return;

  const params = effective.params ?? {};
  const emitKind = inferEmitType(effective.template, params);
  if (emitKind === "skip") return;

  const chainKey = effective.chainKey || chain.chainKey;
  const activityId = foundryIdFromSeed(`act-${chainKey}`);
  const sort = opts.sortBase;

  if (emitKind === "counter_spend") {
    compileCounterSpend(item, resolved, opts);
    return;
  }

  applyItemUses(item, params, effective.foundryOverrides);

  if (effective.template === "mastery" && params.mastery?.trim()) {
    const system = item.system as Record<string, unknown>;
    system.mastery = params.mastery.trim().toLowerCase();
  }

  if (emitKind === "item_uses") {
    applyItemUses(item, params, effective.foundryOverrides);
    return;
  }

  const effectIds: string[] = [];
  const needsEffect =
    emitKind === "effect_only" ||
    effective.template === "mode_aura_or_stance" ||
    effective.template === "on_hit_condition" ||
    hasWeaponActiveEffectPayload(params);

  if (needsEffect) {
    const effect = buildEffectFromParams(displayName, {
      ...params,
      effectTransfer:
        params.effectTransfer ??
        (effective.template === "passive_stat" ||
          effective.template === "mastery"),
    }, chainKey);
    item.effects.push(effect);
    effectIds.push(effect._id);

    if (emitKind === "effect_only" && effective.template === "on_hit_condition") {
      // Link non-transfer AE to all attack activities
      const system = item.system as Record<string, unknown>;
      const activities = system.activities as
        | Record<string, Record<string, unknown>>
        | undefined;
      if (activities) {
        for (const activity of Object.values(activities)) {
          if (activity?.type !== "attack") continue;
          const existing = Array.isArray(activity.effects)
            ? (activity.effects as Array<{ _id: string }>)
            : [];
          if (!existing.some((e) => e._id === effect._id)) {
            activity.effects = [...existing, { _id: effect._id }];
          }
        }
      }
      return;
    }

    if (emitKind === "effect_only") return;
  }

  const activationFallback =
    effective.template === "bonus_action" ||
    effective.template === "mode_switch" ||
    effective.template === "mode_aura_or_stance"
      ? "bonus"
      : effective.template === "reaction"
        ? "reaction"
        : "action";

  const activation = defaultActivation(params.activation, activationFallback);
  const midi = midiFor(displayName, params, opts.magical);

  let activity: Record<string, unknown>;

  if (emitKind === "save") {
    const part = damagePartFromParams(params);
    activity = {
      ...baseActivityFields({
        id: activityId,
        name: displayName,
        sort,
        activation,
        params,
        midi,
      }),
      type: "save",
      damage: {
        parts: part ? [part] : [],
        onSave: params.onSave ?? "half",
      },
      save: {
        ability: params.saveAbility
          ? [params.saveAbility.toLowerCase().slice(0, 3)]
          : ["dex"],
        dc: {
          calculation: params.saveDcCalculation ?? "",
          formula: params.saveDcFormula ?? "",
        },
      },
    };
  } else if (emitKind === "damage") {
    const part = damagePartFromParams(params);
    activity = {
      ...baseActivityFields({
        id: activityId,
        name: displayName,
        sort,
        activation,
        params,
        midi,
      }),
      type: "damage",
      damage: {
        critical: { allow: false, bonus: "" },
        parts: part ? [part] : [],
      },
    };
  } else if (emitKind === "attack") {
    const part = damagePartFromParams(params);
    const weaponTypeValue = String(
      (item.system as { type?: { value?: string } } | undefined)?.type?.value ??
        "",
    );
    const attackValue =
      weaponTypeValue === "simpleR" || weaponTypeValue === "martialR"
        ? "ranged"
        : "melee";
    activity = {
      ...baseActivityFields({
        id: activityId,
        name: displayName,
        sort,
        activation,
        params,
        midi,
      }),
      type: "attack",
      attack: {
        ability: "",
        bonus: "",
        critical: { threshold: null },
        flat: false,
        type: {
          value: attackValue,
          classification: "weapon",
        },
      },
      damage: {
        critical: { bonus: "" },
        includeBase: params.includeBaseDamage ?? false,
        parts: part ? [part] : [],
      },
    };
  } else if (emitKind === "heal") {
    const dice = params.damageFormula
      ? parseDice(params.damageFormula)
      : null;
    activity = {
      ...baseActivityFields({
        id: activityId,
        name: displayName,
        sort,
        activation,
        params,
        midi,
      }),
      type: "heal",
      healing: {
        number: dice?.kind === "dice" ? dice.number : null,
        denomination: dice?.kind === "dice" ? dice.denomination : null,
        bonus: dice?.kind === "dice" ? dice.bonus : "",
        types: ["healing"],
        custom: {
          enabled: dice?.kind === "custom",
          formula: dice?.kind === "custom" ? dice.formula : "",
        },
        scaling: { mode: "", number: 1 },
      },
    };
  } else {
    activity = {
      ...baseActivityFields({
        id: activityId,
        name: displayName,
        sort,
        activation,
        params,
        midi,
      }),
      type: "utility",
      roll: {
        formula: params.rollFormula ?? "",
        name: "",
        prompt: false,
        visible: false,
      },
    };
  }

  linkEffectsToActivity(activity, effectIds);

  if (effective.foundryOverrides?.activities) {
    activity = {
      ...activity,
      ...effective.foundryOverrides.activities,
      _id: activityId,
      name: displayName,
    };
  }

  emitActivityOntoItem(item, activity);

  if (
    params.triggerFromAttack ||
    effective.template === "on_hit_extra_damage"
  ) {
    wireTriggeredFromAttacks(
      item,
      activityId,
      params.triggeredActivityCondition ?? "hits > 0",
      params.triggerFromAttackMatch
        ? { attackNameMatch: params.triggerFromAttackMatch }
        : undefined,
    );
  }

  if (effective.foundryOverrides?.flags) {
    item.flags = {
      ...item.flags,
      ...effective.foundryOverrides.flags,
    };
  }
}
