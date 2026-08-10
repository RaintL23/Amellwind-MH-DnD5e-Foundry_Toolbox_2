/**
 * Builds the Combo Crafting Foundry content from the app's Combo List data.
 *
 * Reads COMBO_TOOL_TABLES from src/features/combo/data/combo.data.ts (single
 * source of truth shared with the /combo screen), then writes:
 *   - combo-recipes.json           snapshot of the recipe tables
 *   - fvtt-Item-combo-crafting.json a dnd5e "feat" that any actor can receive;
 *                                   its Item Macro embeds the recipe data + UI.
 *
 * Run: node public/data/foundry-jsons-example/combo-crafting/build-combo-craft-item.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");
const COMBO_DATA = path.join(ROOT, "src", "features", "combo", "data", "combo.data.ts");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";

// Deterministic 16-char ids so rebuilds update the pack in place (no churn).
const ITEM_ID = "ComboCraftItem01";
const ACTIVITY_ID = "ComboCraftAct001";
const IMG = "mh-icons/book.webp";

/** Extract a top-level exported array literal from a TS source file via bracket matching. */
function extractArrayLiteral(src, exportName) {
  const marker = `export const ${exportName}`;
  const start = src.indexOf(marker);
  if (start === -1) throw new Error(`Could not find "${exportName}" in ${COMBO_DATA}`);
  const eq = src.indexOf("=", start);
  const open = src.indexOf("[", eq);
  let depth = 0;
  let inStr = null;
  let end = -1;
  for (let i = open; i < src.length; i += 1) {
    const c = src[i];
    if (inStr) {
      if (c === inStr && src[i - 1] !== "\\") inStr = null;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      inStr = c;
      continue;
    }
    if (c === "[") depth += 1;
    else if (c === "]") {
      depth -= 1;
      if (depth === 0) {
        end = i + 1;
        break;
      }
    }
  }
  if (end === -1) throw new Error(`Unbalanced brackets while parsing "${exportName}"`);
  const literal = src.slice(open, end);
  // The literal is a plain JS array of object literals (no functions / refs).
  // eslint-disable-next-line no-eval
  return eval(literal);
}

const source = fs.readFileSync(COMBO_DATA, "utf8");
const tables = extractArrayLiteral(source, "COMBO_TOOL_TABLES");

// Normalise to the shape the macro expects.
const recipes = tables.map((t) => ({
  id: t.id,
  toolName: t.toolName,
  hasCategory: Boolean(t.hasCategory),
  rows: (t.rows ?? []).map((r) => ({
    category: r.category ?? "",
    name: r.name,
    item1: r.item1 ?? "",
    item2: r.item2 ?? "",
    dc: r.dc ?? "",
    quantity: r.quantity ?? "",
  })),
}));

const recipesOut = path.join(__dirname, "combo-recipes.json");
fs.writeFileSync(recipesOut, JSON.stringify(recipes, null, 2));

// Inject the recipe table into the macro source.
const macroSrc = fs.readFileSync(path.join(__dirname, "combo-craft-item-macro.js"), "utf8");
const injection = `const COMBO_RECIPES = ${JSON.stringify(recipes)};`;
if (!macroSrc.includes("/* @@COMBO_RECIPES@@ */")) {
  throw new Error("combo-craft-item-macro.js is missing the /* @@COMBO_RECIPES@@ */ placeholder");
}
const command = macroSrc.replace("/* @@COMBO_RECIPES@@ */", injection);

const makeUtilityActivity = ({ id, name, identifier, chatFlavor, condition = "" }) => ({
  _id: id,
  type: "utility",
  sort: 0,
  name,
  img: IMG,
  activation: { type: "action", value: 1, condition, override: false },
  consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [] },
  description: { chatFlavor },
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
  },
  roll: { formula: "", name: "", prompt: false, visible: false },
  useConditionText: "",
  useConditionReason: "",
  effectConditionText: "",
});

const makeMidiItemacroFlags = (macroName, macroCommand) => ({
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
      command: macroCommand,
      folder: null,
      sort: 0,
      ownership: { default: 0 },
      flags: {},
      _stats: { coreVersion: CORE_VERSION, systemId: SYSTEM_ID, systemVersion: SYSTEM_VERSION },
    },
  },
});

const totalRecipes = recipes.reduce((n, t) => n + t.rows.length, 0);

const description = `<p><strong>Combo Crafting</strong> — the Monster Hunter combo list, on your sheet.</p>
<p>Activate this feature to open the crafting panel. Pick a tool you own, choose a
recipe you have the ingredients for, select an ability score, and craft. The panel
stays open so you can keep crafting.</p>
<p><strong>Crafting Check:</strong> 1d20 + ability modifier + your proficiency bonus
(only if you are proficient with the tool) + Combo Book bonus (+1 per distinct Combo
Book volume you carry, max +5).</p>
<ul>
<li><strong>Success:</strong> both ingredients are consumed and the item is crafted.</li>
<li><strong>Fail by 5 or less:</strong> only one ingredient (your choice) is consumed.</li>
<li><strong>Fail by 6 or more:</strong> both ingredients are consumed.</li>
</ul>
<p><em>Only tools you carry in your inventory appear. Recipes whose ingredients you
lack are greyed out. The crafted item must exist on your sheet, in the world, or in a
compendium (import the Amellwind items first).</em></p>
<p><em>Requires MidiQOL + Item Macro. ${totalRecipes} recipes across ${recipes.length} tools.</em></p>`;

const item = {
  _id: ITEM_ID,
  name: "Combo Crafting",
  type: "feat",
  img: IMG,
  system: {
    description: {
      value: description,
      chat: "<p>Opens the Combo Crafting panel.</p>",
    },
    source: {
      custom: "",
      book: "AGMH",
      page: "",
      license: "",
      rules: "2024",
      revision: 1,
    },
    identifier: "combo-crafting",
    type: { value: "feat", subtype: "" },
    requirements: "A crafting tool in your inventory",
    properties: [],
    activities: {
      [ACTIVITY_ID]: makeUtilityActivity({
        id: ACTIVITY_ID,
        name: "Open Combo Crafting",
        identifier: "combo-crafting",
        chatFlavor: "Open the Combo Crafting panel.",
        condition: "",
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
    ...makeMidiItemacroFlags("Combo Crafting", command),
    world: { comboCrafting: { feature: true } },
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

const itemOut = path.join(__dirname, "fvtt-Item-combo-crafting.json");
fs.writeFileSync(itemOut, JSON.stringify(item, null, 2));

console.log("Wrote", recipesOut);
console.log("Wrote", itemOut);
console.log(`tools: ${recipes.length}, recipes: ${totalRecipes}`);
console.log("macro bytes:", Buffer.byteLength(command, "utf8"));
