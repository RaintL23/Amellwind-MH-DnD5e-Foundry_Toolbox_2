/**
 * Builds Hidden Detection Foundry content:
 *   - fvtt-Item-hidden-detection.json
 *   - fvtt-Macro-hidden-detection-sync.json
 *
 * Run: node public/data/foundry-jsons-example/hidden-detect/build-hidden-detection.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";

const ITEM_ID = "HiddenDetectItm1";
const ACTIVITY_ID = "HiddenDetectCfg1";
const MACRO_ID = "HiddenDetectSync1";
const IMG = "mh-icons/mystery-item.webp";

const toMacroCommand = (src) => src.replace(/\r\n/g, "\n").replace(/\n/g, "\r\n");

const injectEngine = (src, engine) => {
  if (!src.includes("/* @@SYNC_ENGINE@@ */")) {
    throw new Error("Source is missing /* @@SYNC_ENGINE@@ */ placeholder");
  }
  return src.replace("/* @@SYNC_ENGINE@@ */", engine.trim());
};

const engineSrc = fs.readFileSync(path.join(__dirname, "hidden-detection-sync-engine.js"), "utf8");
const itemMacroSrc = injectEngine(
  fs.readFileSync(path.join(__dirname, "hidden-detection-item-macro.js"), "utf8"),
  engineSrc,
);
const syncMacroSrc = injectEngine(
  fs.readFileSync(path.join(__dirname, "hidden-detection-sync-macro.js"), "utf8"),
  engineSrc,
);

const description = `<p><strong>Hidden Detection</strong> — Baldur's Gate–style discovery for Foundry.</p>
<p>Place this feature on the <em>hidden object</em> actor. Hide the token from players,
then use <strong>Configure Hidden Detection</strong> (GM). Saving arms proximity sync
for the session — you do not need a separate macro first (the Sync macro is still
available for world-load automation).</p>
<ul>
<li><strong>Range:</strong> when a PC enters the aura, detection resolves.</li>
<li><strong>Mode:</strong> active skill check <em>or</em> Passive Perception vs DC.</li>
<li><strong>Passive mode:</strong> attempt whispers go to the GM only; players get a chat
message only when they successfully reveal the object.</li>
<li><strong>Fail lock:</strong> optional one-fail lockout per PC (GM configurable).</li>
<li><strong>Reveal:</strong> only the discoverer, or the whole party on first success.</li>
</ul>
<p><em>Requires Midi QOL + Item Macro. GM only for configuration.</em></p>`;

const makeUtilityActivity = () => ({
  _id: ACTIVITY_ID,
  type: "utility",
  sort: 0,
  name: "Configure Hidden Detection",
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
    identifier: "configure-hidden-detection",
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
  name: "Hidden Detection",
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
    identifier: "hidden-detection",
    type: { value: "feat", subtype: "" },
    requirements: "GM — place on the hidden object actor",
    properties: [],
    activities: {
      [ACTIVITY_ID]: makeUtilityActivity(),
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
        name: "Hidden Detection",
        type: "script",
        scope: "global",
        author: "",
        img: "icons/svg/eye.svg",
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
      hiddenDetect: {
        isFeature: true,
        enabled: true,
        rangeFt: 30,
        detectMode: "skillCheck",
        skill: "prc",
        dc: 15,
        wallsBlock: false,
        allowRetryOnFail: false,
        revealToParty: false,
        whisperToGm: true,
        revealed: false,
        revealedBy: null,
        failedBy: [],
        inRangeBy: {},
        visibleToUsers: [],
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
  name: "Hidden Detection Sync",
  type: "script",
  img: IMG,
  command: toMacroCommand(syncMacroSrc),
  folder: null,
  sort: 0,
  ownership: { default: 0 },
  flags: {
    world: {
      hiddenDetect: {
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

fs.writeFileSync(path.join(__dirname, "fvtt-Item-hidden-detection.json"), `${JSON.stringify(itemDoc, null, 2)}\n`);
fs.writeFileSync(path.join(__dirname, "fvtt-Macro-hidden-detection-sync.json"), `${JSON.stringify(macroDoc, null, 2)}\n`);

console.log("Wrote fvtt-Item-hidden-detection.json");
console.log("Wrote fvtt-Macro-hidden-detection-sync.json");
