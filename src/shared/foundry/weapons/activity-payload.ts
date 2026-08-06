import { defaultMidiProperties } from "../midi";
import { mapDamageType } from "../mappings";
import type { WeaponActivityParams } from "./activity.types";

export function slugifyIdentifier(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function parseDice(
  formula: string,
):
  | { kind: "dice"; number: number; denomination: number; bonus: string }
  | { kind: "custom"; formula: string }
  | null {
  const trimmed = formula.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^(\d+)\s*d\s*(\d+)\s*([+-]\s*\d+)?$/i);
  if (!match) {
    return { kind: "custom", formula: trimmed };
  }
  return {
    kind: "dice",
    number: Number(match[1]),
    denomination: Number(match[2]),
    bonus: match[3] ? match[3].replace(/\s+/g, "") : "",
  };
}

export function damagePartFromParams(
  params: WeaponActivityParams,
): Record<string, unknown> | null {
  if (!params.damageFormula?.trim()) return null;
  const dice = parseDice(params.damageFormula);
  const mapped = params.damageType
    ? mapDamageType(params.damageType) || params.damageType.toLowerCase()
    : "";
  if (!dice) return null;
  if (dice.kind === "custom") {
    return {
      number: null,
      denomination: null,
      types: mapped ? [mapped] : [],
      custom: { enabled: true, formula: dice.formula },
      scaling: { mode: "", number: 1 },
      bonus: "",
    };
  }
  return {
    number: dice.number,
    denomination: dice.denomination,
    types: mapped ? [mapped] : [],
    custom: { enabled: false, formula: "" },
    scaling: { mode: "", number: 1 },
    bonus: dice.bonus,
  };
}

export function usesBlock(params: WeaponActivityParams): Record<string, unknown> {
  const recovery =
    params.usesMax && params.usesRecoveryPeriod
      ? [
          {
            period: params.usesRecoveryPeriod,
            type: "recoverAll",
            formula:
              params.usesRecoveryPeriod === "recharge"
                ? (params.usesRecoveryFormula ?? "6")
                : "",
          },
        ]
      : [];
  return {
    spent: 0,
    max: params.usesMax ?? "",
    recovery,
  };
}

export function consumptionTargets(
  params: WeaponActivityParams,
): Record<string, unknown>[] {
  if (!params.consumeItemUses) return [];
  return [
    {
      type: "itemUses",
      target: "",
      value: params.consumeAmount?.trim() || "1",
      scaling: { mode: "", formula: "" },
    },
  ];
}

export function targetBlock(params: WeaponActivityParams): Record<string, unknown> {
  const affectsType = params.targetAffectsType?.trim() || "";
  return {
    template: {
      count: "",
      contiguous: false,
      type: params.templateType?.trim() || "",
      size: params.templateSize?.trim() || "",
      width: params.templateWidth?.trim() || "",
      height: "",
      units: "ft",
    },
    affects: {
      count: "",
      type: affectsType,
      choice: false,
      special: "",
    },
    prompt: params.targetPrompt ?? true,
    override: false,
  };
}

export function rangeBlock(params: WeaponActivityParams): Record<string, unknown> {
  const units =
    params.rangeUnits?.trim() ||
    (params.rangeValue?.trim() ? "ft" : "");
  // When only units are set (e.g. self), omit null `value` to match Foundry saves.
  if (!params.rangeValue?.trim() && units === "self") {
    return {
      units,
      special: "",
      override: false,
    };
  }
  return {
    value: params.rangeValue?.trim() || null,
    units,
    special: "",
    override: false,
  };
}

export function defaultActivation(
  templateActivation: WeaponActivityParams["activation"] | undefined,
  fallback: "action" | "bonus" | "reaction" | "special",
): string {
  if (templateActivation === "") return "special";
  return templateActivation || fallback;
}

export function baseActivityFields(opts: {
  id: string;
  name: string;
  sort: number;
  activation: string;
  condition?: string;
  params: WeaponActivityParams;
  midi: Record<string, unknown>;
}): Record<string, unknown> {
  return {
    _id: opts.id,
    sort: opts.sort,
    name: opts.name,
    ...(opts.params.activityImg?.trim()
      ? { img: opts.params.activityImg.trim() }
      : {}),
    activation: {
      type: opts.activation,
      value: opts.activation === "special" ? null : 1,
      condition: opts.condition ?? opts.params.activationCondition ?? "",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: consumptionTargets(opts.params),
    },
    description: {
      chatFlavor: opts.params.chatFlavor ?? "",
    },
    duration: {
      value: opts.params.durationValue?.trim() || "",
      units: opts.params.durationUnits?.trim() || "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: rangeBlock(opts.params),
    target: targetBlock(opts.params),
    uses: usesBlock(opts.params),
    midiProperties: opts.midi,
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: opts.params.effectConditionText ?? "",
  };
}

export function midiFor(
  name: string,
  params: WeaponActivityParams,
  magical: boolean,
): Record<string, unknown> {
  return defaultMidiProperties({
    identifier: slugifyIdentifier(name),
    displayActivityName: true,
    magicDamage: params.magicDamage ?? magical,
    magicEffect: params.magicEffect ?? magical,
    ignoreFullCover: params.ignoreCover === true,
    automationOnly: params.automationOnly === true,
    toggleEffect: params.toggleEffect === true,
    ...(params.otherActivityCompatible !== undefined
      ? { otherActivityCompatible: params.otherActivityCompatible }
      : {}),
  });
}

/** Foundry / Midi activity fields usually present after saving in-world. */
export function foundryActivityEnvelope(
  activity: Record<string, unknown>,
): Record<string, unknown> {
  const type = String(activity.type ?? "");
  const isAttack = type === "attack";
  return {
    macroData: { name: "", command: "" },
    ignoreTraits: { idi: false, idr: false, idv: false, ida: false },
    isOverTimeFlag: false,
    overTimeProperties: {
      saveRemoves: true,
      preRemoveConditionText: "",
      postRemoveConditionText: "",
    },
    ...(isAttack
      ? {
          otherActivityId: "",
          otherActivityUuid: "",
          attackMode: "oneHanded",
          ammunition: "",
        }
      : { otherActivityId: "none" }),
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: isAttack ? "false" : "",
  };
}

/** Fill missing Foundry activity envelope keys without clobbering authored values. */
export function enrichWeaponActivities(item: {
  system: Record<string, unknown>;
}): void {
  const activities = item.system.activities;
  if (!activities || typeof activities !== "object") return;
  for (const activity of Object.values(
    activities as Record<string, Record<string, unknown>>,
  )) {
    if (!activity || typeof activity !== "object") continue;
    const envelope = foundryActivityEnvelope(activity);
    for (const [key, value] of Object.entries(envelope)) {
      if (activity[key] === undefined) activity[key] = value;
    }
    if (activity.img === "") delete activity.img;
    if (!activity.midiProperties || typeof activity.midiProperties !== "object") {
      activity.midiProperties = defaultMidiProperties();
    }
  }
}
