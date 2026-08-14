/**
 * Builds Items Forge Foundry items from `public/data/raintdm-items/traps.json`.
 *
 * Magazines already ship in `weapons-resources/magazines/` (Dual Repeaters).
 * This pack is the hunter-trap catalog (Trap Tool + Pitfall / Shock / +).
 *
 * Run: node public/data/foundry-jsons-example/items-forge/build-items-forge.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");
const TRAPS_SRC = path.join(ROOT, "public", "data", "raintdm-items", "traps.json");
const OUT_DIR = path.join(__dirname, "traps");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";

const ITEM_IDS = {
  tool: "TrapToolItem0001",
  pitfall: "PitfallTrap00001",
  "pitfall-plus": "PitfallTrapPlus01",
  shock: "ShockTrapItem001",
  "shock-plus": "ShockTrapPlus001",
};

const ACTIVITY_IDS = {
  set: "SetTrapAct000001",
  retrieve: "RetrvTrapAct0001",
};

const IMGS = {
  tool: "mh-icons/trap-tool.webp",
  pitfall: "mh-icons/trap-pitfall.webp",
  "pitfall-plus": "mh-icons/trap-pitfall.webp",
  shock: "icons/magic/lightning/bolt-strike-blue.webp",
  "shock-plus": "icons/magic/lightning/bolt-strike-blue.webp",
};

const TRAP_AUTOMATION = {
  pitfall: {
    family: "pitfall",
    isPlus: false,
    saveAbility: "str",
    saveDc: 14,
    sizeMode: "hugeOrSmaller",
    durationMode: "start",
    lightning: null,
  },
  "pitfall-plus": {
    family: "pitfall",
    isPlus: true,
    saveAbility: "str",
    saveDc: 16,
    sizeMode: "hugeOrSmaller",
    durationMode: "end",
    lightning: null,
  },
  shock: {
    family: "shock",
    isPlus: false,
    saveAbility: "con",
    saveDc: 14,
    sizeMode: "largeOrLarger",
    durationMode: "start",
    lightning: null,
  },
  "shock-plus": {
    family: "shock",
    isPlus: true,
    saveAbility: "con",
    saveDc: 16,
    sizeMode: "largeOrLarger",
    durationMode: "end",
    lightning: "2d8",
  },
};

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
  return `<p><em>Craft (10 minutes, Combo List): ${escapeHtml(crafting.tool)} — ${escapeHtml(crafting.item1)} + ${escapeHtml(crafting.item2)} DC ${escapeHtml(String(crafting.dc))}${qty}.</em></p>`;
}

function cpToGp(value) {
  const cp = Number(value) || 0;
  return cp / 100;
}

function midiProperties(identifier, { displayName = true } = {}) {
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
    displayActivityName: displayName,
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

function emptyTarget(prompt = false) {
  return {
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
    prompt,
    override: false,
  };
}

function makeSetActivity(img) {
  return {
    _id: ACTIVITY_IDS.set,
    type: "utility",
    sort: 0,
    name: "Set Trap",
    img,
    activation: { type: "action", value: 1, condition: "", override: false },
    consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [] },
    description: { chatFlavor: "Set a camouflaged 10-foot-square hunter trap within 5 feet." },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: 5, units: "ft", special: "", override: false },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "square",
        size: "10",
        width: "",
        height: "",
        units: "ft",
      },
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midiProperties("set-trap"),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  };
}

function makeRetrieveActivity(img) {
  return {
    _id: ACTIVITY_IDS.retrieve,
    type: "utility",
    sort: 100000,
    name: "Retrieve Trap",
    img,
    activation: { type: "action", value: 1, condition: "Unused trap within 5 feet", override: false },
    consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [] },
    description: { chatFlavor: "Retrieve an unused hunter trap within 5 feet." },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: 5, units: "ft", special: "", override: false },
    target: emptyTarget(false),
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midiProperties("retrieve-trap"),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  };
}

function midiItemacroFlags(macroName, command) {
  return {
    dnd5e: { riders: { activity: [], effect: [] } },
    "midi-qol": {
      fumbleThreshold: null,
      rollAttackPerTarget: "default",
      removeAttackDamageButtons: "default",
      itemCondition: "",
      reactionCondition: "",
      otherCondition: "",
      effectCondition: "",
      onUseMacroName: "[postActiveEffects]ItemMacro",
      onUseMacroParts: { items: [{ macroName: "ItemMacro", option: "postActiveEffects" }] },
    },
    midiProperties: {
      autoFailFriendly: false,
      autoSaveFriendly: false,
      magicdam: false,
      magiceffect: false,
      noConcentrationCheck: false,
      toggleEffect: false,
      ignoreTotalCover: false,
    },
    itemacro: {
      macro: {
        name: macroName,
        type: "script",
        scope: "global",
        author: "",
        img: "icons/svg/dice-target.svg",
        command,
        folder: null,
        sort: 0,
        ownership: { default: 0 },
        flags: {},
        _stats: { coreVersion: CORE_VERSION, systemId: SYSTEM_ID, systemVersion: SYSTEM_VERSION },
      },
    },
    exportSource: {
      world: "amellwind-toolbox",
      system: SYSTEM_ID,
      coreVersion: CORE_VERSION,
      systemVersion: SYSTEM_VERSION,
    },
  };
}

function physicalSystem({ name, identifier, rarity, valueCp, weight, description, activities }) {
  const gp = cpToGp(valueCp);
  return {
    description: {
      value: description,
      chat: `<p><strong>${escapeHtml(name)}</strong></p>`,
    },
    source: {
      custom: "",
      book: "RAINTDM",
      page: "",
      license: "",
      rules: "2024",
      revision: 1,
    },
    identifier,
    quantity: 1,
    weight: { value: Number(weight) || 0, units: "lb" },
    price: { value: gp, denomination: "gp" },
    rarity: rarity && rarity !== "none" && rarity !== "common" ? rarity : "",
    identified: true,
    unidentified: { description: "", name: "Mysterious Hunter Gear" },
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
    properties: rarity && rarity !== "none" && rarity !== "common" ? ["mgc"] : [],
    uses: { spent: 0, max: "", recovery: [], autoDestroy: false },
    activities,
  };
}

function wrapItem({ id, name, img, system, flags, sort }) {
  return {
    _id: id,
    name,
    type: "consumable",
    img,
    system,
    effects: [],
    folder: null,
    sort,
    ownership: { default: 0 },
    flags,
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

const trapsFile = JSON.parse(fs.readFileSync(TRAPS_SRC, "utf8"));
const items = Array.isArray(trapsFile.items) ? trapsFile.items : [];
const macroSrc = fs.readFileSync(path.join(__dirname, "hunter-traps-item-macro.js"), "utf8");

fs.mkdirSync(OUT_DIR, { recursive: true });

let sort = 0;
for (const raw of items) {
  const trapKey = raw?._raintdm?.trapKey;
  const id = ITEM_IDS[trapKey];
  if (!id) {
    console.warn(`  skip unknown trapKey: ${trapKey}`);
    continue;
  }
  const img = IMGS[trapKey] ?? "icons/sundries/misc/trap.webp";
  const identifier = slugify(raw.name);
  const description = `${entriesToHtml(raw.entries)}${craftingFooter(raw.crafting)}`;
  const isTool = trapKey === "tool";
  const automation = TRAP_AUTOMATION[trapKey];

  const activities = {};
  if (!isTool) {
    activities[ACTIVITY_IDS.set] = makeSetActivity(img);
    activities[ACTIVITY_IDS.retrieve] = makeRetrieveActivity(img);
  }

  const item = wrapItem({
    id,
    name: raw.name,
    img,
    sort,
    system: physicalSystem({
      name: raw.name,
      identifier,
      rarity: raw.rarity,
      valueCp: raw.value,
      weight: raw.weight,
      description,
      activities,
    }),
    flags: {
      "amellwind-toolbox": {
        exportKind: "items-forge",
        resourceKind: "trap",
        trapKey,
      },
      world: {
        hunterTrap: isTool
          ? { trapKey: "tool", isComponent: true }
          : { trapKey, isTrap: true, ...automation },
      },
      ...(isTool ? {} : midiItemacroFlags(raw.name, macroSrc)),
    },
  });

  const outPath = path.join(OUT_DIR, filenameFor(raw.name));
  fs.writeFileSync(outPath, `${JSON.stringify(item, null, 2)}\n`);
  console.log("Wrote", path.relative(ROOT, outPath));
  sort += 100000;
}

console.log(`Items Forge traps: ${items.length}`);
