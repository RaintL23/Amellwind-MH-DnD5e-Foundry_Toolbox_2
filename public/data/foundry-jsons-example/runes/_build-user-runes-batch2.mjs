/**
 * Generator for 5 missing Foundry rune items requested by user (v12 / dnd5e 4.4.4).
 * Run: node public/data/foundry-jsons-example/runes/_build-user-runes-batch2.mjs
 *
 * Loads IDs from _user-runes-batch2-ids.json and text from _user-runes-batch2-meta.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeRuneItemMacroCommand } from "../../scripts/runes/compose-rune-itemacro.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const metaList = JSON.parse(fs.readFileSync(path.join(__dirname, "_user-runes-batch2-meta.json"), "utf8"));
const idsByName = JSON.parse(fs.readFileSync(path.join(__dirname, "_user-runes-batch2-ids.json"), "utf8"));

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
    name: "",
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

function buildItem({
  _id,
  name,
  identifier,
  description,
  runeName,
  monsterName,
  sides,
  effects,
  macroName,
  macroTail,
  sort,
  rarity,
  systemExtra,
}) {
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
          command: composeRuneItemMacroCommand(macroTail),
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

function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function identifierFrom(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "") + "rune";
}

function utilityActivity(id, name, activationType, chatFlavor, opts = {}) {
  const {
    condition = "",
    consumeActivityUse = false,
    usesMax = "",
    recoveryPeriod = "lr",
    effectIds = [],
    durationValue = "",
    durationUnits = "inst",
    specialDuration = [],
  } = opts;
  return {
    [id]: {
      _id: id,
      type: "utility",
      sort: 0,
      name,
      img: "mh-icons/material-rune.webp",
      activation: { type: activationType, value: null, condition, override: false },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: consumeActivityUse
          ? [{ type: "activityUses", value: "1", scaling: { mode: "", formula: "" } }]
          : [],
      },
      description: { chatFlavor },
      duration: { value: durationValue, units: durationUnits, concentration: false, override: false },
      effects: effectIds.map((eid) => ({ _id: eid })),
      range: { value: null, units: "self", special: "", override: false },
      target: {
        template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
        affects: { count: "", type: "self", choice: false, special: "" },
        prompt: false,
        override: false,
      },
      uses: usesMax
        ? { spent: 0, max: String(usesMax), recovery: [{ period: recoveryPeriod, type: "recoverAll" }] }
        : { spent: 0, max: "", recovery: [] },
      midiProperties: {
        identifier: slugify(name),
        displayActivityName: true,
        specialDurationHint: specialDuration,
      },
      roll: { formula: "", name: "", prompt: false, visible: false },
      useConditionText: "",
      useConditionReason: "",
      effectConditionText: "",
    },
  };
}

function metaOf(name) {
  const m = metaList.find((x) => x.name === name);
  if (!m) throw new Error(`Missing meta for ${name}`);
  return m;
}

function idsOf(name) {
  const ids = idsByName[name];
  if (!ids) throw new Error(`Missing ids for ${name}`);
  return ids;
}

function slotsLabel(slots) {
  const hasA = slots.includes("A");
  const hasW = slots.includes("W");
  if (hasA && hasW) return "Armor, Weapon";
  if (hasA) return "Armor";
  if (hasW) return "Weapon";
  return slots.join(", ");
}

function descHtml(meta) {
  const parts = [
    `<h4>Source Monster</h4>`,
    `<p><strong>Monster:</strong> ${meta.monster} | CR: ${meta.cr} | Tier: ${meta.tier}</p>`,
    `<p><strong>Compatible Slots:</strong> ${slotsLabel(meta.slots)}</p>`,
  ];
  if (meta.weapon) {
    parts.push(`<h3>Weapon Effect</h3>`, `<p>${meta.weapon}</p>`);
  }
  if (meta.armor) {
    parts.push(`<h3>Armor Effect</h3>`, `<p>${meta.armor}</p>`);
  }
  return parts.join("\n");
}

function bothSides(weaponLabel, armorLabel) {
  return {
    weapon: { label: `Weapon Effect — ${weaponLabel}` },
    armor: { label: `Armor Effect — ${armorLabel}` },
  };
}

function weaponOnly(weaponLabel) {
  return { weapon: { label: `Weapon Effect — ${weaponLabel}` } };
}

function midi(macroName, pass) {
  return [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: `ItemMacro.${macroName},${pass}`, priority: 20 }];
}

function midiMulti(macroName, passes) {
  return passes.flatMap((pass) => midi(macroName, pass));
}

/** Odogaron Gem: stackable wounds with midi overtime necrotic + Con DC 13. */
function odogaronWoundTail() {
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
  const origin = item.uuid;
  const resolveActor = (t) => t?.actor ?? t?.document?.actor ?? (t?.documentName === "Actor" ? t : null);
  const FLAG_KEY = "odogaronWound";

  for (const t of hits) {
    const targetActor = resolveActor(t);
    if (!targetActor) continue;
    const existing = [...(targetActor.effects ?? [])].find((e) => {
      const f = e.flags?.["amellwind-toolbox"] ?? {};
      return f[FLAG_KEY] && e.origin === origin;
    });
    const prevStacks = Number(existing?.flags?.["amellwind-toolbox"]?.stacks ?? 0);
    const stacks = prevStacks + 1;
    const img = CONFIG.statusEffects?.find((e) => e.id === "bleeding")?.img ?? "icons/svg/blood.svg";
    const buildWound = () => ({
      name: \`Odogaron Wound (×\${stacks})\`,
      img,
      type: "base",
      origin,
      transfer: false,
      disabled: false,
      duration: { rounds: null, turns: null, seconds: null, startTime: null, combat: null, startRound: null, startTurn: null },
      changes: [],
      statuses: [],
      tint: "#ffffff",
      description: \`Wounded ×\${stacks}: at start of turn take \${stacks}d4 necrotic, then DC 13 Con to end all wounds. Or action: DC 15 Wisdom (Medicine) (self or ally within 5 ft).\`,
      flags: {
        dae: { stackable: "noneName", showIcon: true },
        "amellwind-toolbox": { [FLAG_KEY]: true, stacks },
        "midi-qol": {
          overtime: {
            turn: "start",
            saveAbility: "con",
            saveDC: "13",
            damageRoll: \`\${stacks}d4\`,
            damageType: "necrotic",
            label: "Odogaron Wound",
            saveRemove: true,
          },
        },
      },
    });
    if (existing) {
      try { await existing.delete(); } catch (_) {}
    }
    if (!game.user.isGM && typeof MidiQOL?.socket === "function") {
      try {
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [buildWound()] });
        continue;
      } catch (_) {}
    }
    await targetActor.createEmbeddedDocuments("ActiveEffect", [buildWound()]);
  }
  return;
}`;
}

/** Rompopolo Claw weapon: Ammo Saver on ranged d20 17–20. */
function ammoSaverTail() {
  return `
if (pass.includes("postattackroll")) {
  const applied = getRuneFlag(item, "applied");
  if (!applied || applied.side !== "weapon") return;
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const src = wf.item;
  if (!src || src.type !== "weapon") return;
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isRanged =
    actionType === "rwak"
    || String(src.system?.type?.value ?? "").toLowerCase().includes("ranged")
    || src.system?.properties?.has?.("amm")
    || (Array.isArray(src.system?.properties) && src.system.properties.includes("amm"));
  if (!isRanged && actionType !== "rwak") return;

  let die = null;
  try {
    for (const d of (wf.attackRoll?.dice ?? arg0?.attackRoll?.dice ?? [])) {
      if (Number(d.faces) !== 20) continue;
      for (const r of (d.results ?? [])) {
        if (r.discarded) continue;
        die = Number(r.result ?? r);
      }
    }
  } catch (_) {}
  if (!(die >= 17 && die <= 20)) return;

  // Refund 1 consumed ammo / arrow if we can find it.
  let refunded = false;
  try {
    const consume = src.system?.consume ?? src.system?.ammunition;
    const ammoId = consume?.target ?? consume?.id ?? null;
    const ammo = ammoId
      ? actorDoc?.items?.get?.(ammoId) ?? actorDoc?.items?.find?.((i) => i.id === ammoId || i._id === ammoId)
      : null;
    if (ammo && ammo.system?.quantity != null) {
      await ammo.update({ "system.quantity": Number(ammo.system.quantity ?? 0) + 1 });
      refunded = true;
    }
  } catch (_) {}

  await ChatMessage.create({
    speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    content: \`<div class="dnd5e2"><p><strong>\${runeName}</strong> — Ammo Saver (rolled \${die}): \${refunded ? "1 ammo/arrow refunded." : "do not consume ammo/arrow (verify inventory)."}</p></div>\`,
  });
  return;
}`;
}

/** Rompopolo Claw armor: thunder-save advantage while Earplugs AE is active + Dispel activity. */
function earplugsTail() {
  return `
{
  const act = workflow?.activity ?? arg0?.activity ?? rolledActivity;
  const actId = String(act?.midiProperties?.identifier ?? act?.identifier ?? "").toLowerCase();
  const actName = String(act?.name ?? "").toLowerCase();
  const isDispel = actId === "dispel-earplugs" || actName.includes("dispel earplugs");
  if (isDispel && actorDoc) {
    const plugs = [...(actorDoc.effects ?? [])].filter((e) => e.flags?.["amellwind-toolbox"]?.rompopoloEarplugs);
    for (const e of plugs) {
      try { await e.delete(); } catch (_) {}
    }
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
      content: \`<div class="dnd5e2"><p><strong>\${runeName}</strong> — Earplugs dispelled.</p></div>\`,
    });
    return;
  }
}
if (pass.includes("issave")) {
  const applied = getRuneFlag(item, "applied");
  if (!applied || applied.side !== "armor") return;
  if (!actorDoc) return;
  const plugs = [...(actorDoc.effects ?? [])].some((e) => e.flags?.["amellwind-toolbox"]?.rompopoloEarplugs);
  if (!plugs) return;
  const wf = workflow ?? arg0?.workflow;
  const dump = JSON.stringify({
    dmg: wf?.damageDetail,
    item: wf?.item?.system?.damage,
    desc: wf?.item?.system?.description?.value,
    flavor: wf?.flavor,
  }).toLowerCase();
  if (!dump.includes("thunder")) return;
  foundry.utils.setProperty(arg0, "advantage", true);
  if (wf) wf.advantage = true;
  return;
}`;
}

/** B.Basarios Wing weapon: +2 save DC when forcing a stun save from a weapon attack. */
function hitterTail() {
  return `
if (pass.includes("presavedc") || pass.includes("preamblecomplete") || pass.includes("preitemroll") || pass.includes("preattackroll")) {
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

  const looksStunned = (obj) => {
    if (!obj) return false;
    const dump = JSON.stringify(obj).toLowerCase();
    return dump.includes('"stunned"') || dump.includes("[stunned]") || /\\bstunn/.test(dump);
  };
  let appliesStun = false;
  try {
    const activity = wf.activity;
    for (const ref of (activity?.effects ?? [])) {
      const eid = ref?._id ?? ref;
      const ef = wf.item?.effects?.get?.(eid) ?? wf.item?.effects?.find?.((e) => e.id === eid || e._id === eid);
      const statuses = ef?.statuses;
      const hasStun = statuses?.has?.("stunned") || [...(statuses ?? [])].includes("stunned") || looksStunned(ef);
      if (ef && hasStun) { appliesStun = true; break; }
    }
    if (!appliesStun && looksStunned(activity)) appliesStun = true;
    if (!appliesStun && looksStunned(wf.item?.system)) appliesStun = true;
    const desc = String(wf.item?.system?.description?.value ?? "").toLowerCase();
    if (!appliesStun && desc.includes("stun") && (desc.includes("save") || desc.includes("saving"))) appliesStun = true;
  } catch (_) {}
  if (!appliesStun) return;

  foundry.utils.setProperty(arg0, "saveDCBonus", (Number(arg0?.saveDCBonus ?? 0) || 0) + 2);
  if (wf) wf.saveDCBonus = (Number(wf.saveDCBonus ?? 0) || 0) + 2;
  return;
}`;
}

/** Y.Lagiacrus Horn: nat 20 → incapacitated until end of next turn (no save). */
function lagiCritIncapTail() {
  return `
if (pass.includes("postdamageroll") || pass.includes("postactiveeffects") || pass.includes("iscritical") || pass.includes("ishit")) {
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
  const img = CONFIG.statusEffects?.find((e) => e.id === "incapacitated")?.img ?? "icons/svg/paralysis.svg";
  const resolveActor = (t) => t?.actor ?? t?.document?.actor ?? (t?.documentName === "Actor" ? t : null);
  const buildIncap = () => ({
    name: "Incapacitated (Y.Lagiacrus Horn)",
    img,
    type: "base",
    origin,
    transfer: false,
    disabled: false,
    duration: { rounds: 1, turns: null, seconds: null, startTime: null, combat: null, startRound: null, startTurn: null },
    changes: [],
    statuses: ["incapacitated"],
    tint: "#ffffff",
    description: "Incapacitated until the end of its next turn (Y.Lagiacrus Horn — natural 20).",
    flags: {
      dae: { stackable: "noneName", showIcon: true, specialDuration: ["turnEnd"] },
      "amellwind-toolbox": { yLagiCritIncap: true },
    },
  });
  for (const t of hits) {
    const targetActor = resolveActor(t);
    if (!targetActor) continue;
    if (!game.user.isGM && typeof MidiQOL?.socket === "function") {
      try {
        await MidiQOL.socket().executeAsGM("createEffects", { actorUuid: targetActor.uuid, effects: [buildIncap()] });
        continue;
      } catch (_) {}
    }
    await targetActor.createEmbeddedDocuments("ActiveEffect", [buildIncap()]);
  }
  return;
}`;
}

function pushRune(cfg) {
  const meta = metaOf(cfg.name);
  const ids = idsOf(cfg.name);
  const rarity = cfg.rarity ?? meta.rarity ?? "uncommon";
  const fileName = `fvtt-Item-${slugify(meta.monster)}-${slugify(cfg.name)}-rune.json`;
  const filePath = path.join(__dirname, meta.monster, fileName);
  const doc = buildItem({
    _id: ids.item,
    identifier: identifierFrom(cfg.name),
    runeName: cfg.name,
    monsterName: meta.monster,
    sort: cfg.sort,
    rarity,
    description: descHtml(meta),
    sides: cfg.sides,
    macroName: `${cfg.name} Rune`,
    macroTail: cfg.macroTail ?? "",
    systemExtra: cfg.systemExtra,
    effects: cfg.effects(ids, `${cfg.name} Rune`),
  });
  items.push({ path: filePath, doc, name: cfg.name });
}

const items = [];
let sortBase = 9800000;

// ─── 1. Odogaron Gem (W only) ───
pushRune({
  name: "Odogaron Gem",
  sort: sortBase,
  sides: weaponOnly("Wound"),
  macroTail: odogaronWoundTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Odogaron Gem - Wound",
      "weapon",
      "Wound",
      midiMulti(macroName, ["postDamageRoll", "isHit"]),
      "On hit: stack Odogaron Wound (Nd4 necrotic at turn start, DC 13 Con ends; Medicine DC 15).",
    ),
  ],
});

// ─── 2. Rompopolo Claw ───
pushRune({
  name: "Rompopolo Claw",
  sort: (sortBase += 10000),
  sides: bothSides("Ammo Saver", "Earplugs"),
  macroTail: `${ammoSaverTail()}\n${earplugsTail()}`,
  systemExtra: {
    activities: {
      ...utilityActivity(
        idsOf("Rompopolo Claw").act1,
        "Conjure Earplugs",
        "bonus",
        "Armor side — conjure earplugs: deafened + advantage on saves vs thunder damage.",
        { effectIds: [idsOf("Rompopolo Claw").ae1], condition: "Armor side active" },
      ),
      ...utilityActivity(
        idsOf("Rompopolo Claw").act2,
        "Dispel Earplugs",
        "bonus",
        "Armor side — dispel earplugs (end deafened / thunder-save advantage).",
        { condition: "Armor side active" },
      ),
    },
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Rompopolo Claw - Ammo Saver",
      "weapon",
      "Ammo Saver",
      midi(macroName, "postAttackRoll"),
      "Ranged attack die 17–20: do not consume ammo/arrow (refund + chat).",
    ),
    sideEffect(
      ids.armor,
      "Rompopolo Claw - Earplugs",
      "armor",
      "Earplugs",
      midi(macroName, "isSave"),
      "Bonus action: conjure/dispel earplugs (use activities).",
    ),
    {
      _id: ids.ae1,
      name: "Earplugs (Rompopolo Claw)",
      img: "icons/svg/deaf.svg",
      type: "base",
      system: {},
      changes: [],
      disabled: false,
      duration: { ...DURATION },
      description: "Deafened while earplugs are worn. Advantage on saving throws against thunder damage.",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: ["deafened"],
      sort: 0,
      flags: {
        dae: { ...DAE, showIcon: true },
        "amellwind-toolbox": { rompopoloEarplugs: true },
      },
      _stats: { ...STATS },
    },
  ],
});

