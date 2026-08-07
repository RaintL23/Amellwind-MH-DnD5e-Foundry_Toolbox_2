import type { FoundryActiveEffect, FoundryItem } from "@/shared/foundry";
import {
  buildEffect,
  buildFoundryItemFilename,
  defaultMidiProperties,
  FOUNDRY_EXPORT_TARGET,
  foundryIdFromSeed,
  wrapItem,
} from "@/shared/foundry";
import { slugifyIdentifier } from "@/shared/foundry/weapons/activity-payload";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { getAssignedFeaturesForRow } from "../utils/weapon-forge-features.utils";

export interface PhialFeatDef {
  name: string;
  /** Short key stored on flags.world.sa.phialKey */
  phialKey: string;
  img: string;
  bodyHtml: string;
  chatHtml: string;
  /** Damage die for Phial Discharge when this phial is installed. */
  damageFormula: string;
  /** Damage type id (empty for Element — player picks Acid/Cold/Fire/Lightning). */
  damageType: string;
  /**
   * Optional on-hit rider after Phial Discharge (Exhaust speed/reactions,
   * Poison CON save, …).
   */
  rider?: {
    kind: "exhaust" | "poison";
    saveAbility?: string;
    statuses?: string[];
    /** Feet to subtract from walk speed (Exhaust). */
    speedPenalty?: number;
    chatFlavor?: string;
  };
}

/** Hand-tuned Switch Axe Phials for Foundry resource feats. */
export const SWITCH_AXE_PHIAL_FEATS: Record<string, PhialFeatDef> = {
  "power phial": {
    name: "Power Phial",
    phialKey: "power",
    img: "icons/weapons/ammunition/arrowhead-glowing-blue.webp",
    bodyHtml:
      "<p><strong>Power Phial</strong></p><p>Deals an extra [[/r 1d6]] Slashing damage when your Phial Discharge activates.</p><p><em>Install one Phial Type after a Long Rest. Only one Phial can be installed at a time.</em></p>",
    chatHtml:
      "<p><strong>Power Phial</strong></p><p>Extra [[/r 1d6]] Slashing on Phial Discharge.</p>",
    damageFormula: "1d6",
    damageType: "slashing",
  },
  "element phial": {
    name: "Element Phial",
    phialKey: "element",
    img: "icons/magic/fire/projectile-embers-orange.webp",
    bodyHtml:
      "<p><strong>Element Phial</strong></p><p>Deals an extra [[/r 1d8]] Acid, Cold, Fire, or Lightning damage (chosen during your Long Rest) when your Phial Discharge activates.</p><p><em>Install one Phial Type after a Long Rest. Only one Phial can be installed at a time. Set the damage type on the Discharge activity to match your choice.</em></p>",
    chatHtml:
      "<p><strong>Element Phial</strong></p><p>Extra [[/r 1d8]] Acid/Cold/Fire/Lightning on Phial Discharge.</p>",
    damageFormula: "1d8",
    damageType: "",
  },
  "exhaust phial": {
    name: "Exhaust Phial",
    phialKey: "exhaust",
    img: "icons/magic/control/silhouette-hold-beam-blue.webp",
    bodyHtml:
      "<p><strong>Exhaust Phial</strong></p><p>Deals an extra [[/r 1d6]] Bludgeoning damage. The target's speed is reduced by 10 feet and it cannot take Reactions until the start of its next turn.</p><p><em>Install one Phial Type after a Long Rest. Only one Phial can be installed at a time.</em></p>",
    chatHtml:
      "<p><strong>Exhaust Phial</strong></p><p>Extra [[/r 1d6]] Bludgeoning; −10 ft speed and no Reactions until start of its next turn.</p>",
    damageFormula: "1d6",
    damageType: "bludgeoning",
    rider: {
      kind: "exhaust",
      speedPenalty: 10,
      chatFlavor:
        "Speed −10 ft; cannot take Reactions until the start of its next turn.",
    },
  },
  "poison phial": {
    name: "Poison Phial",
    phialKey: "poison",
    img: "icons/magic/acid/dissolve-arm-flesh.webp",
    bodyHtml:
      "<p><strong>Poison Phial</strong></p><p>Deals an extra [[/r 1d6]] Poison damage. The target must succeed on a Constitution saving throw (DC 8 + your Proficiency Bonus + your Strength modifier) or be Poisoned until the end of its next turn.</p><p><em>Install one Phial Type after a Long Rest. Only one Phial can be installed at a time.</em></p>",
    chatHtml:
      "<p><strong>Poison Phial</strong></p><p>Extra [[/r 1d6]] Poison; CON save or Poisoned until end of its next turn.</p>",
    damageFormula: "1d6",
    damageType: "poison",
    rider: {
      kind: "poison",
      saveAbility: "con",
      statuses: ["poisoned"],
      chatFlavor:
        "CON save (DC 8 + PB + STR) or Poisoned until the end of its next turn.",
    },
  },
};

