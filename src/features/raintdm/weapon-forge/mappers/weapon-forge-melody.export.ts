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
  /** Melody of Guile — ItemMacro picks a skill on activate. */
  needsSkillChoice?: boolean;
  /** Footer note override (tier hint). */
  footer?: string;
}

const FOOTER_BASE =
  "Songbook Melody for Hunting Horn. Starts inactive; Recital / Solo Recital / Encore activates Melodies as 15-foot auras for 1 minute.";

function melodyBody(title: string, rules: string, footer = FOOTER_BASE): string {
  return `<p><strong>${title}</strong></p><p>${rules}</p><p><em>${footer}</em></p>`;
}

const ATTACK_BONUS = (value: string) =>
  (["mwak", "rwak", "msak", "rsak"] as const).map((k) => ({
    key: `system.bonuses.${k}.attack`,
    mode: EFFECT_MODE.ADD,
    value,
    priority: 20,
  }));

const DAMAGE_BONUS = (value: string) =>
  (["mwak", "rwak", "msak", "rsak"] as const).map((k) => ({
    key: `system.bonuses.${k}.damage`,
    mode: EFFECT_MODE.ADD,
    value,
    priority: 20,
  }));

const RESIST = (type: string) => [
  {
    key: `system.traits.dr.value`,
    mode: EFFECT_MODE.ADD,
    value: type,
    priority: 20,
  },
];

