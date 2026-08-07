import type { FoundryActiveEffect, FoundryItem } from "@/shared/foundry";
import {
  buildEffect,
  buildFoundryItemFilename,
  EFFECT_MODE,
  FOUNDRY_EXPORT_TARGET,
  wrapItem,
} from "@/shared/foundry";
import { slugifyIdentifier } from "@/shared/foundry/weapons/activity-payload";
import type { CustomWeapon } from "../types/weapon-forge.types";
import { getAssignedFeaturesForRow } from "../utils/weapon-forge-features.utils";

export interface MelodyFeatDef {
  name: string;
  /** Short key stored on flags.world.hh.melodyKey */
  melodyKey: string;
  img: string;
  bodyHtml: string;
  changes: Array<{ key: string; mode: number; value: string; priority?: number }>;
}

/** Hand-tuned Songbook Melodies matching `public/data/foundry-jsons-example/weapons-resources/`. */
export const SONGBOOK_MELODY_FEATS: Record<string, MelodyFeatDef> = {
  "melody of might": {
    name: "Melody of Might",
    melodyKey: "might",
    img: "icons/skills/melee/strike-sword-blood-red.webp",
    bodyHtml:
      "<p><strong>Melody of Might</strong></p><p>Allies in the aura (including you) can add [[/r 1d4]] to the damage rolls.</p><p><em>Songbook Melody for Hunting Horn. Starts inactive; Recital activates one Melody as a 15-foot aura for 1 minute.</em></p>",
    changes: [
      {
        key: "system.bonuses.mwak.damage",
        mode: EFFECT_MODE.ADD,
        value: "1d4",
        priority: 20,
      },
      {
        key: "system.bonuses.rwak.damage",
        mode: EFFECT_MODE.ADD,
        value: "1d4",
        priority: 20,
      },
      {
        key: "system.bonuses.msak.damage",
        mode: EFFECT_MODE.ADD,
        value: "1d4",
        priority: 20,
      },
      {
        key: "system.bonuses.rsak.damage",
        mode: EFFECT_MODE.ADD,
        value: "1d4",
        priority: 20,
      },
    ],
  },
  "melody of swiftness": {
    name: "Melody of Swiftness",
    melodyKey: "swiftness",
    img: "icons/skills/movement/feet-winged-boots-brown.webp",
    bodyHtml:
      "<p><strong>Melody of Swiftness</strong></p><p>Allies in the aura have their Speed increased by 10 feet and ignore Difficult Terrain.</p><p><em>Songbook Melody for Hunting Horn. Starts inactive; Recital activates one Melody as a 15-foot aura for 1 minute.</em></p>",
    changes: [
      {
        key: "system.attributes.movement.bonus",
        mode: EFFECT_MODE.ADD,
        value: "10",
        priority: 20,
      },
      {
        key: "system.attributes.movement.ignoredDifficultTerrain",
        mode: EFFECT_MODE.ADD,
        value: "all",
        priority: 20,
      },
    ],
  },
};

function buildMelodyAuraEffect(def: MelodyFeatDef): FoundryActiveEffect {
  return buildEffect({
    name: `${def.name} (Aura 15 ft)`,
    img: def.img,
    transfer: true,
    disabled: true,
    changes: def.changes.map((c) => ({
      key: c.key,
      mode: c.mode,
      value: c.value,
      priority: c.priority ?? 20,
    })),
    flags: {
      ActiveAuras: {
        isAura: true,
        aura: "Allies",
        radius: "15",
        alignment: "",
        type: "",
        customCheck: "",
        ignoreSelf: false,
        height: false,
        hidden: false,
        displayTemp: true,
        hostile: false,
        onlyOnce: false,
        wallsBlock: "system",
        statuses: [],
      },
      dae: {
        enableCondition: "",
        selfTarget: false,
        selfTargetAlways: false,
        stackable: "noneName",
        showIcon: true,
        durationExpression: "",
        specialDuration: ["isIncapacitated"],
        disableIncapacitated: false,
        dontApply: false,
      },
      world: {
        hh: { isMelodyAura: true },
      },
    },
  });
}

export function buildMelodyFeatItem(def: MelodyFeatDef): FoundryItem {
  const system: Record<string, unknown> = {
    description: { value: def.bodyHtml, chat: "" },
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
    requirements: "Hunting Horn (Songbook)",
    properties: [],
    activities: {},
    enchant: {},
    prerequisites: { level: null, repeatable: false },
    uses: { spent: 0, max: "", recovery: [] },
  };

  return wrapItem({
    name: def.name,
    type: "feat",
    img: def.img,
    system,
    effects: [buildMelodyAuraEffect(def)],
    flags: {
      exportSource: {
        world: "amellwind-toolbox",
        system: FOUNDRY_EXPORT_TARGET.systemId,
        coreVersion: FOUNDRY_EXPORT_TARGET.coreVersion,
        systemVersion: FOUNDRY_EXPORT_TARGET.systemVersion,
      },
      world: {
        hh: {
          isMelody: true,
          melodyKey: def.melodyKey,
        },
      },
    },
  });
}

/**
 * Build Songbook Melody feat items unlocked through Melodies/Notes up to this rarity.
 * Only Melodies with a catalogued Foundry feat definition are emitted.
 */
export function buildWeaponMelodyFeatItems(
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
      if (col && !/^melod/i.test(col) && !/^notes?$/i.test(col)) continue;
      // Melodies live under resource columns; skip combat Features.
      if (!col) continue;

      const key = ref.name.trim().toLowerCase();
      if (seen.has(key)) continue;
      const def = SONGBOOK_MELODY_FEATS[key];
      if (!def) continue;
      seen.add(key);
      out.push(buildMelodyFeatItem(def));
    }
  }

  return out;
}

export function melodyFeatFilename(item: FoundryItem): string {
  return buildFoundryItemFilename(item.name || "melody");
}
