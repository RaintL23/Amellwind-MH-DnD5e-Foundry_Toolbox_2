/**
 * Builds Resource Node Foundry content:
 *   - fvtt-Item-resource-node.json
 *   - fvtt-Macro-resource-node-sync.json
 *
 * Run: node public/data/foundry-jsons-example/resource-node/build-resource-node.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";

const ITEM_ID = "ResNodeFeature01";
const CFG_ACTIVITY_ID = "ResNodeCfgAct01";
const GATHER_ACTIVITY_ID = "ResNodeGthAct01";
const MACRO_ID = "ResNodeSyncMac01";
const IMG = "icons/consumables/plants/herb-tied-bundle-green.webp";

const toMacroCommand = (src) => src.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");

const injectEngine = (src, engine) => {
  if (!src.includes("/* @@SYNC_ENGINE@@ */")) {
    throw new Error("Source is missing /* @@SYNC_ENGINE@@ */ placeholder");
  }
  return src.replace("/* @@SYNC_ENGINE@@ */", engine.trim());
};

const engineSrc = fs.readFileSync(path.join(__dirname, "resource-node-sync-engine.js"), "utf8");
const itemMacroSrc = injectEngine(
  fs.readFileSync(path.join(__dirname, "resource-node-item-macro.js"), "utf8"),
  engineSrc,
);
const syncMacroSrc = injectEngine(
  fs.readFileSync(path.join(__dirname, "resource-node-sync-macro.js"), "utf8"),
  engineSrc,
);

const description = `<p><strong>Resource Node</strong> — Amellwind field gathering for Foundry.</p>
<p>Place this feature on a prop actor (plant, mineral vein, fishing spot, etc.).
Put possible loot items in that actor's <strong>inventory</strong>, then use
<strong>Configure Resource Node</strong> (GM).</p>
<ul>
<li><strong>Interact:</strong> players double-click the token to gather (Items Pile–style UI).</li>
<li><strong>Harvest:</strong> category skill check vs DC + Amellwind tool rules.</li>
<li><strong>Loot:</strong> on success roll <em>1dN</em> over inventory stacks and copy 1 item to the PC.</li>
<li><strong>Attempts:</strong> one try per character (success or fail). GM can reset from Configure.</li>
</ul>
<p><em>Requires Midi QOL + Item Macro. Players double-click the token to gather (no ownership of the node required; PC token on the scene). GM: double-click (no PC) or Shift+double-click opens Configure; Alt+double-click opens the actor sheet.</em></p>`;

const makeUtilityActivity = ({ id, name, identifier, sort = 0 }) => ({
  _id: id,
  type: "utility",
  sort,
  name,
  img: IMG,
  activation: { type: "special", value: null, condition: "", override: false },
  consumption: {
    scaling: { allowed: false, max: "" },
    spellSlot: false,
    targets: [],
  },
  description: { chatFlavor: "" },
  duration: { value: "", units: "inst", concentration: false, override: false },
  effects: [],
  range: { value: null, units: "self", special: "", override: false },
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
    affects: { count: "", type: "self", choice: false, special: "" },
    prompt: false,
    override: false,
  },
  uses: { spent: 0, max: "", recovery: [] },
  midiProperties: {
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
    displayActivityName: false,
    rollMode: "selfroll",
    chooseEffects: false,
    toggleEffect: false,
    ignoreFullCover: false,
    removeChatButtons: "all",
    magicEffect: false,
    magicDamage: false,
    noConcentrationCheck: false,
    autoCEEffects: "none",
  },
  roll: { formula: "", name: "", prompt: false, visible: false },
  useConditionText: "",
  useConditionReason: "",
  effectConditionText: "",
});

const itemDoc = {
  _id: ITEM_ID,
  name: "Resource Node",
  type: "feat",
  img: IMG,
  system: {
    description: {
      value: description,
      chat: "",
    },
    source: {
      custom: "",
      book: "AGMH",
      page: "",
      license: "",
      rules: "2024",
      revision: 1,
    },
    identifier: "resource-node",
    type: { value: "feat", subtype: "" },
    requirements: "Place on a map resource actor (GM configures)",
    properties: [],
    activities: {
      [CFG_ACTIVITY_ID]: makeUtilityActivity({
        id: CFG_ACTIVITY_ID,
        name: "Configure Resource Node",
        identifier: "configure-resource-node",
        sort: 0,
      }),
      [GATHER_ACTIVITY_ID]: makeUtilityActivity({
        id: GATHER_ACTIVITY_ID,
        name: "Gather Resource",
        identifier: "gather-resource",
        sort: 1,
      }),
    },
    enchant: {},
    prerequisites: { level: null, repeatable: false },
    uses: { spent: 0, max: "", recovery: [] },
  },
  effects: [],
  folder: null,
  sort: 0,
  ownership: { default: 0 },
  flags: {
    dnd5e: { riders: { activity: [], effect: [] } },
    "midi-qol": {
      fumbleThreshold: null,
      rollAttackPerTarget: "default",
      removeAttackDamageButtons: "default",
      itemCondition: "",
      reactionCondition: "",
      otherCondition: "",
      effectCondition: "",
      onUseMacroName: "[preItemRoll]ItemMacro,[postActiveEffects]ItemMacro",
      onUseMacroParts: {
        items: [
          { macroName: "ItemMacro", option: "preItemRoll" },
          { macroName: "ItemMacro", option: "postActiveEffects" },
        ],
      },
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
        name: "Resource Node",
        type: "script",
        scope: "global",
        author: "",
        img: "icons/svg/oak.svg",
        command: toMacroCommand(itemMacroSrc),
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
    world: {
      resourceNode: {
        isFeature: true,
        enabled: true,
        category: "Plants",
        dc: 10,
        requireTool: true,
        interactionDistance: 5,
        attemptedBy: [],
      },
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

const macroDoc = {
  _id: MACRO_ID,
  name: "Resource Node Sync",
  type: "script",
  img: IMG,
  command: toMacroCommand(syncMacroSrc),
  folder: null,
  sort: 0,
  ownership: { default: 0 },
  flags: {
    world: {
      resourceNode: {
        syncMacro: true,
      },
    },
  },
  _stats: {
    coreVersion: CORE_VERSION,
    systemId: SYSTEM_ID,
    systemVersion: SYSTEM_VERSION,
  },
};

fs.writeFileSync(path.join(__dirname, "fvtt-Item-resource-node.json"), `${JSON.stringify(itemDoc, null, 2)}\n`);
fs.writeFileSync(path.join(__dirname, "fvtt-Macro-resource-node-sync.json"), `${JSON.stringify(macroDoc, null, 2)}\n`);

console.log("Wrote fvtt-Item-resource-node.json");
console.log("Wrote fvtt-Macro-resource-node-sync.json");
