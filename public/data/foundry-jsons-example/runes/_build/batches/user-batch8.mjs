/**
 * User-requested runes batch 8
 * Run via: node public/data/foundry-jsons-example/runes/_build/build.mjs user-batch8
 *
 * Also repairs Rathalos Carapace (missing sides/AE) and Hard Mossplate (uses without activity).
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
  midiMulti,
  sideEffect,
  utilityActivity,
} from "../../../../scripts/runes/build-rune-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runesRoot = path.resolve(__dirname, "../..");
const { metaList, idsByName } = loadBatchData(path.resolve(__dirname, "../data/user-batch8"));
const { pushRune, writeAll, idsOf } = createRuneBatch({ runesRoot, metaList, idsByName });

/** Nat-20 weapon attack → Frozen (speed 0 until DC Str escape). */
function criticalFrozenTail(dc) {
  return `
if (pass.includes("postdamageroll") || pass.includes("postactiveeffects") || pass.includes("ishit") || pass.includes("iscritical")) {
  const applied = getRuneFlag(item, "applied");
  if (!applied || applied.side !== "weapon") return;
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

  let isNat20 = Boolean(wf.isCritical || arg0?.isCritical);
  try {
    for (const d of (wf.attackRoll?.dice ?? arg0?.attackRoll?.dice ?? [])) {
      for (const r of (d.results ?? [])) {
        if (Number(r.result ?? r) === 20 && !r.discarded) isNat20 = true;
      }
    }
  } catch (_) {}
  if (!isNat20) return;

  const hits = [...(arg0?.hitTargets ?? wf.hitTargets ?? [])];
  if (!hits.length) return;
  const origin = item.uuid;
  const DC = ${dc};
  const resolveActor = (t) => t?.actor ?? t?.document?.actor ?? (t?.documentName === "Actor" ? t : null);

  const buildFrozen = () => ({
    name: "Frozen",
    img: "icons/magic/water/snowflake-ice-blue.webp",
    type: "base",
    origin,
    transfer: false,
    disabled: false,
    duration: { rounds: null, seconds: null, startTime: null, combat: null, startRound: null, startTurn: null, turns: null },
    changes: [
      { key: "system.attributes.movement.walk", mode: 2, value: "-999", priority: 50 },
      { key: "system.attributes.movement.fly", mode: 2, value: "-999", priority: 50 },
      { key: "system.attributes.movement.swim", mode: 2, value: "-999", priority: 50 },
      { key: "system.attributes.movement.climb", mode: 2, value: "-999", priority: 50 },
      { key: "system.attributes.movement.burrow", mode: 2, value: "-999", priority: 50 },
    ],
    statuses: [],
    tint: "#88ccff",
    description: \`Frozen by \${runeName}. Action: DC \${DC} Strength check to escape.\`,
    flags: {
      dae: { stackable: "noneName", showIcon: true },
      "amellwind-toolbox": { frozen: true, dc: DC },
    },
  });

  for (const t of hits) {
    const targetActor = resolveActor(t);
    if (!targetActor) continue;
    if (!game.user.isGM && typeof MidiQOL?.socket === "function") {
      try {
        await MidiQOL.socket().executeAsGM("createEffects", {
          actorUuid: targetActor.uuid,
          effects: [buildFrozen()],
        });
        continue;
      } catch (_) {}
    }
    await targetActor.createEmbeddedDocuments("ActiveEffect", [buildFrozen()]);
  }
  return;
}`;
}

let sortBase = 9990000;

// ─── 1. Hard Mossplate (repair) ───
pushRune({
  name: "Hard Mossplate",
  sort: sortBase,
  sides: bothSides("FastCharge", "Acrobatics Advantage"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "sr", type: "recoverAll" }] },
    activities: {
      ...utilityActivity(
        idsOf("Hard Mossplate").act1,
        "Acrobatics Advantage",
        "reaction",
        "Grant yourself advantage on an Acrobatics check. 1/SR or LR.",
        {
          condition: "When you make an Acrobatics check — Armor side active",
          consumeItemUse: true,
        },
      ),
      ...utilityActivity(
        idsOf("Hard Mossplate").act2,
        "FastCharge Reminder",
        "special",
        "FastCharge: on initiative, greatsword/longsword/charge blade/tonfas gain 1 charge, spirit, or phial charge (apply manually).",
        { condition: "Weapon side — when you roll initiative" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Hard Mossplate - FastCharge",
      "weapon",
      "FastCharge",
      [],
      "On initiative: GS/LS/CB/tonfas gain 1 charge/spirit/phial (manual).",
    ),
    sideEffect(
      ids.armor,
      "Hard Mossplate - Acrobatics Advantage",
      "armor",
      "Acrobatics Advantage",
      [],
      "Reaction: advantage on an Acrobatics check. 1/SR (item activity).",
    ),
  ],
});

