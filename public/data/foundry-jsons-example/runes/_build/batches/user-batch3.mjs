/**
 * User-requested runes batch 3
 * Run via: node public/data/foundry-jsons-example/runes/_build/build.mjs user-batch3
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  createRuneBatch,
  loadBatchData,
  armorOnly,
  bothSides,
  equipEffect,
  midi,
  midiMulti,
  sideEffect,
  utilityActivity,
  weaponOnly,
} from "../../../../scripts/runes/build-rune-lib.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const runesRoot = path.resolve(__dirname, "../..");
const { metaList, idsByName } = loadBatchData(path.resolve(__dirname, "../data/user-batch3"));
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

function mindEyeTail() {
  return `
if (pass.includes("damagebonus") || pass.includes("predamageroll") || pass.includes("preamblecomplete")) {
  const applied = getRuneFlag(item, "applied");
  if (!applied || applied.side !== "weapon") return;
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const actType = String(wf.activity?.type ?? arg0?.activity?.type ?? "").toLowerCase();
  const isWeaponAttack =
    itemType === "weapon"
    || ["mwak", "rwak"].includes(actionType)
    || (actType === "attack" && itemType !== "spell");
  if (!isWeaponAttack) return;
  try {
    wf.ignoreResistances = true;
    foundry.utils.setProperty(arg0, "ignoreResistances", true);
  } catch (_) {}
  return;
}`;
}

function poisonSpellDcTail() {
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
  foundry.utils.setProperty(arg0, "saveDCBonus", (Number(arg0?.saveDCBonus ?? 0) || 0) + 1);
  if (wf) wf.saveDCBonus = (Number(wf.saveDCBonus ?? 0) || 0) + 1;
  return;
}`;
}
let sortBase = 9900000;

// ─── 1. Espinas Tail ───
pushRune({
  name: "Espinas Tail",
  sort: sortBase,
  sides: bothSides("Awaken", "Stamina Surge+1"),
  macroTail: awakenExtraDieTail(),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "day", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Espinas Tail").act1,
      "Cast Haste (Self)",
      "action",
      "Stamina Surge+1: cast haste targeting only yourself. When the spell ends, gain 2 levels of exhaustion. 1/day.",
      { condition: "Armor side active", consumeItemUse: true },
    ),
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Espinas Tail - Awaken",
      "weapon",
      "Awaken",
      midi(macroName, "damageBonus"),
      "Non-elemental weapons roll one extra damage die on hit.",
    ),
    sideEffect(
      ids.armor,
      "Espinas Tail - Stamina Surge+1",
      "armor",
      "Stamina Surge+1",
      [],
      "Action: cast haste on self. 1/day. When haste ends: 2 exhaustion (use activity).",
    ),
  ],
});

// ─── 2. Wyvern Stone ───
pushRune({
  name: "Wyvern Stone",
  sort: (sortBase += 10000),
  sides: bothSides("Quick Load", "Wide-Range"),
  systemExtra: {
    activities: {
      ...utilityActivity(
        idsOf("Wyvern Stone").act1,
        "Quick Load Reminder",
        "special",
        "Quick Load: reload as a free action while attuned (weapon side).",
        { condition: "Weapon side active" },
      ),
      ...utilityActivity(
        idsOf("Wyvern Stone").act2,
        "Wide-Range Share",
        "special",
        "Wide-Range: when you eat/drink an Uncommon or lower consumable (except potions of resistance), allies within 10 ft also gain the effect (apply manually).",
        { condition: "Armor side active — when you consume an eligible item" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Wyvern Stone - Quick Load",
      "weapon",
      "Quick Load",
      [],
      "Reload as a free action (manual / activity reminder).",
    ),
    sideEffect(
      ids.armor,
      "Wyvern Stone - Wide-Range",
      "armor",
      "Wide-Range",
      [],
      "Share Uncommon-or-lower consumable effects with allies within 10 ft (manual / activity reminder).",
    ),
  ],
});

// ─── 3. Rathian Plate ───
pushRune({
  name: "Rathian Plate",
  sort: (sortBase += 10000),
  sides: bothSides("Poison Spell DC +1", "Poisoned Immunity"),
  macroTail: poisonSpellDcTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Rathian Plate - Poison Spell DC +1",
      "weapon",
      "Poison Spell DC +1",
      midiMulti(macroName, ["preSaveDC", "preambleComplete", "preItemRoll"]),
      "Poison-damage spells: spell save DC +1.",
    ),
    sideEffect(
      ids.armor,
      "Rathian Plate - Poisoned Immunity",
      "armor",
      "Poisoned Immunity",
      [{ key: "system.traits.ci.value", mode: 2, value: "poisoned", priority: 20 }],
      "Immune to the poisoned condition.",
    ),
  ],
});

// ─── 4. Y.Narga Pelt (armor only) ───
pushRune({
  name: "Y.Narga Pelt",
  sort: (sortBase += 10000),
  sides: armorOnly("Darkvision +60"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.armor,
      "Y.Narga Pelt - Darkvision",
      "armor",
      "Darkvision +60",
      [{ key: "system.attributes.senses.darkvision", mode: 2, value: "60", priority: 20 }],
      "Gain darkvision 60 ft, or increase existing darkvision by 60 ft.",
    ),
  ],
});

// ─── 5. G.Agnak Fin (weapon only) ───
pushRune({
  name: "G.Agnak Fin",
  sort: (sortBase += 10000),
  sides: weaponOnly("Mind's Eye"),
  macroTail: mindEyeTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "G.Agnak Fin - Mind's Eye",
      "weapon",
      "Mind's Eye",
      midiMulti(macroName, ["preDamageRoll", "damageBonus"]),
      "Weapon attacks bypass damage resistances (not immunities).",
    ),
  ],
});

// ─── 6. Anjanath Fang ───
pushRune({
  name: "Anjanath Fang",
  sort: (sortBase += 10000),
  sides: bothSides("Produce Flame", "Blinding Flame Reaction"),
  systemExtra: {
    uses: { spent: 0, max: "2", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: {
      ...utilityActivity(
        idsOf("Anjanath Fang").act1,
        "Blinding Flame",
        "reaction",
        "Impose disadvantage on an attack roll from a creature within 30 ft that you can see (blinding white flame). Attackers that can't be blinded are immune. 2/LR.",
        {
          condition: "Armor side — when attacked by a creature within 30 ft that you can see",
          consumeItemUse: true,
        },
      ),
      ...utilityActivity(
        idsOf("Anjanath Fang").act2,
        "Produce Flame Reminder",
        "special",
        "(Cleric/Druid/Ranger) You know produce flame while attuned. If you already know it: +1 to its spell attack roll (apply manually).",
        { condition: "Weapon side active" },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Anjanath Fang - Produce Flame",
      "weapon",
      "Produce Flame",
      [],
      "(Cleric/Druid/Ranger) Know produce flame; +1 spell attack if already known (manual / activity reminder).",
    ),
    sideEffect(
      ids.armor,
      "Anjanath Fang - Blinding Flame",
      "armor",
      "Blinding Flame Reaction",
      [],
      "Reaction: impose disadvantage on an attack within 30 ft. 2/LR (use activity).",
    ),
  ],
});

// ─── 7. Hirabami Hide (upgrade Divine Blessing+) ───
pushRune({
  name: "Hirabami Hide",
  sort: 4100000,
  rarity: "uncommon",
  sides: armorOnly("Divine Blessing+"),
  systemExtra: {
    uses: { spent: 0, max: "@prof", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Hirabami Hide").act1,
      "Divine Blessing+",
      "reaction",
      "Expend one divine die (1d6) to reduce the damage taken by the roll. Spend extra item uses for more dice (apply total manually).",
      {
        condition: "When you take damage you are not immune or resistant to — Armor side active",
        consumeItemUse: true,
        rollFormula: "1d6",
        rollName: "Divine Blessing+",
      },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.armor,
      "Hirabami Hide - Divine Blessing+",
      "armor",
      "Divine Blessing+",
      [],
      "Pool of d6s (= proficiency bonus). Reaction: expend dice to reduce incoming damage. Regain on long rest.",
    ),
  ],
});

writeAll();
