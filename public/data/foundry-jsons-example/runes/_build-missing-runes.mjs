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

for (const { path: filePath, doc } of items) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n");
  console.log("Wrote", path.relative(__dirname, filePath));
}
