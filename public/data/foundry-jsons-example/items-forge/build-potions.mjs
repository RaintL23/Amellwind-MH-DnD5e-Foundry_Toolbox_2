/**
 * Builds AGMH potion / buff consumables for the Items Forge Foundry pack.
 * Source: `public/data/raintdm-items/potions.json`
 *
 * Each item is a consumable potion with a Drink/Eat activity that applies an
 * Active Effect (transfer: false) matching GTMH Chapter 3 rules.
 *
 * Run via: node public/data/foundry-jsons-example/items-forge/build-items-forge.mjs
 * Or alone: node public/data/foundry-jsons-example/items-forge/build-potions.mjs
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  loadFoundryIconCatalog,
  resolveFoundryIcon,
} from "../../../../scripts/lib/foundry-icons.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");
const POTIONS_SRC = path.join(ROOT, "public", "data", "raintdm-items", "potions.json");
const OUT_DIR = path.join(__dirname, "potions");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";
const ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const MODE = { CUSTOM: 0, ADD: 2, OVERRIDE: 5 };

/** Preferred Foundry core icons (verified / remapped at build via foundry-icons). */
/** @type {Record<string, PotionDef>} */
const POTION_DEFS = {
  "adamant-pill": {
    effectName: "Adamant Pill",
    activityName: "Swallow Pill",
    durationSeconds: 600,
    changes: [
      { key: "system.attributes.ac.bonus", mode: MODE.ADD, value: "+2", priority: 20 },
    ],
    img: "icons/consumables/potions/potion-tube-corked-glowing-red.webp",
  },
  armorskin: {
    effectName: "Armorskin",
    activityName: "Drink",
    durationSeconds: 28800,
    changes: [
      {
        key: "system.attributes.ac.formula",
        mode: MODE.OVERRIDE,
        value: "13 + @abilities.dex.mod",
        priority: 20,
      },
      {
        key: "system.attributes.ac.calc",
        mode: MODE.OVERRIDE,
        value: "custom",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/potion-bottle-corked-fancy-orange.webp",
  },
  "mega-armorskin": {
    effectName: "Armorskin",
    activityName: "Drink",
    durationSeconds: 28800,
    changes: [
      {
        key: "system.attributes.ac.formula",
        mode: MODE.OVERRIDE,
        value: "15 + @abilities.dex.mod",
        priority: 20,
      },
      {
        key: "system.attributes.ac.calc",
        mode: MODE.OVERRIDE,
        value: "custom",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/bottle-pear-corked-labeled-ornamental-purple.webp",
  },
  "dash-juice": {
    effectName: "Dash Juice",
    activityName: "Drink",
    durationSeconds: 3600,
    changes: [
      {
        key: "system.attributes.movement.walk",
        mode: MODE.ADD,
        value: "10",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/bottle-conical-corked-yellow.webp",
  },
  "mega-dash-juice": {
    effectName: "Dash Juice",
    activityName: "Drink",
    durationSeconds: 3600,
    changes: [
      {
        key: "system.attributes.movement.walk",
        mode: MODE.ADD,
        value: "20",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/potion-bottle-corked-fancy-blue.webp",
  },
  demondrug: {
    effectName: "Demondrug",
    activityName: "Drink",
    durationSeconds: 3600,
    changes: [
      { key: "system.abilities.str.value", mode: MODE.ADD, value: "2", priority: 20 },
    ],
    img: "icons/consumables/potions/potion-bottle-corked-labeled-red.webp",
  },
  "mega-demondrug": {
    effectName: "Demondrug",
    activityName: "Drink",
    durationSeconds: 3600,
    changes: [
      { key: "system.abilities.str.value", mode: MODE.ADD, value: "4", priority: 20 },
    ],
    img: "icons/consumables/potions/potion-flask-corked-shiny-red.webp",
  },
  nutrients: {
    effectName: "Nutrients",
    activityName: "Drink",
    durationSeconds: 28800,
    changes: [
      { key: "system.attributes.hp.tempmax", mode: MODE.ADD, value: "5", priority: 20 },
    ],
    healFormula: "5",
    img: "icons/consumables/potions/potion-bottle-corked-labeled-green.webp",
  },
  "mega-nutrients": {
    effectName: "Nutrients",
    activityName: "Drink",
    durationSeconds: 28800,
    changes: [
      {
        key: "system.attributes.hp.tempmax",
        mode: MODE.ADD,
        value: "10",
        priority: 20,
      },
    ],
    healFormula: "10",
    img: "icons/consumables/potions/bottle-bulb-corked-labeled-blue.webp",
  },
  "frozen-berry": {
    effectName: "Frozen Berry",
    activityName: "Eat",
    durationSeconds: 3600,
    changes: [
      { key: "system.traits.dr.value", mode: MODE.ADD, value: "fire", priority: 20 },
    ],
    img: "icons/consumables/fruit/berry-leaf-pink.webp",
  },
  "ancient-potion": {
    effectName: "Ancient Potion",
    activityName: "Drink",
    durationSeconds: null,
    healFormula: "45",
    changes: [
      {
        key: "system.attributes.exhaustion",
        mode: MODE.OVERRIDE,
        value: "0",
        priority: 20,
      },
    ],
    img: "icons/magic/life/heart-glowing-red.webp",
  },
  "max-potion": {
    effectName: "Max Potion",
    activityName: "Drink",
    durationSeconds: null,
    healFormula: "70",
    changes: [],
    img: "icons/magic/life/cross-worn-green.webp",
  },
  "herbal-medicine": {
    effectName: "Herbal Medicine",
    activityName: "Drink",
    durationSeconds: 3600,
    healFormula: "1d4",
    changes: [
      {
        key: "flags.midi-qol.advantage.ability.save.con",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/potion-flask-corked-green.webp",
  },
  lifepowder: {
    effectName: "Lifepowder",
    activityName: "Use",
    durationSeconds: null,
    healFormula: "1d4 + 2",
    healAoE: { rangeFt: 30, creatureCount: "8" },
    changes: [],
    img: "icons/commodities/materials/powder-teal.webp",
  },
  "dust-of-life": {
    effectName: "Dust of Life",
    activityName: "Use",
    durationSeconds: null,
    healFormula: "1d6 + 2",
    healAoE: { rangeFt: 30, creatureCount: "8" },
    changes: [],
    img: "icons/commodities/materials/powder-grey.webp",
  },
  "energy-drink": {
    effectName: "Energy Drink",
    activityName: "Drink",
    durationSeconds: null,
    changes: [
      {
        key: "system.attributes.exhaustion",
        mode: MODE.ADD,
        value: "-1",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/flask-corked-yellow-glow.webp",
  },
  "air-philter": {
    effectName: "Air Philter",
    activityName: "Drink",
    durationSeconds: 3600,
    changes: [
      {
        key: "flags.midi-qol.advantage.ability.save.con",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/potion-bottle-fumes-blue.webp",
  },
  "mega-air-philter": {
    effectName: "Air Philter",
    activityName: "Drink",
    durationSeconds: 86400,
    changes: [
      {
        key: "flags.midi-qol.advantage.ability.save.con",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/potion-bottle-corked-fancy-blue.webp",
  },
  "might-pill": {
    effectName: "Demondrug",
    activityName: "Swallow Pill",
    durationSeconds: 60,
    changes: [
      { key: "system.abilities.str.value", mode: MODE.ADD, value: "4", priority: 20 },
    ],
    img: "icons/consumables/potions/potion-vial-corked-purple.webp",
  },
  "power-juice": {
    effectName: "Power Juice (Haste)",
    activityName: "Drink",
    durationSeconds: 60,
    concentration: true,
    changes: [
      { key: "system.attributes.ac.bonus", mode: MODE.ADD, value: "+2", priority: 20 },
      {
        key: "system.attributes.movement.all",
        mode: MODE.CUSTOM,
        value: "*2",
        priority: 20,
      },
      {
        key: "flags.midi-qol.advantage.ability.save.dex",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/potion-bottle-labeled-stopped-purple.webp",
  },
  psychoserum: {
    effectName: "Psychoserum",
    activityName: "Drink",
    durationSeconds: 86400,
    changes: [
      {
        key: "flags.midi-qol.advantage.skill.sur",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/potion-jar-corked-labeled-purple-pink.webp",
  },
  immunizer: {
    effectName: "Immunizer",
    activityName: "Drink",
    durationSeconds: 3600,
    changes: [
      {
        key: "flags.midi-qol.advantage.ability.save.con",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    img: "icons/consumables/potions/vial-cork-green.webp",
  },
  "antiseptic-stone": {
    effectName: "Antiseptic Stone",
    activityName: "Crush",
    durationSeconds: 3600,
    changes: [
      {
        key: "flags.midi-qol.advantage.ability.save.con",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    img: "icons/commodities/stone/ore-pile-teal.webp",
  },
};

const FALLBACK_POTION_IMG =
  "icons/consumables/potions/potion-bottle-corked-labeled-green.webp";

/** Resolve preferred img against the local Foundry icons tree. */
function resolvePotionImg(preferred, catalogState) {
  const result = resolveFoundryIcon(preferred, catalogState);
  if (result.path && !result.remapped) return result.path;
  if (result.path && result.remapped) {
    console.warn(`  icon remap: ${preferred} → ${result.path}`);
    return result.path;
  }
  console.warn(`  icon missing (using fallback): ${preferred}`);
  return FALLBACK_POTION_IMG;
}

/**
 * @typedef {{
 *   effectName: string;
 *   activityName: string;
 *   durationSeconds: number | null;
 *   changes: Array<{ key: string; mode: number; value: string; priority: number }>;
 *   healFormula?: string;
 *   healAoE?: { rangeFt: number; creatureCount: string };
 *   concentration?: boolean;
 *   img: string;
 * }} PotionDef
 */

function stableId(seed) {
  const hash = createHash("sha1").update(seed).digest();
  let id = "";
  for (let i = 0; i < 16; i += 1) id += ID_ALPHABET[hash[i] % ID_ALPHABET.length];
  return id;
}

function slugify(name) {
  return String(name)
    .toLowerCase()
    .replace(/\+/g, "-plus")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function filenameFor(name) {
  return `fvtt-Item-${slugify(name)}.json`;
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function convertFiveTools(raw) {
  return String(raw).replace(/\{@([a-zA-Z]+)(?:\s+([^}]+))?\}/g, (_, tag, body = "") => {
    const lower = String(tag).toLowerCase();
    const trimmed = String(body).trim();
    if (lower === "dc") return `DC ${escapeHtml(trimmed)}`;
    if (lower === "dice" || lower === "damage") {
      const formula = trimmed.split("|")[0]?.trim() ?? trimmed;
      return `[[/r ${formula}]]`;
    }
    if (lower === "item" || lower === "skill" || lower === "condition" || lower === "spell") {
      return `@${lower}[${trimmed}]`;
    }
    return escapeHtml(trimmed || tag);
  });
}

function entriesToHtml(entries) {
  return (entries ?? [])
    .filter((e) => typeof e === "string" && e.trim())
    .map((e) => `<p>${convertFiveTools(e)}</p>`)
    .join("");
}

function craftingFooter(crafting) {
  if (!crafting) return "";
  const qty = crafting.quantity ? `, qty ${escapeHtml(String(crafting.quantity))}` : "";
  return `<p><em>Craft (Combo List): ${escapeHtml(crafting.tool)} — ${escapeHtml(crafting.item1)} + ${escapeHtml(crafting.item2)} DC ${escapeHtml(String(crafting.dc))}${qty}.</em></p>`;
}

function cpToGp(value) {
  if (value == null || value === "") return 0;
  return (Number(value) || 0) / 100;
}

function midiProperties(identifier) {
  return {
    ignoreTraits: [],
    triggeredActivityId: "none",
    triggeredActivityConditionText: "",
    triggeredActivityTargets: "targets",
    triggeredActivityRollAs: "self",
    autoConsume: false,
    forceConsumeDialog: "default",
    forceRollDialog: "default",
    forceDamageDialog: "default",
    confirmTargets: "default",
    autoTargetType: "any",
    autoTargetAction: "default",
    automationOnly: false,
    otherActivityCompatible: true,
    identifier,
    displayActivityName: true,
    rollMode: "default",
    chooseEffects: false,
    toggleEffect: false,
    ignoreFullCover: false,
    removeChatButtons: "default",
    magicEffect: false,
    magicDamage: false,
    noConcentrationCheck: false,
    autoCEEffects: "default",
  };
}

function durationLabel(seconds) {
  if (seconds == null) return "instant";
  if (seconds === 60) return "1 minute";
  if (seconds === 600) return "10 minutes";
  if (seconds === 3600) return "1 hour";
  if (seconds === 28800) return "8 hours";
  if (seconds === 86400) return "24 hours";
  if (seconds % 3600 === 0) return `${seconds / 3600} hours`;
  if (seconds % 60 === 0) return `${seconds / 60} minutes`;
  return `${seconds} seconds`;
}

function makeDrinkActivity({
  activityId,
  effectId,
  name,
  img,
  durationSeconds,
  healFormula,
  healAoE,
  concentration,
  identifier,
}) {
  const hasEffect = Boolean(effectId);
  const isHeal = Boolean(healFormula);
  const seconds = durationSeconds ?? 0;

  /** @type {Record<string, unknown>} */
  const activity = {
    _id: activityId,
    type: isHeal ? "heal" : "utility",
    sort: 0,
    name,
    img,
    activation: { type: "action", value: 1, condition: "", override: false },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [
        {
          type: "itemUses",
          target: "",
          value: "1",
          scaling: { mode: "", formula: "" },
        },
      ],
    },
    description: {
      chatFlavor: `${name} (${durationLabel(durationSeconds)})`,
    },
    duration: concentration
      ? {
          value: "1",
          units: "minute",
          concentration: true,
          override: false,
        }
      : seconds > 0
        ? {
            value: String(seconds),
            units: "second",
            concentration: false,
            override: false,
          }
        : {
            value: "",
            units: "inst",
            concentration: false,
            override: false,
          },
    effects: hasEffect ? [{ _id: effectId, onSave: false }] : [],
    range: healAoE
      ? { value: healAoE.rangeFt, units: "ft", special: "", override: false }
      : { value: null, units: "self", special: "", override: false },
    target: healAoE
      ? {
          template: {
            count: "",
            contiguous: false,
            type: "",
            size: "",
            width: "",
            height: "",
            units: "ft",
          },
          affects: {
            count: healAoE.creatureCount,
            type: "ally",
            choice: true,
            special: "You and up to 7 other creatures within range",
          },
          prompt: true,
          override: false,
        }
      : {
          template: {
            count: "",
            contiguous: false,
            type: "",
            size: "",
            width: "",
            height: "",
            units: "ft",
          },
          affects: { count: "", type: "self", choice: false, special: "" },
          prompt: false,
          override: false,
        },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midiProperties(identifier),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  };

  if (healFormula) {
    activity.healing = {
      number: null,
      denomination: 0,
      types: ["healing"],
      custom: { enabled: true, formula: healFormula },
      scaling: { mode: "", number: null },
      bonus: "",
    };
  }

  return activity;
}

function makeEffect({
  effectId,
  name,
  img,
  description,
  durationSeconds,
  changes,
}) {
  return {
    _id: effectId,
    name,
    img,
    type: "base",
    system: {},
    changes,
    disabled: false,
    duration: {
      startTime: null,
      seconds: durationSeconds,
      combat: null,
      rounds: null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    description,
    origin: null,
    tint: "#ffffff",
    transfer: false,
    statuses: [],
    sort: 0,
    flags: {
      dae: {
        enableCondition: "",
        selfTarget: true,
        selfTargetAlways: true,
        stackable: "noneName",
        showIcon: true,
        durationExpression: "",
        specialDuration: [],
        disableIncapacitated: false,
        dontApply: false,
      },
    },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      coreVersion: CORE_VERSION,
      systemId: SYSTEM_ID,
      systemVersion: SYSTEM_VERSION,
      createdTime: null,
      modifiedTime: null,
      lastModifiedBy: null,
    },
  };
}

function buildPotionItem(raw, sort, catalogState) {
  const potionKey = raw?._raintdm?.potionKey;
  const def = potionKey ? POTION_DEFS[potionKey] : null;
  if (!def) {
    console.warn(`  skip unknown potionKey: ${potionKey}`);
    return null;
  }

  const identifier = slugify(raw.name);
  const itemId = stableId(`items-forge:potion:${potionKey}:item`);
  const needsEffect = (def.changes?.length ?? 0) > 0;
  const effectId = needsEffect
    ? stableId(`items-forge:potion:${potionKey}:effect`)
    : null;
  const activityId = stableId(`items-forge:potion:${potionKey}:activity`);
  const img = resolvePotionImg(def.img, catalogState);
  const description = `${entriesToHtml(raw.entries)}${craftingFooter(raw.crafting)}`;
  const rarity =
    raw.rarity && raw.rarity !== "none" && raw.rarity !== "common" ? raw.rarity : "";
  const isMagic = Boolean(rarity);

  const activity = makeDrinkActivity({
    activityId,
    effectId,
    name: def.activityName,
    img,
    durationSeconds: def.durationSeconds,
    healFormula: def.healFormula,
    healAoE: def.healAoE,
    concentration: def.concentration,
    identifier: `drink-${potionKey}`,
  });

  const effects = needsEffect
    ? [
        makeEffect({
          effectId,
          name: def.effectName,
          img,
          description: `<p>${escapeHtml(def.effectName)} — ${durationLabel(def.durationSeconds)}.</p>`,
          durationSeconds: def.durationSeconds,
          changes: def.changes,
        }),
      ]
    : [];

  return {
    _id: itemId,
    name: raw.name,
    type: "consumable",
    img,
    system: {
      description: {
        value: description,
        chat: `<p><strong>${escapeHtml(raw.name)}</strong></p>`,
      },
      source: {
        custom: "",
        book: "AGMH",
        page: "",
        license: "",
        rules: "2024",
        revision: 1,
      },
      identifier,
      quantity: 1,
      weight: { value: Number(raw.weight) || 0, units: "lb" },
      price: { value: cpToGp(raw.value), denomination: "gp" },
      rarity,
      identified: true,
      unidentified: { description: "", name: "Mysterious Potion" },
      container: null,
      attunement: "",
      attuned: false,
      equipped: false,
      type: { value: "potion", subtype: "" },
      damage: {
        base: {
          number: null,
          denomination: null,
          types: [],
          custom: { enabled: false, formula: "" },
          scaling: { mode: "", number: null },
          bonus: "",
        },
        replace: false,
      },
      magicalBonus: null,
      properties: isMagic ? ["mgc"] : [],
      uses: { spent: 0, max: "1", recovery: [], autoDestroy: true },
      activities: { [activityId]: activity },
    },
    effects,
    folder: null,
    sort,
    ownership: { default: 0 },
    flags: {
      "amellwind-toolbox": {
        exportKind: "items-forge",
        resourceKind: "potion",
        potionKey,
      },
      exportSource: {
        world: "amellwind-toolbox",
        system: SYSTEM_ID,
        coreVersion: CORE_VERSION,
        systemVersion: SYSTEM_VERSION,
      },
    },
    _stats: {
      compendiumSource: null,
      duplicateSource: null,
      coreVersion: CORE_VERSION,
      systemId: SYSTEM_ID,
      systemVersion: SYSTEM_VERSION,
      createdTime: null,
      modifiedTime: null,
      lastModifiedBy: null,
    },
  };
}

export function buildPotions() {
  const potionsFile = JSON.parse(fs.readFileSync(POTIONS_SRC, "utf8"));
  const items = Array.isArray(potionsFile.items) ? potionsFile.items : [];
  const catalogState = loadFoundryIconCatalog();
  if (!catalogState.catalog.length) {
    console.warn(
      `  ! Foundry icons not found at ${catalogState.iconsDir} — potion imgs may be broken`,
    );
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let sort = 0;
  let written = 0;
  for (const raw of items) {
    const item = buildPotionItem(raw, sort, catalogState);
    if (!item) continue;
    const outPath = path.join(OUT_DIR, filenameFor(raw.name));
    fs.writeFileSync(outPath, `${JSON.stringify(item, null, 2)}\n`);
    console.log("Wrote", path.relative(ROOT, outPath));
    sort += 100000;
    written += 1;
  }

  console.log(`Items Forge potions: ${written}`);
  return written;
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) buildPotions();
