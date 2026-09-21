/**
 * Shared Foundry rune item builders (v12 / dnd5e 4.4.4).
 * Used by public/data/foundry-jsons-example/runes/_build/batches/*.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { composeRuneItemMacroCommand } from "./compose-rune-itemacro.mjs";
export { composeRuneItemMacroCommand };

export const CORE = {
  coreVersion: "12.331",
  systemId: "dnd5e",
  systemVersion: "4.4.4",
};

export const STATS = {
  compendiumSource: null,
  duplicateSource: null,
  ...CORE,
  createdTime: null,
  modifiedTime: null,
  lastModifiedBy: null,
};

export const DAE = {
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

export const DURATION = {
  startTime: null,
  seconds: null,
  combat: null,
  rounds: null,
  turns: null,
  startRound: null,
  startTurn: null,
};

export const RARITY = { 1: "common", 2: "uncommon", 3: "rare", 4: "veryRare" };

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .replace(/'/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function identifierFrom(name) {
  return String(name).toLowerCase().replace(/[^a-z0-9]+/g, "") + "rune";
}

export function trinketSystem(description, identifier, rarity = "uncommon", extra = {}) {
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

export function equipEffect(id) {
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

export function sideEffect(id, name, side, materialEffectName, changes = [], description = "", extra = {}) {
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

export function buildItem({
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

/**
 * Supports both call styles used by legacy batches:
 * - modern: utilityActivity(id, name, type, flavor, { condition, consumeItemUse, ... })
 * - legacy: utilityActivity(id, name, type, flavor, condition, consumeItemUse, extra)
 */
export function utilityActivity(id, name, activationType, chatFlavor, conditionOrOpts = "", consumeItemUse = false, extra = {}) {
  const opts =
    typeof conditionOrOpts === "object" && conditionOrOpts !== null
      ? conditionOrOpts
      : { condition: conditionOrOpts || "", consumeItemUse, ...extra };

  const {
    condition = "",
    consumeItemUse: consumeItem = false,
    consumeActivityUse = false,
    usesMax = "",
    recoveryPeriod = "lr",
    effectIds = [],
    durationValue = "",
    durationUnits = "inst",
    rollFormula = "",
    rollName = "",
  } = opts;

  const targets = [];
  if (consumeItem) targets.push({ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } });
  if (consumeActivityUse) targets.push({ type: "activityUses", value: "1", scaling: { mode: "", formula: "" } });

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
      targets,
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
    },
    roll: { formula: rollFormula, name: rollName, prompt: Boolean(rollFormula), visible: Boolean(rollFormula) },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  };

  // Preserve unknown legacy `extra` keys onto the activity (old call style).
  if (typeof conditionOrOpts !== "object" || conditionOrOpts === null) {
    Object.assign(activity, extra);
  }

  return { [id]: activity };
}

export function saveActivity(id, name, opts = {}) {
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
    effectIds = [],
    identifier = null,
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
      effects: effectIds.map((eid) => ({ _id: eid, onSave: false })),
      range: { value: rangeValue, units: rangeUnits, special: "", override: false },
      target: { template, affects, prompt, override: false },
      uses,
      damage: { parts: damageParts, onSave },
      save: { ability, dc: { calculation: "", formula: dcFormula } },
      midiProperties: {
        identifier: identifier ?? slugify(name),
        displayActivityName: true,
        magicDamage: true,
      },
      roll: { formula: "", name: "", prompt: false, visible: false },
    },
  };
}

export function checkActivity(id, name, ability, dc, chatFlavor, skill = null) {
  return {
    [id]: {
      _id: id,
      type: "check",
      sort: 0,
      name,
      img: "mh-icons/material-rune.webp",
      activation: { type: "special", value: null, condition: "When you finish a long rest", override: false },
      consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [] },
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
      check: {
        ability,
        dc: { calculation: "", formula: String(dc) },
        associated: skill ? [skill] : [],
      },
      midiProperties: { identifier: slugify(name), displayActivityName: true },
      useConditionText: "",
      useConditionReason: "",
      effectConditionText: "",
    },
  };
}

