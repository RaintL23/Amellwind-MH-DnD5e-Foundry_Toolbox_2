/**
 * One-off generator for missing / fixed Foundry rune items.
 * Run: node public/data/foundry-jsons-example/runes/_build-missing-runes.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CORE = {
  coreVersion: "12.331",
  systemId: "dnd5e",
  systemVersion: "4.4.4",
};

const STATS = {
  compendiumSource: null,
  duplicateSource: null,
  ...CORE,
  createdTime: null,
  modifiedTime: null,
  lastModifiedBy: null,
};

const DAE = {
  enableCondition: "",
  selfTarget: false,
  selfTargetAlways: false,
  stackable: "noneName",
  showIcon: false,
  durationExpression: "",
  specialDuration: [],
  disableIncapacitated: false,
  dontApply: false,
};

const DURATION = {
  startTime: null,
  seconds: null,
  combat: null,
  rounds: null,
  turns: null,
  startRound: null,
  startTurn: null,
};

function trinketSystem(description, identifier, rarity = "uncommon", extra = {}) {
  return {
    source: { custom: "", book: "MHMM", page: "", license: "", rules: "2024", revision: 1 },
    description: { value: description, chat: "" },
    identifier,
    quantity: 1,
    weight: { value: 0.1, units: "lb" },
    price: { value: 0, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped: false,
    rarity,
    identified: true,
    type: { value: "trinket", baseItem: "" },
    armor: { value: null, dex: null, magicalBonus: null },
    properties: [],
    proficient: null,
    strength: null,
    activities: {},
    container: null,
    cover: null,
    crewed: false,
    unidentified: { description: "" },
    uses: { spent: 0, max: "", recovery: [] },
    ...extra,
  };
}

function equipEffect(id) {
  return {
    _id: id,
    name: "", // filled per rune
    img: "mh-icons/material-rune.webp",
    type: "base",
    system: {},
    changes: [{ key: "macro.itemMacro", mode: 0, value: "", priority: 20 }],
    disabled: false,
    duration: { ...DURATION },
    description: "On equip, choose which rune effect (Weapon or Armor) to activate.",
    origin: null,
    tint: "#ffffff",
    transfer: true,
    statuses: [],
    sort: -10,
    flags: { dae: { ...DAE }, "amellwind-toolbox": { runeController: true } },
    _stats: { ...STATS },
  };
}

function sideEffect(id, name, side, materialEffectName, changes = [], description = "", extra = {}) {
  return {
    _id: id,
    name,
    img: "mh-icons/material-rune.webp",
    type: "base",
    system: {},
    changes,
    disabled: true,
    duration: { ...DURATION },
    description,
    origin: null,
    tint: "#ffffff",
    transfer: false,
    statuses: [],
    sort: 0,
    flags: {
      dae: { ...DAE },
      "amellwind-toolbox": { runeSide: side, materialEffectName },
      ...extra.flags,
    },
    _stats: { ...STATS },
    ...extra.body,
  };
}

const RUNE_CONTROLLER = `// Amellwind unified rune controller (Foundry v12 / dnd5e 4.4 / MidiQOL + DAE + Item Macro)
const FLAG = "amellwind-toolbox";
const getRuneFlag = (doc, key) => foundry.utils.getProperty(doc, \`flags.\${FLAG}.\${key}\`);
const setRuneFlag = async (doc, key, value) => doc.update({ [\`flags.\${FLAG}.\${key}\`]: value });
const unsetRuneFlag = async (doc, key) => doc.update({ [\`flags.\${FLAG}.-=\${key}\`]: null });
const actorDoc = actor ?? item?.actor ?? item?.parent;
if (!item) return;
const arg0 = args?.[0];
const pass = String(arg0?.macroPass ?? "").toLowerCase();
const runeName = getRuneFlag(item, "runeName") ?? item.name;

async function runeCleanup() {
  if (!actorDoc) return;
  const mine = actorDoc.effects.filter((e) => getRuneFlag(e, "runeClone") && e.origin === item.uuid);
  if (mine.length) await actorDoc.deleteEmbeddedDocuments("ActiveEffect", mine.map((e) => e.id));
  await unsetRuneFlag(item, "applied");
}

function runeAeName(side, matName, trinket) {
  let n = \`\${runeName}-\${side}\`;
  if (matName) n += \`-\${matName}\`;
  if (trinket) n += " (Trinket)";
  return n;
}

async function runeApplySide(side, trinket) {
  if (!actorDoc) return;
  const blueprints = item.effects.filter((e) => getRuneFlag(e, "runeSide") === side);
  const docs = blueprints.map((e) => {
    const o = e.toObject();
    delete o._id;
    o.origin = item.uuid;
    o.disabled = false;
    o.transfer = false;
    o.name = runeAeName(side, getRuneFlag(e, "materialEffectName"), trinket);
    foundry.utils.setProperty(o, \`flags.\${FLAG}.runeClone\`, true);
    foundry.utils.setProperty(o, "flags.dae.showIcon", false);
    return o;
  });
  if (docs.length) await actorDoc.createEmbeddedDocuments("ActiveEffect", docs);
  await setRuneFlag(item, "applied", { side, trinket });
  if (typeof runeOnEquip === "function") await runeOnEquip(side, trinket);
}

if (arg0 === "on") {
  if (!actorDoc) return;
  await runeCleanup();
  const sides = getRuneFlag(item, "sides") ?? {};
  const available = Object.keys(sides).filter((s) => sides[s]);
  if (!available.length) return;
  const radios = available
    .map((s, i) => \`<label style="display:block;margin:.15rem 0"><input type="radio" name="runeSide" value="\${s}" \${i === 0 ? "checked" : ""}/> \${sides[s].label ?? s}</label>\`)
    .join("");
  const content = \`<form class="dnd5e2"><p>Choose which effect to activate for <strong>\${runeName}</strong>:</p>\${radios}<hr/><label style="display:block;margin-top:.35rem"><input type="checkbox" name="runeTrinket"/> Equipped in a trinket</label></form>\`;
  const choice = await new Promise((resolve) => {
    new Dialog({
      title: \`\${runeName} Rune\`,
      content,
      buttons: {
        ok: { icon: '<i class="fas fa-check"></i>', label: "Activate", callback: (html) => resolve({ side: html.find('input[name="runeSide"]:checked').val(), trinket: html.find('input[name="runeTrinket"]').is(":checked") }) },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => resolve(null) },
      },
      default: "ok",
      close: () => resolve(null),
    }).render(true);
  });
  if (!choice || !choice.side) { await item.update({ "system.equipped": false }); return; }
  await runeApplySide(choice.side, choice.trinket);
  return;
}

if (arg0 === "off") { await runeCleanup(); return; }
if (arg0 === "each") return;

// ===== rune-specific combat passes =====`;

function buildItem({ _id, name, identifier, description, runeName, monsterName, sides, effects, macroName, macroTail, sort, rarity, systemExtra }) {
  const equip = effects.find((e) => e.flags?.["amellwind-toolbox"]?.runeController);
  if (equip) equip.name = `${runeName} Rune (Equip)`;
  return {
    _id,
    name: `${runeName} Rune`,
    type: "equipment",
    img: "mh-icons/material-rune.webp",
    system: trinketSystem(description, identifier, rarity, systemExtra),
    effects,
    folder: null,
    sort,
    ownership: { default: 0 },
    flags: {
      "amellwind-toolbox": {
        exportKind: "rune",
        runeName,
        monsterName,
        unified: true,
        sides,
      },
      itemacro: {
        macro: {
          name: macroName,
          type: "script",
          scope: "global",
          author: "",
          img: "icons/svg/dice-target.svg",
          command: RUNE_CONTROLLER + macroTail,
          folder: null,
          sort: 0,
          ownership: { default: 0 },
          flags: {},
          _stats: { ...CORE },
        },
      },
    },
    _stats: { ...STATS, createdTime: Date.now(), modifiedTime: Date.now() },
  };
}

function spellAttackElementBonus(types, label) {
  const checks = types
    .flatMap((t) => [
      `dump.includes("${t}")`,
      `desc.includes("${t}")`,
    ])
    .join(" || ");
  return `
if (pass.includes("preitemroll") || pass.includes("preattackroll")) {
  const wf = workflow ?? arg0?.workflow;
  const src = wf?.item;
  if (!src || src.type !== "spell") return;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const desc = String(src.system?.description?.value ?? "").toLowerCase();
  const hasElement = ${checks};
  if (!hasElement) return;
  foundry.utils.setProperty(arg0, "attackRollBonus", (Number(arg0?.attackRollBonus ?? 0) || 0) + 1);
  if (wf) wf.attackRollBonus = (Number(wf.attackRollBonus ?? 0) || 0) + 1;
  return;
}`;
}

function spellDamageTypeBonus(type, label) {
  return `
if (pass.includes("damagebonus")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf || !actorDoc) return null;
  const src = wf.item;
  if (!src || src.type !== "spell") return null;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const desc = String(src.system?.description?.value ?? "").toLowerCase();
  const hasType = dump.includes("${type}") || desc.includes("${type}")
    || (wf.damageDetail ?? []).some((d) => String(d.type ?? "").toLowerCase() === "${type}")
    || (wf.damageRolls ?? []).some((r) => /\\[${type}\\]/i.test(r?.formula ?? ""));
  if (!hasType) return null;
  const prof = Number(actorDoc.system?.attributes?.prof ?? 2);
  const bonus = Math.max(1, Math.floor(prof / 2));
  return { damageRoll: \`\${bonus}[${type}]\`, flavor: \`\${runeName} — ${label}\` };
}`;
}

function resentmentTail() {
  return `
if (pass.includes("isdamaged")) {
  const wf = workflow ?? arg0?.workflow;
  const attacker = wf?.token?.actor ?? wf?.actor;
  if (!attacker || attacker.uuid === actorDoc?.uuid) return;
  const ids = new Set(getRuneFlag(item, "resentmentTargets") ?? []);
  ids.add(attacker.uuid);
  await setRuneFlag(item, "resentmentTargets", [...ids]);
  await setRuneFlag(item, "resentmentTurn", game.combat?.round ?? game.time?.worldTime ?? 0);
  return;
}
if (pass.includes("preattackroll") || pass.includes("preitemroll")) {
  const targets = getRuneFlag(item, "resentmentTargets") ?? [];
  if (!targets.length) return;
  const wf = workflow ?? arg0?.workflow;
  const target = wf?.targets?.first?.()?.actor ?? wf?.target?.actor;
  if (!target || !targets.includes(target.uuid)) return;
  foundry.utils.setProperty(arg0, "attackRollBonus", (Number(arg0?.attackRollBonus ?? 0) || 0) + 1);
  if (wf) wf.attackRollBonus = (Number(wf.attackRollBonus ?? 0) || 0) + 1;
  return;
}
if (pass.includes("damagebonus")) {
  const targets = getRuneFlag(item, "resentmentTargets") ?? [];
  if (!targets.length) return;
  const wf = workflow ?? arg0?.workflow;
  const target = wf?.targets?.first?.()?.actor ?? wf?.target?.actor;
  if (!target || !targets.includes(target.uuid)) return;
  return { damageRoll: "1", flavor: "Resentment" };
}`;
}

function nat20IgniteTail() {
  return `
if (pass.includes("postdamageroll") || pass.includes("postactiveeffects") || pass.includes("iscritical")) {
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
  const img = CONFIG.statusEffects?.find((e) => e.id === "burning")?.img ?? "icons/svg/fire.svg";
  const resolveActor = (t) => t?.actor ?? t?.document?.actor ?? (t?.documentName === "Actor" ? t : null);
  const buildBurn = () => ({
    name: "Ignite (Quematrice Gem)",
    img,
    type: "base",
    origin,
    transfer: false,
    disabled: false,
    duration: { rounds: null, turns: null, seconds: null, startTime: null, combat: null, startRound: null, startTurn: null },
    changes: [],
    statuses: ["burning"],
    tint: "#ffffff",
    description: "Catches fire: 1d4 fire at start of each turn until doused (Quematrice Gem).",
    flags: {
      dae: { stackable: "noneName", showIcon: true },
      "amellwind-toolbox": { quematriceIgnite: true },
      "midi-qol": { overtime: { turn: "start", saveAbility: "", saveDC: "", damageRoll: "1d4", damageType: "fire", label: "Ignite" } },
    },
  });
  for (const t of hits) {
    const targetActor = resolveActor(t);
    if (!targetActor) continue;
    if (!game.user.isGM && typeof MidiQOL?.socket === "function") {
      try {
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [buildBurn()] });
        continue;
      } catch (_) {}
    }
    await targetActor.createEmbeddedDocuments("ActiveEffect", [buildBurn()]);
  }
  return;
}`;
}

function slashingReductionChanges(amount) {
  const value = `-${amount}`;
  return [
    { key: "system.traits.dm.amount.slashing", mode: 2, value, priority: 20 },
    { key: "system.traits.dm.midi.slashing", mode: 2, value, priority: 20 },
  ];
}

function extraSlashingDamageChanges(amount) {
  const value = `${amount}[slashing]`;
  return [
    { key: "system.bonuses.mwak.damage", mode: 2, value, priority: 20 },
    { key: "system.bonuses.rwak.damage", mode: 2, value, priority: 20 },
  ];
}

function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function utilityActivity(id, name, activationType, chatFlavor, condition = "", consumeItemUse = false) {
  const activity = {
    _id: id,
    type: "utility",
    sort: 0,
    name,
    img: "mh-icons/material-rune.webp",
    activation: { type: activationType, value: null, condition, override: false },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: consumeItemUse
        ? [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }]
        : [],
    },
    description: { chatFlavor },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: null, units: "self", special: "", override: false },
    target: {
      template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
      affects: { count: "", type: "self", choice: false, special: "" },
      prompt: false,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: { identifier: slugify(name), displayActivityName: true },
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  };
  return { [id]: activity };
}

function sleepUnconsciousSaveBonusTail() {
  return `
if (pass.includes("issave")) {
  const wf = workflow ?? arg0?.workflow;
  if (!actorDoc || !wf) return;
  const looksSleepUnconscious = (obj) => {
    if (!obj) return false;
    const dump = JSON.stringify(obj).toLowerCase();
    return dump.includes("\\"unconscious\\"") || dump.includes("[unconscious]")
      || dump.includes("\\"sleep\\"") || /\\bsleep\\b/.test(dump)
      || dump.includes("sleep-like");
  };
  let applies = false;
  try {
    const activity = wf.activity;
    for (const ref of activity?.effects ?? []) {
      const eid = ref?._id ?? ref;
      const ef = wf.item?.effects?.get?.(eid) ?? wf.item?.effects?.find?.((e) => e.id === eid || e._id === eid);
      const statuses = ef?.statuses;
      const hit = statuses?.has?.("unconscious") || [...(statuses ?? [])].includes("unconscious")
        || looksSleepUnconscious(ef);
      if (ef && hit) { applies = true; break; }
    }
    if (!applies && looksSleepUnconscious(activity)) applies = true;
    if (!applies && looksSleepUnconscious(wf.item?.system)) applies = true;
    const desc = String(wf.item?.system?.description?.value ?? "").toLowerCase();
    if (!applies && (desc.includes("unconscious") || desc.includes("sleep")) && desc.includes("save")) applies = true;
  } catch (_) {}
  if (!applies) return;
  foundry.utils.setProperty(arg0, "saveBonus", (Number(arg0?.saveBonus ?? 0) || 0) + 1);
  if (wf) wf.saveBonus = (Number(wf.saveBonus ?? 0) || 0) + 1;
  return;
}`;
}

function isSaveProneAdvantageTail() {
  return `
if (pass.includes("issave")) {
  const wf = workflow ?? arg0?.workflow;
  if (!actorDoc || !wf) return;
  const looksProne = (obj) => {
    if (!obj) return false;
    const dump = JSON.stringify(obj).toLowerCase();
    return dump.includes('"prone"') || dump.includes("[prone]") || /\\bprone\\b/.test(dump);
  };
  let appliesProne = false;
  try {
    const activity = wf.activity;
    for (const ref of activity?.effects ?? []) {
      const eid = ref?._id ?? ref;
      const ef = wf.item?.effects?.get?.(eid) ?? wf.item?.effects?.find?.((e) => e.id === eid || e._id === eid);
      const statuses = ef?.statuses;
      const hasProne = statuses?.has?.("prone") || [...(statuses ?? [])].includes("prone") || looksProne(ef);
      if (ef && hasProne) { appliesProne = true; break; }
    }
    if (!appliesProne && looksProne(activity)) appliesProne = true;
    if (!appliesProne && looksProne(wf.item?.system)) appliesProne = true;
    const desc = String(wf.item?.system?.description?.value ?? "").toLowerCase();
    if (!appliesProne && desc.includes("prone") && (desc.includes("knock") || desc.includes("save"))) appliesProne = true;
  } catch (_) {}
  if (!appliesProne) return;
  foundry.utils.setProperty(arg0, "advantage", true);
  if (wf) wf.advantage = true;
  await actorDoc.setFlag("midi-qol", "advantage.ability.save.all", true);
  Hooks.once("midi-qol.RollComplete", async () => {
    try { await actorDoc.unsetFlag("midi-qol", "advantage.ability.save.all"); } catch (_) {}
  });
  return;
}`;
}

const items = [];

// ─── Flood Sac (fix) ───
items.push({
  path: path.join(__dirname, "Coral Pukei-Pukei", "fvtt-Item-coral-pukei-pukei-flood-sac-rune.json"),
  doc: buildItem({
    _id: "1n13jcat9mx2x18h",
    name: "Flood Sac Rune",
    identifier: "floodsacrune",
    runeName: "Flood Sac",
    monsterName: "Coral Pukei-Pukei",
    sort: 5200000,
    rarity: "uncommon",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Coral Pukei-Pukei | CR: 10 | Tier: 2</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<p>When you cast a spell that deals acid damage, add half of your proficiency bonus to that damage.</p>\n<h3>Armor Effect</h3>\n<p>While wearing this armor, you have a swimming speed equal to your walking speed, and you can hold your breath underwater for twice as long as normal.</p>\n<p><em><strong>Tags:</strong> mechanic:spell-buff:damage, damage:acid, type:offensive, type:utility, mechanic:movement</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Acid Spell Bonus" },
      armor: { label: "Armor Effect — Swim Speed" },
    },
    macroName: "Flood Sac Rune",
    macroTail: spellDamageTypeBonus("acid", "Acid Spell Bonus"),
    effects: [
      equipEffect("qJFZWBl4rBkSn0f8"),
      sideEffect(
        "ofqewaouaxeqbnhl",
        "Flood Sac - Swim Speed",
        "armor",
        "Swim Speed",
        [{ key: "system.attributes.movement.swim", mode: 5, value: "30", priority: 20 }],
        "Swimming speed 30 ft (approximately equal to walking speed) and extended breath underwater (passive).",
      ),
      sideEffect(
        "gyeN6L41PdFub65U",
        "Flood Sac - Acid Spell Bonus",
        "weapon",
        "Acid Spell Bonus",
        [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "ItemMacro.Flood Sac Rune,damageBonus", priority: 20 }],
        "Acid spells deal extra damage equal to half your proficiency bonus.",
      ),
    ],
  }),
});

// ─── Sharpened Fang+ ───
items.push({
  path: path.join(__dirname, "Volvidon", "fvtt-Item-volvidon-sharpened-fang-plus-rune.json"),
  doc: buildItem({
    _id: "BcWmaQzdieuwiGwk",
    identifier: "sharpenedfangplusrune",
    runeName: "Sharpened Fang+",
    monsterName: "Volvidon",
    sort: 8800000,
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Volvidon | CR: 5 | Tier: 2</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<p>Your weapon deals an extra [[/r 1d4]] slashing damage.</p>\n<h3>Armor Effect</h3>\n<p>While you are wearing this armor, you can use your reaction or bonus action to gain resistance to slashing damage until the end of your next turn. Once you use this property, you cannot use it again until you finish a long rest.</p>\n<p><em><strong>Tags:</strong> mechanic:extra-damage:minor, type:offensive, damage:slashing, mechanic:reaction, mechanic:bonus-action, mechanic:resistance, mechanic:long-rest, type:defensive</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Extra Slashing" },
      armor: { label: "Armor Effect — Slashing Resistance" },
    },
    macroName: "Sharpened Fang+ Rune",
    macroTail: "",
    systemExtra: {
      activities: {
        vi4v4q2OsqXh0fXC: {
          _id: "vi4v4q2OsqXh0fXC",
          type: "utility",
          sort: 0,
          name: "Slashing Resistance",
          img: "mh-icons/material-rune.webp",
          activation: { type: "bonus", value: null, condition: "Or use your reaction instead", override: false },
          consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [{ type: "activityUses", value: "1", scaling: { mode: "", formula: "" } }] },
          description: { chatFlavor: "Gain resistance to slashing damage until the end of your next turn." },
          duration: { value: "", units: "inst", concentration: false, override: false },
          effects: [{ _id: "Zvk2L3v2ddNV9tw6" }],
          range: { value: null, units: "self", special: "", override: false },
          target: { template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" }, affects: { count: "", type: "self", choice: false, special: "" }, prompt: false, override: false },
          uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
          midiProperties: { identifier: "slashing-resistance", displayActivityName: true, automationOnly: false, otherActivityCompatible: true, rollMode: "default" },
          roll: { formula: "", name: "", prompt: false, visible: false },
          useConditionText: "",
          useConditionReason: "",
          effectConditionText: "",
        },
      },
    },
    effects: [
      equipEffect("cNqUxgyp3iaCcdEe"),
      sideEffect(
        "9ido4OtvLpdnf9wP",
        "Sharpened Fang+ - Extra Slashing",
        "weapon",
        "Extra Slashing",
        [
          { key: "system.bonuses.mwak.damage", mode: 2, value: "1d4[slashing]", priority: 20 },
          { key: "system.bonuses.rwak.damage", mode: 2, value: "1d4[slashing]", priority: 20 },
        ],
        "While this rune is equipped: 1d4[slashing] on weapon attacks.",
      ),
      {
        ...sideEffect(
          "Zvk2L3v2ddNV9tw6",
          "Sharpened Fang+ - Slashing Resist (AE)",
          "armor",
          "Slashing Resistance",
          [{ key: "system.traits.dr.value", mode: 2, value: "slashing", priority: 20 }],
          "+1 slashing resistance until end of next turn (applied by activity).",
        ),
        disabled: false,
        flags: {
          dae: { ...DAE, specialDuration: ["turnEndSource"] },
          "amellwind-toolbox": { runeSide: "armor", materialEffectName: "Slashing Resistance AE" },
        },
      },
      sideEffect(
        "n3txYJjilS3p36s1",
        "Sharpened Fang+ - Slashing Resistance",
        "armor",
        "Slashing Resistance",
        [],
        "Reaction or bonus action: slashing resistance until end of next turn. 1/LR.",
      ),
    ],
  }),
});

// ─── Quematrice Gem ───
items.push({
  path: path.join(__dirname, "Quematrice", "fvtt-Item-quematrice-quematrice-gem-rune.json"),
  doc: buildItem({
    _id: "5sw49pKx30WI6lw7",
    identifier: "quematricegemrune",
    runeName: "Quematrice Gem",
    monsterName: "Quematrice",
    sort: 5900000,
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Quematrice | CR: 5 | Tier: 2</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<em>Minor Critical Status (Ignite).</em> When you make a weapon attack with this weapon, and roll a 20 for the attack roll, the target catches fire; Until a creature takes an action to douse the fire, the target takes 2 (1d4) fire damage at the start of each of its turns.\n<h3>Armor Effect</h3>\n<em>Tremor-Proof.</em> You cannot be knocked prone while you wear this armor.\n<p><em><strong>Tags:</strong> mechanic:condition, type:offensive, damage:fire, mechanic:saving-throw, type:defensive</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Minor Critical Status (Ignite)" },
      armor: { label: "Armor Effect — Tremor-Proof" },
    },
    macroName: "Quematrice Gem Rune",
    macroTail: nat20IgniteTail() + isSaveProneAdvantageTail(),
    effects: [
      equipEffect("QDG1rHcgcBw1tCFw"),
      sideEffect(
        "Lx4NapxtirVGSn64",
        "Quematrice Gem - Minor Critical Status (Ignite)",
        "weapon",
        "Minor Critical Status (Ignite)",
        [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "ItemMacro.Quematrice Gem Rune,postDamageRoll", priority: 20 }],
        "On natural 20 weapon attack: target catches fire (1d4 fire/turn until doused).",
      ),
      sideEffect(
        "coFw4jCghIBKGhyH",
        "Quematrice Gem - Tremor-Proof",
        "armor",
        "Tremor-Proof",
        [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "ItemMacro.Quematrice Gem Rune,isSave", priority: 20 }],
        "Advantage on saves vs being knocked prone.",
      ),
    ],
  }),
});

// ─── Blue Kut-Ku Auricle ───
items.push({
  path: path.join(__dirname, "Blue Yian Kut-Ku", "fvtt-Item-blue-yian-kut-ku-blue-kut-ku-auricle-rune.json"),
  doc: buildItem({
    _id: "lxmvTIGSJR14adrm",
    identifier: "bluekutkuauriclerune",
    runeName: "Blue Kut-Ku Auricle",
    monsterName: "Blue Yian Kut-Ku",
    sort: 4300000,
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Blue Yian Kut-Ku | CR: 5 | Tier: 2</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<p>While attuned to this weapon, you can use a bonus action to exhale fire at a target within 15 feet of you. The target must make a DC 14 Dexterity saving throw, taking [[/r 3d6]] fire damage on a failed save, or half as much damage on a successful one. Once used, this property cannot be used again until you finish a long rest.</p>\n<h3>Armor Effect</h3>\n<p>When you make a skill check while wearing this armor, you can use your reaction to gain a +2 bonus to the check. You can use this property twice, regaining all expended uses after you finish a long rest.</p>\n<p><em><strong>Tags:</strong> mechanic:bonus-action, mechanic:saving-throw, damage:fire, type:offensive, mechanic:reaction, mechanic:skill, mechanic:long-rest, type:utility</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Fire Breath" },
      armor: { label: "Armor Effect — Skill Check Boost" },
    },
    macroName: "Blue Kut-Ku Auricle Rune",
    macroTail: "",
    systemExtra: {
      uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
      activities: {
        NfFP1AKikeHKIoPm: {
          _id: "NfFP1AKikeHKIoPm",
          type: "save",
          sort: 0,
          name: "Fire Breath",
          img: "mh-icons/material-rune.webp",
          activation: { type: "bonus", value: null, condition: "", override: false },
          consumption: {
            scaling: { allowed: false, max: "" },
            spellSlot: false,
            targets: [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }],
          },
          description: { chatFlavor: "Exhale fire at a target within 15 ft (DC 14 Dex, 3d6 fire)." },
          duration: { value: "", units: "inst", concentration: false, override: false },
          effects: [],
          range: { value: "15", units: "ft", special: "", override: false },
          target: { template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" }, affects: { count: "1", type: "creature", choice: false, special: "" }, prompt: true, override: false },
          uses: { spent: 0, max: "", recovery: [] },
          damage: { parts: [{ number: 3, denomination: 6, bonus: "", types: ["fire"], custom: { enabled: false } }], onSave: "half" },
          save: { ability: ["dex"], dc: { calculation: "", formula: "14" } },
          midiProperties: { identifier: "fire-breath", displayActivityName: true, magicDamage: true },
          roll: { formula: "", name: "", prompt: false, visible: false },
        },
      },
    },
    effects: [
      equipEffect("x9vCiSs15g9Q3mL0"),
      sideEffect(
        "puCPIg2lQYRq5o4I",
        "Blue Kut-Ku Auricle - Fire Breath",
        "weapon",
        "Fire Breath",
        [],
        "Bonus action: 15 ft, DC 14 Dex save, 3d6 fire (half on save). 1/LR via item activity.",
      ),
      sideEffect(
        "n41IsszBMBsTqHLd",
        "Blue Kut-Ku Auricle - Skill Check Boost",
        "armor",
        "Skill Check Boost",
        [],
        "Reaction: +2 to a skill check. 2 uses, regain on long rest (track manually).",
      ),
    ],
  }),
});

// ─── Pumpkin.U Jaw ───
items.push({
  path: path.join(__dirname, "Pumpkin Uragaan", "fvtt-Item-pumpkin-uragaan-pumpkin-u-jaw-rune.json"),
  doc: buildItem({
    _id: "AL00Co0VffBks3w5",
    identifier: "pumpkinujawrune",
    runeName: "Pumpkin.U Jaw",
    monsterName: "Pumpkin Uragaan",
    sort: 2100000,
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Pumpkin Uragaan | CR: 10 | Tier: 2</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<em>Resentment.</em> Until the end of your turn, you gain a +1 bonus to attack and damage rolls against any creature that has damaged you since the end of your last turn.\n<h3>Armor Effect</h3>\n<p><em>(Fighter Only)</em> While attuned to this armor, you regain an extra [[/r 1d10]] hit points from your Second Wind feature.</p>\n<p><em><strong>Tags:</strong> mechanic:attack-bonus, mechanic:extra-damage:minor, type:offensive, class:fighter, mechanic:class-feature, type:defensive</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Resentment" },
      armor: { label: "Armor Effect — Second Wind Boost" },
    },
    macroName: "Pumpkin.U Jaw Rune",
    macroTail: resentmentTail(),
    effects: [
      equipEffect("9zrd6EFoAQirhYiP"),
      sideEffect("EMCiBD8lXcsRpWEO", "Pumpkin.U Jaw - Resentment (Track)", "weapon", "Resentment", [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "ItemMacro.Pumpkin.U Jaw Rune,isDamaged", priority: 20 }], "Tracks attackers that damage you (Resentment)."),
      sideEffect("OALzZxT9HmvJlpN3", "Pumpkin.U Jaw - Resentment (Attack)", "weapon", "Resentment", [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "ItemMacro.Pumpkin.U Jaw Rune,preItemRoll", priority: 20 }], "+1 attack rolls vs Resentment targets."),
      sideEffect("h4rWDnSVjZnsTgAu", "Pumpkin.U Jaw - Resentment (Damage)", "weapon", "Resentment", [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "ItemMacro.Pumpkin.U Jaw Rune,damageBonus", priority: 20 }], "+1 damage vs Resentment targets."),
      sideEffect("jaabF2sv62wRPAYI", "Pumpkin.U Jaw - Second Wind Boost", "armor", "Second Wind Boost", [], "Fighter only: +1d10 HP when using Second Wind (manual)."),
    ],
  }),
});

// ─── Uragaan Ruby (armor only) ───
items.push({
  path: path.join(__dirname, "Uragaan", "fvtt-Item-uragaan-uragaan-ruby-rune.json"),
  doc: {
    _id: "jyfvPUi0Hz9QiF4D",
    name: "Uragaan Ruby Rune",
    type: "equipment",
    img: "mh-icons/material-rune.webp",
    system: trinketSystem(
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Uragaan | CR: 6 | Tier: 2</p>\n<p><strong>Compatible Slots:</strong> Armor</p>\n<h3>Armor Effect</h3>\n<em>Uragaan Protection.</em> When you must make a saving throw while taking the dodge action, you can use your Armor Class in place of making the roll. You can use this property three times, regaining all uses when you finish a long rest.\n<p><em><strong>Tags:</strong> mechanic:saving-throw, mechanic:dodge, mechanic:ac, mechanic:long-rest, type:defensive</em></p>",
      "uragaanrubyrune",
      "rare",
      {
        uses: { spent: 0, max: "3", recovery: [{ period: "lr", type: "recoverAll" }] },
        activities: {
          g5ZN6EFtgDLMyNGP: {
            _id: "g5ZN6EFtgDLMyNGP",
            type: "utility",
            sort: 0,
            name: "Uragaan Protection",
            img: "mh-icons/material-rune.webp",
            activation: { type: "reaction", value: null, condition: "When you must make a save while taking the Dodge action", override: false },
            consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }] },
            description: { chatFlavor: "Use your AC in place of the saving throw." },
            duration: { value: "", units: "inst", concentration: false, override: false },
            effects: [],
            range: { value: null, units: "self", special: "", override: false },
            target: { template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" }, affects: { count: "", type: "self", choice: false, special: "" }, prompt: false, override: false },
            uses: { spent: 0, max: "", recovery: [] },
            midiProperties: { identifier: "uragaan-protection", displayActivityName: true },
            roll: { formula: "", name: "", prompt: false, visible: false },
          },
        },
      },
    ),
    effects: [
      { ...equipEffect("8TEw7I3Ao2x3uTPw"), name: "Uragaan Ruby Rune (Equip)" },
      sideEffect(
        "5Vm01swb67Qs6k2r",
        "Uragaan Ruby - Uragaan Protection",
        "armor",
        "Uragaan Protection",
        [],
        "Reaction while Dodging: use AC instead of the save. 3 uses, regain on long rest.",
      ),
    ],
    folder: null,
    sort: 7100000,
    ownership: { default: 0 },
    flags: {
      "amellwind-toolbox": {
        exportKind: "rune",
        runeName: "Uragaan Ruby",
        monsterName: "Uragaan",
        unified: true,
        sides: { armor: { label: "Armor Effect — Uragaan Protection" } },
      },
      itemacro: {
        macro: {
          name: "Uragaan Ruby Rune",
          type: "script",
          scope: "global",
          author: "",
          img: "icons/svg/dice-target.svg",
          command: RUNE_CONTROLLER + "\n",
          folder: null,
          sort: 0,
          ownership: { default: 0 },
          flags: {},
          _stats: { ...CORE },
        },
      },
    },
    _stats: { ...STATS, createdTime: Date.now(), modifiedTime: Date.now() },
  },
});

// ─── Bulldrome Tusk (weapon only) ───
items.push({
  path: path.join(__dirname, "Bulldrome", "fvtt-Item-bulldrome-bulldrome-tusk-rune.json"),
  doc: buildItem({
    _id: "b7kR0m3TuskWpn01",
    identifier: "bulldrometuskrune",
    runeName: "Bulldrome Tusk",
    monsterName: "Bulldrome",
    sort: 2000000,
    rarity: "common",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Bulldrome | CR: 2 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Weapon</p>\n<h3>Weapon Effect</h3>\n<p>Your slashing weapon deals an extra 2 slashing damage.</p>\n<p><em><strong>Tags:</strong> damage:slashing, type:offensive, mechanic:extra-damage:minor</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Extra Slashing" },
    },
    macroName: "Bulldrome Tusk Rune",
    macroTail: "",
    effects: [
      equipEffect("bTuskEq01xxxxxxxx"),
      sideEffect(
        "bTuskWpn01xxxxxxxx",
        "Bulldrome Tusk - Extra Slashing",
        "weapon",
        "Extra Slashing",
        [
          { key: "system.bonuses.mwak.damage", mode: 2, value: "2[slashing]", priority: 20 },
          { key: "system.bonuses.rwak.damage", mode: 2, value: "2[slashing]", priority: 20 },
        ],
        "Slashing weapons deal an extra 2 slashing damage on weapon attacks.",
      ),
    ],
  }),
});

// ─── Juv.Astalos Membrane ───
items.push({
  path: path.join(__dirname, "Juvenile Astalos", "fvtt-Item-juvenile-astalos-juv-astalos-membrane-rune.json"),
  doc: buildItem({
    _id: "jAm3mbr4n3Astl0s",
    identifier: "juvastalosmembranerune",
    runeName: "Juv.Astalos Membrane",
    monsterName: "Juvenile Astalos",
    sort: 3000000,
    rarity: "uncommon",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Juvenile Astalos | CR: 3 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<p>When you cast a spell that deals lightning or thunder damage, you gain a +1 bonus to its spell attack roll.</p>\n<h3>Armor Effect</h3>\n<em>Marathon Runner.</em> While wearing this armor, your walking speed increases by 5 feet.\n<p><em><strong>Tags:</strong> mechanic:spell-buff:attack, damage:lightning, damage:thunder, type:offensive, mechanic:movement, type:defensive</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Lightning/Thunder Spell Attack" },
      armor: { label: "Armor Effect — Marathon Runner" },
    },
    macroName: "Juv.Astalos Membrane Rune",
    macroTail: spellAttackElementBonus(["lightning", "thunder"], "Lightning/Thunder Spell Attack"),
    effects: [
      equipEffect("jAmEq01xxxxxxxxxx"),
      sideEffect(
        "jAmWpn01xxxxxxxxxx",
        "Juv.Astalos Membrane - Lightning/Thunder Spell Attack",
        "weapon",
        "Lightning/Thunder Spell Attack",
        [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "ItemMacro.Juv.Astalos Membrane Rune,preItemRoll", priority: 20 }],
        "+1 spell attack roll when casting a spell that deals lightning or thunder damage.",
      ),
      sideEffect(
        "jAmArm01xxxxxxxxxx",
        "Juv.Astalos Membrane - Marathon Runner",
        "armor",
        "Marathon Runner",
        [{ key: "system.attributes.movement.walk", mode: 2, value: "5", priority: 20 }],
        "Walking speed increases by 5 feet.",
      ),
    ],
  }),
});

// ─── D.Seltas Razorwing ───
items.push({
  path: path.join(__dirname, "Desert Seltas", "fvtt-Item-desert-seltas-d-seltas-razorwing-rune.json"),
  doc: buildItem({
    _id: "dS3lt4Rz0rw1ng01",
    identifier: "dseltasrazorwingrune",
    runeName: "D.Seltas Razorwing",
    monsterName: "Desert Seltas",
    sort: 4000000,
    rarity: "uncommon",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Desert Seltas | CR: 4 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<em>(Gunlance Only) Artillery.</em> While attuned to this weapon, your wyvernfire can now be used twice per long rest.\n<h3>Armor Effect</h3>\n<em>Minor Guard Up.</em> When you fail a Dexterity or Strength saving throw, you can use your reaction to use your AC in place of your roll. Once you use this property you can't use it again until you finish a long rest.\n<p><em><strong>Tags:</strong> weapon-type:gunlance, mechanic:class-feature, mechanic:long-rest, type:offensive, mechanic:reaction, mechanic:saving-throw, mechanic:ac, type:defensive</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Artillery (Gunlance)" },
      armor: { label: "Armor Effect — Minor Guard Up" },
    },
    macroName: "D.Seltas Razorwing Rune",
    macroTail: "",
    systemExtra: {
      uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
      activities: {
        mGU01xxxxxxxxxxxxx: {
          _id: "mGU01xxxxxxxxxxxxx",
          type: "utility",
          sort: 0,
          name: "Minor Guard Up",
          img: "mh-icons/material-rune.webp",
          activation: {
            type: "reaction",
            value: null,
            condition: "When you fail a Dexterity or Strength saving throw",
            override: false,
          },
          consumption: {
            scaling: { allowed: false, max: "" },
            spellSlot: false,
            targets: [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }],
          },
          description: { chatFlavor: "Use your AC in place of the failed save." },
          duration: { value: "", units: "inst", concentration: false, override: false },
          effects: [],
          range: { value: null, units: "self", special: "", override: false },
          target: {
            template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
            affects: { count: "", type: "self", choice: false, special: "" },
            prompt: false,
            override: false,
          },
          uses: { spent: 0, max: "", recovery: [] },
          midiProperties: { identifier: "minor-guard-up", displayActivityName: true },
          roll: { formula: "", name: "", prompt: false, visible: false },
        },
      },
    },
    effects: [
      equipEffect("dRzEq01xxxxxxxxxx"),
      sideEffect(
        "dRzWpn01xxxxxxxxxx",
        "D.Seltas Razorwing - Artillery",
        "weapon",
        "Artillery",
        [],
        "(Gunlance Only) Wyvernfire can be used twice per long rest (manual — update Gunlance wyvernfire uses).",
      ),
      sideEffect(
        "dRzArm01xxxxxxxxxx",
        "D.Seltas Razorwing - Minor Guard Up",
        "armor",
        "Minor Guard Up",
        [],
        "Reaction when you fail a Dex or Str save: use AC instead of the roll. 1/LR via item activity.",
      ),
    ],
  }),
});

// ─── Sharpened Fang (Volvidon Pup) ───
items.push({
  path: path.join(__dirname, "Volvidon Pup", "fvtt-Item-volvidon-pup-sharpened-fang-rune.json"),
  doc: buildItem({
    _id: "vPupShrpFng00001",
    identifier: "sharpenedfangrune",
    runeName: "Sharpened Fang",
    monsterName: "Volvidon Pup",
    sort: 8650000,
    rarity: "common",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Volvidon Pup | CR: 1/2 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<p>Your slashing weapon deals an extra 1 slashing damage.</p>\n<h3>Armor Effect</h3>\n<p>You reduce slashing damage you take by 2 while you wear this armor.</p>\n<p><em><strong>Tags:</strong> damage:slashing, type:offensive, type:defensive</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Extra Slashing" },
      armor: { label: "Armor Effect — Slashing Reduction" },
    },
    macroName: "Sharpened Fang Rune",
    macroTail: "",
    effects: [
      equipEffect("vPupEq01xxxxxxxx"),
      sideEffect(
        "vPupWpn01xxxxxxx",
        "Sharpened Fang - Extra Slashing",
        "weapon",
        "Extra Slashing",
        extraSlashingDamageChanges(1),
        "Slashing weapons deal an extra 1 slashing damage on weapon attacks.",
      ),
      sideEffect(
        "vPupArm01xxxxxxx",
        "Sharpened Fang - Slashing Reduction",
        "armor",
        "Slashing Reduction",
        slashingReductionChanges(2),
        "Reduce slashing damage taken by 2.",
      ),
    ],
  }),
});

// ─── Lagombi Plastron ───
items.push({
  path: path.join(__dirname, "Lagombi", "fvtt-Item-lagombi-lagombi-plastron-rune.json"),
  doc: buildItem({
    _id: "lPl4str0nLgm0001",
    identifier: "lagombiplastronrune",
    runeName: "Lagombi Plastron",
    monsterName: "Lagombi",
    sort: 3400000,
    rarity: "uncommon",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Lagombi | CR: 3 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<p>This weapon has a reservoir of ice magic that can freeze the ground for up to 30 seconds. While holding this weapon, you can use an action to plant this weapon in the ground and release the ice magic within. While planted and undepleted, the ground in a 10-foot radius of this weapon becomes difficult terrain. This weapon recharges [[/r 1d6]] seconds of energy to the weapon's reservoir daily at dawn.</p>\n<h3>Armor Effect</h3>\n<p>You ignore difficult terrain created by ice or snow while you wear this armor.</p>\n<p><em><strong>Tags:</strong> type:offensive, type:utility, mechanic:movement</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Ice Reservoir" },
      armor: { label: "Armor Effect — Ice/Snow Terrain" },
    },
    macroName: "Lagombi Plastron Rune",
    macroTail: "",
    systemExtra: {
      activities: utilityActivity(
        "lPlIce01xxxxxxxxxx",
        "Plant Ice Reservoir",
        "action",
        "Plant weapon: 10-ft radius becomes difficult terrain for up to 30 seconds (track reservoir manually). Recharges 1d6 seconds at dawn.",
        "Weapon side active — while holding this weapon",
      ),
    },
    effects: [
      equipEffect("lPlEq01xxxxxxxxxx"),
      sideEffect(
        "lPlWpn01xxxxxxxxx",
        "Lagombi Plastron - Ice Reservoir",
        "weapon",
        "Ice Reservoir",
        [],
        "Action: plant weapon to freeze ground in 10-ft radius (up to 30 seconds). Reservoir recharges 1d6 seconds daily at dawn.",
      ),
      sideEffect(
        "lPlArm01xxxxxxxxx",
        "Lagombi Plastron - Ice/Snow Terrain",
        "armor",
        "Ice/Snow Terrain",
        [],
        "Ignore difficult terrain created by ice or snow (passive).",
      ),
    ],
  }),
});

// ─── Seregios Blunt Scale ───
items.push({
  path: path.join(__dirname, "Young Seregios", "fvtt-Item-young-seregios-seregios-blunt-scale-rune.json"),
  doc: buildItem({
    _id: "ySrgBlntScl00001",
    identifier: "seregiosbluntscalerune",
    runeName: "Seregios Blunt Scale",
    monsterName: "Young Seregios",
    sort: 6400000,
    rarity: "common",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Young Seregios | CR: 2 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<em>Hunter.</em> While attuned to this weapon you gain one extra ration from whatever you hunt.\n<h3>Armor Effect</h3>\n<p>You reduce slashing damage you take by 3 while you wear this armor.</p>\n<p><em><strong>Tags:</strong> damage:slashing, type:defensive, type:utility</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Hunter" },
      armor: { label: "Armor Effect — Slashing Reduction" },
    },
    macroName: "Seregios Blunt Scale Rune",
    macroTail: "",
    effects: [
      equipEffect("ySrgEq01xxxxxxxx"),
      sideEffect(
        "ySrgWpn01xxxxxxx",
        "Seregios Blunt Scale - Hunter",
        "weapon",
        "Hunter",
        [],
        "While attuned: gain one extra ration from whatever you hunt (manual).",
      ),
      sideEffect(
        "ySrgArm01xxxxxxx",
        "Seregios Blunt Scale - Slashing Reduction",
        "armor",
        "Slashing Reduction",
        slashingReductionChanges(3),
        "Reduce slashing damage taken by 3.",
      ),
    ],
  }),
});

// ─── Y.Seregios Scraper ───
items.push({
  path: path.join(__dirname, "Young Seregios", "fvtt-Item-young-seregios-y-seregios-scraper-rune.json"),
  doc: buildItem({
    _id: "ySrgScrpr0000001",
    identifier: "yseregioscraperrune",
    runeName: "Y.Seregios Scraper",
    monsterName: "Young Seregios",
    sort: 6450000,
    rarity: "uncommon",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Young Seregios | CR: 2 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<em>FastCharge.</em> When you roll for initiative, your greatsword, longsword, or charge blade gains 1 charge, spirit, or phial charge.\n<h3>Armor Effect</h3>\n<em>Jump Master.</em> While wearing this armor, you can use an action to double your jump distance. You can use this property twice, regaining all expended uses on a short or long rest.\n<p><em><strong>Tags:</strong> mechanic:class-feature, mechanic:movement, mechanic:short-rest, mechanic:long-rest, type:defensive</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — FastCharge" },
      armor: { label: "Armor Effect — Jump Master" },
    },
    macroName: "Y.Seregios Scraper Rune",
    macroTail: "",
    systemExtra: {
      uses: { spent: 0, max: "2", recovery: [{ period: "sr", type: "recoverAll" }] },
      activities: utilityActivity(
        "ySrgJmp01xxxxxxxxx",
        "Double Jump Distance",
        "action",
        "Double your jump distance for your next jump. 2 uses, regain on short or long rest.",
        "Armor side active",
        true,
      ),
    },
    effects: [
      equipEffect("yScrEq01xxxxxxxx"),
      sideEffect(
        "yScrWpn01xxxxxxx",
        "Y.Seregios Scraper - FastCharge",
        "weapon",
        "FastCharge",
        [],
        "On initiative: greatsword/longsword/charge blade gains 1 charge, spirit, or phial charge (manual).",
      ),
      sideEffect(
        "yScrArm01xxxxxxx",
        "Y.Seregios Scraper - Jump Master",
        "armor",
        "Jump Master",
        [],
        "Action: double your jump distance. 2 uses, regain on short or long rest (item activity).",
      ),
    ],
  }),
});

// ─── Great Jagras Claw ───
items.push({
  path: path.join(__dirname, "Great Jagras", "fvtt-Item-great-jagras-great-jagras-claw-rune.json"),
  doc: buildItem({
    _id: "gJgrClw00000001",
    identifier: "greatjagrasclawrune",
    runeName: "Great Jagras Claw",
    monsterName: "Great Jagras",
    sort: 3150000,
    rarity: "common",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Great Jagras | CR: 4 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<em>Palico Rally.</em> NPC allies within 10 feet of you gain +1 AC and +1 to attack rolls while you are attuned to this weapon.\n<h3>Armor Effect</h3>\n<em>Full Belly.</em> As an action, you can eat up to two days' worth of rations causing your belly to expand for 1 minute or until you regurgitate the rations as a bonus action. For each ration you eat in this way, you gain a +1 bonus to your AC, but your movement speed is reduced by 10 feet.\n<p><em><strong>Tags:</strong> type:offensive, type:defensive, mechanic:action, mechanic:bonus-action, mechanic:ac, mechanic:movement</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Palico Rally" },
      armor: { label: "Armor Effect — Full Belly" },
    },
    macroName: "Great Jagras Claw Rune",
    macroTail: "",
    systemExtra: {
      activities: {
        ...utilityActivity(
          "gJgFB01xxxxxxxxxx",
          "Full Belly",
          "action",
          "Eat up to 2 days' worth of rations: +1 AC and -10 ft speed per ration for 1 minute (track AC/speed manually).",
          "Armor side active",
        ),
        ...utilityActivity(
          "gJgRG01xxxxxxxxxx",
          "Regurgitate",
          "bonus",
          "End Full Belly early and restore normal AC/speed.",
          "While Full Belly is active",
        ),
      },
    },
    effects: [
      equipEffect("gJgEq01xxxxxxxxxx"),
      sideEffect(
        "gJgWpn01xxxxxxxxx",
        "Great Jagras Claw - Palico Rally",
        "weapon",
        "Palico Rally",
        [],
        "NPC allies within 10 ft gain +1 AC and +1 attack rolls while you are attuned (apply to allied NPC tokens manually).",
      ),
      sideEffect(
        "gJgArm01xxxxxxxxx",
        "Great Jagras Claw - Full Belly",
        "armor",
        "Full Belly",
        [],
        "Action: eat up to 2 rations (+1 AC, -10 ft speed each) for 1 minute. Bonus action to regurgitate (item activities).",
      ),
    ],
  }),
});

// ─── Doshaguma Fang ───
items.push({
  path: path.join(__dirname, "Doshaguma", "fvtt-Item-doshaguma-doshaguma-fang-rune.json"),
  doc: buildItem({
    _id: "dshgFng00000001",
    identifier: "doshagumafangrune",
    runeName: "Doshaguma Fang",
    monsterName: "Doshaguma",
    sort: 2550000,
    rarity: "common",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Doshaguma | CR: 1 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<em>Dwarf Thrower.</em> While attuned to this weapon you can use your action to throw a willing ally that isn't grappled a number of feet equal to 5 times your Strength modifier. The ally lands as safely as possible in the space you throw them.\n<h3>Armor Effect</h3>\n<em>Palamute Rally.</em> NPC allies within 10 feet of you gain a +1 bonus to their AC and attack rolls while you are attuned to this armor.\n<p><em><strong>Tags:</strong> type:offensive, type:utility, mechanic:action, mechanic:movement</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Dwarf Thrower" },
      armor: { label: "Armor Effect — Palamute Rally" },
    },
    macroName: "Doshaguma Fang Rune",
    macroTail: "",
    systemExtra: {
      activities: utilityActivity(
        "dshDT01xxxxxxxxxx",
        "Dwarf Thrower",
        "action",
        "Throw a willing, ungrappled ally 5 × your Strength modifier feet (GM resolves landing).",
        "Weapon side active — while attuned to this weapon",
      ),
    },
    effects: [
      equipEffect("dshEq01xxxxxxxxxx"),
      sideEffect(
        "dshWpn01xxxxxxxxx",
        "Doshaguma Fang - Dwarf Thrower",
        "weapon",
        "Dwarf Thrower",
        [],
        "Action: throw a willing ally 5 × STR mod feet (item activity; resolve landing manually).",
      ),
      sideEffect(
        "dshArm01xxxxxxxxx",
        "Doshaguma Fang - Palamute Rally",
        "armor",
        "Palamute Rally",
        [],
        "NPC allies within 10 ft gain +1 AC and +1 attack rolls while you are attuned (apply to allied NPC tokens manually).",
      ),
    ],
  }),
});

// ─── Velocidrome Head (armor only) ───
items.push({
  path: path.join(__dirname, "Velocidrome", "fvtt-Item-velocidrome-velocidrome-head-rune.json"),
  doc: buildItem({
    _id: "vlcHd0000000001",
    identifier: "velocidromeheadrune",
    runeName: "Velocidrome Head",
    monsterName: "Velocidrome",
    sort: 8550000,
    rarity: "common",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Velocidrome | CR: 1 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Armor Effect</h3>\n<p>Whenever you make a saving throw against the @condition[unconscious] condition or other sleep-like effects, you do so with a +1 bonus.</p>\n<p><em><strong>Tags:</strong> mechanic:saving-throw, mechanic:condition, type:defensive</em></p>",
    sides: {
      armor: { label: "Armor Effect — Sleep/Unconscious Save Bonus" },
    },
    macroName: "Velocidrome Head Rune",
    macroTail: sleepUnconsciousSaveBonusTail(),
    effects: [
      equipEffect("vlcEq01xxxxxxxxxx"),
      sideEffect(
        "vlcArm01xxxxxxxxx",
        "Velocidrome Head - Sleep/Unconscious Save Bonus",
        "armor",
        "Sleep/Unconscious Save Bonus",
        [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: "ItemMacro.Velocidrome Head Rune,isSave", priority: 20 }],
        "+1 bonus on saves vs unconscious or sleep-like effects (MidiQOL isSave pass).",
      ),
    ],
  }),
});

// ─── Great Izuchi Tail ───
items.push({
  path: path.join(__dirname, "Great Izuchi", "fvtt-Item-great-izuchi-great-izuchi-tail-rune.json"),
  doc: buildItem({
    _id: "gIztTail0000001",
    identifier: "greatizuchitailrune",
    runeName: "Great Izuchi Tail",
    monsterName: "Great Izuchi",
    sort: 3180000,
    rarity: "common",
    description:
      "<h4>Source Monster</h4>\n<p><strong>Monster:</strong> Great Izuchi | CR: 3 | Tier: 1</p>\n<p><strong>Compatible Slots:</strong> Armor, Weapon</p>\n<h3>Weapon Effect</h3>\n<p><em>(Spellcaster Only)</em> You know the @spell[friends] cantrip. If you already know the friends cantrip, the creature doesn't realize that you used magic to influence its mood until 10 minutes after the spell ends.</p>\n<h3>Armor Effect</h3>\n<em>Palamute Rally.</em> NPC allies within 10 feet of you gain a +1 bonus to their AC and attack rolls while you are attuned to this armor.\n<p><em><strong>Tags:</strong> class:spellcaster, mechanic:spell, type:offensive, type:utility</em></p>",
    sides: {
      weapon: { label: "Weapon Effect — Friends Cantrip" },
      armor: { label: "Armor Effect — Palamute Rally" },
    },
    macroName: "Great Izuchi Tail Rune",
    macroTail: "",
    systemExtra: {
      activities: utilityActivity(
        "gIzFr01xxxxxxxxxx",
        "Friends Cantrip",
        "action",
        "Cast friends (spellcasters only). If you already know friends, targets don't realize magic was used until 10 minutes after the spell ends.",
        "Weapon side active — spellcasters only",
      ),
    },
    effects: [
      equipEffect("gIzEq01xxxxxxxxxx"),
      sideEffect(
        "gIzWpn01xxxxxxxxx",
        "Great Izuchi Tail - Friends Cantrip",
        "weapon",
        "Friends Cantrip",
        [],
        "Spellcasters know friends cantrip; extended deception if already known (cast via spell sheet or activity).",
      ),
      sideEffect(
        "gIzArm01xxxxxxxxx",
        "Great Izuchi Tail - Palamute Rally",
        "armor",
        "Palamute Rally",
        [],
        "NPC allies within 10 ft gain +1 AC and +1 attack rolls while you are attuned (apply to allied NPC tokens manually).",
      ),
    ],
  }),
});

for (const { path: filePath, doc } of items) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n");
  console.log("Wrote", path.relative(__dirname, filePath));
}
