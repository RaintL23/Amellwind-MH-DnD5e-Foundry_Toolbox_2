/**
 * Generator for Alatreon one-shot recommended Foundry rune items (v12 / dnd5e 4.4.4).
 * Run: node public/data/foundry-jsons-example/runes/_build-alatreon-oneshot-runes.mjs
 *
 * Pattern matches `_build-requested-runes.mjs` (unified controller + side AEs + Midi).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeRuneItemMacroCommand } from "../../scripts/runes/compose-rune-itemacro.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const metaList = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_alatreon-oneshot-runes-meta.json"), "utf8"),
);
const idsByName = JSON.parse(
  fs.readFileSync(path.join(__dirname, "_alatreon-oneshot-runes-ids.json"), "utf8"),
);

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

const RARITY = { 1: "common", 2: "uncommon", 3: "rare", 4: "veryRare" };

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

function utilityActivity(id, name, activationType, chatFlavor, condition = "", consumeItemUse = false, extra = {}) {
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
      ...extra,
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

function mwakDamage(formula) {
  return [
    { key: "system.bonuses.mwak.damage", mode: 2, value: formula, priority: 20 },
    { key: "system.bonuses.rwak.damage", mode: 2, value: formula, priority: 20 },
  ];
}

function mindEyeTail(bypassImmunity) {
  return `
if (pass.includes("damagebonus") || pass.includes("predamageroll") || pass.includes("preamblecomplete")) {
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
    if (${bypassImmunity}) {
      wf.ignoreImmunities = true;
      foundry.utils.setProperty(arg0, "ignoreImmunities", true);
    }
  } catch (_) {}
  return;
}`;
}

function resentmentTail(bonus) {
  return `
if (pass.includes("isdamaged")) {
  const wf = workflow ?? arg0?.workflow;
  const attacker = wf?.token?.actor ?? wf?.actor;
  if (!attacker || attacker.uuid === actorDoc?.uuid) return;
  const ids = new Set(getRuneFlag(item, "resentmentTargets") ?? []);
  ids.add(attacker.uuid);
  await setRuneFlag(item, "resentmentTargets", [...ids]);
  return;
}
if (pass.includes("preattackroll") || pass.includes("preitemroll")) {
  const targets = getRuneFlag(item, "resentmentTargets") ?? [];
  if (!targets.length) return;
  const wf = workflow ?? arg0?.workflow;
  const target = wf?.targets?.first?.()?.actor ?? wf?.target?.actor;
  if (!target || !targets.includes(target.uuid)) return;
  foundry.utils.setProperty(arg0, "attackRollBonus", (Number(arg0?.attackRollBonus ?? 0) || 0) + ${bonus});
  if (wf) wf.attackRollBonus = (Number(wf.attackRollBonus ?? 0) || 0) + ${bonus};
  return;
}
if (pass.includes("damagebonus")) {
  const targets = getRuneFlag(item, "resentmentTargets") ?? [];
  if (!targets.length) return;
  const wf = workflow ?? arg0?.workflow;
  const target = wf?.targets?.first?.()?.actor ?? wf?.target?.actor;
  if (!target || !targets.includes(target.uuid)) return;
  return { damageRoll: "${bonus}", flavor: \`\${runeName} — Resentment\` };
}`;
}

function partbreakerCritTail(dice) {
  return `
if (pass.includes("damagebonus")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return null;
  if (!(wf.isCritical || arg0?.isCritical)) return null;
  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isWeapon = itemType === "weapon" || ["mwak", "rwak"].includes(actionType);
  if (!isWeapon) return null;
  return { damageRoll: "${dice}", flavor: \`\${runeName} — Partbreaker\` };
}`;
}

function coldSpellBypassTail() {
  return `
if (pass.includes("predamageroll") || pass.includes("damagebonus") || pass.includes("preamblecomplete")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const src = wf.item;
  if (!src || src.type !== "spell") return;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const desc = String(src.system?.description?.value ?? "").toLowerCase();
  const hasCold = dump.includes("cold") || desc.includes("cold")
    || (wf.damageDetail ?? []).some((d) => String(d.type ?? "").toLowerCase() === "cold");
  if (!hasCold) return;
  try {
    wf.ignoreResistances = true;
    foundry.utils.setProperty(arg0, "ignoreResistances", true);
  } catch (_) {}
  return;
}`;
}

function criticalDrawPlusPlusTail() {
  return `
if (pass.includes("preattackroll") || pass.includes("preitemroll")) {
  if (!game.combat || Number(game.combat.round) !== 1) return;
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isMelee = itemType === "weapon" || actionType === "mwak";
  if (!isMelee) return;
  // Crit on 13+ ≈ midi critical.range +7 from 20
  foundry.utils.setProperty(arg0, "criticalThreshold", 13);
  if (wf) wf.criticalThreshold = 13;
  return;
}
if (pass.includes("damagebonus")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf || !(wf.isCritical || arg0?.isCritical)) return null;
  const dump = JSON.stringify(wf.item?.system?.damage ?? wf.item?.system?.activities ?? {}).toLowerCase();
  const detailTypes = (wf.damageDetail ?? []).map((d) => String(d.type ?? "").toLowerCase());
  if (!(dump.includes("cold") || detailTypes.includes("cold"))) return null;
  // Set bonus (2) reminder: +1d8 cold on cold crits (always when weapon side active)
  return { damageRoll: "1d8[cold]", flavor: \`\${runeName} — T.Velkhana Divinity (2)\` };
}`;
}

function garangolmCortexTail() {
  return `
async function runeOnEquip(side) {
  if (side !== "weapon" || !actorDoc) return;
  const choice = await new Promise((resolve) => {
    new Dialog({
      title: \`\${runeName} — Element\`,
      content: \`<form class="dnd5e2"><p>Choose extra damage type (dual-wield auto-splits cold/fire — pick either to arm both hands):</p>
        <label style="display:block"><input type="radio" name="el" value="fire" checked/> Fire</label>
        <label style="display:block"><input type="radio" name="el" value="cold"/> Cold</label></form>\`,
      buttons: {
        ok: { icon: '<i class="fas fa-check"></i>', label: "OK", callback: (html) => resolve(html.find('input[name="el"]:checked').val()) },
        cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancel", callback: () => resolve(null) },
      },
      default: "ok",
      close: () => resolve(null),
    }).render(true);
  });
  if (!choice) return;
  await setRuneFlag(item, "garangolmElement", choice);
  const clones = actorDoc.effects.filter((e) => getRuneFlag(e, "runeClone") && e.origin === item.uuid && String(e.name).includes("Extra Element"));
  for (const e of clones) {
    const changes = e.changes.map((c) => {
      if (String(c.key).includes("damage")) {
        return { ...c, value: \`1d8[\${choice}]\` };
      }
      return c;
    });
    await e.update({ changes });
  }
}
`;
}

function pushRune(cfg) {
  const meta = metaOf(cfg.name);
  const ids = idsOf(cfg.name);
  const rarity = RARITY[meta.tier] ?? "uncommon";
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
let sortBase = 9500000;

// ─── 1. Garangolm Cortex ───
pushRune({
  name: "Garangolm Cortex",
  sort: sortBase,
  sides: bothSides("Fire/Cold 1d8 (Rest Choice)", "Cosmetic Appearance"),
  macroTail: garangolmCortexTail(),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Garangolm Cortex - Extra Element",
      "weapon",
      "Extra Element",
      mwakDamage("1d8[fire]"),
      "Extra 1d8 fire or cold (chosen on equip / rest). Dual-wield splits cold/fire per description (manual for offhand).",
    ),
    sideEffect(
      ids.armor,
      "Garangolm Cortex - Cosmetic",
      "armor",
      "Cosmetic",
      [],
      "Cosmetic armor appearance options (manual).",
    ),
  ],
});

// ─── 2. Garangolm Shard ───
pushRune({
  name: "Garangolm Shard",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Status (Water/Fireblight)", "Flinch Free"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Garangolm Shard - Critical Status",
      "weapon",
      "Critical Status",
      [],
      "Nat 20 with cold/fire damage applies waterblight or fireblight (manual).",
    ),
    sideEffect(
      ids.armor,
      "Garangolm Shard - Flinch Free",
      "armor",
      "Flinch Free",
      [{ key: "system.traits.ci.value", mode: 2, value: "prone", priority: 20 }],
      "Cannot be knocked prone; unwilling movement blocked (prone CI + manual for forced movement).",
    ),
  ],
});

// ─── 3. Consumption Parasite ───
pushRune({
  name: "Consumption Parasite",
  sort: (sortBase += 10000),
  sides: bothSides("Archdemon Mode Always On (DB)", "Recovery Up+"),
  systemExtra: {
    activities: {
      ...utilityActivity(
        idsOf("Consumption Parasite").act1,
        "Archdemon Mode Reminder",
        "special",
        "(Dual Blades Only) Archdemon Mode always active; Archdemon damage die +1 (manual / Dual Blades sheet).",
        "Weapon side",
      ),
      ...utilityActivity(
        idsOf("Consumption Parasite").act2,
        "Recovery Up+ Reminder",
        "special",
        "Regain maximum HP from potions/plants you consume (manual).",
        "Armor side",
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Consumption Parasite - Archdemon",
      "weapon",
      "Archdemon Always On",
      [],
      "(Dual Blades Only) Archdemon Mode always active; +1 die (manual).",
    ),
    sideEffect(
      ids.armor,
      "Consumption Parasite - Recovery Up+",
      "armor",
      "Recovery Up+",
      [],
      "Max healing from potions/plants (manual).",
    ),
  ],
});

// ─── 4. Pulsing Dragonshell ───
pushRune({
  name: "Pulsing Dragonshell",
  sort: (sortBase += 10000),
  sides: bothSides("Dragonvein Awakening", "Fire Immune / Cold+Lightning Resist"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Pulsing Dragonshell - Dragonvein",
      "weapon",
      "Dragonvein Awakening",
      [
        ...mwakDamage("1d6[fire]"),
        { key: "flags.midi-qol.critical.range", mode: 2, value: "1", priority: 20 },
      ],
      "Extra 1d6 fire; crit range +1; condition save DC +2 (manual for DC).",
    ),
    sideEffect(
      ids.armor,
      "Pulsing Dragonshell - Defenses",
      "armor",
      "Fire / Cold / Lightning",
      [
        { key: "system.traits.di.value", mode: 2, value: "fire", priority: 20 },
        { key: "system.traits.dr.value", mode: 2, value: "cold", priority: 20 },
        { key: "system.traits.dr.value", mode: 2, value: "lightning", priority: 20 },
      ],
      "Immune to fire; resistance to cold and lightning.",
    ),
  ],
});

// ─── 5. Earth Dragongem ───
pushRune({
  name: "Earth Dragongem",
  sort: (sortBase += 10000),
  sides: bothSides("Mind's Eye", "Iron Wall+"),
  macroTail: mindEyeTail(false),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Earth Dragongem - Mind's Eye",
      "weapon",
      "Mind's Eye",
      midi(macroName, "preDamageRoll"),
      "Weapon attacks bypass damage resistances.",
    ),
    sideEffect(
      ids.armor,
      "Earth Dragongem - Iron Wall+",
      "armor",
      "Iron Wall+",
      [{ key: "system.attributes.ac.bonus", mode: 2, value: "3", priority: 20 }],
      "+3 AC while wearing this armor.",
    ),
  ],
});

// ─── 6. Jin Dahaad Claw ───
pushRune({
  name: "Jin Dahaad Claw",
  sort: (sortBase += 10000),
  sides: bothSides("Inspiring Melody", "Tremor-Proof"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Jin Dahaad Claw").act1,
      "Inspiring Melody Reminder",
      "special",
      "On melody complete: allies within 20 ft deal +1d6 damage until end of your next turn (manual).",
      "Weapon side — Hunting Horn",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Jin Dahaad Claw - Inspiring Melody",
      "weapon",
      "Inspiring Melody",
      [],
      "Melody → allies +1d6 damage (manual).",
    ),
    sideEffect(
      ids.armor,
      "Jin Dahaad Claw - Tremor-Proof",
      "armor",
      "Tremor-Proof",
      [{ key: "system.traits.ci.value", mode: 2, value: "prone", priority: 20 }],
      "Can't be knocked prone.",
    ),
  ],
});

// ─── 7. AT.Uth Duna Tentacle ───
pushRune({
  name: "AT.Uth Duna Tentacle",
  sort: (sortBase += 10000),
  sides: bothSides("Inspiring Melody+", "Health Boost+"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("AT.Uth Duna Tentacle").act1,
      "Inspiring Melody+ Reminder",
      "special",
      "(Hunting Horn Only) Melody → allies within 30 ft deal +1d6 damage until end of your next turn (manual).",
      "Weapon side",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "AT.Uth Duna Tentacle - Inspiring Melody+",
      "weapon",
      "Inspiring Melody+",
      [],
      "(Hunting Horn Only) Ally damage buff on melody (manual).",
    ),
    sideEffect(
      ids.armor,
      "AT.Uth Duna Tentacle - Health Boost+",
      "armor",
      "Health Boost+",
      [{ key: "system.attributes.hp.bonuses.overall", mode: 2, value: "2 * @details.level", priority: 20 }],
      "Hit point maximum +2 per character level.",
    ),
  ],
});

// ─── 8. Shimmering Scale ───
pushRune({
  name: "Shimmering Scale",
  sort: (sortBase += 10000),
  sides: bothSides("Resentment", "Survivor+"),
  macroTail: resentmentTail(1),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: {
      [idsOf("Shimmering Scale").act1]: {
        _id: idsOf("Shimmering Scale").act1,
        type: "utility",
        sort: 0,
        name: "Survivor+",
        img: "mh-icons/material-rune.webp",
        activation: {
          type: "reaction",
          value: null,
          condition: "When an ally you can see is reduced to 0 hit points",
          override: false,
        },
        consumption: {
          scaling: { allowed: false, max: "" },
          spellSlot: false,
          targets: [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }],
        },
        description: { chatFlavor: "+2 AC, +2 damage, +2 attack rolls for 1 minute. 1/LR." },
        duration: { value: "1", units: "minute", concentration: false, override: false },
        effects: [{ _id: idsOf("Shimmering Scale").ae1 }],
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
      "Shimmering Scale - Resentment (Track)",
      "weapon",
      "Resentment",
      midi(macroName, "isDamaged"),
      "Tracks creatures that damaged you.",
    ),
    sideEffect(
      ids.weapon2,
      "Shimmering Scale - Resentment (Attack)",
      "weapon",
      "Resentment",
      midi(macroName, "preItemRoll"),
      "+1 attack vs Resentment targets.",
    ),
    sideEffect(
      ids.weapon3,
      "Shimmering Scale - Resentment (Damage)",
      "weapon",
      "Resentment",
      midi(macroName, "damageBonus"),
      "+1 damage vs Resentment targets.",
    ),
    {
      ...sideEffect(
        ids.ae1,
        "Shimmering Scale - Survivor+ Buff",
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
        dae: { ...DAE, specialDuration: [] },
        "amellwind-toolbox": { runeSide: "armor", materialEffectName: "Survivor+ Buff" },
      },
    },
    sideEffect(
      ids.armor,
      "Shimmering Scale - Survivor+",
      "armor",
      "Survivor+",
      [],
      "Reaction when ally drops to 0 HP (item activity). 1/LR.",
    ),
  ],
});

// ─── 9. Dreadqueen Cortex ───
pushRune({
  name: "Dreadqueen Cortex",
  sort: (sortBase += 10000),
  sides: bothSides("Horn Maestro+2", "Divine Blessing+3"),
  systemExtra: {
    uses: { spent: 0, max: "@prof", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: {
      ...utilityActivity(
        idsOf("Dreadqueen Cortex").act1,
        "Horn Maestro+2 Reminder",
        "special",
        "(Hunting Horn only) Melody +1 minute; max cord length +1 (manual).",
        "Weapon side",
      ),
      [idsOf("Dreadqueen Cortex").act2]: {
        _id: idsOf("Dreadqueen Cortex").act2,
        type: "utility",
        sort: 0,
        name: "Divine Blessing+3",
        img: "mh-icons/material-rune.webp",
        activation: {
          type: "reaction",
          value: null,
          condition: "When you take damage you are not immune or resistant to",
          override: false,
        },
        consumption: {
          scaling: { allowed: false, max: "" },
          spellSlot: false,
          targets: [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }],
        },
        description: { chatFlavor: "Reduce damage by 1d10 (apply manually)." },
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
        midiProperties: { identifier: "divine-blessing-plus-3", displayActivityName: true },
        roll: { formula: "1d10", name: "Damage Reduced", prompt: false, visible: true },
      },
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Dreadqueen Cortex - Horn Maestro+2",
      "weapon",
      "Horn Maestro+2",
      [],
      "(Hunting Horn only) Longer melodies / +1 cord (manual).",
    ),
    sideEffect(
      ids.armor,
      "Dreadqueen Cortex - Divine Blessing+3",
      "armor",
      "Divine Blessing+3",
      [],
      "Reaction: reduce damage by 1d10. PB uses / LR.",
    ),
  ],
});

// ─── 10. Zionium Crystal ───
pushRune({
  name: "Zionium Crystal",
  sort: (sortBase += 10000),
  sides: bothSides("True Dragonvein Awakening", "Death Saves / Regenerate"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "day", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Zionium Crystal").act1,
      "Cast Regenerate (Self)",
      "action",
      "Cast regenerate targeting only yourself. 1/dawn.",
      "Armor side",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Zionium Crystal - True Dragonvein",
      "weapon",
      "True Dragonvein Awakening",
      [
        ...mwakDamage("1d8[fire]"),
        { key: "flags.midi-qol.critical.range", mode: 2, value: "2", priority: 20 },
      ],
      "Extra 1d8 fire; crit range +2; condition saves at disadvantage (manual for disadvantage).",
    ),
    sideEffect(
      ids.armor,
      "Zionium Crystal - Survive / Regenerate",
      "armor",
      "Death Saves / Regenerate",
      [],
      "Regain consciousness on death save 19–20 (manual). Regenerate self 1/dawn (activity).",
    ),
  ],
});

// ─── 11. Annihilating Greathorn ───
pushRune({
  name: "Annihilating Greathorn",
  sort: (sortBase += 10000),
  sides: bothSides("Strength 29", "+3 AC / Fire Immune / Draconic"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Annihilating Greathorn - Strength 29",
      "weapon",
      "Strength 29",
      [{ key: "system.abilities.str.value", mode: 5, value: "29", priority: 20 }],
      "Strength becomes 29 while attuned (no effect if already ≥29).",
    ),
    sideEffect(
      ids.armor,
      "Annihilating Greathorn - Dragon Armor",
      "armor",
      "+3 AC / Fire Immune",
      [
        { key: "system.attributes.ac.bonus", mode: 2, value: "3", priority: 20 },
        { key: "system.traits.di.value", mode: 2, value: "fire", priority: 20 },
      ],
      "+3 AC; immune to fire; speak/understand Draconic; walk on molten rock (manual).",
    ),
  ],
});

// ─── 12. B.Gravios Conflagrant Sac ───
pushRune({
  name: "B.Gravios Conflagrant Sac",
  sort: (sortBase += 10000),
  sides: bothSides("Extra 1d10 Fire", "Protection from Energy (Fire)"),
  systemExtra: {
    uses: { spent: 0, max: "@prof + 1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("B.Gravios Conflagrant Sac").act1,
      "Protection from Energy (Fire)",
      "action",
      "Cast protection from energy (fire only). Uses = PB+1 / LR. Spell must be on your class list.",
      "Armor side",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "B.Gravios Conflagrant Sac - Extra Fire",
      "weapon",
      "Extra Fire",
      mwakDamage("1d10[fire]"),
      "Extra 1d10 fire damage on weapon attacks.",
    ),
    sideEffect(
      ids.armor,
      "B.Gravios Conflagrant Sac - PfE Fire",
      "armor",
      "Protection from Energy (Fire)",
      [],
      "Action: protection from energy (fire). PB+1 / LR.",
    ),
  ],
});

// ─── 13. A.Lagi Dynamo ───
pushRune({
  name: "A.Lagi Dynamo",
  sort: (sortBase += 10000),
  sides: bothSides("FastCharge+2", "Great Luck"),
  systemExtra: {
    uses: { spent: 0, max: "2", recovery: [{ period: "day", type: "recoverAll" }] },
    activities: {
      ...utilityActivity(
        idsOf("A.Lagi Dynamo").act1,
        "FastCharge+2 Reminder",
        "special",
        "On initiative: GS/LS/CB/Tonfas gain 3 charges/spirit/phials (manual).",
        "Weapon side",
      ),
      ...utilityActivity(
        idsOf("A.Lagi Dynamo").act2,
        "Lucky Point",
        "special",
        "Great Luck: spend a luck point as Lucky feat. 2/dawn.",
        "Armor side",
        true,
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "A.Lagi Dynamo - FastCharge+2",
      "weapon",
      "FastCharge+2",
      [],
      "Initiative: +3 charges/spirit/phials (manual).",
    ),
    sideEffect(
      ids.armor,
      "A.Lagi Dynamo - Great Luck",
      "armor",
      "Great Luck",
      [],
      "2 luck points / dawn (item uses + activity).",
    ),
  ],
});

// ─── 14. T.Velkhana Crownhorn ───
pushRune({
  name: "T.Velkhana Crownhorn",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Draw++", "Ice Coat Temp HP"),
  macroTail: criticalDrawPlusPlusTail(),
  systemExtra: {
    uses: { spent: 0, max: "2", recovery: [{ period: "day", type: "recoverAll" }] },
    activities: {
      [idsOf("T.Velkhana Crownhorn").act1]: {
        _id: idsOf("T.Velkhana Crownhorn").act1,
        type: "utility",
        sort: 0,
        name: "Ice Coat (25 Temp HP)",
        img: "mh-icons/material-rune.webp",
        activation: { type: "action", value: null, condition: "Armor side — Sorcerer, Warlock, or Wizard", override: false },
        consumption: {
          scaling: { allowed: false, max: "" },
          spellSlot: false,
          targets: [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }],
        },
        description: {
          chatFlavor:
            "Gain 25 temp HP. Creatures that hit you with melee while you have these take 25 cold (manual on isDamaged).",
        },
        duration: { value: "", units: "inst", concentration: false, override: false },
        effects: [{ _id: idsOf("T.Velkhana Crownhorn").ae1 }],
        range: { value: null, units: "self", special: "", override: false },
        target: {
          template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
          affects: { count: "", type: "self", choice: false, special: "" },
          prompt: false,
          override: false,
        },
        uses: { spent: 0, max: "", recovery: [] },
        midiProperties: { identifier: "ice-coat-temp-hp", displayActivityName: true },
        roll: { formula: "", name: "", prompt: false, visible: false },
      },
    },
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "T.Velkhana Crownhorn - Critical Draw++",
      "weapon",
      "Critical Draw++",
      midi(macroName, "preAttackRoll"),
      "Round 1: melee crits on 13+. Divinity (2): +1d8 cold on cold crits (damageBonus).",
    ),
    sideEffect(
      ids.weapon2,
      "T.Velkhana Crownhorn - Divinity Crit Cold",
      "weapon",
      "Critical Draw++",
      midi(macroName, "damageBonus"),
      "Cold critical: +1d8 cold (set bonus 2).",
    ),
    {
      ...sideEffect(
        ids.ae1,
        "T.Velkhana Crownhorn - Ice Coat HP",
        "armor",
        "Ice Coat Temp HP",
        [{ key: "system.attributes.hp.temp", mode: 5, value: "25", priority: 20 }],
        "25 temporary hit points.",
      ),
      disabled: false,
      flags: {
        dae: { ...DAE },
        "amellwind-toolbox": { runeSide: "armor", materialEffectName: "Ice Coat Temp HP" },
      },
    },
    sideEffect(
      ids.armor,
      "T.Velkhana Crownhorn - Ice Coat",
      "armor",
      "Ice Coat",
      [],
      "(Sorcerer/Warlock/Wizard) Action: 25 temp HP; melee hitters take 25 cold (manual). 2/dawn.",
    ),
  ],
});

// ─── 15. Nergigante Hardclaw ───
pushRune({
  name: "Nergigante Hardclaw",
  sort: (sortBase += 10000),
  sides: bothSides("Extra 2d6 Force", "Thorns Reaction 3d4"),
  systemExtra: {
    activities: {
      [idsOf("Nergigante Hardclaw").act1]: {
        _id: idsOf("Nergigante Hardclaw").act1,
        type: "damage",
        sort: 0,
        name: "Spike Reaction (3d4)",
        img: "mh-icons/material-rune.webp",
        activation: {
          type: "reaction",
          value: null,
          condition: "When a creature within 5 feet hits you with a melee attack",
          override: false,
        },
        consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [] },
        description: {
          chatFlavor: "3d4 piercing; bypasses resistance/immunity (apply ignore flags manually if needed).",
        },
        duration: { value: "", units: "inst", concentration: false, override: false },
        effects: [],
        range: { value: "5", units: "ft", special: "", override: false },
        target: {
          template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
          affects: { count: "1", type: "creature", choice: false, special: "" },
          prompt: true,
          override: false,
        },
        damage: {
          critical: { allow: false, bonus: "" },
          parts: [{ number: 3, denomination: 4, bonus: "", types: ["piercing"], custom: { enabled: false, formula: "" }, scaling: { mode: "", number: null, formula: "" } }],
        },
        uses: { spent: 0, max: "", recovery: [] },
        midiProperties: { identifier: "nergigante-spike-reaction", displayActivityName: true },
      },
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Nergigante Hardclaw - Extra Force",
      "weapon",
      "Extra Force",
      mwakDamage("2d6[force]"),
      "Extra 2d6 force on weapon attacks.",
    ),
    sideEffect(
      ids.armor,
      "Nergigante Hardclaw - Spike Reaction",
      "armor",
      "Spike Reaction",
      [],
      "Reaction: 3d4 piercing to melee hitter within 5 ft (activity).",
    ),
  ],
});

// ─── 16. Savage Tallfang ───
pushRune({
  name: "Savage Tallfang",
  sort: (sortBase += 10000),
  sides: weaponOnly("Partbreaker+3"),
  macroTail: partbreakerCritTail("1d10"),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Savage Tallfang - Partbreaker+3",
      "weapon",
      "Partbreaker+3",
      midi(macroName, "damageBonus"),
      "On weapon critical: +1d10 damage.",
    ),
  ],
});

// ─── 17. Elderfrost Redfur ───
pushRune({
  name: "Elderfrost Redfur",
  sort: (sortBase += 10000),
  sides: bothSides("Horn Maestro+2", "Cold Resistance / Ice Terrain"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Elderfrost Redfur").act1,
      "Horn Maestro+2 Reminder",
      "special",
      "(Hunting Horn only) Melody +1 minute; max cord length +1 (manual).",
      "Weapon side",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Elderfrost Redfur - Horn Maestro+2",
      "weapon",
      "Horn Maestro+2",
      [],
      "(Hunting Horn only) Longer melodies / +1 cord (manual).",
    ),
    sideEffect(
      ids.armor,
      "Elderfrost Redfur - Cold Resist",
      "armor",
      "Cold Resistance",
      [{ key: "system.traits.dr.value", mode: 2, value: "cold", priority: 20 }],
      "Resistance to cold; ignore ice/snow difficult terrain (manual for terrain).",
    ),
  ],
});

// ─── 18. Diametrical Horn ───
pushRune({
  name: "Diametrical Horn",
  sort: (sortBase += 10000),
  sides: bothSides("+3 Spell Attack / DC", "Cold Immunity"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Diametrical Horn - Spell Buff",
      "weapon",
      "Spell Attack / DC +3",
      [
        { key: "system.bonuses.spell.dc", mode: 2, value: "3", priority: 20 },
        { key: "system.bonuses.msak.attack", mode: 2, value: "3", priority: 20 },
        { key: "system.bonuses.rsak.attack", mode: 2, value: "3", priority: 20 },
      ],
      "+3 spell attack rolls and spell save DC.",
    ),
    sideEffect(
      ids.armor,
      "Diametrical Horn - Cold Immunity",
      "armor",
      "Cold Immunity",
      [{ key: "system.traits.di.value", mode: 2, value: "cold", priority: 20 }],
      "Immune to cold damage.",
    ),
  ],
});

// ─── 19. Gravios Pleura ───
pushRune({
  name: "Gravios Pleura",
  sort: (sortBase += 10000),
  sides: weaponOnly("Muse (Hunting Horn)"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Gravios Pleura").act1,
      "Choose Muse",
      "special",
      "(Hunting Horn Only) After a long rest, choose a muse within 120 ft who gains your melody benefits (manual tracking).",
      "Weapon side — after long rest",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Gravios Pleura - Muse",
      "weapon",
      "Muse",
      [],
      "(Hunting Horn Only) Muse shares melody benefits within 120 ft (manual).",
    ),
  ],
});

// ─── 20. Rey Dau Shell ───
pushRune({
  name: "Rey Dau Shell",
  sort: (sortBase += 10000),
  sides: bothSides("Lord's Favor", "Stun Save Advantage"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Rey Dau Shell").act1,
      "Lord's Favor Reminder",
      "special",
      "(Hunting Horn Only) On melody complete: hunting horn deals +1d12 bludgeoning until end of your next turn (manual).",
      "Weapon side",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Rey Dau Shell - Lord's Favor",
      "weapon",
      "Lord's Favor",
      [],
      "(Hunting Horn Only) Melody → +1d12 bludgeoning on horn (manual).",
    ),
    sideEffect(
      ids.armor,
      "Rey Dau Shell - Stun Advantage",
      "armor",
      "Stun Save Advantage",
      [{ key: "flags.midi-qol.advantage.ability.save.con", mode: 0, value: "1", priority: 20 }],
      "Advantage on saves vs stunned (Con save adv as approximation; verify vs stun saves in play).",
    ),
  ],
});

// ─── 21. Lunastra Gem ───
pushRune({
  name: "Lunastra Gem",
  sort: (sortBase += 10000),
  sides: bothSides("Mind's Eye", "Health Boost"),
  macroTail: mindEyeTail(false),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Lunastra Gem - Mind's Eye",
      "weapon",
      "Mind's Eye",
      midi(macroName, "preDamageRoll"),
      "Weapon attacks bypass damage resistances.",
    ),
    sideEffect(
      ids.armor,
      "Lunastra Gem - Health Boost",
      "armor",
      "Health Boost",
      [{ key: "system.attributes.hp.bonuses.overall", mode: 2, value: "@details.level", priority: 20 }],
      "Hit point maximum +1 per character level.",
    ),
  ],
});

// ─── 22. Kirin Icehorn ───
pushRune({
  name: "Kirin Icehorn",
  sort: (sortBase += 10000),
  sides: bothSides("Cold Spells Bypass Resistance", "Iceblight Immunity"),
  macroTail: coldSpellBypassTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Kirin Icehorn - Cold Bypass",
      "weapon",
      "Cold Spell Bypass",
      midi(macroName, "preDamageRoll"),
      "Cold spells bypass cold resistance.",
    ),
    sideEffect(
      ids.armor,
      "Kirin Icehorn - Iceblight Immunity",
      "armor",
      "Iceblight Immunity",
      [{ key: "system.traits.ci.value", mode: 2, value: "diseased", priority: 20 }],
      "Immune to iceblight (ci diseased approximation + description).",
    ),
  ],
});

for (const { path: filePath, doc } of items) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n");
  console.log("Wrote", path.relative(__dirname, filePath));
}

console.log(`\nDone: ${items.length} rune JSON files written.`);