function buildInstallActivity(def: PhialFeatDef): Record<string, unknown> {
  const id = foundryIdFromSeed(`act-install-phial-${def.phialKey}`);
  return {
    _id: id,
    type: "utility",
    sort: 0,
    name: "Install Phial",
    img: def.img,
    activation: {
      type: "special",
      value: null,
      condition: "When you finish a Long Rest",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    },
    description: {
      chatFlavor: `Install ${def.name}. Disable other Phial Install AEs so only one is active.`,
    },
    duration: {
      value: "",
      units: "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: {
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
      identifier: `install-${def.phialKey}-phial`,
      displayActivityName: true,
    }),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  };
}

function buildInstalledMarkerEffect(def: PhialFeatDef): FoundryActiveEffect {
  const effect = buildEffect({
    name: `${def.name} (Installed)`,
    img: def.img,
    transfer: true,
    disabled: true,
    changes: [],
    flags: {
      dae: {
        enableCondition: "",
        selfTarget: false,
        selfTargetAlways: false,
        stackable: "noneName",
        showIcon: true,
        durationExpression: "",
        specialDuration: [],
        disableIncapacitated: false,
        dontApply: false,
      },
      world: {
        sa: {
          isPhialInstalled: true,
          phialKey: def.phialKey,
          damageFormula: def.damageFormula,
          damageType: def.damageType,
        },
      },
    },
  });
  effect._id = foundryIdFromSeed(`eff-phial-installed-${def.phialKey}`);
  return effect;
}

export function buildPhialFeatItem(def: PhialFeatDef): FoundryItem {
  const install = buildInstallActivity(def);
  const marker = buildInstalledMarkerEffect(def);
  // Link Install → marker AE so clicking Install can apply it (Midi / sheet).
  (install.effects as Array<{ _id: string }>).push({ _id: marker._id });

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
    type: { value: "feat", subtype: "" },
    requirements: "Switch Axe (Phial Gauge)",
    properties: [],
    activities: { [String(install._id)]: install },
    enchant: {},
    prerequisites: { level: null, repeatable: false },
    uses: { spent: 0, max: "", recovery: [] },
  };

  return wrapItem({
    name: def.name,
    type: "feat",
    img: def.img,
    system,
    effects: [marker],
    flags: {
      exportSource: {
        world: "amellwind-toolbox",
        system: FOUNDRY_EXPORT_TARGET.systemId,
        coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
        systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
      },
      world: {
        sa: {
          isPhial: true,
          phialKey: def.phialKey,
        },
      },
    },
  });
}

/**
 * Build Phial feat items unlocked under the Phials column up to this rarity.
 * Only Phials with a catalogued Foundry feat definition are emitted.
 */
export function buildWeaponPhialFeatItems(
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
      if (!/^phials?$/i.test(col)) continue;

      const key = ref.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      const def = SWITCH_AXE_PHIAL_FEATS[key];
      if (!def) continue;
      seen.add(key);
      out.push(buildPhialFeatItem(def));
    }
  }

  return out;
}

/** Unlocked catalogued phial defs through this rarity (for weapon overlay). */
export function listUnlockedPhialDefs(
  weapon: CustomWeapon,
  rarityIndex: number,
): PhialFeatDef[] {
  const defs: PhialFeatDef[] = [];
  const seen = new Set<string>();
  const end = Math.min(rarityIndex, weapon.rarityRows.length - 1);

  for (let i = 0; i <= end; i++) {
    const row = weapon.rarityRows[i];
    if (!row) continue;
    for (const ref of getAssignedFeaturesForRow(row, weapon.customFeatures)) {
      const col = ref.resourceColumn?.trim() ?? "";
      if (!/^phials?$/i.test(col)) continue;
      const key = ref.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      const def = SWITCH_AXE_PHIAL_FEATS[key];
      if (!def) continue;
      seen.add(key);
      defs.push(def);
    }
  }

  return defs;
}

export function phialFeatFilename(item: FoundryItem): string {
  return buildFoundryItemFilename(item.name || "phial");
}