/** Hand-tuned Songbook Melodies matching `public/data/foundry-jsons-example/weapons-resources/melodies/`. */
export const SONGBOOK_MELODY_FEATS: Record<string, MelodyFeatDef> = {
  "melody of might": {
    name: "Melody of Might",
    melodyKey: "might",
    img: "icons/skills/melee/strike-sword-blood-red.webp",
    bodyHtml: melodyBody(
      "Melody of Might",
      "Allies in the aura (including you) can add [[/r 1d4]] to the damage rolls.",
    ),
    changes: DAMAGE_BONUS("1d4"),
  },
  "melody of swiftness": {
    name: "Melody of Swiftness",
    melodyKey: "swiftness",
    img: "icons/skills/movement/feet-winged-boots-brown.webp",
    bodyHtml: melodyBody(
      "Melody of Swiftness",
      "Allies in the aura have their Speed increased by 10 feet and ignore Difficult Terrain.",
    ),
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
  "melody of precision": {
    name: "Melody of Precision",
    melodyKey: "precision",
    img: "icons/skills/targeting/crosshair-scope-yellow.webp",
    bodyHtml: melodyBody(
      "Melody of Precision",
      "Allies in the aura gain a +1 bonus to attack rolls.",
    ),
    changes: ATTACK_BONUS("1"),
  },
  "melody of guile": {
    name: "Melody of Guile",
    melodyKey: "guile",
    img: "icons/magic/control/mouth-smile-creepy-green.webp",
    bodyHtml: melodyBody(
      "Melody of Guile",
      "When you activate this Melody, choose one skill. Allies in the aura gain a +1 bonus to checks using that skill.",
    ),
    // Placeholder; ItemMacro rewrites the change key when a skill is chosen.
    changes: [
      {
        key: "system.skills.ste.bonuses.check",
        mode: EFFECT_MODE.ADD,
        value: "1",
        priority: 20,
      },
    ],
    needsSkillChoice: true,
  },
  "melody of warding": {
    name: "Melody of Warding",
    melodyKey: "warding",
    img: "icons/magic/defensive/shield-barrier-blue.webp",
    bodyHtml: melodyBody(
      "Melody of Warding",
      "Allies in the aura gain a +1 bonus to their Armor Class.",
      "Songbook Melody for Hunting Horn (Rare+). Starts inactive; Recital/Encore/Solo Recital activates Melodies as 15-foot auras for 1 minute.",
    ),
    changes: [
      {
        key: "system.attributes.ac.bonus",
        mode: EFFECT_MODE.ADD,
        value: "1",
        priority: 20,
      },
    ],
  },
  "melody of focus": {
    name: "Melody of Focus",
    melodyKey: "focus",
    img: "icons/magic/symbols/rune-sigil-red-pink.webp",
    bodyHtml: melodyBody(
      "Melody of Focus",
      "Allies in the aura (including you) gain a +1 bonus to their spell save DCs.",
    ),
    changes: [
      {
        key: "system.bonuses.spell.dc",
        mode: EFFECT_MODE.ADD,
        value: "1",
        priority: 20,
      },
    ],
  },
  "melody of harmful acid": {
    name: "Melody of Harmful Acid",
    melodyKey: "harmful-acid",
    img: "icons/magic/acid/dissolve-bone-white.webp",
    bodyHtml: melodyBody(
      "Melody of Harmful Acid",
      "Allies in the aura deal an extra [[/r 1d4]] Acid damage.",
    ),
    changes: DAMAGE_BONUS("1d4[acid]"),
  },
  "melody of harmful cold": {
    name: "Melody of Harmful Cold",
    melodyKey: "harmful-cold",
    img: "icons/magic/water/ice-crystal-white.webp",
    bodyHtml: melodyBody(
      "Melody of Harmful Cold",
      "Allies in the aura deal an extra [[/r 1d4]] Cold damage.",
    ),
    changes: DAMAGE_BONUS("1d4[cold]"),
  },
  "melody of harmful fire": {
    name: "Melody of Harmful Fire",
    melodyKey: "harmful-fire",
    img: "icons/magic/fire/flame-burning-orange.webp",
    bodyHtml: melodyBody(
      "Melody of Harmful Fire",
      "Allies in the aura deal an extra [[/r 1d4]] Fire damage.",
    ),
    changes: DAMAGE_BONUS("1d4[fire]"),
  },
  "melody of harmful lightning": {
    name: "Melody of Harmful Lightning",
    melodyKey: "harmful-lightning",
    img: "icons/magic/lightning/bolt-strike-blue.webp",
    bodyHtml: melodyBody(
      "Melody of Harmful Lightning",
      "Allies in the aura deal an extra [[/r 1d4]] Lightning damage.",
    ),
    changes: DAMAGE_BONUS("1d4[lightning]"),
  },
  "melody of harmful thunder": {
    name: "Melody of Harmful Thunder",
    melodyKey: "harmful-thunder",
    img: "icons/magic/sonic/explosion-shock-wave-teal.webp",
    bodyHtml: melodyBody(
      "Melody of Harmful Thunder",
      "Allies in the aura deal an extra [[/r 1d4]] Thunder damage.",
    ),
    changes: DAMAGE_BONUS("1d4[thunder]"),
  },
  "melody of clarity": {
    name: "Melody of Clarity",
    melodyKey: "clarity",
    img: "icons/magic/perception/eye-ringed-glow-angry-teal.webp",
    bodyHtml: melodyBody(
      "Melody of Clarity",
      "Allies in the aura have Advantage on saving throws against being Charmed, Frightened, Paralyzed, or Stunned.",
    ),
    // Honor-system / Midi condition saves — marker AE with no numeric change.
    changes: [],
  },
  "melody of vigor": {
    name: "Melody of Vigor",
    melodyKey: "vigor",
    img: "icons/magic/life/heart-glowing-red.webp",
    bodyHtml: melodyBody(
      "Melody of Vigor",
      "At the start of each of their turns, allies in the aura gain Temporary Hit Points equal to your Charisma or Strength modifier (minimum of 1).",
    ),
    changes: [],
  },
  "melody of fortitude": {
    name: "Melody of Fortitude",
    melodyKey: "fortitude",
    img: "icons/magic/defensive/armor-stone-barbs.webp",
    bodyHtml: melodyBody(
      "Melody of Fortitude",
      "Allies in the aura gain a +1 bonus to saving throws.",
    ),
    changes: [
      {
        key: "system.bonuses.abilities.save",
        mode: EFFECT_MODE.ADD,
        value: "1",
        priority: 20,
      },
    ],
  },
  "melody of recovery": {
    name: "Melody of Recovery",
    melodyKey: "recovery",
    img: "icons/magic/life/cross-beam-green.webp",
    bodyHtml: melodyBody(
      "Melody of Recovery",
      "At the start of each of their turns, allies in the aura regain Hit Points equal to your Charisma or Strength modifier (minimum of 1).",
    ),
    changes: [],
  },
  "melody of the wilds": {
    name: "Melody of the Wilds",
    melodyKey: "wilds",
    img: "icons/magic/nature/leaf-glow-maple-orange-purple.webp",
    bodyHtml: melodyBody(
      "Melody of the Wilds",
      "Allies in the aura can move across calm liquid as if it were solid ground, and they suffer no harm from extreme cold or extreme heat.",
    ),
    changes: [
      {
        key: "system.attributes.movement.hover",
        mode: EFFECT_MODE.OVERRIDE,
        value: "true",
        priority: 20,
      },
    ],
  },
  "melody of resistant acid": {
    name: "Melody of Resistant Acid",
    melodyKey: "resistant-acid",
    img: "icons/magic/acid/dissolve-bone-white.webp",
    bodyHtml: melodyBody(
      "Melody of Resistant Acid",
      "Allies in the aura gain Resistance to Acid damage.",
    ),
    changes: RESIST("acid"),
  },
  "melody of resistant cold": {
    name: "Melody of Resistant Cold",
    melodyKey: "resistant-cold",
    img: "icons/magic/water/ice-crystal-white.webp",
    bodyHtml: melodyBody(
      "Melody of Resistant Cold",
      "Allies in the aura gain Resistance to Cold damage.",
    ),
    changes: RESIST("cold"),
  },
  "melody of resistant fire": {
    name: "Melody of Resistant Fire",
    melodyKey: "resistant-fire",
    img: "icons/magic/fire/flame-burning-orange.webp",
    bodyHtml: melodyBody(
      "Melody of Resistant Fire",
      "Allies in the aura gain Resistance to Fire damage.",
    ),
    changes: RESIST("fire"),
  },
  "melody of resistant lightning": {
    name: "Melody of Resistant Lightning",
    melodyKey: "resistant-lightning",
    img: "icons/magic/lightning/bolt-strike-blue.webp",
    bodyHtml: melodyBody(
      "Melody of Resistant Lightning",
      "Allies in the aura gain Resistance to Lightning damage.",
    ),
    changes: RESIST("lightning"),
  },
  "melody of resistant thunder": {
    name: "Melody of Resistant Thunder",
    melodyKey: "resistant-thunder",
    img: "icons/magic/sonic/explosion-shock-wave-teal.webp",
    bodyHtml: melodyBody(
      "Melody of Resistant Thunder",
      "Allies in the aura gain Resistance to Thunder damage.",
    ),
    changes: RESIST("thunder"),
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
          ...(def.needsSkillChoice ? { needsSkillChoice: true } : {}),
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
