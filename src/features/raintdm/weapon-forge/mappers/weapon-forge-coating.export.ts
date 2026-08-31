import type { FoundryActiveEffect, FoundryItem } from "@/shared/foundry";
import {
  buildEffect,
  buildFoundryItemFilename,
  defaultMidiProperties,
  EFFECT_MODE,
  FOUNDRY_EXPORT_TARGET,
  foundryIdFromSeed,
  itemMacroFlagBundle,
  wrapItem,
} from "@/shared/foundry";
import { slugifyIdentifier } from "@/shared/foundry/weapons/activity-payload";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { getAssignedFeaturesForRow } from "../utils/weapon-forge-features.utils";
import { BOW_COATINGS_ITEM_MACRO } from "./bow-coatings.macro";

export interface CoatingConsumableDef {
  name: string;
  /** Short key stored on flags.world.bow.coatingKey */
  coatingKey: string;
  img: string;
  bodyHtml: string;
  chatHtml: string;
  priceGp: number;
  /** Active Effect changes while coating charges remain. */
  changes: Array<{ key: string; mode: number; value: string; priority?: number }>;
  /** Advanced coatings with on-hit riders handled by the Bow weapon macro. */
  riderKind?: "blast" | "poison-save" | "paralysis-save" | "sleep-save";
  craftedNote?: boolean;
}

const APPLY_BLURB =
  "<p><em>Apply Coating</em> (once per turn, no action): expend this vial to gain <strong>3 charges</strong>. Each ranged attack with the Bow spends 1 charge (hit or miss). Remaining charges are lost if you apply a different coating or finish a Short or Long Rest. Coatings do not regenerate.</p>";

const DAMAGE = (formula: string) => [
  {
    key: "system.bonuses.rwak.damage",
    mode: EFFECT_MODE.ADD,
    value: formula,
    priority: 20,
  },
];

