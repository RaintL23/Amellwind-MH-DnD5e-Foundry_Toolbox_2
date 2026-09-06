/**
 * Generator for 35 requested Foundry rune items (v12 / dnd5e 4.4.4).
 * Run: node public/data/foundry-jsons-example/runes/_build-requested-runes.mjs
 *
 * Loads IDs from _requested-runes-ids.json and text from _requested-runes-meta.json.
 * Self-contained — copies helpers from _build-missing-runes.mjs (does not import it).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeRuneItemMacroCommand } from "../../scripts/runes/compose-rune-itemacro.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const metaList = JSON.parse(fs.readFileSync(path.join(__dirname, "_requested-runes-meta.json"), "utf8"));
const idsByName = JSON.parse(fs.readFileSync(path.join(__dirname, "_requested-runes-ids.json"), "utf8"));

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
    ...extra,
  };
  return { [id]: activity };
}

function saveActivity(id, name, opts = {}) {
  const {
    activationType = "action",
    condition = "",
    chatFlavor = "",
    consumeItemUse = true,
    rangeValue = null,
    rangeUnits = "self",
    template = { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
    affects = { count: "1", type: "creature", choice: false, special: "" },
    prompt = true,
    damageParts = [],
    onSave = "half",
    ability = ["dex"],
    dcFormula = "15",
    uses = { spent: 0, max: "", recovery: [] },
  } = opts;
  return {
    [id]: {
      _id: id,
      type: "save",
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
      range: { value: rangeValue, units: rangeUnits, special: "", override: false },
      target: { template, affects, prompt, override: false },
      uses,
      damage: { parts: damageParts, onSave },
      save: { ability, dc: { calculation: "", formula: dcFormula } },
      midiProperties: { identifier: slugify(name), displayActivityName: true, magicDamage: true },
      roll: { formula: "", name: "", prompt: false, visible: false },
    },
  };
}

function resentmentPlusTail() {
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
  foundry.utils.setProperty(arg0, "attackRollBonus", (Number(arg0?.attackRollBonus ?? 0) || 0) + 2);
  if (wf) wf.attackRollBonus = (Number(wf.attackRollBonus ?? 0) || 0) + 2;
  return;
}
if (pass.includes("damagebonus")) {
  const targets = getRuneFlag(item, "resentmentTargets") ?? [];
  if (!targets.length) return;
  const wf = workflow ?? arg0?.workflow;
  const target = wf?.targets?.first?.()?.actor ?? wf?.target?.actor;
  if (!target || !targets.includes(target.uuid)) return;
  return { damageRoll: "2", flavor: "Resentment+" };
}`;
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

function criticalBoostTail(extraDice) {
  return `
if (pass.includes("damagebonus")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return null;
  const isCrit = Boolean(wf.isCritical || arg0?.isCritical);
  if (!isCrit) return null;
  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isWeapon = itemType === "weapon" || ["mwak", "rwak"].includes(actionType);
  if (!isWeapon) return null;
  let formula = "${extraDice}d6";
  try {
    const atk = Object.values(wf.item?.system?.activities ?? {}).find((a) => a?.type === "attack");
    const part = atk?.damage?.parts?.[0];
    if (part?.denomination) formula = \`\${${extraDice}}d\${part.denomination}\`;
    else {
      const legacy = wf.item?.system?.damage?.parts?.[0];
      const m = String(legacy?.[0] ?? "").match(/(\\d*)d(\\d+)/i);
      if (m) formula = \`\${${extraDice}}d\${m[2]}\`;
    }
  } catch (_) {}
  return { damageRoll: formula, flavor: \`\${runeName} — Critical Boost+\` };
}`;
}

function spiritHugeTail() {
  return `
if (pass.includes("damagebonus")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return null;
  const target = wf?.targets?.first?.()?.actor ?? wf?.target?.actor;
  if (!target) return null;
  const size = String(target.system?.traits?.size ?? "").toLowerCase();
  const hugeOrLarger = ["huge", "grg", "gargantuan"].includes(size);
  if (!hugeOrLarger) return null;
  return { damageRoll: "1d6", flavor: \`\${runeName} — Spirit (Huge+)\` };
}`;
}

function heroicsTail() {
  return `
if (pass.includes("damagebonus")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf || !actorDoc) return null;
  const hp = Number(actorDoc.system?.attributes?.hp?.value ?? 0);
  const max = Number(actorDoc.system?.attributes?.hp?.max ?? 0);
  if (!max || hp > max * 0.25) return null;
  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isWeapon = itemType === "weapon" || ["mwak", "rwak"].includes(actionType);
  if (!isWeapon) return null;
  return { damageRoll: "1d4", flavor: \`\${runeName} — Heroics\` };
}`;
}

function awakenExtraDieTail() {
  return `
if (pass.includes("damagebonus")) {
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

function weaknessExploitTail() {
  return `
// Weakness Exploit — track uses via item activity; resolve max damage manually when advantage lower die would hit.
`;
}

function partbreakerCritTail() {
  return `
if (pass.includes("damagebonus")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return null;
  if (!(wf.isCritical || arg0?.isCritical)) return null;
  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isWeapon = itemType === "weapon" || ["mwak", "rwak"].includes(actionType);
  if (!isWeapon) return null;
  return { damageRoll: "1d8", flavor: "Partbreaker+2" };
}`;
}

function lightningSpellBypassTail() {
  return `
if (pass.includes("predamageroll") || pass.includes("damagebonus") || pass.includes("preamblecomplete")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const src = wf.item;
  if (!src || src.type !== "spell") return;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const desc = String(src.system?.description?.value ?? "").toLowerCase();
  const hasLightning = dump.includes("lightning") || desc.includes("lightning")
    || (wf.damageDetail ?? []).some((d) => String(d.type ?? "").toLowerCase() === "lightning");
  if (!hasLightning) return;
  try {
    wf.ignoreResistances = true;
    foundry.utils.setProperty(arg0, "ignoreResistances", true);
  } catch (_) {}
  return;
}`;
}

function criticalElementTail() {
  return `
if (pass.includes("damagebonus")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return null;
  const isCrit = Boolean(wf.isCritical || arg0?.isCritical);
  if (!isCrit) return null;
  const dump = JSON.stringify(wf.item?.system?.damage ?? wf.item?.system?.activities ?? {}).toLowerCase();
  const detailTypes = (wf.damageDetail ?? []).map((d) => String(d.type ?? "").toLowerCase());
  const types = ["cold", "fire", "lightning", "necrotic", "thunder"];
  const hit = types.find((t) => dump.includes(t) || detailTypes.includes(t));
  if (!hit) return null;
  return { damageRoll: \`1d10[\${hit}]\`, flavor: \`\${runeName} — Critical Element\` };
}`;
}

function thunderLightningSpellBonusTail() {
  return `
if (pass.includes("preitemroll") || pass.includes("preattackroll")) {
  const wf = workflow ?? arg0?.workflow;
  const src = wf?.item;
  if (!src || src.type !== "spell") return;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const desc = String(src.system?.description?.value ?? "").toLowerCase();
  const has = dump.includes("lightning") || dump.includes("thunder") || desc.includes("lightning") || desc.includes("thunder");
  if (!has) return;
  foundry.utils.setProperty(arg0, "attackRollBonus", (Number(arg0?.attackRollBonus ?? 0) || 0) + 1);
  if (wf) wf.attackRollBonus = (Number(wf.attackRollBonus ?? 0) || 0) + 1;
  return;
}`;
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

function midi(macroName, pass) {
  return [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: `ItemMacro.${macroName},${pass}`, priority: 20 }];
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
let sortBase = 9000000;

// ─── 1. Barroth Gem ───
pushRune({
  name: "Barroth Gem",
  sort: sortBase,
  sides: bothSides("Guard AC / No Crit Extra", "Guard (No Push)"),
  macroTail: "",
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Barroth Gem - Guard AC",
      "weapon",
      "Guard AC",
      [
        { key: "system.attributes.ac.bonus", mode: 2, value: "2", priority: 20 },
        { key: "flags.midi-qol.critical.damage", mode: 5, value: "0", priority: 20 },
      ],
      "+2 AC while attuned. Critical hits no longer deal extra damage (midi critical.damage=0; verify in play).",
    ),
    sideEffect(
      ids.armor,
      "Barroth Gem - Guard (Manual)",
      "armor",
      "Guard",
      [],
      "Guard (manual): you cannot be pushed or knocked backwards while you wear this armor.",
    ),
  ],
});

// ─── 2. Banbaro Lash ───
pushRune({
  name: "Banbaro Lash",
  sort: (sortBase += 10000),
  sides: bothSides("Offensive Guard (GS/Lance)", "Health Boost"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Banbaro Lash - Offensive Guard", "weapon", "Offensive Guard", [], "(Greatsword & Lance Only) Offensive Guard (manual)."),
    sideEffect(
      ids.armor,
      "Banbaro Lash - Health Boost",
      "armor",
      "Health Boost",
      [{ key: "system.attributes.hp.bonuses.overall", mode: 2, value: "@details.level", priority: 20 }],
      "Hit point maximum increases by 1 per character level.",
    ),
  ],
});

// ─── 3. T.Zamtrios Tailbrand ───
pushRune({
  name: "T.Zamtrios Tailbrand",
  sort: (sortBase += 10000),
  sides: bothSides("Awaken", "Fire Resistance"),
  macroTail: awakenExtraDieTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "T.Zamtrios Tailbrand - Awaken", "weapon", "Awaken", midi(macroName, "damageBonus"), "Non-elemental weapons roll one additional damage die on hit."),
    sideEffect(
      ids.armor,
      "T.Zamtrios Tailbrand - Fire Resistance",
      "armor",
      "Fire Resistance",
      [{ key: "system.traits.dr.value", mode: 2, value: "fire", priority: 20 }],
      "Resistance to fire damage.",
    ),
  ],
});

// ─── 4. Shining Shieldwing ───
pushRune({
  name: "Shining Shieldwing",
  sort: (sortBase += 10000),
  sides: bothSides("Shield Upgrade (Manual)", "Shield+"),
  systemExtra: {
    activities: {
      [idsOf("Shining Shieldwing").act1]: {
        _id: idsOf("Shining Shieldwing").act1,
        type: "utility",
        sort: 0,
        name: "Shield+ (+2 AC)",
        img: "mh-icons/material-rune.webp",
        activation: { type: "reaction", value: null, condition: "When you use a reaction that would increase your AC", override: false },
        consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [] },
        description: { chatFlavor: "Gain an additional +2 AC until the start of your next turn." },
        duration: { value: "", units: "inst", concentration: false, override: false },
        effects: [{ _id: idsOf("Shining Shieldwing").ae1 }],
        range: { value: null, units: "self", special: "", override: false },
        target: { template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" }, affects: { count: "", type: "self", choice: false, special: "" }, prompt: false, override: false },
        uses: { spent: 0, max: "", recovery: [] },
        midiProperties: { identifier: "shield-plus", displayActivityName: true },
        roll: { formula: "", name: "", prompt: false, visible: false },
      },
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Shining Shieldwing - Shield Upgrade", "weapon", "Shield Upgrade", [], "Shield Upgrade — weapon-type list benefits (manual)."),
    {
      ...sideEffect(
        ids.ae1,
        "Shining Shieldwing - Shield+ AE",
        "armor",
        "Shield+ AE",
        [{ key: "system.attributes.ac.bonus", mode: 2, value: "2", priority: 20 }],
        "+2 AC until start of next turn (applied by activity).",
      ),
      disabled: false,
      flags: {
        dae: { ...DAE, specialDuration: ["turnStart"] },
        "amellwind-toolbox": { runeSide: "armor", materialEffectName: "Shield+ AE" },
      },
    },
    sideEffect(ids.armor, "Shining Shieldwing - Shield+", "armor", "Shield+", [], "Reaction: additional +2 AC until start of next turn (item activity)."),
  ],
});

// ─── 5. Heavy Wyvern Scalp ───
pushRune({
  name: "Heavy Wyvern Scalp",
  sort: (sortBase += 10000),
  sides: bothSides("Lay on Hands Temp HP (Paladin)", "Spell Healing Boost (Cleric/Paladin)"),
  systemExtra: {
    activities: {
      ...utilityActivity(idsOf("Heavy Wyvern Scalp").act1, "Healing Boost Reminder", "special", "Cleric/Paladin: when you regain HP from a spell, increase by half class level (manual).", "Armor side"),
      ...utilityActivity(idsOf("Heavy Wyvern Scalp").act2, "Lay on Hands Temp HP Reminder", "special", "Paladin: Lay on Hands also grants equal temp HP until start of next turn (manual).", "Weapon side"),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Heavy Wyvern Scalp - Lay on Hands", "weapon", "Lay on Hands Temp HP", [], "(Paladin Only) Lay on Hands grants equal temp HP (manual)."),
    sideEffect(ids.armor, "Heavy Wyvern Scalp - Spell Healing", "armor", "Spell Healing Boost", [], "(Cleric & Paladin Only) Spell healing increased by half class level (manual)."),
  ],
});

// ─── 6. T.Teostra Mane ───
pushRune({
  name: "T.Teostra Mane",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Eye+", "Extend Aura"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("T.Teostra Mane").act1,
      "Extend Aura +10 ft",
      "action",
      "(Paladin Only) Extend your aura by 10 feet for 1 minute. 1/LR.",
      "Armor side — Paladin only",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "T.Teostra Mane - Critical Eye+",
      "weapon",
      "Critical Eye+",
      [{ key: "flags.midi-qol.critical.range", mode: 2, value: "2", priority: 20 }],
      "Critical hit range increased by 2.",
    ),
    sideEffect(ids.armor, "T.Teostra Mane - Extend Aura", "armor", "Extend Aura", [], "(Paladin Only) Action: extend aura +10 ft for 1 minute. 1/LR."),
  ],
});

// ─── 7. T.Fire Dragon Scale ───
pushRune({
  name: "T.Fire Dragon Scale",
  sort: (sortBase += 10000),
  sides: bothSides("Quick Load (Manual)", "Biology"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "T.Fire Dragon Scale - Quick Load", "weapon", "Quick Load", [], "Quick Load: reload as a free action (manual)."),
    sideEffect(
      ids.armor,
      "T.Fire Dragon Scale - Biology",
      "armor",
      "Biology",
      [{ key: "system.traits.ci.value", mode: 2, value: "diseased", priority: 20 }],
      "Biology: proficient with dung bombs (manual). Immune to blight effects (ci diseased as approximation; resolve blight manually).",
    ),
  ],
});

// ─── 8. Zorah Magdaros Gem ───
pushRune({
  name: "Zorah Magdaros Gem",
  sort: (sortBase += 10000),
  sides: bothSides("Release Bioenergy (Manual)", "Channel Zorah Magdaros"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: {
      [idsOf("Zorah Magdaros Gem").act1]: {
        _id: idsOf("Zorah Magdaros Gem").act1,
        type: "utility",
        sort: 0,
        name: "Channel Zorah Magdaros",
        img: "mh-icons/material-rune.webp",
        activation: { type: "action", value: null, condition: "Armor side active", override: false },
        consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }] },
        description: { chatFlavor: "Channel Zorah Magdaros for 10 minutes (see description). Gain 50 temp HP; apply other benefits manually." },
        duration: { value: "10", units: "minute", concentration: false, override: false },
        effects: [{ _id: idsOf("Zorah Magdaros Gem").ae1 }],
        range: { value: null, units: "self", special: "", override: false },
        target: { template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" }, affects: { count: "", type: "self", choice: false, special: "" }, prompt: false, override: false },
        uses: { spent: 0, max: "", recovery: [] },
        midiProperties: { identifier: "channel-zorah", displayActivityName: true },
        roll: { formula: "", name: "", prompt: false, visible: false },
      },
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Zorah Magdaros Gem - Release Bioenergy", "weapon", "Release Bioenergy", [], "Release Bioenergy when reducing a creature to 0 HP (manual / isDamaged note)."),
    {
      ...sideEffect(
        ids.ae1,
        "Zorah Magdaros Gem - Temp HP",
        "armor",
        "Channel Temp HP",
        [{ key: "system.attributes.hp.temp", mode: 5, value: "50", priority: 20 }],
        "50 temporary hit points while channeling.",
      ),
      disabled: false,
      flags: {
        dae: { ...DAE },
        "amellwind-toolbox": { runeSide: "armor", materialEffectName: "Channel Temp HP AE" },
      },
    },
    sideEffect(ids.armor, "Zorah Magdaros Gem - Channel", "armor", "Channel Zorah Magdaros", [], "Action: Channel Zorah Magdaros for 10 minutes (item activity + manual benefits)."),
  ],
});

// ─── 9. Heavy Rustrazor Scalp ───
pushRune({
  name: "Heavy Rustrazor Scalp",
  sort: (sortBase += 10000),
  sides: bothSides("Brawn (Manual)", "Guard Up"),
  systemExtra: {
    uses: { spent: 0, max: "@abilities.con.mod", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Heavy Rustrazor Scalp").act1,
      "Guard Up",
      "reaction",
      "When you fail a Dexterity or Strength saving throw, use your AC in place of your roll.",
      "When you fail a Dexterity or Strength saving throw",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Heavy Rustrazor Scalp - Brawn", "weapon", "Brawn", [], "Brawn (manual): stun disadvantage / exhaustion on hit."),
    sideEffect(ids.armor, "Heavy Rustrazor Scalp - Guard Up", "armor", "Guard Up", [], "Reaction Guard Up. Uses = CON mod (item uses), regain on long rest."),
  ],
});

// ─── 10. Dalam Tail Scale ───
pushRune({
  name: "Dalam Tail Scale",
  sort: (sortBase += 10000),
  sides: bothSides("Melf's Minute Meteors", "Iron Wall"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Dalam Tail Scale").act1,
      "Melf's Minute Meteors",
      "action",
      "(Spellcaster Only) You know Melf's Minute Meteors; cast as one level higher if already known (manual / add spell).",
      "Weapon side — spellcaster only",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Dalam Tail Scale - Minute Meteors", "weapon", "Melf's Minute Meteors", [], "(Spellcaster Only) Know Melf's Minute Meteors (item activity reminder)."),
    sideEffect(
      ids.armor,
      "Dalam Tail Scale - Iron Wall",
      "armor",
      "Iron Wall",
      [{ key: "system.attributes.ac.bonus", mode: 2, value: "2", priority: 20 }],
      "+2 AC while you wear this armor.",
    ),
  ],
});

// ─── 11. Brach Gem ───
pushRune({
  name: "Brach Gem",
  sort: (sortBase += 10000),
  sides: bothSides("Spirit", "Fire Immunity"),
  macroTail: spiritHugeTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Brach Gem - Spirit",
      "weapon",
      "Spirit",
      midi(macroName, "damageBonus"),
      "Vs Huge+: +1d6 damage (macro). Crit range +1 vs Huge+ (manual / description — AE always-on would be wrong).",
    ),
    sideEffect(
      ids.armor,
      "Brach Gem - Fire Immunity",
      "armor",
      "Fire Immunity",
      [{ key: "system.traits.di.value", mode: 2, value: "fire", priority: 20 }],
      "Immune to fire damage.",
    ),
  ],
});

// ─── 12. Savage Gem ───
pushRune({
  name: "Savage Gem",
  sort: (sortBase += 10000),
  sides: bothSides("Hellfire Beam", "Cold Immunity"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: saveActivity(idsOf("Savage Gem").act1, "Hellfire Beam", {
      activationType: "action",
      chatFlavor: "60-ft line, 5 ft wide. DC 15 Dex. 5d6 fire + 5d6 necrotic (half on save). 1/LR.",
      consumeItemUse: true,
      rangeValue: null,
      rangeUnits: "self",
      template: { count: "", contiguous: false, type: "line", size: "60", width: "5", height: "", units: "ft" },
      affects: { count: "", type: "creature", choice: false, special: "" },
      damageParts: [
        { number: 5, denomination: 6, bonus: "", types: ["fire"], custom: { enabled: false, formula: "" }, scaling: { mode: "", number: null, formula: "" } },
        { number: 5, denomination: 6, bonus: "", types: ["necrotic"], custom: { enabled: false, formula: "" }, scaling: { mode: "", number: null, formula: "" } },
      ],
      ability: ["dex"],
      dcFormula: "15",
    }),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Savage Gem - Hellfire Beam", "weapon", "Hellfire Beam", [], "Action: 60-ft line DC 15 Dex, 5d6 fire + 5d6 necrotic. 1/LR."),
    sideEffect(
      ids.armor,
      "Savage Gem - Cold Immunity",
      "armor",
      "Cold Immunity",
      [{ key: "system.traits.di.value", mode: 2, value: "cold", priority: 20 }],
      "Immune to cold damage.",
    ),
  ],
});

// ─── 13. Sturdy Fang ───
pushRune({
  name: "Sturdy Fang",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Eye+", "Fire Immunity"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Sturdy Fang - Critical Eye+",
      "weapon",
      "Critical Eye+",
      [{ key: "flags.midi-qol.critical.range", mode: 2, value: "2", priority: 20 }],
      "Critical hit range increased by 2.",
    ),
    sideEffect(
      ids.armor,
      "Sturdy Fang - Fire Immunity",
      "armor",
      "Fire Immunity",
      [{ key: "system.traits.di.value", mode: 2, value: "fire", priority: 20 }],
      "Immune to fire damage.",
    ),
  ],
});

// ─── 14. Vaal Hazak Hardclaw ───
pushRune({
  name: "Vaal Hazak Hardclaw",
  sort: (sortBase += 10000),
  sides: bothSides("Extra Necrotic", "Poison/Disease Immunity"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Vaal Hazak Hardclaw - Extra Necrotic",
      "weapon",
      "Extra Necrotic",
      [
        { key: "system.bonuses.mwak.damage", mode: 2, value: "2d6[necrotic]", priority: 20 },
        { key: "system.bonuses.rwak.damage", mode: 2, value: "2d6[necrotic]", priority: 20 },
      ],
      "Extra 2d6 necrotic on weapon attacks.",
    ),
    sideEffect(
      ids.armor,
      "Vaal Hazak Hardclaw - Poison/Disease Immunity",
      "armor",
      "Poison/Disease Immunity",
      [
        { key: "system.traits.di.value", mode: 2, value: "poison", priority: 20 },
        { key: "system.traits.di.value", mode: 2, value: "disease", priority: 20 },
        { key: "system.traits.ci.value", mode: 2, value: "poisoned", priority: 20 },
        { key: "system.traits.ci.value", mode: 2, value: "diseased", priority: 20 },
      ],
      "Immune to poison and disease; immune to poisoned/diseased conditions.",
    ),
  ],
});

// ─── 15. Amatsu Hardclaw (weapon only) ───
pushRune({
  name: "Amatsu Hardclaw",
  sort: (sortBase += 10000),
  sides: { weapon: { label: "Weapon Effect — Latent Power +1" } },
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "sr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Amatsu Hardclaw").act1,
      "Latent Power +1 (haste)",
      "special",
      "Latent Power +1: gain haste for 1 minute when first reduced to 1/4 HP in combat or at start of round 10 (manual trigger). 1/SR or LR.",
      "Weapon side",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Amatsu Hardclaw - Latent Power", "weapon", "Latent Power +1", [], "Latent Power +1 (haste) — manual trigger; track via activity uses."),
  ],
});

// ─── 16. Rajang Hardclaw ───
pushRune({
  name: "Rajang Hardclaw",
  sort: (sortBase += 10000),
  sides: bothSides("Heroics", "Health Boost+"),
  macroTail: heroicsTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Rajang Hardclaw - Heroics",
      "weapon",
      "Heroics",
      midi(macroName, "damageBonus"),
      "Below 25% HP: +1d4 weapon damage (macro). Resistance to all damage except psychic (manual / AE note).",
    ),
    sideEffect(
      ids.armor,
      "Rajang Hardclaw - Health Boost+",
      "armor",
      "Health Boost+",
      [{ key: "system.attributes.hp.bonuses.overall", mode: 2, value: "2 * @details.level", priority: 20 }],
      "Hit point maximum increases by 2 per character level.",
    ),
  ],
});

// ─── 17. Bazelgeuse Gem ───
pushRune({
  name: "Bazelgeuse Gem",
  sort: (sortBase += 10000),
  sides: bothSides("Strength 25", "Fire Immunity"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Bazelgeuse Gem - Strength 25",
      "weapon",
      "Strength 25",
      [{ key: "system.abilities.str.value", mode: 5, value: "25", priority: 20 }],
      "Strength score becomes 25 (override) if lower.",
    ),
    sideEffect(
      ids.armor,
      "Bazelgeuse Gem - Fire Immunity",
      "armor",
      "Fire Immunity",
      [{ key: "system.traits.di.value", mode: 2, value: "fire", priority: 20 }],
      "Immune to fire damage.",
    ),
  ],
});

// ─── 18. Fatalis Webbing ───
pushRune({
  name: "Fatalis Webbing",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Eye+2", "Constitution 24"),
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Fatalis Webbing - Critical Eye+2",
      "weapon",
      "Critical Eye+2",
      [{ key: "flags.midi-qol.critical.range", mode: 2, value: "3", priority: 20 }],
      "Critical hit range increased by 3.",
    ),
    sideEffect(
      ids.armor,
      "Fatalis Webbing - Constitution 24",
      "armor",
      "Constitution 24",
      [{ key: "system.abilities.con.value", mode: 5, value: "24", priority: 20 }],
      "Constitution score becomes 24 (override) if lower.",
    ),
  ],
});

// ─── 19. S.Dalamadur Gazer (armor only sides) ───
pushRune({
  name: "S.Dalamadur Gazer",
  sort: (sortBase += 10000),
  sides: { armor: { label: "Armor Effect — Guts+2" } },
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "sr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("S.Dalamadur Gazer").act1,
      "Drop to 1 HP instead",
      "reaction",
      "Guts+2: when reduced to 0 HP but not killed outright, drop to 1 HP instead. 1/SR or LR.",
      "When you are reduced to 0 hit points but not killed outright",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.armor, "S.Dalamadur Gazer - Guts+2", "armor", "Guts+2", [], "Reaction/utility: drop to 1 HP instead of 0. 1 use, recover on short or long rest."),
  ],
});

// ─── 20. Safi'jiiva Cortex ───
pushRune({
  name: "Safi'jiiva Cortex",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Boost+", "Evade Window+"),
  macroTail: criticalBoostTail(2),
  systemExtra: {
    uses: {
      spent: 0,
      max: "5",
      recovery: [{ period: "dawn", type: "formula", formula: "1d5" }],
    },
    activities: utilityActivity(
      idsOf("Safi'jiiva Cortex").act1,
      "Evade Window+ (Succeed Dex Save)",
      "reaction",
      "When you fail a Dexterity saving throw, expend 1 rune to succeed instead.",
      "When you fail a Dexterity saving throw",
      true,
    ),
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Safi'jiiva Cortex - Critical Boost+",
      "weapon",
      "Critical Boost+",
      midi(macroName, "damageBonus"),
      "On critical weapon hit: roll two additional weapon damage dice (macro).",
    ),
    sideEffect(ids.armor, "Safi'jiiva Cortex - Evade Window+", "armor", "Evade Window+", [], "5 runes; regain 1d5 at dawn. Reaction: succeed failed Dex save (item uses)."),
  ],
});

// ─── 21. Heavy Ceanataur Leg ───
pushRune({
  name: "Heavy Ceanataur Leg",
  sort: (sortBase += 10000),
  sides: bothSides("Partbreaker+2", "Health Boost+"),
  macroTail: partbreakerCritTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Heavy Ceanataur Leg - Partbreaker+2",
      "weapon",
      "Partbreaker+2",
      midi(macroName, "damageBonus"),
      "On critical hit: +1d8 weapon damage.",
    ),
    sideEffect(
      ids.armor,
      "Heavy Ceanataur Leg - Health Boost+",
      "armor",
      "Health Boost+",
      [{ key: "system.attributes.hp.bonuses.overall", mode: 2, value: "2 * @details.level", priority: 20 }],
      "Hit point maximum increases by 2 per character level.",
    ),
  ],
});

// ─── 22. S. Zinogre Umbrage ───
pushRune({
  name: "S. Zinogre Umbrage",
  sort: (sortBase += 10000),
  sides: bothSides("Necrotic Explosion", "Crit Temp HP Aura"),
  systemExtra: {
    uses: { spent: 0, max: "3", recovery: [{ period: "dawn", type: "recoverAll" }] },
    activities: saveActivity(idsOf("S. Zinogre Umbrage").act1, "Necrotic Explosion", {
      activationType: "special",
      condition: "On hit with this weapon — expend a rune",
      chatFlavor: "Target and creatures within 5 ft (not you): DC 15 Con. Damage = floor(level/2)d6 necrotic (4d6 placeholder if formula unsupported). Half on save.",
      consumeItemUse: true,
      rangeValue: "5",
      rangeUnits: "ft",
      template: { count: "", contiguous: false, type: "radius", size: "5", width: "", height: "", units: "ft" },
      affects: { count: "", type: "creature", choice: false, special: "Exclude self" },
      damageParts: [
        {
          number: null,
          denomination: null,
          bonus: "",
          types: ["necrotic"],
          custom: { enabled: true, formula: "floor(@details.level/2)d6" },
          scaling: { mode: "", number: null, formula: "" },
        },
      ],
      ability: ["con"],
      dcFormula: "15",
    }),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "S. Zinogre Umbrage - Necrotic Explosion", "weapon", "Necrotic Explosion", [], "3 runes/dawn. On hit: expend rune for necrotic explosion (save activity). Formula floor(level/2)d6 or resolve manually."),
    sideEffect(ids.armor, "S. Zinogre Umbrage - Crit Aura", "armor", "Crit Temp HP Aura", [], "On weapon crit: red lightning aura 1 min; temp HP = half level at start of turns (manual)."),
  ],
});

// ─── 23. Cursed Bone ───
pushRune({
  name: "Cursed Bone",
  sort: (sortBase += 10000),
  sides: bothSides("Weakness Exploit", "Recovery Speed"),
  macroTail: weaknessExploitTail(),
  systemExtra: {
    uses: { spent: 0, max: "@abilities.str.mod", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Cursed Bone").act1,
      "Weakness Exploit",
      "special",
      "With advantage: if lower d20 would also hit, deal maximum weapon damage (extra dice still rolled). Track uses = STR or DEX mod (item uses; set max manually if needed).",
      "Weapon side — on hit with advantage",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Cursed Bone - Weakness Exploit", "weapon", "Weakness Exploit", [], "Weakness Exploit (manual resolution); track uses via activity. Max @abilities.str.mod (fallback 3 if blank)."),
    sideEffect(ids.armor, "Cursed Bone - Recovery Speed", "armor", "Recovery Speed", [], "Recovery Speed (manual): double Hit Dice healing."),
  ],
});

// ─── 24. Brachydios Lash ───
pushRune({
  name: "Brachydios Lash",
  sort: (sortBase += 10000),
  sides: bothSides("Weakness Exploit+", "Adrenaline"),
  macroTail: weaknessExploitTail(),
  systemExtra: {
    uses: { spent: 0, max: "@abilities.str.mod", recovery: [{ period: "sr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Brachydios Lash").act1,
      "Weakness Exploit+",
      "special",
      "Weakness Exploit+ (same as Weakness Exploit). Uses = STR/DEX mod; regain on short or long rest.",
      "Weapon side — on hit with advantage",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Brachydios Lash - Weakness Exploit+", "weapon", "Weakness Exploit+", [], "Weakness Exploit+ (manual); uses recover on SR or LR."),
    sideEffect(ids.armor, "Brachydios Lash - Adrenaline (Manual)", "armor", "Adrenaline", [], "Adrenaline (manual): first time below half HP in combat — next turn double speed + extra action."),
  ],
});

// ─── 25. Narwa Carapace ───
pushRune({
  name: "Narwa Carapace",
  sort: (sortBase += 10000),
  sides: bothSides("Artillery+2 (Gunlance)", "Constitution+"),
  systemExtra: {
    uses: { spent: 0, max: "2", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Narwa Carapace").act1,
      "Reroll failed Con save",
      "reaction",
      "Constitution+: reroll a failed Constitution saving throw; must use the new roll. 2/LR.",
      "When you fail a Constitution saving throw",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Narwa Carapace - Artillery+2",
      "weapon",
      "Artillery+2",
      [],
      "(Gunlance Only) Artillery+2 (manual). See description for Thunder Alignment set bonuses.",
    ),
    sideEffect(ids.armor, "Narwa Carapace - Constitution+", "armor", "Constitution+", [], "Reroll failed Con save. 2/LR (item activity). Thunder Alignment noted in description."),
  ],
});

// ─── 26. Fatalis Eye ───
pushRune({
  name: "Fatalis Eye",
  sort: (sortBase += 10000),
  sides: bothSides("Mind's Eye+", "Dark Finale"),
  macroTail: mindEyeTail(true),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Fatalis Eye").act1,
      "Dark Finale (Manual)",
      "reaction",
      "Dark Finale possession when reduced to 0 HP (see description — fully manual).",
      "When reduced to 0 hit points but not killed outright",
    ),
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Fatalis Eye - Mind's Eye+",
      "weapon",
      "Mind's Eye+",
      midi(macroName, "preDamageRoll"),
      "Weapon attacks bypass resistances and immunities (midi ignore flags).",
    ),
    sideEffect(ids.armor, "Fatalis Eye - Dark Finale", "armor", "Dark Finale", [], "Dark Finale (manual reaction) — see description."),
  ],
});

// ─── 27. Rajang Heart ───
pushRune({
  name: "Rajang Heart",
  sort: (sortBase += 10000),
  sides: bothSides("Extra Lightning", "Stamina Surge+3"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "day", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("Rajang Heart").act1,
      "Cast Haste (Self)",
      "action",
      "Stamina Surge+3: cast haste targeting only yourself. 1/day.",
      "Armor side",
      true,
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Rajang Heart - Extra Lightning",
      "weapon",
      "Extra Lightning",
      [
        { key: "system.bonuses.mwak.damage", mode: 2, value: "2d6[lightning]", priority: 20 },
        { key: "system.bonuses.rwak.damage", mode: 2, value: "2d6[lightning]", priority: 20 },
      ],
      "Extra 2d6 lightning on weapon attacks.",
    ),
    sideEffect(ids.armor, "Rajang Heart - Stamina Surge+3", "armor", "Stamina Surge+3", [], "Action: cast haste on self. 1/day (item activity)."),
  ],
});

// ─── 28. Fatalis Fellwing ───
pushRune({
  name: "Fatalis Fellwing",
  sort: (sortBase += 10000),
  sides: bothSides("Arcane Focus / BA Spell", "Channel Divinity +1"),
  systemExtra: {
    activities: {
      ...utilityActivity(
        idsOf("Fatalis Fellwing").act1,
        "Bonus Action Spell (4th or lower)",
        "bonus",
        "Cast a spell of 4th level or lower that normally takes an action as a bonus action (manual — expend slot).",
        "Weapon side — while holding this weapon",
      ),
      ...utilityActivity(
        idsOf("Fatalis Fellwing").act2,
        "Channel Divinity +1 Reminder",
        "special",
        "(Paladin & Cleric Only) One additional Channel Divinity between rests (manual).",
        "Armor side",
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Fatalis Fellwing - Arcane Focus", "weapon", "Arcane Focus / BA Spell", [], "Acts as arcane focus; BA cast 4th or lower (manual + activity reminder)."),
    sideEffect(ids.armor, "Fatalis Fellwing - Channel Divinity +1", "armor", "Channel Divinity +1", [], "(Paladin & Cleric Only) +1 Channel Divinity between rests (manual)."),
  ],
});

// ─── 29. Archdemon Tailhook ───
pushRune({
  name: "Archdemon Tailhook",
  sort: (sortBase += 10000),
  sides: bothSides("Resentment+", "Cold Immunity / Fire Resistance"),
  macroTail: resentmentPlusTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Archdemon Tailhook - Resentment+ (Track)", "weapon", "Resentment+", midi(macroName, "isDamaged"), "Tracks attackers that damage you (Resentment+)."),
    sideEffect(ids.weapon2, "Archdemon Tailhook - Resentment+ (Attack)", "weapon", "Resentment+", midi(macroName, "preItemRoll"), "+2 attack rolls vs Resentment+ targets."),
    sideEffect(ids.weapon3, "Archdemon Tailhook - Resentment+ (Damage)", "weapon", "Resentment+", midi(macroName, "damageBonus"), "+2 damage vs Resentment+ targets."),
    sideEffect(
      ids.armor,
      "Archdemon Tailhook - Cold/Fire",
      "armor",
      "Cold Immunity / Fire Resistance",
      [
        { key: "system.traits.di.value", mode: 2, value: "cold", priority: 20 },
        { key: "system.traits.dr.value", mode: 2, value: "fire", priority: 20 },
      ],
      "Immune to cold; resistance to fire.",
    ),
  ],
});

// ─── 30. Narwa Sparksac ───
pushRune({
  name: "Narwa Sparksac",
  sort: (sortBase += 10000),
  sides: bothSides("Lightning Spells Bypass Resistance", "Fly 60"),
  macroTail: lightningSpellBypassTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Narwa Sparksac - Lightning Bypass",
      "weapon",
      "Lightning Bypass",
      midi(macroName, "preDamageRoll"),
      "Lightning spells bypass resistance (midi ignoreResistances).",
    ),
    sideEffect(
      ids.armor,
      "Narwa Sparksac - Fly 60",
      "armor",
      "Fly 60",
      [{ key: "system.attributes.movement.fly", mode: 5, value: "60", priority: 20 }],
      "Flying speed 60 feet.",
    ),
  ],
});

// ─── 31. Dragonmoss ───
pushRune({
  name: "Dragonmoss",
  sort: (sortBase += 10000),
  sides: bothSides("Mind's Eye", "Strength 25"),
  macroTail: mindEyeTail(false),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Dragonmoss - Mind's Eye",
      "weapon",
      "Mind's Eye",
      midi(macroName, "preDamageRoll"),
      "Weapon attacks bypass damage resistances (not immunities).",
    ),
    sideEffect(
      ids.armor,
      "Dragonmoss - Strength 25",
      "armor",
      "Strength 25",
      [{ key: "system.abilities.str.value", mode: 5, value: "25", priority: 20 }],
      "Strength score becomes 25 (override) if lower.",
    ),
  ],
});

// ─── 32. Skyblade Dragon Sapphire ───
pushRune({
  name: "Skyblade Dragon Sapphire",
  sort: (sortBase += 10000),
  sides: bothSides("Charm Person", "Cold/Fire Immunity"),
  systemExtra: {
    uses: { spent: 0, max: "3", recovery: [{ period: "dawn", type: "recoverAll" }] },
    activities: saveActivity(idsOf("Skyblade Dragon Sapphire").act1, "Charm Person", {
      activationType: "action",
      chatFlavor: "Expend a rune: DC 21 Cha save or become charmed as charm person.",
      consumeItemUse: true,
      rangeValue: "30",
      rangeUnits: "ft",
      affects: { count: "1", type: "creature", choice: false, special: "" },
      damageParts: [],
      onSave: "none",
      ability: ["cha"],
      dcFormula: "21",
    }),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Skyblade Dragon Sapphire - Charm Person", "weapon", "Charm Person", [], "3 runes/dawn. Action: DC 21 Cha charm person (save activity)."),
    sideEffect(
      ids.armor,
      "Skyblade Dragon Sapphire - Cold/Fire Immunity",
      "armor",
      "Cold/Fire Immunity",
      [
        { key: "system.traits.di.value", mode: 2, value: "cold", priority: 20 },
        { key: "system.traits.di.value", mode: 2, value: "fire", priority: 20 },
      ],
      "Immune to cold and fire damage.",
    ),
  ],
});

// ─── 33. T.Fulgur Tail ───
pushRune({
  name: "T.Fulgur Tail",
  sort: (sortBase += 10000),
  sides: bothSides("Spell Attack/DC +2", "Electric Shroud"),
  macroTail: thunderLightningSpellBonusTail(),
  systemExtra: {
    uses: { spent: 0, max: "@abilities.con.mod", recovery: [{ period: "lr", type: "recoverAll" }] },
    activities: utilityActivity(
      idsOf("T.Fulgur Tail").act1,
      "Electric Shroud",
      "action",
      "Shroud in electricity for 1 minute. Once: advantage on one weapon attack (+1d8 lightning on hit) and +30 ft walk until end of that turn (manual resolution of once-per-shroud).",
      "Armor side",
      true,
    ),
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "T.Fulgur Tail - Spell Bonus",
      "weapon",
      "Spell Attack/DC +2",
      [
        { key: "system.bonuses.spell.attack", mode: 2, value: "2", priority: 20 },
        { key: "system.bonuses.spell.dc", mode: 2, value: "2", priority: 20 },
        { key: "flags.midi-qol.onUseMacroName", mode: 0, value: `ItemMacro.${macroName},preItemRoll`, priority: 20 },
      ],
      "+2 spell attack and spell save DC. Extra +1 (to +3) for thunder/lightning spells via macro (attack) / note for DC.",
    ),
    sideEffect(ids.armor, "T.Fulgur Tail - Electric Shroud", "armor", "Electric Shroud", [], "Action Electric Shroud 1 min. Uses = CON mod (or 3). 1/LR per use."),
  ],
});

// ─── 34. Alatreon Mantle ───
pushRune({
  name: "Alatreon Mantle",
  sort: (sortBase += 10000),
  sides: bothSides("Critical Element", "Blightproof"),
  macroTail: criticalElementTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Alatreon Mantle - Critical Element",
      "weapon",
      "Critical Element",
      midi(macroName, "damageBonus"),
      "On critical with elemental damage: +1d10 of that type. Failed save by 5+ for elemental spells: +1d10 (manual for save case).",
    ),
    sideEffect(
      ids.armor,
      "Alatreon Mantle - Blightproof",
      "armor",
      "Blightproof",
      [{ key: "system.traits.ci.value", mode: 2, value: "diseased", priority: 20 }],
      "Blightproof: immune to blight spells/conditions (ci diseased approximation + description).",
    ),
  ],
});

// ─── 35. Behemoth Tail ───
pushRune({
  name: "Behemoth Tail",
  sort: (sortBase += 10000),
  sides: bothSides("Nat20 Fireball BA", "Lightning Immunity / Paralyzed Immunity"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Behemoth Tail").act1,
      "Fireball (Bonus Action Reminder)",
      "bonus",
      "On ranged spell nat 20: cast fireball as BA centered on the hit creature (manual — expend 3rd+ slot).",
      "Weapon side — after ranged spell critical (nat 20)",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(ids.weapon, "Behemoth Tail - Nat20 Fireball", "weapon", "Nat20 Fireball BA", [], "Ranged spell nat 20 → BA fireball on target (manual + activity reminder)."),
    sideEffect(
      ids.armor,
      "Behemoth Tail - Lightning / Paralyzed",
      "armor",
      "Lightning & Paralyzed Immunity",
      [
        { key: "system.traits.di.value", mode: 2, value: "lightning", priority: 20 },
        { key: "system.traits.ci.value", mode: 2, value: "paralyzed", priority: 20 },
      ],
      "Immune to lightning damage; cannot be paralyzed.",
    ),
  ],
});

for (const { path: filePath, doc } of items) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n");
  console.log("Wrote", path.relative(__dirname, filePath));
}

console.log(`\nDone: ${items.length} rune JSON files written.`);
const armorOnly = items.filter((x) => {
  const sides = x.doc.flags["amellwind-toolbox"].sides;
  return sides.armor && !sides.weapon;
});
const weaponOnly = items.filter((x) => {
  const sides = x.doc.flags["amellwind-toolbox"].sides;
  return sides.weapon && !sides.armor;
});
console.log("Armor-only sides:", armorOnly.map((x) => x.name).join(", ") || "(none)");
console.log("Weapon-only sides:", weaponOnly.map((x) => x.name).join(", ") || "(none)");