// ─── 3. B.Basarios Wing ───
pushRune({
  name: "B.Basarios Wing",
  sort: (sortBase += 10000),
  sides: bothSides("Hitter", "Rocky Stealth +2"),
  macroTail: hitterTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "B.Basarios Wing - Hitter",
      "weapon",
      "Hitter",
      midiMulti(macroName, ["preSaveDC", "preambleComplete", "preItemRoll"]),
      "Weapon attacks that force a save vs stunned: save DC +2.",
    ),
    sideEffect(
      ids.armor,
      "B.Basarios Wing - Rocky Stealth",
      "armor",
      "Rocky Stealth",
      [{ key: "system.skills.ste.bonuses.check", mode: 2, value: "2", priority: 20 }],
      "+2 Stealth when hiding in rocky terrain (GM: apply only in rocky terrain).",
    ),
  ],
});

// ─── 4. Y.Lagiacrus Horn ───
pushRune({
  name: "Y.Lagiacrus Horn",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Status (Incapacitate)", "Lightning Resistance"),
  macroTail: lagiCritIncapTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Y.Lagiacrus Horn - Critical Status (Incapacitate)",
      "weapon",
      "Critical Status (Incapacitate)",
      midiMulti(macroName, ["postDamageRoll", "isCritical"]),
      "Natural 20 on weapon attack: target incapacitated until end of its next turn.",
    ),
    sideEffect(
      ids.armor,
      "Y.Lagiacrus Horn - Lightning Resistance",
      "armor",
      "Lightning Resistance",
      [{ key: "system.traits.dr.value", mode: 2, value: "lightning", priority: 20 }],
      "Resistance to lightning damage.",
    ),
  ],
});

