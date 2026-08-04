import type { FoundryItem } from "../types";
import { buildEffect, EFFECT_MODE } from "../effects";
import { foundryIdFromSeed } from "../id";
import type {
  WeaponActivityParams,
  WeaponFeatureAutomationSpec,
} from "./activity.types";
import type { ResolvedCombatChain } from "./activity-chains";
import {
  baseActivityFields,
  damagePartFromParams,
  defaultActivation,
  midiFor,
  parseDice,
} from "./activity-payload";
import {
  applyItemUses,
  resolveSpendRange,
  scaleDiceFormulaByCharges,
} from "./activity-uses";
import { emitActivityOntoItem, linkEffectsToActivity } from "./activity-write";

export function isCounterSpendTemplate(
  template: WeaponFeatureAutomationSpec["template"],
): boolean {
  return template === "counter_spend" || template === "charge_pool_attack";
}

export function buildSpendActivityPayload(opts: {
  id: string;
  name: string;
  sort: number;
  activation: string;
  params: WeaponActivityParams;
  midi: Record<string, unknown>;
  damageFormula: string;
  activityType: "attack" | "damage" | "save" | "utility";
}): Record<string, unknown> {
  const base = baseActivityFields({
    id: opts.id,
    name: opts.name,
    sort: opts.sort,
    activation: opts.activation,
    params: opts.params,
    midi: opts.midi,
  });
  const part = damagePartFromParams({
    ...opts.params,
    damageFormula: opts.damageFormula,
  });

  if (opts.activityType === "save") {
    return {
      ...base,
      type: "save",
      damage: {
        parts: part ? [part] : [],
        onSave: opts.params.onSave ?? "half",
      },
      save: {
        ability: opts.params.saveAbility
          ? [opts.params.saveAbility.toLowerCase().slice(0, 3)]
          : ["dex"],
        dc: {
          calculation: opts.params.saveDcCalculation ?? "",
          formula: opts.params.saveDcFormula ?? "",
        },
      },
    };
  }

  if (opts.activityType === "damage") {
    return {
      ...base,
      type: "damage",
      damage: {
        critical: { allow: false, bonus: "" },
        parts: part ? [part] : [],
      },
    };
  }

  if (opts.activityType === "utility") {
    return {
      ...base,
      type: "utility",
      roll: {
        formula: opts.params.rollFormula ?? "",
        name: "",
        prompt: false,
        visible: false,
      },
    };
  }

  return {
    ...base,
    type: "attack",
    attack: {
      ability: "",
      bonus: "",
      critical: { threshold: null },
      flat: false,
      type: {
        value: "melee",
        classification: "weapon",
      },
    },
    damage: {
      critical: { bonus: "" },
      includeBase: opts.params.includeBaseDamage ?? false,
      parts: part ? [part] : [],
    },
  };
}

const COUNTER_BUTTON_SPAN_MAX = 5;

/**
 * Generic counter spend: optional item uses + optional Gather + ×N buttons
 * (or one scaled activity when the spend range is wide).
 */
