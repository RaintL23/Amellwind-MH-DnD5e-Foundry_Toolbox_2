/**
 * Generator for 6 missing Foundry rune items (v12 / dnd5e 4.4.4).
 * Run: node public/data/foundry-jsons-example/runes/_build-batch-missing-runes.mjs
 *
 * Loads IDs from _batch-missing-runes-ids.json and text from _batch-missing-runes-meta.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeRuneItemMacroCommand } from "../../scripts/runes/compose-rune-itemacro.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const metaList = JSON.parse(fs.readFileSync(path.join(__dirname, "_batch-missing-runes-meta.json"), "utf8"));
const idsByName = JSON.parse(fs.readFileSync(path.join(__dirname, "_batch-missing-runes-ids.json"), "utf8"));

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

function checkActivity(id, name, ability, dc, chatFlavor, skill = null) {
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

function midiMulti(macroName, passes) {
  return passes.flatMap((pass) => midi(macroName, pass));
}

/** Lightning spells: bypass resistance; half damage vs lightning immunity. */
function allmotherLightningTail() {
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
}
if (pass.includes("postdamageroll")) {
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const src = wf.item;
  if (!src || src.type !== "spell") return;
  const dump = JSON.stringify(src.system?.damage ?? src.system?.activities ?? {}).toLowerCase();
  const desc = String(src.system?.description?.value ?? "").toLowerCase();
  const hasLightning = dump.includes("lightning") || desc.includes("lightning")
    || (wf.damageDetail ?? []).some((d) => String(d.type ?? "").toLowerCase() === "lightning");
  if (!hasLightning) return;
  const targets = [...(wf.targets ?? [])];
  for (const t of targets) {
    const a = t.actor;
    if (!a) continue;
    const di = a.system?.traits?.di?.value;
    const immune = di instanceof Set ? di.has("lightning") : Array.isArray(di) && di.includes("lightning");
    if (!immune) continue;
    try {
      wf.ignoreImmunities = true;
      foundry.utils.setProperty(arg0, "ignoreImmunities", true);
      if (Array.isArray(wf.damageDetail)) {
        for (const d of wf.damageDetail) {
          if (String(d.type ?? "").toLowerCase() === "lightning" || !d.type) {
            d.value = Math.floor(Number(d.value ?? 0) / 2);
          }
        }
      }
      if (wf.damageRoll?.total != null) {
        ChatMessage.create({
          content: \`<em>\${runeName}: lightning immunity → half damage applied (verify Midi totals).</em>\`,
          speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
        });
      }
    } catch (_) {}
  }
  return;
}`;
}

/** Blood Awakening: heal-from-damage arms +10 on next attack. */
function bloodAwakeningTail() {
  return `
if (pass.includes("ishealed")) {
  const amount = Number(arg0?.damageTotal ?? arg0?.totalDamage ?? arg0?.hpTotal ?? 0);
  if (!(amount > 0)) return;
  // Arm when healing occurs while weapon side is active (life-steal / damage-heal sources).
  await setRuneFlag(item, "bloodAwakeningArmed", true);
  return;
}
if (pass.includes("damagebonus")) {
  const armed = getRuneFlag(item, "bloodAwakeningArmed");
  if (!armed) return null;
  await setRuneFlag(item, "bloodAwakeningArmed", false);
  return { damageRoll: "10", flavor: \`\${runeName} — Blood Awakening\` };
}`;
}

/** Benediction: store healed amount; reduce next damage taken by that amount. */
function benedictionTail() {
  return `
if (pass.includes("ishealed") || pass.includes("posthealroll")) {
  // When the wearer heals someone (midi may fire on healer or target — arm if this actor is the healer).
  const healer = arg0?.actor ?? workflow?.actor ?? actorDoc;
  if (healer?.uuid !== actorDoc?.uuid) return;
  const amount = Number(arg0?.damageTotal ?? arg0?.totalDamage ?? arg0?.hpTotal ?? arg0?.appliedDamage ?? 0);
  if (!(amount > 0)) return;
  await setRuneFlag(item, "benedictionBuffer", amount);
  return;
}
if (pass.includes("predamagetotalapplied") || pass.includes("isdamaged")) {
  const buf = Number(getRuneFlag(item, "benedictionBuffer") ?? 0);
  if (!(buf > 0)) return;
  const incoming = Number(arg0?.totalDamage ?? arg0?.damageTotal ?? arg0?.hpDamage ?? 0);
  if (!(incoming > 0)) return;
  const reduce = Math.min(buf, incoming);
  await setRuneFlag(item, "benedictionBuffer", 0);
  try {
    if (arg0 && typeof arg0 === "object") {
      if (arg0.totalDamage != null) arg0.totalDamage = Math.max(0, Number(arg0.totalDamage) - reduce);
      if (arg0.damageTotal != null) arg0.damageTotal = Math.max(0, Number(arg0.damageTotal) - reduce);
      if (arg0.hpDamage != null) arg0.hpDamage = Math.max(0, Number(arg0.hpDamage) - reduce);
    }
    ChatMessage.create({
      content: \`<em>\${runeName} — Benediction: reduced damage by \${reduce}.</em>\`,
      speaker: ChatMessage.getSpeaker({ actor: actorDoc }),
    });
  } catch (_) {}
  return;
}`;
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
let sortBase = 9700000;

// ─── 1. Allmother Sparksac ───
pushRune({
  name: "Allmother Sparksac",
  sort: sortBase,
  sides: bothSides("Lightning Bypass + Half vs Immunity", "Fly 80"),
  macroTail: allmotherLightningTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Allmother Sparksac - Lightning Bypass",
      "weapon",
      "Lightning Bypass",
      midiMulti(macroName, ["preDamageRoll", "postDamageRoll"]),
      "Lightning spells bypass resistance; half damage vs lightning immunity (midi).",
    ),
    sideEffect(
      ids.armor,
      "Allmother Sparksac - Fly 80",
      "armor",
      "Fly 80",
      [{ key: "system.attributes.movement.fly", mode: 5, value: "80", priority: 20 }],
      "Flying speed 80 feet.",
    ),
  ],
});

// ─── 2. Malzeno Beautifang ───
pushRune({
  name: "Malzeno Beautifang",
  sort: (sortBase += 10000),
  sides: bothSides("Blood Awakening", "White Knight"),
  macroTail: bloodAwakeningTail(),
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Malzeno Beautifang - Blood Awakening",
      "weapon",
      "Blood Awakening",
      midiMulti(macroName, ["isHealed", "damageBonus"]),
      "After healing from dealing damage: next attack +10 damage.",
    ),
    sideEffect(
      ids.armor,
      "Malzeno Beautifang - White Knight",
      "armor",
      "White Knight",
      [{ key: "system.abilities.cha.value", mode: 4, value: "19", priority: 20 }],
      "Charisma becomes 19 (upgrade) if lower. Advantage on Cha checks vs nobles (manual).",
    ),
  ],
});

// ─── 3. Qurupeco Feather ───
pushRune({
  name: "Qurupeco Feather",
  sort: (sortBase += 10000),
  sides: bothSides("Summon Jaggi", "Performance Inspiration"),
  systemExtra: {
    uses: { spent: 0, max: "1", recovery: [{ period: "week", type: "recoverAll" }] },
    activities: {
      ...checkActivity(
        idsOf("Qurupeco Feather").act1,
        "Performance Inspiration (DC 15)",
        "cha",
        15,
        "Armor side — after a long rest: DC 15 Cha (Performance) with a proficient instrument. On success, gain Inspiration if you lack it.",
        "per",
      ),
      ...utilityActivity(
        idsOf("Qurupeco Feather").act2,
        "Summon Jaggi",
        "action",
        "Weapon side — summon a jaggi ally for 1 hour (acts on your turn; flees if harmed). 1/week.",
        "Weapon side — while holding this weapon",
        true,
        {
          duration: { value: "1", units: "hour", concentration: false, override: false },
          range: { value: "30", units: "ft", special: "", override: false },
        },
      ),
    },
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Qurupeco Feather - Summon Jaggi",
      "weapon",
      "Summon Jaggi",
      [],
      "Action: summon jaggi for 1 hour. 1/week (use activity).",
    ),
    sideEffect(
      ids.armor,
      "Qurupeco Feather - Performance Inspiration",
      "armor",
      "Performance Inspiration",
      [],
      "After long rest: DC 15 Performance for Inspiration (use check activity).",
    ),
  ],
});

// ─── 4. Azure Lao-Shan Hardhorn ───
pushRune({
  name: "Azure Lao-Shan Hardhorn",
  sort: (sortBase += 10000),
  sides: bothSides("Benediction", "Psychic Vision"),
  macroTail: benedictionTail(),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Azure Lao-Shan Hardhorn").act1,
      "Benediction Reminder",
      "special",
      "When you heal a creature: next damage you take is reduced by the HP healed (midi buffer + verify).",
      "Weapon side",
    ),
  },
  effects: (ids, macroName) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Azure Lao-Shan Hardhorn - Benediction",
      "weapon",
      "Benediction",
      midiMulti(macroName, ["isHealed", "isDamaged"]),
      "Heal → buffer; next damage reduced by healed amount (midi).",
    ),
    sideEffect(
      ids.armor,
      "Azure Lao-Shan Hardhorn - Psychic Vision",
      "armor",
      "Psychic Vision",
      [
        { key: "system.attributes.senses.tremorsense", mode: 4, value: "60", priority: 20 },
        { key: "system.traits.dv.value", mode: 2, value: "psychic", priority: 20 },
      ],
      "Know creature locations within 60 ft (tremorsense approx) + vulnerability to psychic.",
    ),
  ],
});