// ─── 5. Paolumu Scale ───
pushRune({
  name: "Paolumu Scale",
  sort: (sortBase += 10000),
  sides: bothSides("Dex Save +1", "Acid Resistance Toggle"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Paolumu Scale").act1,
      "Acid Resistance",
      "bonus",
      "Armor side — gain resistance to acid damage until the end of your next turn. (Bonus action or reaction.)",
      {
        condition: "Or use your reaction instead — Armor side active",
        consumeActivityUse: true,
        usesMax: "2",
        recoveryPeriod: "lr",
        effectIds: [idsOf("Paolumu Scale").ae1],
      },
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Paolumu Scale - Dex Save +1",
      "weapon",
      "Dex Save +1",
      [{ key: "system.abilities.dex.bonuses.save", mode: 2, value: "1", priority: 20 }],
      "+1 bonus to Dexterity saving throws.",
    ),
    sideEffect(
      ids.armor,
      "Paolumu Scale - Acid Resist Toggle",
      "armor",
      "Acid Resist Toggle",
      [],
      "Bonus action or reaction: acid resistance until end of next turn. 2/LR (use activity).",
    ),
    {
      _id: ids.ae1,
      name: "Paolumu Scale - Acid Resistance (Active)",
      img: "mh-icons/material-rune.webp",
      type: "base",
      system: {},
      changes: [{ key: "system.traits.dr.value", mode: 2, value: "acid", priority: 20 }],
      disabled: false,
      duration: { ...DURATION },
      description: "Resistance to acid damage until the end of your next turn.",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: [],
      sort: 0,
      flags: {
        dae: { ...DAE, specialDuration: ["turnStart"] },
        "amellwind-toolbox": { paolumuAcidResist: true },
      },
      _stats: { ...STATS },
    },
  ],
});

for (const { path: filePath, doc } of items) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`);
  console.log("Wrote", path.relative(__dirname, filePath));
}

console.log(`\nDone: ${items.length} rune JSON files written.`);