/** Hand-tuned Bow Coatings as Foundry consumable resources. */
export const BOW_COATING_DEFS: Record<string, CoatingConsumableDef> = {
  "power coating": {
    name: "Power Coating",
    coatingKey: "power",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Power Coating</strong> (Bow coating vial)</p><p>On a hit with the Bow while this coating is active, the attack deals an extra [[/r 1d6]] piercing damage.</p>${APPLY_BLURB}`,
    chatHtml:
      "<p><strong>Power Coating</strong></p><p>Extra [[/r 1d6]] piercing on hit while active (3 charges per vial).</p>",
    priceGp: 1,
    changes: DAMAGE("1d6[piercing]"),
  },
  "close range coating": {
    name: "Close Range Coating",
    coatingKey: "close-range",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Close Range Coating</strong> (Bow coating vial)</p><p>While this coating is active, you do not have Disadvantage on ranged attacks with the Bow from a hostile creature within 5 feet of you.</p>${APPLY_BLURB}<p><em>Requires Midi QOL Nearby Foe optional rule (or equivalent) for full automation via <code>flags.midi-qol.ignoreNearbyFoes</code>.</em></p>`,
    chatHtml:
      "<p><strong>Close Range Coating</strong></p><p>Ignore nearby-foe Disadvantage on ranged attacks (3 charges per vial).</p>",
    priceGp: 1,
    changes: [
      {
        key: "flags.midi-qol.ignoreNearbyFoes",
        mode: EFFECT_MODE.OVERRIDE,
        value: "1",
        priority: 20,
      },
    ],
  },
  "acid coating": {
    name: "Acid Coating",
    coatingKey: "acid",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Acid Coating</strong> (Bow coating vial)</p><p>On a hit with the Bow while this coating is active, the attack deals an extra [[/r 1d6]] acid damage.</p>${APPLY_BLURB}<p><em>Crafted coating (not sold in standard shops).</em></p>`,
    chatHtml:
      "<p><strong>Acid Coating</strong></p><p>Extra [[/r 1d6]] acid on hit while active (3 charges per vial).</p>",
    priceGp: 2,
    changes: DAMAGE("1d6[acid]"),
    craftedNote: true,
  },
  "cold coating": {
    name: "Cold Coating",
    coatingKey: "cold",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Cold Coating</strong> (Bow coating vial)</p><p>On a hit with the Bow while this coating is active, the attack deals an extra [[/r 1d6]] cold damage.</p>${APPLY_BLURB}<p><em>Crafted coating (not sold in standard shops).</em></p>`,
    chatHtml:
      "<p><strong>Cold Coating</strong></p><p>Extra [[/r 1d6]] cold on hit while active (3 charges per vial).</p>",
    priceGp: 2,
    changes: DAMAGE("1d6[cold]"),
    craftedNote: true,
  },
  "fire coating": {
    name: "Fire Coating",
    coatingKey: "fire",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Fire Coating</strong> (Bow coating vial)</p><p>On a hit with the Bow while this coating is active, the attack deals an extra [[/r 1d6]] fire damage.</p>${APPLY_BLURB}<p><em>Crafted coating (not sold in standard shops).</em></p>`,
    chatHtml:
      "<p><strong>Fire Coating</strong></p><p>Extra [[/r 1d6]] fire on hit while active (3 charges per vial).</p>",
    priceGp: 2,
    changes: DAMAGE("1d6[fire]"),
    craftedNote: true,
  },
  "lightning coating": {
    name: "Lightning Coating",
    coatingKey: "lightning",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Lightning Coating</strong> (Bow coating vial)</p><p>On a hit with the Bow while this coating is active, the attack deals an extra [[/r 1d6]] lightning damage.</p>${APPLY_BLURB}<p><em>Crafted coating (not sold in standard shops).</em></p>`,
    chatHtml:
      "<p><strong>Lightning Coating</strong></p><p>Extra [[/r 1d6]] lightning on hit while active (3 charges per vial).</p>",
    priceGp: 2,
    changes: DAMAGE("1d6[lightning]"),
    craftedNote: true,
  },
  "blast coating": {
    name: "Blast Coating",
    coatingKey: "blast",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Blast Coating</strong> (Bow coating vial · Advanced)</p><p>On a hit, each other creature within 5 feet of the target must succeed on a Dexterity saving throw against your Bow Save DC or take [[/r 1d8]] fire damage.</p>${APPLY_BLURB}`,
    chatHtml:
      "<p><strong>Blast Coating</strong></p><p>5-ft splash: Dex save or 1d8 fire (3 charges per vial).</p>",
    priceGp: 5,
    changes: [],
    riderKind: "blast",
  },
  "poison coating": {
    name: "Poison Coating",
    coatingKey: "poison",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Poison Coating</strong> (Bow coating vial · Advanced)</p><p>On a hit, the attack deals an extra [[/r 1d4]] poison damage, and the target must succeed on a Constitution saving throw against your Bow Save DC or have the Poisoned condition for 1 minute.</p>${APPLY_BLURB}`,
    chatHtml:
      "<p><strong>Poison Coating</strong></p><p>+1d4 poison; Con save or Poisoned 1 minute (3 charges per vial).</p>",
    priceGp: 4,
    changes: DAMAGE("1d4[poison]"),
    riderKind: "poison-save",
  },
  "paralysis coating": {
    name: "Paralysis Coating",
    coatingKey: "paralysis",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Paralysis Coating</strong> (Bow coating vial · Advanced)</p><p>On a hit, the attack deals an extra [[/r 1d4]] lightning damage, and the target must succeed on a Constitution saving throw against your Bow Save DC or have the Paralyzed condition until the end of its next turn. If the target succeeds on this save, it is immune to your Paralysis Coating for 24 hours.</p>${APPLY_BLURB}`,
    chatHtml:
      "<p><strong>Paralysis Coating</strong></p><p>+1d4 lightning; Con save or Paralyzed until end of its next turn (3 charges per vial).</p>",
    priceGp: 4,
    changes: DAMAGE("1d4[lightning]"),
    riderKind: "paralysis-save",
  },
  "sleep coating": {
    name: "Sleep Coating",
    coatingKey: "sleep",
    img: "mh-icons/coating-full.webp",
    bodyHtml: `<p><strong>Sleep Coating</strong> (Bow coating vial · Advanced)</p><p>On a hit, the target must succeed on a Constitution saving throw against your Bow Save DC or have the Unconscious condition for 1 minute, or until it takes damage or another creature uses an action to shake it awake. Constructs and Undead automatically succeed on the save.</p>${APPLY_BLURB}`,
    chatHtml:
      "<p><strong>Sleep Coating</strong></p><p>Con save or Unconscious 1 minute (3 charges per vial).</p>",
    priceGp: 5,
    changes: [],
    riderKind: "sleep-save",
  },
};

function buildApplyActivity(def: CoatingConsumableDef): Record<string, unknown> {
  const id = foundryIdFromSeed(`act-apply-coating-${def.coatingKey}`);
  return {
    _id: id,
    type: "utility",
    sort: 0,
    name: "Apply Coating",
    img: def.img,
    activation: {
      type: "special",
      value: null,
      condition: "Once on each of your turns (no action required)",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
    },
    description: {
      chatFlavor: `Apply ${def.name} (3 charges)`,
    },
    duration: {
      value: "",
      units: "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: {
      value: null,
      units: "self",
      special: "",
      override: false,
    },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: {
        count: "",
        type: "self",
        choice: false,
        special: "",
      },
      prompt: false,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: defaultMidiProperties({
      identifier: "apply-coating",
      displayActivityName: true,
      magicEffect: false,
      magicDamage: false,
    }),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "false",
    otherActivityId: "none",
  };
}

function buildCoatingTemplateEffect(def: CoatingConsumableDef): FoundryActiveEffect {
  const effect = buildEffect({
    name: `${def.name} (Active) [3/3]`,
    img: def.img,
    transfer: false,
    disabled: true,
    changes: def.changes.map((c) => ({
      key: c.key,
      mode: c.mode,
      value: c.value,
      priority: c.priority ?? 20,
    })),
    description:
      def.riderKind != null
        ? "<p>Advanced coating rider resolved by Bow Item Macro on hit. Charges tracked by Bow Item Macro.</p>"
        : "<p>Coating effect while charges remain. Charges tracked by Bow Item Macro.</p>",
    flags: {
      dae: {
        enableCondition: "",
        selfTarget: true,
        selfTargetAlways: true,
        stackable: "noneName",
        showIcon: true,
        durationExpression: "",
        specialDuration: ["shortRest", "longRest"],
        disableIncapacitated: false,
        dontApply: false,
      },
      world: {
        bow: {
          isCoatingTemplate: true,
          isCoatingActive: true,
          coatingKey: def.coatingKey,
          charges: 3,
          chargesMax: 3,
          ...(def.riderKind ? { riderKind: def.riderKind } : {}),
        },
      },
    },
  });
  effect._id = foundryIdFromSeed(`eff-coating-active-${def.coatingKey}`);
  return effect;
}

function coatingItemFlags(def: CoatingConsumableDef): Record<string, unknown> {
  return {
    "amellwind-toolbox": {
      exportKind: "weapon-resource",
      resourceKind: "coating",
      baseWeaponName: "Bow",
    },
    world: {
      bow: {
        isCoating: true,
        coatingKey: def.coatingKey,
        chargesPerVial: 3,
        ...(def.riderKind ? { riderKind: def.riderKind } : {}),
      },
    },
    ...itemMacroFlagBundle({
      name: def.name,
      command: BOW_COATINGS_ITEM_MACRO,
      passes: ["preTargeting", "postActiveEffects"],
    }),
    exportSource: {
      world: "amellwind-toolbox",
      system: FOUNDRY_EXPORT_TARGET.systemId,
      coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
      systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
    },
  };
}

export function buildCoatingConsumableItem(def: CoatingConsumableDef): FoundryItem {
  const apply = buildApplyActivity(def);
  const template = buildCoatingTemplateEffect(def);

  const system: Record<string, unknown> = {
    description: { value: def.bodyHtml, chat: def.chatHtml },
    source: {
      custom: "",
      book: "RAINTDM",
      page: "",
      license: "",
      rules: FOUNDRY_EXPORT_TARGET.rules,
      revision: 1,
    },
    identifier: slugifyIdentifier(def.name),
    quantity: 1,
    weight: { value: 0.25, units: "lb" },
    price: { value: def.priceGp, denomination: "gp" },
    rarity: "",
    identified: true,
    unidentified: {
      description: "",
      name: "Mysterious Coating",
    },
    container: null,
    attunement: "",
    attuned: false,
    equipped: false,
    type: { value: "poison", subtype: "" },
    damage: {
      base: {
        number: null,
        denomination: null,
        types: [],
        custom: { enabled: false, formula: "" },
        scaling: { mode: "", number: null },
        bonus: "",
      },
      replace: false,
    },
    magicalBonus: null,
    properties: [],
    uses: {
      spent: 0,
      max: "1",
      recovery: [],
      autoDestroy: true,
    },
    activities: { [String(apply._id)]: apply },
  };

  return wrapItem({
    name: def.name,
    type: "consumable",
    img: def.img,
    system,
    effects: [template],
    flags: coatingItemFlags(def),
  });
}

/**
 * Build Bow coating consumables unlocked under the Coatings column up to this rarity.
 */
export function buildWeaponCoatingConsumableItems(
  weapon: CustomWeapon,
  rarityIndex: number,
): FoundryItem[] {
  const out: FoundryItem[] = [];
  const seen = new Set<string>();
  const end = Math.min(rarityIndex, weapon.rarityRows.length - 1);

  for (let i = 0; i <= end; i++) {
    const row = weapon.rarityRows[i];
    if (!row) continue;
    for (const ref of getAssignedFeaturesForRow(row, weapon.customFeatures)) {
      const col = ref.resourceColumn?.trim() ?? "";
      if (!/^coatings?$/i.test(col)) continue;

      const key = ref.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      if (/upgrade/i.test(key)) continue;
      const def = BOW_COATING_DEFS[key];
      if (!def) continue;
      seen.add(key);
      out.push(buildCoatingConsumableItem(def));
    }
  }

  return out;
}

export function coatingConsumableFilename(item: FoundryItem): string {
  return buildFoundryItemFilename(item.name || "coating");
}