// ─── 5. Nightcloak Plume ───
pushRune({
  name: "Nightcloak Plume",
  sort: (sortBase += 10000),
  sides: bothSides("Horn Maestro+", "Insight Advantage"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Nightcloak Plume").act1,
      "Horn Maestro+ Reminder",
      "special",
      "(Hunting Horn only) Melody duration +1 minute (manual / Hunting Horn sheet).",
      "Weapon side",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Nightcloak Plume - Horn Maestro+",
      "weapon",
      "Horn Maestro+",
      [],
      "(Hunting Horn only) Melody lasts 1 minute longer (manual).",
    ),
    sideEffect(
      ids.armor,
      "Nightcloak Plume - Insight Advantage",
      "armor",
      "Insight Advantage",
      [{ key: "flags.midi-qol.advantage.skill.ins", mode: 0, value: "1", priority: 20 }],
      "Advantage on Insight checks.",
    ),
  ],
});

// ─── 6. Uth Duna Tentacle ───
pushRune({
  name: "Uth Duna Tentacle",
  sort: (sortBase += 10000),
  sides: bothSides("Inspiring Melody", "Health Boost"),
  systemExtra: {
    activities: utilityActivity(
      idsOf("Uth Duna Tentacle").act1,
      "Inspiring Melody Reminder",
      "special",
      "(Hunting Horn Only) Melody → allies within 20 ft deal +1d6 damage until end of your next turn (manual).",
      "Weapon side",
    ),
  },
  effects: (ids) => [
    equipEffect(ids.equip),
    sideEffect(
      ids.weapon,
      "Uth Duna Tentacle - Inspiring Melody",
      "weapon",
      "Inspiring Melody",
      [],
      "(Hunting Horn Only) Ally damage buff on melody (manual).",
    ),
    sideEffect(
      ids.armor,
      "Uth Duna Tentacle - Health Boost",
      "armor",
      "Health Boost",
      [{ key: "system.attributes.hp.bonuses.overall", mode: 2, value: "@details.level", priority: 20 }],
      "Hit point maximum increases by 1 per character level.",
    ),
  ],
});

for (const { path: filePath, doc } of items) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(doc, null, 2) + "\n");
  console.log("Wrote", path.relative(__dirname, filePath));
}

console.log(`\nDone: ${items.length} rune JSON files written.`);
