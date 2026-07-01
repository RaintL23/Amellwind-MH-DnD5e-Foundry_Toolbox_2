/**
 * Midi-QoL / DAE automation overlays applied on top of the base Foundry items
 * the exporter builds, mirroring how the *Plutonium Addon: Automation* module
 * enriches documents at import time.
 *
 * Each overlay is a small patch (Active Effects carrying `flags.midi-qol.*`,
 * `flags.dae.*`, `system.traits.*` changes) merged onto an item that matches by
 * name. The exported actor therefore behaves as if it had been imported through
 * Plutonium + Automation, provided the target world has Midi QoL, DAE and
 * Times Up active.
 *
 * Automation data is ported from TheGiddyLimit/plutonium-addon-automation
 * (MIT License, © 2022 TheGiddyLimit). Only the mechanical effect data is
 * reproduced; base item data still comes from this app's own builders.
 *
 * `transfer` semantics:
 *  - `true`  → passive effect, always active while the item is owned
 *    (magic-item bonuses, always-on feats).
 *  - `false` → effect applied on use/cast (spells, activated class features).
 */

import { EFFECT_MODE } from "./effect.builders";

export interface AutomationChange {
  key: string;
  mode: number;
  value: string;
  /** Defaults to 20 when omitted. */
  priority?: number;
}

export interface AutomationEffect {
  /** Effect label; falls back to the item name when omitted. */
  name?: string;
  img?: string;
  transfer?: boolean;
  disabled?: boolean;
  changes: AutomationChange[];
  /** Partial duration (e.g. `{ seconds: 60 }`, `{ rounds: 1 }`). */
  duration?: Record<string, unknown>;
  /** Effect flags such as `dae.specialDuration`, `core.statusId`, `ActiveAuras`. */
  flags?: Record<string, unknown>;
  statuses?: string[];
}

export interface AutomationOverlay {
  /** Source book code, for reference / future disambiguation. */
  source?: string;
  /** Item-level flag merge (e.g. `midiProperties`). */
  flags?: Record<string, unknown>;
  effects?: AutomationEffect[];
}

const M = EFFECT_MODE;