// ─── 2. B.Tetsucabra Shard ───
pushRune({
  name: "B.Tetsucabra Shard",
  sort: (sortBase += 10000),
  sides: bothSides("Mold Earth", "Guard"),
  systemExtra: {
    activities: {
      ...utilityActivity(
        idsOf("B.Tetsucabra Shard").act1,
        "Cast Mold Earth",
        "action",
        "Cast mold earth at will while attuned (add/cast the cantrip).",
        { condition: "Weapon side active" },
      ),
      ...utilityActivity(
        idsOf("B.Tetsucabra Shard").act2,
        "Guard Reminder",
        "special",
        "Guard: you cannot be pushed or knocked backwards while you wear this armor (resolve forced movement manually).",
        { condition: "Armor side active" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "B.Tetsucabra Shard - Mold Earth",
      "weapon",
      "Mold Earth",
      [],
      "Cast mold earth at will (item activity reminder).",
    ),
    sideEffect(
      ids.armor,
      "B.Tetsucabra Shard - Guard",
      "armor",
      "Guard",
      [],
      "Guard (manual): cannot be pushed or knocked backwards.",
    ),
  ],
});

// ─── 3. J.Barroth Scalp ───
pushRune({
  name: "J.Barroth Scalp",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Status (Frozen)", "Cold Resistance"),
  macroTail: criticalFrozenTail(14),
  systemExtra: {
    activities: utilityActivity(
      idsOf("J.Barroth Scalp").act1,
      "Escape Frozen (DC 14 Str)",
      "action",
      "If Frozen: action, DC 14 Strength check to end Frozen (target uses this / resolve check).",
      { condition: "When affected by Frozen from this rune", rollFormula: "1d20", rollName: "Strength check (DC 14)" },
    ),
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "J.Barroth Scalp - Critical Status (Frozen)",
      "weapon",
      "Critical Status (Frozen)",
      midiMulti(macroName, ["postDamageRoll", "isCritical"]),
      "Nat 20 weapon attack: target is Frozen (speed 0; action DC 14 Str to escape).",
    ),
    sideEffect(
      ids.armor,
      "J.Barroth Scalp - Cold Resistance",
      "armor",
      "Cold Resistance",
      [{ key: "system.traits.dr.value", mode: 2, value: "cold", priority: 20 }],
      "Resistance to cold damage.",
    ),
  ],
});

// ─── 4. T.Zamtrios Grandfin ───
pushRune({
  name: "T.Zamtrios Grandfin",
  sort: (sortBase += 10000),
  sides: bothSides("Natural Weapon Reaction", "Tremor-Proof"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("T.Zamtrios Grandfin").act1,
      "Natural Weapon Reaction",
      "reaction",
      "(Race with natural weapons only) When a hostile creature takes damage within 5 ft of you, make an attack with your race's natural weapon against them.",
      {
        condition: "Weapon side — when a hostile creature within 5 ft takes damage",
      },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "T.Zamtrios Grandfin - Natural Weapon Reaction",
      "weapon",
      "Natural Weapon Reaction",
      [],
      "(Natural weapons only) Reaction attack when a hostile within 5 ft takes damage (activity).",
    ),
    sideEffect(
      ids.armor,
      "T.Zamtrios Grandfin - Tremor-Proof",
      "armor",
      "Tremor-Proof",
      [{ key: "system.traits.ci.value", mode: 2, value: "prone", priority: 20 }],
      "Cannot be knocked prone.",
    ),
  ],
});

// ─── 5. Rathalos Carapace (repair) ───
pushRune({
  name: "Rathalos Carapace",
  sort: (sortBase += 10000),
  sides: armorOnly("+1 AC"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.armor,
      "Rathalos Carapace - +1 AC",
      "armor",
      "+1 AC",
      [{ key: "system.attributes.ac.bonus", mode: 2, value: "1", priority: 20 }],
      "+1 bonus to AC while you wear this armor.",
    ),
  ],
});

// ─── 6. Lightcrystal ───
pushRune({
  name: "Lightcrystal",
  sort: (sortBase += 10000),
  sides: bothSides("Moonlight", "Brilliant Flare"),
  systemExtra: {
    uses: { spent: 0, max: "2", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: {
      ...utilityActivity(
        idsOf("Lightcrystal").act1,
        "Brilliant Flare",
        "bonus",
        "Creatures within 10 ft must use their reaction to shield their eyes or be blinded until the end of their next turn. Apply Blinded AE to those who don't. 2/LR.",
        {
          condition: "Armor side active",
          consumeItemUse: true,
        },
      ),
      ...utilityActivity(
        idsOf("Lightcrystal").act2,
        "Moonlight Reminder",
        "special",
        "While holding this weapon in darkness: bright light 15 ft, dim light +15 ft (set token light manually).",
        { condition: "Weapon side — while in darkness" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Lightcrystal - Moonlight",
      "weapon",
      "Moonlight",
      [],
      "In darkness: bright 15 ft / dim +15 ft moonlight (manual token light).",
    ),
    sideEffect(
      ids.armor,
      "Lightcrystal - Brilliant Flare",
      "armor",
      "Brilliant Flare",
      [],
      "Bonus action flare 10 ft: reaction or blinded until end of next turn. 2/LR.",
    ),
    {
      _id: ids.ae1,
      name: "Blinded (Lightcrystal Flare)",
      img: "icons/svg/blind.svg",
      type: "base",
      system: {},
      changes: [],
      disabled: true,
      duration: { ...DURATION },
      description: "Blinded until the end of your next turn (Lightcrystal Brilliant Flare).",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: ["blinded"],
      sort: 1,
      flags: {
        dae: { ...DAE, showIcon: true, specialDuration: ["turnEnd"] },
        "amellwind-toolbox": { lightcrystalBlindBlueprint: true },
      },
      _stats: { ...STATS },
    },
  ],
});

writeAll({ summarizeSides: true });