export function compileCounterSpend(
  item: FoundryItem,
  resolved: ResolvedCombatChain,
  opts: { magical: boolean; sortBase: number },
): void {
  const { effective, displayName, chain } = resolved;
  if (!effective) return;
  const params = effective.params ?? {};
  const chainKey = effective.chainKey || chain.chainKey;
  const { spendMin, spendMax } = resolveSpendRange(params);
  const perCharge = params.damageFormula?.trim() || "1d6";
  const activation = defaultActivation(params.activation, "special");
  const activityType: "attack" | "damage" | "save" | "utility" =
    params.activityType === "damage" ||
    params.activityType === "save" ||
    params.activityType === "utility" ||
    params.activityType === "attack"
      ? params.activityType
      : params.saveAbility
        ? "save"
        : "attack";
  const ownsUses =
    params.ownsItemUses !== false && !!params.itemUsesMax?.trim();
  const startsEmpty =
    params.poolStartsEmpty === true ||
    (params.poolStartsEmpty !== false && ownsUses && !params.itemUsesRecoveryPeriod);
  const emitGather =
    params.emitGather === true ||
    (params.emitGather !== false && ownsUses && startsEmpty);
  const statusNote =
    params.statuses && params.statuses.length > 0
      ? ` On hit/use apply: ${params.statuses.join(", ")}.`
      : "";

  if (ownsUses) {
    applyItemUses(item, params, effective.foundryOverrides, {
      forceStartsEmpty: startsEmpty,
    });
  }

  let advantageEffectId: string | undefined;
  if (params.advantageOnUse === true) {
    const advantageEffect = buildEffect({
      name: `${displayName} (Advantage)`,
      transfer: false,
      changes: [
        {
          key: "flags.midi-qol.advantage.attack.all",
          mode: EFFECT_MODE.CUSTOM,
          value: "1",
          priority: 20,
        },
      ],
      flags: {
        dae: { specialDuration: ["1Attack"], stackable: "noneName" },
      },
    });
    advantageEffect._id = foundryIdFromSeed(`eff-adv-${chainKey}`);
    item.effects.push(advantageEffect);
    advantageEffectId = advantageEffect._id;
  }

  if (emitGather) {
    const gatherParams: WeaponActivityParams = {
      ...params,
      consumeItemUses: false,
      chatFlavor:
        params.gatherLabel?.trim() ||
        params.activationCondition?.trim() ||
        "Recover 1 item use on this weapon (grant 1 counter). Counters may expire — see feature text.",
    };
    const gatherId = foundryIdFromSeed(`act-gather-${chainKey}`);
    const gatherName = params.gatherLabel?.trim()
      ? `${displayName}: ${params.gatherLabel.trim()}`
      : `${displayName}: Gather`;
    const gatherMidi = midiFor(gatherName, gatherParams, opts.magical);
    emitActivityOntoItem(item, {
      ...baseActivityFields({
        id: gatherId,
        name: gatherName,
        sort: opts.sortBase,
        activation: "special",
        params: gatherParams,
        midi: gatherMidi,
      }),
      type: "utility",
      roll: { formula: "", name: "", prompt: false, visible: false },
    });
  }

  const span = spendMax - spendMin + 1;
  const useButtons = span <= COUNTER_BUTTON_SPAN_MAX;

  if (useButtons) {
    for (let n = spendMin; n <= spendMax; n++) {
      const scaled = scaleDiceFormulaByCharges(perCharge, n);
      const spendParams: WeaponActivityParams = {
        ...params,
        consumeItemUses: true,
        consumeAmount: String(n),
        damageFormula: scaled,
        includeBaseDamage:
          params.includeBaseDamage ?? activityType === "attack",
        chatFlavor: [
          params.chatFlavor?.trim() ||
            "Spend counters; damage scales with amount spent.",
          `Consumes ${n} (+${scaled}).`,
          statusNote,
        ]
          .filter(Boolean)
          .join(" "),
      };
      const actId = foundryIdFromSeed(`act-x${n}-${chainKey}`);
      const actName = `${displayName} ×${n}`;
      const activity = buildSpendActivityPayload({
        id: actId,
        name: actName,
        sort: opts.sortBase + n * 1000,
        activation,
        params: spendParams,
        midi: midiFor(actName, spendParams, opts.magical),
        damageFormula: scaled,
        activityType,
      });
      if (advantageEffectId) {
        linkEffectsToActivity(activity, [advantageEffectId]);
      }
      emitActivityOntoItem(item, activity);
    }
  } else {
    // Wide pools: one activity with consumption scaling (player picks how many).
    const baseDice = parseDice(perCharge);
    const spendParams: WeaponActivityParams = {
      ...params,
      consumeItemUses: true,
      consumeAmount: String(spendMin),
      damageFormula: scaleDiceFormulaByCharges(perCharge, spendMin),
      includeBaseDamage:
        params.includeBaseDamage ?? activityType === "attack",
      chatFlavor: [
        params.chatFlavor?.trim() ||
          "Scale this activity to spend more counters (damage scales per counter).",
        `Base ${spendMin} counter${spendMin === 1 ? "" : "s"}; max ${spendMax}.`,
        `Per counter: ${perCharge}.`,
        statusNote,
      ]
        .filter(Boolean)
        .join(" "),
    };
    const actId = foundryIdFromSeed(`act-scale-${chainKey}`);
    const actName = `${displayName} (scale)`;
    const activity = buildSpendActivityPayload({
      id: actId,
      name: actName,
      sort: opts.sortBase + 1000,
      activation,
      params: spendParams,
      midi: midiFor(actName, spendParams, opts.magical),
      damageFormula: scaleDiceFormulaByCharges(perCharge, spendMin),
      activityType,
    });
    activity.consumption = {
      scaling: { allowed: true, max: String(spendMax - spendMin) },
      spellSlot: false,
      targets: [
        {
          type: "itemUses",
          target: "",
          value: String(spendMin),
          scaling: { mode: "amount", formula: "" },
        },
      ],
    };
    if (
      baseDice?.kind === "dice" &&
      (activityType === "attack" ||
        activityType === "damage" ||
        activityType === "save")
    ) {
      const damage = activity.damage as Record<string, unknown> | undefined;
      const parts = damage?.parts as Record<string, unknown>[] | undefined;
      if (parts?.[0]) {
        parts[0] = {
          ...parts[0],
          scaling: { mode: "whole", number: baseDice.number },
        };
      }
    }
    if (advantageEffectId) {
      linkEffectsToActivity(activity, [advantageEffectId]);
    }
    emitActivityOntoItem(item, activity);
  }

  if (effective.foundryOverrides?.flags) {
    item.flags = {
      ...item.flags,
      ...effective.foundryOverrides.flags,
    };
  }
}