export function slotsLabel(slots) {
  const hasA = slots.includes("A");
  const hasW = slots.includes("W");
  if (hasA && hasW) return "Armor, Weapon";
  if (hasA) return "Armor";
  if (hasW) return "Weapon";
  return slots.join(", ");
}

export function descHtml(meta) {
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

export function bothSides(weaponLabel, armorLabel) {
  return {
    weapon: { label: `Weapon Effect — ${weaponLabel}` },
    armor: { label: `Armor Effect — ${armorLabel}` },
  };
}

export function weaponOnly(weaponLabel) {
  return { weapon: { label: `Weapon Effect — ${weaponLabel}` } };
}

export function armorOnly(armorLabel) {
  return { armor: { label: `Armor Effect — ${armorLabel}` } };
}

export function midi(macroName, pass) {
  return [{ key: "flags.midi-qol.onUseMacroName", mode: 0, value: `ItemMacro.${macroName},${pass}`, priority: 20 }];
}

export function midiMulti(macroName, passes) {
  return passes.flatMap((pass) => midi(macroName, pass));
}

export function mwakDamage(formula) {
  return [
    { key: "system.bonuses.mwak.damage", mode: 2, value: formula, priority: 20 },
    { key: "system.bonuses.rwak.damage", mode: 2, value: formula, priority: 20 },
  ];
}

export function slashingReductionChanges(amount) {
  const value = `-${amount}`;
  return [
    { key: "system.traits.dm.amount.slashing", mode: 2, value, priority: 20 },
    { key: "system.traits.dm.midi.slashing", mode: 2, value, priority: 20 },
  ];
}

export function extraSlashingDamageChanges(amount) {
  const value = `${amount}[slashing]`;
  return [
    { key: "system.bonuses.mwak.damage", mode: 2, value, priority: 20 },
    { key: "system.bonuses.rwak.damage", mode: 2, value, priority: 20 },
  ];
}

export function loadBatchData(dataDir) {
  const metaList = JSON.parse(fs.readFileSync(path.join(dataDir, "meta.json"), "utf8"));
  const idsByName = JSON.parse(fs.readFileSync(path.join(dataDir, "ids.json"), "utf8"));
  return { metaList, idsByName };
}

/**
 * @param {{ runesRoot: string, metaList?: object[], idsByName?: Record<string, object> }} opts
 */
export function createRuneBatch({ runesRoot, metaList = [], idsByName = {} }) {
  const items = [];

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

  function pushRune(cfg) {
    const meta = metaOf(cfg.name);
    const ids = idsOf(cfg.name);
    const rarity = cfg.rarity ?? meta.rarity ?? RARITY[meta.tier] ?? "uncommon";
    const fileName = `fvtt-Item-${slugify(meta.monster)}-${slugify(cfg.name)}-rune.json`;
    const filePath = path.join(runesRoot, meta.monster, fileName);
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

  /** Queue a pre-built document (used by the inline-ID `missing` batch). */
  function queueItem(filePath, doc, name = doc?.flags?.["amellwind-toolbox"]?.runeName ?? path.basename(filePath)) {
    items.push({ path: filePath, doc, name });
  }

  function writeAll({ summarizeSides = false } = {}) {
    for (const { path: filePath, doc } of items) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, `${JSON.stringify(doc, null, 2)}\n`);
      console.log("Wrote", path.relative(runesRoot, filePath));
    }
    console.log(`\nDone: ${items.length} rune JSON files written.`);
    if (summarizeSides) {
      const armorOnlyItems = items.filter((x) => {
        const sides = x.doc.flags["amellwind-toolbox"].sides;
        return sides.armor && !sides.weapon;
      });
      const weaponOnlyItems = items.filter((x) => {
        const sides = x.doc.flags["amellwind-toolbox"].sides;
        return sides.weapon && !sides.armor;
      });
      console.log("Armor-only sides:", armorOnlyItems.map((x) => x.name).join(", ") || "(none)");
      console.log("Weapon-only sides:", weaponOnlyItems.map((x) => x.name).join(", ") || "(none)");
    }
    return items;
  }

  return {
    items,
    metaOf,
    idsOf,
    pushRune,
    queueItem,
    writeAll,
    composeRuneItemMacroCommand,
  };
}
