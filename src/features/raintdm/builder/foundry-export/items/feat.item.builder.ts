import type { FoundryActiveEffect, FoundryItem } from "@/shared/foundry";
import {
  foundryId,
  wrapItem,
  defaultMidiProperties,
  resolveFeatureIcon,
  slugify,
  kebab,
} from "@/shared/foundry";
import {
  featureNeedsActivity,
  parseFeatureUsage,
  type ParsedFeatureUsage,
} from "../feature-usage.utils";
import { sourceBlock, htmlDesc } from "./item-shared";

// ─── Feature / feat items ────────────────────────────────────────────────────

export type FeatSubtype = "class" | "subclass" | "race" | "background" | "feat" | "";

export interface FeatItemInput {
  name: string;
  description?: string;
  subtype: FeatSubtype;
  identifier?: string;
  img?: string;
  source?: string;
  requirements?: string;
  effects?: FoundryActiveEffect[];
  advancement?: unknown[];
  id?: string;
  /**
   * Parent class/subclass/race/background item id for sheet grouping
   * (`flags.dnd5e.advancementOrigin`). Without this, Foundry lists the feat
   * under "Other Features".
   */
  advancementOrigin?: string;
}

function buildFeatUses(usage: ParsedFeatureUsage): {
  spent: number;
  max: string;
  recovery: { period: string; type: string }[];
} {
  const recovery =
    usage.usesMax && usage.recoveryPeriod
      ? [{ period: usage.recoveryPeriod, type: "recoverAll" }]
      : [];
  return { spent: 0, max: usage.usesMax, recovery };
}

/** Utility activity so the feature is usable from the Foundry sheet / Midi. */
function buildFeatUtilityActivity(
  name: string,
  usage: ParsedFeatureUsage,
): Record<string, unknown> {
  const id = foundryId();
  const activationType = usage.activationType || "special";
  const activationValue =
    activationType === "special" ? null : (usage.activationValue ?? 1);
  const consumptionTargets = usage.usesMax
    ? [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ]
    : [];

  return {
    [id]: {
      _id: id,
      type: "utility",
      sort: 0,
      name: "",
      activation: {
        type: activationType,
        value: activationValue,
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: consumptionTargets,
      },
      description: { chatFlavor: "" },
      duration: { units: "inst", concentration: false, override: false },
      effects: [],
      range: { units: "self", override: false },
      target: {
        template: { contiguous: false, units: "ft" },
        affects: { choice: false },
        override: false,
        prompt: false,
      },
      uses: { spent: 0, max: "", recovery: [] },
      roll: { formula: "", name: "", prompt: false, visible: false },
      midiProperties: defaultMidiProperties({
        identifier: slugify(name),
      }),
    },
  };
}

export function buildFeatItem(input: FeatItemInput): FoundryItem {
  const usage = parseFeatureUsage(input.description);
  const activities = featureNeedsActivity(usage)
    ? buildFeatUtilityActivity(input.name, usage)
    : {};

  const system: Record<string, unknown> = {
    description: htmlDesc(input.description),
    source: sourceBlock(input.source),
    identifier: input.identifier ?? kebab(input.name),
    activation: {
      type: usage.activationType,
      value: usage.activationValue,
      override: false,
    },
    duration: { value: "", units: "inst", override: false },
    cover: null,
    crewed: false,
    target: { template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" }, affects: { count: "", type: "", choice: false, special: "" }, prompt: true, override: false },
    range: { value: null, long: null, reach: "", units: "", special: "", override: false },
    uses: buildFeatUses(usage),
    // Subclass features use the class feature type; sheet groups via advancementOrigin.
    type: {
      value: input.subtype === "subclass" ? "class" : input.subtype,
      subtype: "",
    },
    requirements: input.requirements ?? "",
    recharge: { value: null, charged: false },
    properties: [],
    prerequisites: { level: null },
    advancement: input.advancement ?? [],
    enchant: {},
    activities,
  };
  const flags: Record<string, unknown> = {};
  if (input.advancementOrigin) {
    flags.dnd5e = { advancementOrigin: input.advancementOrigin };
  }
  return wrapItem({
    _id: input.id,
    name: input.name,
    type: "feat",
    img: input.img ?? resolveFeatureIcon(input.subtype),
    system,
    effects: input.effects,
    flags,
  });
}

