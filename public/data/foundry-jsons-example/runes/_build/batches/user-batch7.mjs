/**
 * User-requested runes batch 7
 * Run via: node public/data/foundry-jsons-example/runes/_build/build.mjs user-batch7
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRuneBatch,
  loadBatchData,
  DAE,
  DURATION,
  STATS,
  bothSides,
  equipEffect,
  midi,
  midiMulti,
  mwakDamage,
  saveActivity,
  sideEffect,
  utilityActivity,
  weaponOnly,
} from "../../../../scripts/runes/build-rune-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runesRoot = path.resolve(__dirname, "../..");
const { metaList, idsByName } = loadBatchData(path.resolve(__dirname, "../data/user-batch7"));
const { pushRune, writeAll, idsOf } = createRuneBatch({ runesRoot, metaList, idsByName });

function awakenExtraDieTail() {
  return `
if (pass.includes("damagebonus")) {
  const applied = getRuneFlag(item, "applied");
  if (!applied || applied.side !== "weapon") return null;
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return null;
  const src = wf.item;
  if (!src || String(src.type).toLowerCase() !== "weapon") return null;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const elemental = ["cold", "fire", "lightning", "necrotic", "thunder"].some((t) => dump.includes(t) || dump.includes(\`[\${t}]\`));
  if (elemental) return null;
  let formula = "1d6";
  try {
    const atk = Object.values(src.system?.activities ?? {}).find((a) => a?.type === "attack");
    const part = atk?.damage?.parts?.[0];
    if (part?.denomination) formula = \`1d\${part.denomination}\`;
    else {
      const legacy = src.system?.damage?.parts?.[0];
      const m = String(legacy?.[0] ?? "").match(/(\\d*)d(\\d+)/i);
      if (m) formula = \`1d\${m[2]}\`;
    }
  } catch (_) {}
  return { damageRoll: formula, flavor: \`\${runeName} — Awaken\` };
}`;
}

function poisonSpellBonusTail(bonus) {
  return `
if (pass.includes("presavedc") || pass.includes("preamblecomplete") || pass.includes("preitemroll") || pass.includes("preattackroll")) {
  const applied = getRuneFlag(item, "applied");
  if (!applied || applied.side !== "weapon") return;
  const wf = workflow ?? arg0?.workflow;
  const src = wf?.item;
  if (!src || src.type !== "spell") return;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const desc = String(src.system?.description?.value ?? "").toLowerCase();
  const detailTypes = (wf?.damageDetail ?? []).map((d) => String(d.type ?? "").toLowerCase());
  const hasPoison =
    dump.includes("poison")
    || desc.includes("poison")
    || detailTypes.includes("poison");
  if (!hasPoison) return;
  foundry.utils.setProperty(arg0, "saveDCBonus", (Number(arg0?.saveDCBonus ?? 0) || 0) + ${bonus});
  if (wf) wf.saveDCBonus = (Number(wf.saveDCBonus ?? 0) || 0) + ${bonus};
  foundry.utils.setProperty(arg0, "attackRollBonus", (Number(arg0?.attackRollBonus ?? 0) || 0) + ${bonus});
  if (wf) wf.attackRollBonus = (Number(wf.attackRollBonus ?? 0) || 0) + ${bonus};
  return;
}`;
}

function criticalPoisonTail() {
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
  if (!(wf.isCritical || arg0?.isCritical)) return;
  const hits = [...(arg0?.hitTargets ?? wf.hitTargets ?? [])];
  if (!hits.length) return;
  const targetUuids = hits.map((t) => t?.document?.uuid ?? t?.uuid ?? t?.actor?.uuid).filter(Boolean);
  if (!targetUuids.length) return;
  await useRuneSaveActivity({ identifier: "critical-status-poison", targetUuids });
  return;
}`;
}

let sortBase = 9980000;

// ─── 1. Shell Shocker (weapon only) ───
pushRune({
  name: "Shell Shocker",
  sort: sortBase,
  sides: weaponOnly("Awaken"),
  macroTail: awakenExtraDieTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Shell Shocker - Awaken",
      "weapon",
      "Awaken",
      midi(macroName, "damageBonus"),
      "Non-elemental weapons roll one extra damage die on hit.",
    ),
  ],
});

// ─── 2. Ado.Akantor Spike ───
pushRune({
  name: "Ado.Akantor Spike",
  sort: (sortBase += 10000),
  sides: bothSides("Extra 1d8 Fire", "Health Boost"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Ado.Akantor Spike - Extra Fire",
      "weapon",
      "Extra 1d8 Fire",
      mwakDamage("1d8[fire]"),
      "Weapon attacks deal extra 1d8 fire damage.",
    ),
    sideEffect(
      ids.armor,
      "Ado.Akantor Spike - Health Boost",
      "armor",
      "Health Boost",
      [{ key: "system.attributes.hp.bonuses.overall", mode: 2, value: "@details.level", priority: 20 }],
      "Hit point maximum increases by 1 per character level.",
    ),
  ],
});

// ─── 3. Uber Plesioth Head ───
pushRune({
  name: "Uber Plesioth Head",
  sort: (sortBase += 10000),
  sides: bothSides("Charge Attack +2 (Hammer/Lance)", "Dash No OA"),
  systemExtra: {
    activities: {
      ...utilityActivity(
        idsOf("Uber Plesioth Head").act1,
        "Charge Attack +2 Reminder",
        "special",
        "(Hammer & Lance Only) After moving 20 ft in a straight line toward a creature without taking damage, +2 attack and damage (apply manually).",
        { condition: "Weapon side — Hammer/Lance only" },
      ),
      ...utilityActivity(
        idsOf("Uber Plesioth Head").act2,
        "Dash No Opportunity Attacks",
        "special",
        "When you Dash and move at least 20 ft in a straight line, you don't provoke opportunity attacks during that dash (resolve manually).",
        { condition: "Armor side — when you take the Dash action" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Uber Plesioth Head - Charge +2",
      "weapon",
      "Charge Attack +2",
      [],
      "(Hammer & Lance Only) +2 attack/damage after 20 ft straight charge without taking damage (manual).",
    ),
    sideEffect(
      ids.armor,
      "Uber Plesioth Head - Dash No OA",
      "armor",
      "Dash No OA",
      [],
      "Dash with 20+ ft straight line: no opportunity attacks (manual).",
    ),
  ],
});

// ─── 4. Chameleos Tail ───
pushRune({
  name: "Chameleos Tail",
  sort: (sortBase += 10000),
  sides: bothSides("Poison Spell +2", "Cold Resistance"),
  macroTail: poisonSpellBonusTail(2),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Chameleos Tail - Poison Spell +2",
      "weapon",
      "Poison Spell +2",
      midiMulti(macroName, ["preSaveDC", "preambleComplete", "preItemRoll"]),
      "Poison damage / poisoned-condition spells: +2 spell attack and spell save DC.",
    ),
    sideEffect(
      ids.armor,
      "Chameleos Tail - Cold Resistance",
      "armor",
      "Cold Resistance",
      [{ key: "system.traits.dr.value", mode: 2, value: "cold", priority: 20 }],
      "Resistance to cold damage.",
    ),
  ],
});

// ─── 5. Chameleos Horn ───
pushRune({
  name: "Chameleos Horn",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Status (Poison)", "Rock Steady"),
  macroTail: criticalPoisonTail(),
  systemExtra: {
    activities: saveActivity(idsOf("Chameleos Horn").act1, "Critical Status (Poison)", {
      activationType: "special",
      condition: "Weapon side — automated on critical hit",
      chatFlavor: "Critical Status (Poison): DC 15 Con or poisoned for 1 minute.",
      consumeItemUse: false,
      rangeValue: null,
      rangeUnits: "ft",
      affects: { count: "1", type: "creature", choice: false, special: "" },
      prompt: false,
      damageParts: [],
      onSave: "none",
      ability: ["con"],
      dcFormula: "15",
      effectIds: [idsOf("Chameleos Horn").ae1],
      identifier: "critical-status-poison",
    }),
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Chameleos Horn - Critical Status (Poison)",
      "weapon",
      "Critical Status (Poison)",
      midiMulti(macroName, ["postDamageRoll", "isCritical"]),
      "On critical hit: DC 15 Con or poisoned for 1 minute (automated save activity).",
    ),
    {
      _id: ids.ae1,
      name: "Poisoned (Chameleos Horn)",
      img: "icons/svg/poison.svg",
      type: "base",
      system: {},
      changes: [],
      disabled: false,
      duration: { ...DURATION, seconds: 60 },
      description: "Poisoned for 1 minute.",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: ["poisoned"],
      sort: 0,
      flags: {
        dae: { ...DAE, showIcon: true },
        "amellwind-toolbox": { chameleosPoison: true, saveEffectBlueprint: true },
      },
      _stats: { ...STATS },
    },
    sideEffect(
      ids.armor,
      "Chameleos Horn - Rock Steady",
      "armor",
      "Rock Steady",
      [{ key: "system.traits.ci.value", mode: 2, value: "prone", priority: 20 }],
      "Can't be unwillingly knocked prone; ignore Kushala/Amatsu wind barriers (manual for wind).",
    ),
  ],
});

// ─── 6. Mizutsune Water Gem ───
pushRune({
  name: "Mizutsune Water Gem",
  sort: (sortBase += 10000),
  sides: bothSides("Watery Sphere", "Bubbly+"),
  systemExtra: {
    activities: {
      ...utilityActivity(
        idsOf("Mizutsune Water Gem").act1,
        "Watery Sphere Reminder",
        "special",
        "(Spellcaster Only) You know watery sphere; always prepared / class spell if needed (add spell manually).",
        { condition: "Weapon side — Spellcaster only" },
      ),
      ...utilityActivity(
        idsOf("Mizutsune Water Gem").act2,
        "Bubbly+ Slow Duration Reminder",
        "special",
        "Bubbly+: durations of slowing effects are halved (apply manually). Dex save advantage is automated via AE.",
        { condition: "Armor side — when affected by a slowing effect" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Mizutsune Water Gem - Watery Sphere",
      "weapon",
      "Watery Sphere",
      [],
      "(Spellcaster Only) Know watery sphere (manual / activity reminder).",
    ),
    sideEffect(
      ids.armor,
      "Mizutsune Water Gem - Bubbly+",
      "armor",
      "Bubbly+",
      [{ key: "flags.midi-qol.advantage.ability.save.dex", mode: 0, value: "1", priority: 20 }],
      "Advantage on Dexterity saving throws; slowing effect durations halved (manual).",
    ),
  ],
});

// ─── 7. Teostra Mane ───
pushRune({
  name: "Teostra Mane",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Eye", "Extend Aura +5 ft"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Teostra Mane").act1,
      "Extend Aura +5 ft",
      "action",
      "(Paladin Only) Extend your aura by 5 feet for 1 minute. 1/LR.",
      {
        condition: "Armor side — Paladin only",
        consumeItemUse: true,
        durationValue: "1",
        durationUnits: "minute",
      },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Teostra Mane - Critical Eye",
      "weapon",
      "Critical Eye",
      [{ key: "flags.dnd5e.weaponCriticalThreshold", mode: 5, value: "19", priority: 20 }],
      "Critical hit range increased by 1.",
    ),
    sideEffect(
      ids.armor,
      "Teostra Mane - Extend Aura",
      "armor",
      "Extend Aura +5 ft",
      [],
      "(Paladin Only) Action: extend aura +5 ft for 1 minute. 1/LR.",
    ),
  ],
});

// ─── 8. J.Barroth Gem ───
pushRune({
  name: "J.Barroth Gem",
  sort: (sortBase += 10000),
  sides: bothSides("Hammer Charge 10 ft", "Armor of Agathys (3rd)"),
  systemExtra: {
    uses: { spent: 0, max: "2", recovery: [{ period: "dawn", type: "recoverAll" }] },
    activities: {
      ...utilityActivity(
        idsOf("J.Barroth Gem").act1,
        "Cast Armor of Agathys (3rd)",
        "action",
        "(Sorcerer/Warlock/Wizard Only) Expend 1 rune to cast armor of agathys at 3rd level (add/cast the spell). 2 runes/dawn.",
        {
          condition: "Armor side — Sorcerer, Warlock, or Wizard only",
          consumeItemUse: true,
        },
      ),
      ...utilityActivity(
        idsOf("J.Barroth Gem").act2,
        "Hammer Charge 10 ft Reminder",
        "special",
        "(Hammer Only) Charge requires only 10 ft straight-line movement instead of 20 ft (apply manually / weapon sheet).",
        { condition: "Weapon side — Hammer only" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "J.Barroth Gem - Hammer Charge 10 ft",
      "weapon",
      "Hammer Charge 10 ft",
      [],
      "(Hammer Only) Charge distance reduced to 10 ft (manual).",
    ),
    sideEffect(
      ids.armor,
      "J.Barroth Gem - Armor of Agathys",
      "armor",
      "Armor of Agathys (3rd)",
      [],
      "(Sorcerer/Warlock/Wizard) 2 runes/dawn: cast armor of agathys 3rd (item activity).",
    ),
  ],
});

writeAll({ summarizeSides: true });
