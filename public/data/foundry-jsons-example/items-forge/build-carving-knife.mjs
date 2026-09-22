/**
 * Builds the Carving Knife Foundry Item (AGMH shop gear + Carving activity).
 *
 * Run: node public/data/foundry-jsons-example/items-forge/build-carving-knife.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";

const ITEM_ID = "CarvingKnifeItm01";
const ACTIVITY_ID = "CarvingAct000001";
const IMG = "mh-icons/throwing-knife.webp";

const macroSrc = fs.readFileSync(
  path.join(ROOT, "public", "data", "scripts", "items-forge", "carving-knife-item-macro.js"),
  "utf8",
);

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

function makeCarvingActivity() {
  return {
    _id: ACTIVITY_ID,
    type: "utility",
    sort: 0,
    name: "Carving",
    img: IMG,
    activation: {
      type: "action",
      value: 1,
      condition: "Target is dead, unconscious, or at 0 HP",
      override: false,
    },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: [],
    },
    description: {
      chatFlavor: "Carve a defeated creature within 5 feet for materials.",
    },
    duration: {
      value: "",
      units: "inst",
      concentration: false,
      override: false,
    },
    effects: [],
    range: { value: 5, units: "ft", special: "", override: false },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "",
        size: "",
        width: "",
        height: "",
        units: "ft",
      },
      affects: { count: "1", type: "creature", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midiProperties("carving"),
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
        _stats: {
          coreVersion: CORE_VERSION,
          systemId: SYSTEM_ID,
          systemVersion: SYSTEM_VERSION,
        },
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

const description = `<p>A hunter's <strong>Carving Knife</strong>. Allows the wielder to add their proficiency bonus to carve checks if they are not already proficient with the Survival skill.</p>
<p><strong>Carving.</strong> As an Action, choose a creature within 5 feet that is dead, unconscious, or at 0 hit points. Set the Carve DC and number of carves (or capture rolls), then resolve Dexterity (Survival) checks (Slay) or loot dice (Capture). Compare each loot d20 to the creature's Monster Hunter loot table.</p>
<p><em>Carve DC = 10 + ½ the creature's CR (rounded down). On a failed carve check, treat the loot roll as 1. Requires MidiQOL + Item Macro. The Amellwind module requests Survival rolls from the hunter's connected owner when available.</em></p>`;

const item = {
  _id: ITEM_ID,
  name: "Carving Knife",
  type: "consumable",
  img: IMG,
  system: {
    description: {
      value: description,
      chat: "<p><strong>Carving Knife</strong> — carve a defeated creature for materials.</p>",
    },
    source: {
      custom: "",
      book: "AGMH",
      page: "",
      license: "",
      rules: "2024",
      revision: 1,
    },
    identifier: "carving-knife",
    quantity: 1,
    weight: { value: 1, units: "lb" },
    price: { value: 50, denomination: "gp" },
    rarity: "",
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
    properties: [],
    uses: { spent: 0, max: "", recovery: [], autoDestroy: false },
    activities: {
      [ACTIVITY_ID]: makeCarvingActivity(),
    },
  },
  effects: [],
  folder: null,
  sort: 0,
  ownership: { default: 0 },
  flags: {
    "amellwind-toolbox": {
      exportKind: "items-forge",
      resourceKind: "gear",
      gearKey: "carving-knife",
    },
    world: {
      carvingKnife: { item: true },
    },
    ...midiItemacroFlags("Carving Knife", macroSrc),
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

const outDir = path.join(__dirname, "gear");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "fvtt-Item-carving-knife.json");
fs.writeFileSync(outPath, `${JSON.stringify(item, null, 2)}\n`);

console.log("Wrote", path.relative(ROOT, outPath));
console.log("macro bytes:", Buffer.byteLength(macroSrc, "utf8"));