/** Keyed by normalized (lowercase, trimmed) item name. */
const AUTOMATIONS: Record<string, AutomationOverlay> = {
  // ── Magic items (passive) ──────────────────────────────────────────────────
  "cloak of protection": {
    source: "DMG",
    effects: [
      {
        name: "Bonus AC",
        transfer: true,
        changes: [{ key: "system.attributes.ac.bonus", mode: M.ADD, value: "+1" }],
      },
      {
        name: "Saving Throw Bonus",
        transfer: true,
        changes: [{ key: "system.bonuses.abilities.save", mode: M.ADD, value: "+1" }],
      },
    ],
  },
  "ring of protection": {
    source: "DMG",
    effects: [
      {
        name: "Bonus AC",
        transfer: true,
        changes: [{ key: "system.attributes.ac.bonus", mode: M.ADD, value: "+1" }],
      },
      {
        name: "Saving Throw Bonus",
        transfer: true,
        changes: [{ key: "system.bonuses.abilities.save", mode: M.ADD, value: "+1" }],
      },
    ],
  },
  "bracers of defense": {
    source: "DMG",
    effects: [
      {
        name: "Bonus AC",
        transfer: true,
        changes: [{ key: "system.attributes.ac.bonus", mode: M.ADD, value: "+2" }],
      },
    ],
  },
  "amulet of health": {
    source: "DMG",
    effects: [
      {
        name: "Constitution 19",
        transfer: true,
        changes: [{ key: "system.abilities.con.value", mode: M.OVERRIDE, value: "19" }],
      },
    ],
  },
  "headband of intellect": {
    source: "DMG",
    effects: [
      {
        name: "Intelligence 19",
        transfer: true,
        changes: [{ key: "system.abilities.int.value", mode: M.OVERRIDE, value: "19" }],
      },
    ],
  },
  "gauntlets of ogre power": {
    source: "DMG",
    effects: [
      {
        name: "Strength 19",
        transfer: true,
        changes: [{ key: "system.abilities.str.value", mode: M.OVERRIDE, value: "19" }],
      },
    ],
  },
  "belt of giant strength (hill)": {
    source: "DMG",
    effects: [
      {
        name: "Strength 21",
        transfer: true,
        changes: [{ key: "system.abilities.str.value", mode: M.OVERRIDE, value: "21" }],
      },
    ],
  },
  "sentinel shield": {
    source: "DMG",
    effects: [
      {
        transfer: true,
        changes: [
          { key: "flags.midi-qol.advantage.skill.prc", mode: M.CUSTOM, value: "1" },
          { key: "flags.midi-qol.advantage.ability.check.init", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },

  // ── Feats (passive) ─────────────────────────────────────────────────────────
  "war caster": {
    source: "PHB",
    effects: [
      {
        transfer: true,
        changes: [
          { key: "flags.midi-qol.advantage.concentration", mode: M.OVERRIDE, value: "1" },
        ],
      },
    ],
  },
  "heavy armor master": {
    source: "PHB",
    effects: [
      {
        transfer: true,
        changes: [
          { key: "system.traits.dm.midi.non-magical-physical", mode: M.ADD, value: "-3" },
        ],
      },
    ],
  },

  // ── Class / subclass features (applied on activation) ───────────────────────
  rage: {
    source: "PHB",
    effects: [
      {
        transfer: false,
        duration: { seconds: 60 },
        flags: { dae: { selfTargetAlways: true } },
        changes: [
          { key: "system.traits.dr.value", mode: M.ADD, value: "bludgeoning" },
          { key: "system.traits.dr.value", mode: M.ADD, value: "piercing" },
          { key: "system.traits.dr.value", mode: M.ADD, value: "slashing" },
          { key: "system.bonuses.mwak.damage", mode: M.ADD, value: "+ @scale.barbarian.rage-damage" },
          { key: "flags.midi-qol.advantage.ability.save.str", mode: M.CUSTOM, value: "1" },
          { key: "flags.midi-qol.advantage.ability.check.str", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },
  "reckless attack": {
    source: "PHB",
    effects: [
      {
        transfer: false,
        duration: { turns: 1 },
        flags: { dae: { selfTargetAlways: true } },
        changes: [
          {
            key: "flags.midi-qol.advantage.attack.str",
            mode: M.CUSTOM,
            value: 'activity.attack.type.value === "melee" && activity.attack.type.classification === "weapon"',
          },
        ],
      },
      {
        name: "Reckless Defense",
        img: "icons/skills/melee/shield-damaged-broken-orange.webp",
        transfer: false,
        duration: { rounds: 1 },
        flags: { dae: { selfTargetAlways: true } },
        changes: [
          { key: "flags.midi-qol.grants.advantage.attack.all", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },
  "patient defense": {
    source: "PHB",
    effects: [
      {
        transfer: false,
        duration: { seconds: 7 },
        flags: { dae: { specialDuration: ["turnStartSource", "shortRest"], selfTargetAlways: true } },
        changes: [
          { key: "flags.midi-qol.grants.disadvantage.attack.all", mode: M.OVERRIDE, value: "1" },
          { key: "flags.midi-qol.advantage.ability.save.dex", mode: M.OVERRIDE, value: "1" },
        ],
      },
    ],
  },
  "steady aim": {
    source: "TCE",
    effects: [
      {
        transfer: false,
        flags: { dae: { specialDuration: ["1Attack", "turnEndSource"], selfTargetAlways: true } },
        changes: [
          { key: "flags.midi-qol.advantage.attack.all", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },

  // ── Spells (applied on cast) ────────────────────────────────────────────────
  aid: {
    source: "PHB",
    effects: [
      {
        transfer: false,
        duration: { seconds: 28800 },
        changes: [
          { key: "system.attributes.hp.tempmax", mode: M.ADD, value: "+ (@item.level - 1) * 5" },
        ],
      },
    ],
  },
  blur: {
    source: "PHB",
    effects: [
      {
        transfer: false,
        duration: { seconds: 60 },
        flags: { dae: { selfTargetAlways: true } },
        changes: [
          { key: "flags.midi-qol.grants.disadvantage.attack.all", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },
  "comprehend languages": {
    source: "PHB",
    effects: [
      {
        transfer: false,
        flags: { dae: { stackable: "noneName", selfTargetAlways: true } },
        changes: [
          { key: "system.traits.languages.all", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },
  frostbite: {
    source: "XGE",
    effects: [
      {
        transfer: false,
        flags: {
          core: { statusId: "Frostbite" },
          dae: { specialDuration: ["turnEnd", "1Attack:mwak", "1Attack:rwak"] },
        },
        changes: [
          { key: "flags.midi-qol.disadvantage.attack.mwak", mode: M.CUSTOM, value: "1" },
          { key: "flags.midi-qol.disadvantage.attack.rwak", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },
  guidance: {
    source: "PHB",
    effects: [
      {
        name: "Guidance",
        transfer: false,
        flags: { dae: { stackable: "noneName", specialDuration: ["isInitiative"] } },
        changes: [
          { key: "flags.midi-qol.optional.guidance.label", mode: M.CUSTOM, value: "Guidance" },
          { key: "flags.midi-qol.optional.guidance.check.all", mode: M.CUSTOM, value: "+ 1d4" },
          { key: "flags.midi-qol.optional.guidance.skill.all", mode: M.CUSTOM, value: "+ 1d4" },
          { key: "system.attributes.init.bonus", mode: M.CUSTOM, value: "+ 1d4" },
        ],
      },
    ],
  },
  haste: {
    source: "PHB",
    effects: [
      {
        transfer: false,
        duration: { seconds: 60 },
        changes: [
          { key: "system.attributes.ac.bonus", mode: M.ADD, value: "+2" },
          { key: "system.attributes.movement.all", mode: M.CUSTOM, value: "*2" },
          { key: "flags.midi-qol.advantage.ability.save.dex", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },
  "mind blank": {
    source: "PHB",
    effects: [
      {
        name: "Mind Blank",
        transfer: false,
        changes: [
          { key: "system.traits.di.value", mode: M.ADD, value: "psychic" },
        ],
      },
    ],
  },
  "otiluke's resilient sphere": {
    source: "PHB",
    effects: [
      {
        transfer: false,
        changes: [
          { key: "system.attributes.movement.all", mode: M.CUSTOM, value: "* 0.5" },
          { key: "system.traits.di.all", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },
  "psychic scream": {
    source: "XGE",
    effects: [
      {
        name: "Psychic Scream - Stunned",
        transfer: false,
        duration: { rounds: 99 },
        statuses: ["stunned"],
        changes: [
          {
            key: "flags.midi-qol.OverTime",
            mode: M.OVERRIDE,
            value: "label=Psychic Scream Stun (End of Turn),turn=end,saveDC=@attributes.spell.dc,saveAbility=int,saveMagic=true,killAnim=true",
          },
        ],
      },
    ],
  },
  resistance: {
    source: "PHB",
    effects: [
      {
        transfer: false,
        changes: [
          { key: "flags.midi-qol.optional.resistance.label", mode: M.CUSTOM, value: "Resistance" },
          { key: "flags.midi-qol.optional.resistance.save.all", mode: M.CUSTOM, value: "+ 1d4" },
        ],
      },
    ],
  },
  "silvery barbs": {
    source: "SCC",
    effects: [
      {
        transfer: false,
        duration: { seconds: 60 },
        flags: { dae: { specialDuration: ["isSave", "isCheck", "isSkill", "1Attack"] } },
        changes: [
          { key: "flags.midi-qol.advantage.all", mode: M.OVERRIDE, value: "1" },
        ],
      },
    ],
  },
  tongues: {
    source: "PHB",
    effects: [
      {
        transfer: false,
        duration: { seconds: 3600 },
        changes: [
          { key: "system.traits.languages.all", mode: M.CUSTOM, value: "1" },
        ],
      },
    ],
  },
  "true strike": {
    source: "PHB",
    effects: [
      {
        transfer: false,
        flags: { dae: { specialDuration: ["1Attack", "shortRest"], selfTargetAlways: true } },
        changes: [
          { key: "flags.midi-qol.advantage.attack.all", mode: M.OVERRIDE, value: "1" },
        ],
      },
    ],
  },
  "vicious mockery": {
    source: "PHB",
    effects: [
      {
        transfer: false,
        duration: { seconds: 6 },
        flags: { dae: { specialDuration: ["1Attack", "turnEnd"] } },
        changes: [
          { key: "flags.midi-qol.disadvantage.attack.all", mode: M.UPGRADE, value: "1" },
        ],
      },
    ],
  },
};

/** Returns the automation overlay for an item name, if one exists. */
export function lookupAutomation(
  name: string,
  _source?: string,
): AutomationOverlay | undefined {
  return AUTOMATIONS[name.trim().toLowerCase()];
}
