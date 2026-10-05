/**
 * User-requested runes batch 4
 * Run via: node public/data/foundry-jsons-example/runes/_build/build.mjs user-batch4
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRuneBatch,
  loadBatchData,
  DAE,
  DURATION,
  STATS,
  armorOnly,
  bothSides,
  equipEffect,
  midi,
  mwakDamage,
  sideEffect,
  utilityActivity,
  weaponOnly,
} from "../../../../scripts/runes/build-rune-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runesRoot = path.resolve(__dirname, "../..");
const { metaList, idsByName } = loadBatchData(path.resolve(__dirname, "../data/user-batch4"));
const { pushRune, writeAll, idsOf } = createRuneBatch({ runesRoot, metaList, idsByName });

function chainCritTail() {
  return `
if (pass.includes("postattackroll") || pass.includes("postattack")) {
  const wf = workflow ?? arg0?.workflow;
  if (!actorDoc || !wf) return;
  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actType = String(wf.activity?.type ?? arg0?.activity?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isWeaponAttack =
    itemType === "weapon"
    || ["mwak", "rwak"].includes(actionType)
    || (actType === "attack" && itemType !== "spell");
  if (!isWeaponAttack) return;

  const FLAGK = "chainCrit";
  const state = foundry.utils.getProperty(item, \`flags.amellwind-toolbox.\${FLAGK}\`) ?? { stacks: 0, targetId: null };

  const hits = [...(arg0?.hitTargets ?? wf.hitTargets ?? [])];
  const missed = !hits.length;
  const isCrit = Boolean(wf.isCritical || arg0?.isCritical);
  const targetId = hits[0]?.id ?? hits[0]?.document?.id ?? hits[0]?.actor?.id ?? null;

  const old = actorDoc.effects.filter((e) => getRuneFlag(e, "chainCritStack") && e.origin === item.uuid);
  if (old.length) await actorDoc.deleteEmbeddedDocuments("ActiveEffect", old.map((e) => e.id));

  if (isCrit || missed || (state.targetId && targetId && state.targetId !== targetId)) {
    await setRuneFlag(item, FLAGK, { stacks: 0, targetId: null });
    return;
  }

  if (!targetId) {
    await setRuneFlag(item, FLAGK, { stacks: 0, targetId: null });
    return;
  }

  const stacks = Number(state.stacks ?? 0) + 1;
  await setRuneFlag(item, FLAGK, { stacks, targetId });

  if (stacks > 0) {
    const baseThreshold = Number(foundry.utils.getProperty(actorDoc, "flags.dnd5e.weaponCriticalThreshold")) || 20;
    const threshold = Math.max(1, baseThreshold - stacks);
    await actorDoc.createEmbeddedDocuments("ActiveEffect", [{
      name: \`\${runeName} — Chain Crit (+\${stacks})\`,
      img: item.img,
      origin: item.uuid,
      transfer: false,
      disabled: false,
      changes: [{ key: "flags.dnd5e.weaponCriticalThreshold", mode: 5, value: String(threshold), priority: 50 }],
      flags: {
        dae: { showIcon: false, stackable: "noneName" },
        "amellwind-toolbox": { chainCritStack: true, runeClone: true },
      },
    }]);
  }
  return;
}`;
}

function staminaDrainTail() {
  return `
if (pass.includes("postdamageroll") || pass.includes("postactiveeffects")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;

  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actType = String(wf.activity?.type ?? arg0?.activity?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isWeaponAttack =
    itemType === "weapon"
    || ["mwak", "rwak"].includes(actionType)
    || (actType === "attack" && itemType !== "spell");
  if (!isWeaponAttack) return;

  const hits = [...(arg0?.hitTargets ?? wf.hitTargets ?? [])];
  if (!hits.length) return;

  if (wf.amellwindStaminaDrainApplied) return;
  wf.amellwindStaminaDrainApplied = true;

  const blueprint = item.effects.find((e) => getRuneFlag(e, "staminaDrainBlueprint") === true)
    ?? item.effects.find((e) => /stamina drain/i.test(e.name ?? "") && !getRuneFlag(e, "runeSide"));

  const origin = actorDoc?.uuid ?? item.uuid;
  const img = blueprint?.img ?? item?.img ?? "icons/svg/aura.svg";

  const buildEffect = () => {
    if (blueprint) {
      const o = blueprint.toObject();
      delete o._id;
      o.disabled = false;
      o.transfer = false;
      o.origin = origin;
      if (!o.system) o.system = {};
      foundry.utils.setProperty(o, "flags.dae.showIcon", true);
      foundry.utils.setProperty(o, "flags.dae.specialDuration", ["turnStartSource"]);
      foundry.utils.setProperty(o, "flags.dae.stackable", "noneName");
      foundry.utils.setProperty(o, \`flags.\${FLAG}.staminaDrain\`, true);
      if (o.flags?.[FLAG]?.staminaDrainBlueprint != null) delete o.flags[FLAG].staminaDrainBlueprint;
      return o;
    }
    return {
      name: "Stamina Drain (-5 ft)",
      img,
      type: "base",
      system: {},
      origin,
      transfer: false,
      disabled: false,
      duration: { turns: 1, rounds: null, seconds: null, startTime: null, combat: null, startRound: null, startTurn: null },
      changes: [
        { key: "system.attributes.movement.walk", mode: 2, value: "-5", priority: 20 },
        { key: "system.attributes.movement.fly", mode: 2, value: "-5", priority: 20 },
        { key: "system.attributes.movement.swim", mode: 2, value: "-5", priority: 20 },
        { key: "system.attributes.movement.climb", mode: 2, value: "-5", priority: 20 },
        { key: "system.attributes.movement.burrow", mode: 2, value: "-5", priority: 20 },
      ],
      statuses: [],
      tint: "#ffffff",
      description: "Speed reduced by 5 feet until the start of the attacker's next turn.",
      flags: {
        dae: { specialDuration: ["turnStartSource"], stackable: "noneName", showIcon: true },
        [FLAG]: { staminaDrain: true },
      },
    };
  };

  const resolveActor = (t) =>
    t?.actor ?? t?.document?.actor ?? (t?.documentName === "Actor" ? t : null);

  const applyTo = async (targetActor, docs) => {
    if (typeof MidiQOL?.socket === "function" && !game.user.isGM) {
      try {
        await MidiQOL.socket().executeAsGM("createEffects", {
          actorUuid: targetActor.uuid,
          effects: docs,
        });
        return;
      } catch (err) {
        console.warn("Stamina Drain createEffects via Midi socket failed", err);
      }
    }
    await targetActor.createEmbeddedDocuments("ActiveEffect", docs);
  };

  const removeFrom = async (targetActor, ids) => {
    if (!ids.length) return;
    if (typeof MidiQOL?.socket === "function" && !game.user.isGM) {
      try {
        await MidiQOL.socket().executeAsGM("removeEffects", {
          actorUuid: targetActor.uuid,
          effects: ids.map((id) => targetActor.effects.get(id)?.uuid).filter(Boolean),
        });
        return;
      } catch (err) {
        console.warn("Stamina Drain removeEffects via Midi socket failed", err);
      }
    }
    await targetActor.deleteEmbeddedDocuments("ActiveEffect", ids);
  };

  for (const t of hits) {
    const targetActor = resolveActor(t);
    if (!targetActor) continue;
    const stale = targetActor.effects.filter(
      (ef) =>
        foundry.utils.getProperty(ef, \`flags.\${FLAG}.staminaDrain\`) === true
        || /stamina drain/i.test(ef.name ?? ""),
    );
    if (stale.length) await removeFrom(targetActor, stale.map((e) => e.id));
    await applyTo(targetActor, [buildEffect()]);
  }
  return;
}`;
}

let sortBase = 9950000;

// ─── 1. Adolescent Defiled Scale ───
pushRune({
  name: "Adolescent Defiled Scale",
  sort: sortBase,
  sides: bothSides("Extra 1d6 Necrotic", "Handicraft"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Adolescent Defiled Scale").act1,
      "Handicraft (Choose Tool)",
      "special",
      "Each dawn: gain proficiency with one artisan tool of your choice for 24 hours (apply proficiency manually).",
      { condition: "Armor side — when you finish a long rest / at dawn" },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Adolescent Defiled Scale - Extra Necrotic",
      "weapon",
      "Extra 1d6 Necrotic",
      mwakDamage("1d6[necrotic]"),
      "Weapon attacks deal extra 1d6 necrotic damage.",
    ),
    sideEffect(
      ids.armor,
      "Adolescent Defiled Scale - Handicraft",
      "armor",
      "Handicraft",
      [],
      "Each dawn: proficiency with one artisan tool for 24 hours (manual / activity reminder).",
    ),
  ],
});

// ─── 2. Nu Udra Flamegem ───
pushRune({
  name: "Nu Udra Flamegem",
  sort: (sortBase += 10000),
  sides: bothSides("Chain Crit", "Fire Immunity"),
  macroTail: chainCritTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Nu Udra Flamegem - Chain Crit",
      "weapon",
      "Chain Crit",
      midi(macroName, "postAttackRoll"),
      "Consecutive hits on the same creature increase crit range by 1 until you crit, miss, or change targets.",
    ),
    sideEffect(
      ids.armor,
      "Nu Udra Flamegem - Fire Immunity",
      "armor",
      "Fire Immunity",
      [{ key: "system.traits.di.value", mode: 2, value: "fire", priority: 20 }],
      "Immune to fire damage.",
    ),
  ],
});

// ─── 3. Bazelgeusling Gem ───
pushRune({
  name: "Bazelgeusling Gem",
  sort: (sortBase += 10000),
  sides: bothSides("Strength 19", "Fire Resistance"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Bazelgeusling Gem - Strength 19",
      "weapon",
      "Strength 19",
      [{ key: "system.abilities.str.value", mode: 5, value: "19", priority: 20 }],
      "Strength score becomes 19 (override) if lower.",
    ),
    sideEffect(
      ids.armor,
      "Bazelgeusling Gem - Fire Resistance",
      "armor",
      "Fire Resistance",
      [{ key: "system.traits.dr.value", mode: 2, value: "fire", priority: 20 }],
      "Resistance to fire damage.",
    ),
  ],
});

// ─── 4. Pumpkin.U Marrow (armor only) ───
pushRune({
  name: "Pumpkin.U Marrow",
  sort: (sortBase += 10000),
  sides: armorOnly("Guts+"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Pumpkin.U Marrow").act1,
      "Drop to 1 HP instead",
      "reaction",
      "Guts+: when reduced to 0 HP but not killed outright, drop to 1 HP instead. 1/LR.",
      {
        condition: "When you are reduced to 0 hit points but not killed outright — Armor side active",
        consumeItemUse: true,
      },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.armor,
      "Pumpkin.U Marrow - Guts+",
      "armor",
      "Guts+",
      [],
      "Reaction/utility: drop to 1 HP instead of 0. 1/LR (item activity).",
    ),
  ],
});

// ─── 5. Lunastra Wing ───
pushRune({
  name: "Lunastra Wing",
  sort: (sortBase += 10000),
  sides: bothSides("Engulf in Flames", "Evade Window"),
  systemExtra: {
    uses: {
      spent: 0,
      max: "3",
      recovery: [{ period: "dawn", type: "formula", formula: "1d3" }],
    },
    activities: {
      ...utilityActivity(
        idsOf("Lunastra Wing").act1,
        "Evade Window (Succeed Dex Save)",
        "reaction",
        "When you fail a Dexterity saving throw, expend 1 rune to succeed instead.",
        {
          condition: "When you fail a Dexterity saving throw — Armor side active",
          consumeItemUse: true,
        },
      ),
      [idsOf("Lunastra Wing").act2]: {
        _id: idsOf("Lunastra Wing").act2,
        type: "utility",
        sort: 1,
        name: "Engulf in Flames",
        img: "mh-icons/material-rune.webp",
        activation: {
          type: "special",
          value: null,
          condition: "On melee weapon hit — Weapon side active",
          override: false,
        },
        consumption: {
          scaling: { allowed: false, max: "" },
          spellSlot: false,
          targets: [{ type: "activityUses", value: "1", scaling: { mode: "", formula: "" } }],
        },
        description: {
          chatFlavor:
            "Engulf the hit target in flames: 1d4 fire at start of each of its turns; DC 15 Dex after that damage to end. Action (self or ally within 5 ft) can smother. 1/SR or LR.",
        },
        duration: { value: "", units: "inst", concentration: false, override: false },
        effects: [{ _id: idsOf("Lunastra Wing").ae1 }],
        range: { value: null, units: "ft", special: "", override: false },
        target: {
          template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
          affects: { count: "1", type: "creature", choice: false, special: "" },
          prompt: true,
          override: false,
        },
        uses: { spent: 0, max: "1", recovery: [{ period: "sr", type: "recoverAll" }] },
        midiProperties: { identifier: "engulf-in-flames", displayActivityName: true },
        roll: { formula: "", name: "", prompt: false, visible: false },
      },
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    {
      _id: ids.ae1,
      name: "Engulfed in Flames (Lunastra Wing)",
      img: "icons/svg/fire.svg",
      type: "base",
      system: {},
      changes: [],
      disabled: true,
      duration: { ...DURATION },
      description:
        "1d4 fire at the start of each turn, then DC 15 Dexterity save to end. Or action (self/ally within 5 ft) to smother.",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: ["burning"],
      sort: 1,
      flags: {
        dae: { ...DAE, showIcon: true, stackable: "noneName" },
        "amellwind-toolbox": { lunastraEngulfBlueprint: true },
        "midi-qol": {
          overtime: {
            turn: "start",
            saveAbility: "dex",
            saveDC: "15",
            damageRoll: "1d4",
            damageType: "fire",
            label: "Engulfed in Flames",
          },
        },
      },
      _stats: { ...STATS },
    },
    sideEffect(
      ids.weapon,
      "Lunastra Wing - Engulf in Flames",
      "weapon",
      "Engulf in Flames",
      [],
      "On melee hit: use Engulf in Flames activity (1/SR). Applies burning AE with 1d4 fire/turn, DC 15 Dex to end.",
    ),
    sideEffect(
      ids.armor,
      "Lunastra Wing - Evade Window",
      "armor",
      "Evade Window",
      [],
      "3 runes; regain 1d3 at dawn. Reaction: succeed failed Dex save (item uses).",
    ),
  ],
});

// ─── 6. Banbaro Great Horn ───
pushRune({
  name: "Banbaro Great Horn",
  sort: (sortBase += 10000),
  sides: bothSides("Catapult (2nd)", "Cold Resistance"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Banbaro Great Horn").act1,
      "Cast Catapult (2nd Level)",
      "action",
      "Cast catapult at 2nd level from this weapon (add/cast the spell; expend this use). 1/LR.",
      {
        condition: "Weapon side active",
        consumeItemUse: true,
      },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Banbaro Great Horn - Catapult",
      "weapon",
      "Catapult (2nd)",
      [],
      "Action: cast catapult at 2nd level. 1/LR (item activity).",
    ),
    sideEffect(
      ids.armor,
      "Banbaro Great Horn - Cold Resistance",
      "armor",
      "Cold Resistance",
      [{ key: "system.traits.dr.value", mode: 2, value: "cold", priority: 20 }],
      "Resistance to cold damage.",
    ),
  ],
});

// ─── 7. Chatacabra Hide ───
pushRune({
  name: "Chatacabra Hide",
  sort: (sortBase += 10000),
  sides: bothSides("Stamina Drain", "Recovery Speed"),
  macroTail: staminaDrainTail(),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Chatacabra Hide").act1,
      "Recovery Speed Reminder",
      "special",
      "Recovery Speed: when you roll a Hit Die to regain HP, double the HP restored (apply manually).",
      { condition: "Armor side — when you spend a Hit Die" },
    ),
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Chatacabra Hide - Stamina Drain",
      "weapon",
      "Stamina Drain",
      midi(macroName, "postDamageRoll"),
      "On weapon hit, apply the Stamina Drain Active Effect to each hit target.",
    ),
    {
      _id: ids.ae1,
      name: "Stamina Drain (-5 ft)",
      img: "icons/magic/movement/trail-streak-impact-blue.webp",
      type: "base",
      system: {},
      changes: [
        { key: "system.attributes.movement.walk", mode: 2, value: "-5", priority: 20 },
        { key: "system.attributes.movement.fly", mode: 2, value: "-5", priority: 20 },
        { key: "system.attributes.movement.swim", mode: 2, value: "-5", priority: 20 },
        { key: "system.attributes.movement.climb", mode: 2, value: "-5", priority: 20 },
        { key: "system.attributes.movement.burrow", mode: 2, value: "-5", priority: 20 },
      ],
      disabled: true,
      duration: { ...DURATION, turns: 1 },
      description: "Speed reduced by 5 feet until the start of the attacker's next turn.",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: [],
      sort: 1,
      flags: {
        dae: { ...DAE, showIcon: true, specialDuration: ["turnStartSource"] },
        "amellwind-toolbox": { staminaDrainBlueprint: true },
      },
      _stats: { ...STATS },
    },
    sideEffect(
      ids.armor,
      "Chatacabra Hide - Recovery Speed",
      "armor",
      "Recovery Speed",
      [],
      "Recovery Speed (manual): double Hit Dice healing.",
    ),
  ],
});

// ─── 8. Aurora Gem (weapon only) ───
pushRune({
  name: "Aurora Gem",
  sort: (sortBase += 10000),
  sides: weaponOnly("Agitator"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Aurora Gem - Agitator",
      "weapon",
      "Agitator",
      [
        { key: "flags.dnd5e.weaponCriticalThreshold", mode: 5, value: "19", priority: 20 },
        ...mwakDamage("1d6"),
      ],
      "Critical hit range +1 and extra 1d6 weapon damage (Critical Eye + extra damage material).",
    ),
  ],
});

writeAll({ summarizeSides: true });
