/**
 * User-requested runes batch 5
 * Run via: node public/data/foundry-jsons-example/runes/_build/build.mjs user-batch5
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRuneBatch,
  loadBatchData,
  DAE,
  armorOnly,
  bothSides,
  equipEffect,
  midi,
  mwakDamage,
  saveActivity,
  sideEffect,
  utilityActivity,
} from "../../../../scripts/runes/build-rune-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runesRoot = path.resolve(__dirname, "../..");
const { metaList, idsByName } = loadBatchData(path.resolve(__dirname, "../data/user-batch5"));
const { pushRune, writeAll, idsOf } = createRuneBatch({ runesRoot, metaList, idsByName });

function rustAcTail() {
  return `
if (pass.includes("postdamageroll") || pass.includes("postactiveeffects") || pass.includes("ishit")) {
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
  const hits = [...(arg0?.hitTargets ?? wf.hitTargets ?? [])];
  if (!hits.length) return;

  const turnKey = \`\${game.combat?.id ?? "out"}:\${game.combat?.round ?? 0}:\${game.combat?.turn ?? 0}:\${actorDoc?.id ?? ""}\`;
  const last = getRuneFlag(item, "rustTurnKey");
  if (last === turnKey) return;
  await setRuneFlag(item, "rustTurnKey", turnKey);

  const origin = item.uuid;
  const img = item?.img ?? "icons/svg/downgrade.svg";
  const resolveActor = (t) => t?.actor ?? t?.document?.actor ?? (t?.documentName === "Actor" ? t : null);

  const buildRust = () => ({
    name: "Rust (-1 AC)",
    img,
    type: "base",
    origin,
    transfer: false,
    disabled: false,
    duration: { turns: 1, rounds: null, seconds: null, startTime: null, combat: null, startRound: null, startTurn: null },
    changes: [{ key: "system.attributes.ac.bonus", mode: 2, value: "-1", priority: 20 }],
    statuses: [],
    tint: "#ffffff",
    description: "AC reduced by 1 until the start of the attacker's next turn (Durambolite — Rust).",
    flags: {
      dae: { specialDuration: ["turnStartSource"], stackable: "noneName", showIcon: true },
      "amellwind-toolbox": { rustAc: true },
    },
  });

  for (const t of hits) {
    const targetActor = resolveActor(t);
    if (!targetActor) continue;
    const stale = [...(targetActor.effects ?? [])].filter(
      (ef) => getRuneFlag(ef, "rustAc") === true || /rust \\(-1 ac\\)/i.test(ef.name ?? ""),
    );
    if (stale.length) {
      if (!game.user.isGM && typeof MidiQOL?.socket === "function") {
        try {
          await MidiQOL.socket().executeAsGM("removeEffects", {
            actorUuid: targetActor.uuid,
            effects: stale.map((e) => e.uuid).filter(Boolean),
          });
        } catch (_) {
          await targetActor.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
        }
      } else {
        await targetActor.deleteEmbeddedDocuments("ActiveEffect", stale.map((e) => e.id));
      }
    }
    if (!game.user.isGM && typeof MidiQOL?.socket === "function") {
      try {
        await MidiQOL.socket().executeAsGM("createEffects", {
          actorUuid: targetActor.uuid,
          effects: [buildRust()],
        });
        continue;
      } catch (_) {}
    }
    await targetActor.createEmbeddedDocuments("ActiveEffect", [buildRust()]);
  }
  return;
}`;
}

let sortBase = 9960000;

// ─── 1. Marbled Hump ───
pushRune({
  name: "Marbled Hump",
  sort: sortBase,
  sides: bothSides("Stunning Strike → Incapacitated", "Botanist+"),
  systemExtra: {
    activities: {
      ...utilityActivity(
        idsOf("Marbled Hump").act1,
        "Botanist+ Reminder",
        "special",
        "Botanist+: when you successfully gather a plant resource, gather an extra 1d4 (apply manually).",
        { condition: "Armor side — when gathering a plant resource" },
      ),
      ...utilityActivity(
        idsOf("Marbled Hump").act2,
        "Stunning Strike DC +3 (Incapacitate)",
        "special",
        "(Monk Only) Stunning Strike save DC +3; on a failed save the target is incapacitated instead of stunned (apply manually).",
        { condition: "Weapon side — Monk only, when using Stunning Strike" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Marbled Hump - Stunning Strike Mod",
      "weapon",
      "Stunning Strike → Incapacitated",
      [],
      "(Monk Only) Stunning Strike DC +3; failed save → incapacitated instead of stunned (manual).",
    ),
    sideEffect(
      ids.armor,
      "Marbled Hump - Botanist+",
      "armor",
      "Botanist+",
      [],
      "Botanist+: +1d4 plant resources on successful gather (manual).",
    ),
  ],
});

// ─── 2. Durambolite ───
pushRune({
  name: "Durambolite",
  sort: (sortBase += 10000),
  sides: bothSides("Rust", "Survivor+"),
  macroTail: rustAcTail(),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: {
      [idsOf("Durambolite").act1]: {
        _id: idsOf("Durambolite").act1,
        type: "utility",
        sort: 0,
        name: "Survivor+",
        img: "mh-icons/material-rune.webp",
        activation: {
          type: "reaction",
          value: null,
          condition: "When an ally you can see is reduced to 0 hit points — Armor side active",
          override: false,
        },
        consumption: {
          scaling: { allowed: false, max: "" },
          spellSlot: false,
          targets: [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }],
        },
        description: { chatFlavor: "+2 AC, +2 damage, +2 attack rolls for 1 minute. 1/LR." },
        duration: { value: "1", units: "minute", concentration: false, override: false },
        effects: [{ _id: idsOf("Durambolite").ae1 }],
        range: { value: null, units: "self", special: "", override: false },
        target: {
          template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
          affects: { count: "", type: "self", choice: false, special: "" },
          prompt: false,
          override: false,
        },
        uses: { spent: 0, max: "", recovery: [] },
        midiProperties: { identifier: "survivor-plus", displayActivityName: true },
        roll: { formula: "", name: "", prompt: false, visible: false },
      },
    },
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Durambolite - Rust",
      "weapon",
      "Rust",
      midi(macroName, "postDamageRoll"),
      "First hit each turn: target AC -1 until start of your next turn (macro).",
    ),
    {
      ...sideEffect(
        ids.ae1,
        "Durambolite - Survivor+ Buff",
        "armor",
        "Survivor+ Buff",
        [
          { key: "system.attributes.ac.bonus", mode: 2, value: "2", priority: 20 },
          { key: "system.bonuses.mwak.attack", mode: 2, value: "2", priority: 20 },
          { key: "system.bonuses.rwak.attack", mode: 2, value: "2", priority: 20 },
          { key: "system.bonuses.mwak.damage", mode: 2, value: "2", priority: 20 },
          { key: "system.bonuses.rwak.damage", mode: 2, value: "2", priority: 20 },
        ],
        "+2 AC / attack / damage for 1 minute.",
      ),
      disabled: false,
      flags: {
        dae: { ...DAE },
        "amellwind-toolbox": { runeSide: "armor", materialEffectName: "Survivor+ Buff" },
      },
    },
    sideEffect(
      ids.armor,
      "Durambolite - Survivor+",
      "armor",
      "Survivor+",
      [],
      "Reaction when ally drops to 0 HP (item activity). 1/LR.",
    ),
  ],
});

// ─── 3. P.Ludroth Scale (armor only) ───
pushRune({
  name: "P.Ludroth Scale",
  sort: (sortBase += 10000),
  sides: armorOnly("Cold Resistance"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.armor,
      "P.Ludroth Scale - Cold Resistance",
      "armor",
      "Cold Resistance",
      [{ key: "system.traits.dr.value", mode: 2, value: "cold", priority: 20 }],
      "Resistance to cold damage.",
    ),
  ],
});

// ─── 4. Rey Dau Tail ───
pushRune({
  name: "Rey Dau Tail",
  sort: (sortBase += 10000),
  sides: bothSides("Lightning Bolt (Runes)", "Evade Extender (M)"),
  systemExtra: {
    uses: {
      spent: 0,
      max: "6",
      recovery: [{ period: "dawn", type: "formula", formula: "1d6" }],
    },
    activities: {
      ...saveActivity(idsOf("Rey Dau Tail").act1, "Lightning Bolt (3rd)", {
        activationType: "action",
        condition: "Weapon side — Spellcaster only; expend 1 rune (more runes = higher level)",
        chatFlavor:
          "Lightning bolt DC 15 Dex, 100-ft line. 8d6 lightning (half on save). Base 3rd-level for 1 rune; spend extra runes to upcast (+1 level each). If this spends the last rune, roll a d20 — on a 1, runes cannot recharge for a week (manual).",
        consumeItemUse: true,
        rangeValue: null,
        rangeUnits: "self",
        template: { count: "", contiguous: false, type: "line", size: "100", width: "5", height: "", units: "ft" },
        affects: { count: "", type: "creature", choice: false, special: "" },
        damageParts: [
          {
            number: 8,
            denomination: 6,
            bonus: "",
            types: ["lightning"],
            custom: { enabled: false, formula: "" },
            scaling: { mode: "", number: null, formula: "" },
          },
        ],
        ability: ["dex"],
        dcFormula: "15",
      }),
      ...utilityActivity(
        idsOf("Rey Dau Tail").act2,
        "Upcast / Last-Rune Check Reminder",
        "special",
        "Upcast: expend extra item uses before/with Lightning Bolt (+1 spell level each). If you spend the last rune, roll d20 — on 1, no recharge for a week (track manually).",
        { condition: "Weapon side — when casting with 2+ runes or spending the last rune" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Rey Dau Tail - Lightning Bolt",
      "weapon",
      "Lightning Bolt (Runes)",
      [],
      "(Spellcaster Only) 6 runes; action Lightning Bolt DC 15 (activity). Regain 1d6 at dawn. Last-rune d20 lockout manual.",
    ),
    sideEffect(
      ids.armor,
      "Rey Dau Tail - Evade Extender (M)",
      "armor",
      "Evade Extender (M)",
      [{ key: "system.abilities.dex.bonuses.save", mode: 2, value: "2", priority: 20 }],
      "+2 bonus to Dexterity saving throws.",
    ),
  ],
});

// ─── 5. Ajarakan Marrow ───
pushRune({
  name: "Ajarakan Marrow",
  sort: (sortBase += 10000),
  sides: bothSides("Offensive Guard", "Health Boost"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Ajarakan Marrow").act1,
      "Offensive Guard Reminder",
      "special",
      "Offensive Guard: after a reaction that increased your AC, your next attack deals extra damage equal to that AC bonus (apply manually).",
      { condition: "Weapon side — after a reaction that increases your AC" },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Ajarakan Marrow - Offensive Guard",
      "weapon",
      "Offensive Guard",
      [],
      "Offensive Guard (manual): next attack after AC-boosting reaction deals extra damage = AC bonus.",
    ),
    sideEffect(
      ids.armor,
      "Ajarakan Marrow - Health Boost",
      "armor",
      "Health Boost",
      [{ key: "system.attributes.hp.bonuses.overall", mode: 2, value: "@details.level", priority: 20 }],
      "Hit point maximum increases by 1 per character level.",
    ),
  ],
});

// ─── 6. T.Blangonga Whisker ───
pushRune({
  name: "T.Blangonga Whisker",
  sort: (sortBase += 10000),
  sides: bothSides("Agitator", "Taunt"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("T.Blangonga Whisker").act1,
      "Taunt (Redirect Attack)",
      "reaction",
      "When a creature you can see attacks a target other than you within 5 feet of you, redirect the attack to you (resolve targeting manually).",
      {
        condition: "Armor side — when a creature attacks another target within 5 ft of you",
      },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "T.Blangonga Whisker - Agitator",
      "weapon",
      "Agitator",
      [
        { key: "flags.dnd5e.weaponCriticalThreshold", mode: 5, value: "19", priority: 20 },
        ...mwakDamage("1d6"),
      ],
      "Critical hit range +1 and extra 1d6 weapon damage.",
    ),
    sideEffect(
      ids.armor,
      "T.Blangonga Whisker - Taunt",
      "armor",
      "Taunt",
      [],
      "Reaction: redirect an attack aimed at another creature within 5 ft to you (activity reminder).",
    ),
  ],
});

writeAll({ summarizeSides: true });
