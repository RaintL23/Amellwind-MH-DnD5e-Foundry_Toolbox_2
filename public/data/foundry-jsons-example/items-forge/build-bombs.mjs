/**
 * Builds AGMH bombs / throwables for the Items Forge Foundry pack.
 * Source: `public/data/raintdm-items/bombs.json`
 *
 * Design (matches AGtMH Ch.3):
 * - Flash / Sonic / barrel / bounce → save Activity with point template (AoE).
 * - Smoke → utility Activity that places a radius template.
 * - Poison Smoke → template + separate save Activity for the gas.
 * - Dung / Tranq / Paintball → ranged attack Activities (book is attack-based).
 *
 * Run via build-items-forge.mjs or:
 *   node public/data/foundry-jsons-example/items-forge/build-bombs.mjs
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
const BOMBS_SRC = path.join(ROOT, "public", "data", "raintdm-items", "bombs.json");
const OUT_DIR = path.join(__dirname, "bombs");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";
const ID_ALPHABET =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

const MODE = { CUSTOM: 0, ADD: 2 };

const FALLBACK_IMG = "icons/weapons/thrown/bomb-fuse-black.webp";

/** @type {Record<string, BombDef>} */
const BOMB_DEFS = {
  "flash-bomb": {
    activityName: "Throw Flash",
    kind: "saveAoE",
    rangeFt: 60,
    template: { type: "radius", size: "5" },
    save: { ability: "con", dc: "13" },
    effectName: "Flash Blinded",
    effectSeconds: 60,
    statuses: ["blinded"],
    changes: [],
    img: "icons/magic/light/explosion-star-large-orange.webp",
  },
  "sonic-bomb": {
    activityName: "Throw Sonic",
    kind: "saveAoE",
    rangeFt: 60,
    template: { type: "radius", size: "30" },
    save: { ability: "con", dc: "13" },
    effectName: "Sonic Deafened",
    effectSeconds: 60,
    statuses: ["deafened"],
    changes: [],
    img: "icons/magic/sonic/explosion-shock-sound-wave.webp",
  },
  "smoke-bomb": {
    activityName: "Throw Smoke",
    kind: "placeTemplate",
    rangeFt: 40,
    template: { type: "radius", size: "20" },
    img: "icons/commodities/tech/smoke-bomb-yellow.webp",
  },
  "poison-smoke-bomb": {
    activityName: "Throw Poison Smoke",
    kind: "poisonSmoke",
    rangeFt: 40,
    template: { type: "radius", size: "20" },
    save: { ability: "con", dc: "13" },
    effectName: "Poison Smoke",
    effectSeconds: 3600,
    statuses: ["poisoned"],
    changes: [],
    img: "icons/commodities/tech/smoke-bomb-purple.webp",
  },
  "sm-barrel-bomb": {
    activityName: "Ignite",
    kind: "saveDamage",
    rangeFt: 5,
    template: { type: "radius", size: "10" },
    save: { ability: "dex", dc: "12" },
    damage: { dice: "3d6", type: "fire", onSave: "half" },
    img: "icons/magic/fire/explosion-fireball-small-red.webp",
  },
  "lg-barrel-bomb": {
    activityName: "Ignite",
    kind: "saveDamage",
    rangeFt: 5,
    template: { type: "radius", size: "10" },
    save: { ability: "dex", dc: "15" },
    damage: { dice: "7d6", type: "fire", onSave: "half" },
    img: "icons/magic/fire/explosion-embers-orange.webp",
  },
  "bounce-bomb": {
    activityName: "Ignite",
    kind: "saveDamage",
    rangeFt: 100,
    template: { type: "radius", size: "10" },
    save: { ability: "dex", dc: "12" },
    damage: { dice: "3d6", type: "fire", onSave: "half" },
    img: "icons/magic/fire/explosion-flame-blue.webp",
  },
  "dung-bomb": {
    activityName: "Throw",
    kind: "attack",
    rangeFt: 60,
    effectName: "Dung Stench",
    effectSeconds: 3600,
    statuses: [],
    changes: [
      {
        key: "flags.midi-qol.disadvantage.skill.prc",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
      {
        key: "flags.midi-qol.disadvantage.concentration",
        mode: MODE.CUSTOM,
        value: "1",
        priority: 20,
      },
    ],
    /** Concentration disadvantage lasts 1 minute; Perception smell 1 hour — use longer AE + note. */
    img: "icons/weapons/thrown/bomb-purple.webp",
  },
  "tranq-bomb": {
    activityName: "Throw",
    kind: "attackTranq",
    rangeFt: 40,
    img: "icons/weapons/thrown/bomb-fuse-black.webp",
  },
  paintball: {
    activityName: "Throw",
    kind: "attack",
    rangeFt: 60,
    effectName: "Paint Marked",
    effectSeconds: 3600,
    statuses: [],
    changes: [],
    img: "icons/skills/targeting/target-strike-triple-blue.webp",
  },
};

/**
 * @typedef {{
 *   activityName: string;
 *   kind: 'saveAoE' | 'saveDamage' | 'placeTemplate' | 'poisonSmoke' | 'attack' | 'attackTranq';
 *   rangeFt: number;
 *   template?: { type: string; size: string };
 *   save?: { ability: string; dc: string };
 *   damage?: { dice: string; type: string; onSave: string };
 *   effectName?: string;
 *   effectSeconds?: number | null;
 *   statuses?: string[];
 *   changes?: Array<{ key: string; mode: number; value: string; priority: number }>;
 *   img: string;
 * }} BombDef
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

function midiProperties(identifier, extras = {}) {
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
    ...extras,
  };
}

function emptyTemplate() {
  return {
    count: "",
    contiguous: false,
    type: "",
    size: "",
    width: "",
    height: "",
    units: "ft",
  };
}

function resolveImg(preferred, catalogState) {
  const result = resolveFoundryIcon(preferred, catalogState);
  if (result.path && !result.remapped) return result.path;
  if (result.path && result.remapped) {
    console.warn(`  icon remap: ${preferred} → ${result.path}`);
    return result.path;
  }
  console.warn(`  icon missing (fallback): ${preferred}`);
  return FALLBACK_IMG;
}

function parseDice(dice) {
  const m = String(dice).trim().match(/^(\d+)d(\d+)$/i);
  if (!m) return { number: null, denomination: 0, formula: dice, custom: true };
  return {
    number: Number(m[1]),
    denomination: Number(m[2]),
    formula: "",
    custom: false,
  };
}

function makeEffect({ effectId, name, img, description, durationSeconds, changes, statuses }) {
  return {
    _id: effectId,
    name,
    img,
    type: "base",
    system: {},
    changes: changes ?? [],
    disabled: false,
    duration: {
      startTime: null,
      seconds: durationSeconds ?? null,
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
    statuses: statuses ?? [],
    sort: 0,
    flags: {
      dae: {
        enableCondition: "",
        selfTarget: false,
        selfTargetAlways: false,
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

function baseActivityFields({ activityId, name, img, chatFlavor, consumeUses }) {
  return {
    _id: activityId,
    sort: 0,
    name,
    img,
    activation: { type: "action", value: 1, condition: "", override: false },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: consumeUses
        ? [
            {
              type: "itemUses",
              target: "",
              value: "1",
              scaling: { mode: "", formula: "" },
            },
          ]
        : [],
    },
    description: { chatFlavor },
    duration: { value: "", units: "inst", concentration: false, override: false },
    uses: { spent: 0, max: "", recovery: [] },
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  };
}

function makeSaveAoEActivity({
  activityId,
  effectId,
  name,
  img,
  rangeFt,
  template,
  save,
  damage,
  identifier,
  consumeUses = true,
}) {
  const activity = {
    ...baseActivityFields({
      activityId,
      name,
      img,
      chatFlavor: `${name} — DC ${save.dc} ${save.ability.toUpperCase()}, ${template.size}-ft ${template.type}, range ${rangeFt} ft.`,
      consumeUses,
    }),
    type: "save",
    effects: effectId ? [{ _id: effectId, onSave: false }] : [],
    range: { value: rangeFt, units: "ft", special: "", override: false },
    target: {
      template: {
        ...emptyTemplate(),
        type: template.type,
        size: String(template.size),
        units: "ft",
      },
      affects: { count: "", type: "creature", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    midiProperties: midiProperties(identifier, {
      autoTargetAction: "always",
      confirmTargets: "never",
    }),
    save: {
      ability: [save.ability],
      dc: { calculation: "", formula: String(save.dc) },
    },
  };

  if (damage) {
    const parsed = parseDice(damage.dice);
    activity.damage = {
      parts: [
        {
          number: parsed.custom ? null : parsed.number,
          denomination: parsed.custom ? 0 : parsed.denomination,
          types: [damage.type],
          custom: { enabled: parsed.custom, formula: parsed.custom ? parsed.formula : "" },
          scaling: { mode: "", number: null },
          bonus: "",
        },
      ],
      onSave: damage.onSave ?? "half",
    };
  }

  return activity;
}

function makePlaceTemplateActivity({
  activityId,
  name,
  img,
  rangeFt,
  template,
  identifier,
  consumeUses = true,
}) {
  return {
    ...baseActivityFields({
      activityId,
      name,
      img,
      chatFlavor: `${name} — place ${template.size}-ft radius smoke (range ${rangeFt} ft). Heavily obscured.`,
      consumeUses,
    }),
    type: "utility",
    effects: [],
    range: { value: rangeFt, units: "ft", special: "", override: false },
    target: {
      template: {
        ...emptyTemplate(),
        type: template.type,
        size: String(template.size),
        units: "ft",
      },
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    midiProperties: midiProperties(identifier),
  };
}

function makeAttackActivity({
  activityId,
  effectId,
  name,
  img,
  rangeFt,
  identifier,
  tranqRoll = false,
}) {
  const activity = {
    ...baseActivityFields({
      activityId,
      name,
      img,
      chatFlavor: tranqRoll
        ? `${name} — ranged improvised attack (range ${rangeFt} ft). On hit roll 5d8 for capture threshold.`
        : `${name} — ranged improvised attack (range ${rangeFt} ft).`,
      consumeUses: true,
    }),
    type: "attack",
    effects: effectId ? [{ _id: effectId }] : [],
    range: { value: rangeFt, units: "ft", special: "", override: false },
    target: {
      template: emptyTemplate(),
      affects: { count: "1", type: "creature", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    midiProperties: midiProperties(identifier),
    attack: {
      ability: "dex",
      bonus: "",
      critical: { threshold: null },
      flat: false,
      type: { value: "ranged", classification: "weapon" },
    },
    damage: {
      critical: { bonus: "" },
      includeBase: false,
      parts: [],
    },
  };

  if (tranqRoll) {
    activity.roll = {
      formula: "5d8",
      name: "Tranq Threshold",
      prompt: false,
      visible: true,
    };
  }

  return activity;
}

function buildBombItem(raw, sort, catalogState) {
  const bombKey = raw?._raintdm?.bombKey;
  const def = bombKey ? BOMB_DEFS[bombKey] : null;
  if (!def) {
    console.warn(`  skip unknown bombKey: ${bombKey}`);
    return null;
  }

  const identifier = slugify(raw.name);
  const itemId = stableId(`items-forge:bomb:${bombKey}:item`);
  const img = resolveImg(def.img, catalogState);
  const description = `${entriesToHtml(raw.entries)}${craftingFooter(raw.crafting)}`;

  const activities = {};
  const effects = [];
  let sortAct = 0;

  const pushEffect = (suffix, effectName, seconds, changes, statuses) => {
    const effectId = stableId(`items-forge:bomb:${bombKey}:effect:${suffix}`);
    effects.push(
      makeEffect({
        effectId,
        name: effectName,
        img,
        description: `<p>${escapeHtml(effectName)}. Repeat the save at the end of each turn if the rules say so.</p>`,
        durationSeconds: seconds,
        changes: changes ?? [],
        statuses: statuses ?? [],
      }),
    );
    return effectId;
  };

  if (def.kind === "saveAoE") {
    const effectId = pushEffect(
      "main",
      def.effectName,
      def.effectSeconds,
      def.changes,
      def.statuses,
    );
    const activityId = stableId(`items-forge:bomb:${bombKey}:activity:throw`);
    activities[activityId] = makeSaveAoEActivity({
      activityId,
      effectId,
      name: def.activityName,
      img,
      rangeFt: def.rangeFt,
      template: def.template,
      save: def.save,
      identifier: `bomb-${bombKey}`,
    });
  } else if (def.kind === "saveDamage") {
    const activityId = stableId(`items-forge:bomb:${bombKey}:activity:ignite`);
    activities[activityId] = makeSaveAoEActivity({
      activityId,
      effectId: null,
      name: def.activityName,
      img,
      rangeFt: def.rangeFt,
      template: def.template,
      save: def.save,
      damage: def.damage,
      identifier: `bomb-${bombKey}`,
    });
  } else if (def.kind === "placeTemplate") {
    const activityId = stableId(`items-forge:bomb:${bombKey}:activity:throw`);
    activities[activityId] = makePlaceTemplateActivity({
      activityId,
      name: def.activityName,
      img,
      rangeFt: def.rangeFt,
      template: def.template,
      identifier: `bomb-${bombKey}`,
    });
  } else if (def.kind === "poisonSmoke") {
    const throwId = stableId(`items-forge:bomb:${bombKey}:activity:throw`);
    activities[throwId] = {
      ...makePlaceTemplateActivity({
        activityId: throwId,
        name: "Throw Poison Smoke",
        img,
        rangeFt: def.rangeFt,
        template: def.template,
        identifier: `bomb-${bombKey}-throw`,
        consumeUses: true,
      }),
      sort: sortAct,
    };
    sortAct += 100000;

    const effectId = pushEffect(
      "poison",
      def.effectName,
      def.effectSeconds,
      def.changes,
      def.statuses,
    );
    const gasId = stableId(`items-forge:bomb:${bombKey}:activity:gas`);
    activities[gasId] = {
      ...makeSaveAoEActivity({
        activityId: gasId,
        effectId,
        name: "Poison Gas (in cloud)",
        img,
        rangeFt: def.rangeFt,
        template: def.template,
        save: def.save,
        identifier: `bomb-${bombKey}-gas`,
        consumeUses: false,
      }),
      sort: sortAct,
      activation: {
        type: "special",
        value: null,
        condition: "Creature starts its turn in the smoke (or proxy check)",
        override: false,
      },
      consumption: {
        scaling: { allowed: false, max: "" },
        spellSlot: false,
        targets: [],
      },
    };
  } else if (def.kind === "attack" || def.kind === "attackTranq") {
    let effectId = null;
    if (def.kind === "attack" && def.effectName) {
      effectId = pushEffect(
        "main",
        def.effectName,
        def.effectSeconds,
        def.changes,
        def.statuses,
      );
    }
    const activityId = stableId(`items-forge:bomb:${bombKey}:activity:throw`);
    activities[activityId] = makeAttackActivity({
      activityId,
      effectId,
      name: def.activityName,
      img,
      rangeFt: def.rangeFt,
      identifier: `bomb-${bombKey}`,
      tranqRoll: def.kind === "attackTranq",
    });
  }

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
      rarity: "",
      identified: true,
      unidentified: { description: "", name: "Mysterious Bomb" },
      container: null,
      attunement: "",
      attuned: false,
      equipped: false,
      type: { value: "trinket", subtype: "" },
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
      properties: [],
      uses: { spent: 0, max: "1", recovery: [], autoDestroy: true },
      activities,
    },
    effects,
    folder: null,
    sort,
    ownership: { default: 0 },
    flags: {
      "amellwind-toolbox": {
        exportKind: "items-forge",
        resourceKind: "bomb",
        bombKey,
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

export function buildBombs() {
  const bombsFile = JSON.parse(fs.readFileSync(BOMBS_SRC, "utf8"));
  const items = Array.isArray(bombsFile.items) ? bombsFile.items : [];
  const catalogState = loadFoundryIconCatalog();
  if (!catalogState.catalog.length) {
    console.warn(
      `  ! Foundry icons not found at ${catalogState.iconsDir} — bomb imgs may be broken`,
    );
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let sort = 0;
  let written = 0;
  for (const raw of items) {
    const item = buildBombItem(raw, sort, catalogState);
    if (!item) continue;
    const outPath = path.join(OUT_DIR, filenameFor(raw.name));
    fs.writeFileSync(outPath, `${JSON.stringify(item, null, 2)}\n`);
    console.log("Wrote", path.relative(ROOT, outPath));
    sort += 100000;
    written += 1;
  }

  console.log(`Items Forge bombs: ${written}`);
  return written;
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) buildBombs();
