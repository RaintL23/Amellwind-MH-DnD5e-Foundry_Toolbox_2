/**
 * Builds fvtt-Actor-felyne-cook.json from Rank 1 meals, Daily Skills, macros, and kitchen aura.
 * Run: node public/data/foundry-jsons-example/cooking-features/build-felyne-cook-actor.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rankDir = path.join(__dirname, "rank-1");
const dailyDir = path.join(__dirname, "daily-skills");
const outPath = path.join(__dirname, "fvtt-Actor-felyne-cook.json");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";
// Foundry DOCUMENT_OWNERSHIP_LEVELS.OBSERVER — players need item data for the meal menu.
const CONST_PLAYER_OWNERSHIP = 2;

const FELYNE_IMG = "icons/creatures/mammals/humanoid-cat-skulking-teal.webp";
const KITCHEN_IMG = "icons/environment/settlement/tavern.webp";

const randomId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < 16; i += 1) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

const read = (name) => fs.readFileSync(path.join(__dirname, name), "utf8");

const auraHooks = read("felyne-cook-aura-hooks.fragment.js");
const playerFlow = read("felyne-cook-player-flow.fragment.js");
const syncEngine = read("felyne-cook-sync-engine.js");
const refreshAuraMacro = read("felyne-cook-refresh-aura-item-macro.js").replace(
  "/* @@AURA_HOOKS@@ */",
  `${auraHooks}\n\n${syncEngine}`,
);
const kitchenSyncMacro = read("felyne-cook-kitchen-sync-macro.js")
  .replace("/* @@PLAYER_FLOW@@ */", playerFlow)
  .replace("/* @@SYNC_ENGINE@@ */", syncEngine)
  .replace("/* @@AURA_HOOKS@@ */", auraHooks);

// Do NOT inject syncEngine here — it redeclares const RANGE_FT / measureDistanceFt
// and breaks MidiQOL Item Macro validation. Token hooks come from the module script.
const gmMacroCommand = read("felyne-cook-item-macro.js")
  .replace("/* @@AURA_HOOKS@@ */", auraHooks)
  .replace("/* @@PLAYER_FLOW_JSON@@ */ \"\"", JSON.stringify(playerFlow));

// Append IIFE sync engine so using Ask also arms double-click on this client
// (safe: no outer const collisions with ask-item-macro).
const askMacroCommand = read("felyne-cook-ask-item-macro.js")
  .replace("/* @@AURA_HOOKS@@ */", auraHooks)
  .replace("/* @@PLAYER_FLOW_BODY@@ */", `${playerFlow}\n\n${syncEngine}`);

const effectMacroGrant = `
if (!game.user.isGM) return;
if (game.users.activeGM && game.users.activeGM.id !== game.user.id) return;
if (!actor || actor.type !== "character") return;
if (actor.items.some(i => foundry.utils.getProperty(i, "flags.world.cooking.playerRequest") === true)) return;

let cook = null;
try {
  const origin = effect?.origin ? await fromUuid(effect.origin) : null;
  if (origin?.documentName === "Actor") cook = origin;
  else if (origin?.documentName === "Item") cook = origin.actor ?? origin.parent ?? null;
  else if (origin?.documentName === "ActiveEffect") {
    const p = origin.parent;
    if (p?.documentName === "Actor") cook = p;
    else if (p?.documentName === "Item") cook = p.actor ?? p.parent ?? null;
  }
} catch (e) { cook = null; }

if (!cook) {
  cook = (canvas?.tokens?.placeables ?? []).find(t => foundry.utils.getProperty(t.actor, "flags.world.cooking.cookNpc") === true)?.actor ?? null;
}
if (!cook || cook.id === actor.id) return;
const template = cook.items.find(i => foundry.utils.getProperty(i, "flags.world.cooking.playerRequestTemplate") === true);
if (!template) return;

const data = template.toObject();
delete data._id;
data.name = "Ask for a Meal (Rank 1)";
data.effects = [];
foundry.utils.setProperty(data, "flags.world.cooking.playerRequestTemplate", false);
foundry.utils.setProperty(data, "flags.world.cooking.playerRequest", true);
foundry.utils.setProperty(data, "flags.world.cooking.fromAura", true);
foundry.utils.setProperty(data, "flags.world.cooking.cookActorUuid", cook.uuid);
foundry.utils.setProperty(data, "system.identifier", "ask-for-a-meal-rank-1");
await actor.createEmbeddedDocuments("Item", [data]);
`.trim();

const effectMacroRevoke = `
if (!game.user.isGM) return;
if (game.users.activeGM && game.users.activeGM.id !== game.user.id) return;
if (typeof globalThis.__amellwindFelyneCookAura?.syncKitchenFeatures === "function") {
  await globalThis.__amellwindFelyneCookAura.syncKitchenFeatures({ notify: false });
  return;
}
if (!actor || actor.type !== "character") return;
const stillNear = actor.effects.some(ef => !ef.disabled && foundry.utils.getProperty(ef, "flags.world.cooking.isKitchenAura") === true);
if (stillNear) return;
const stale = actor.items.filter(i => foundry.utils.getProperty(i, "flags.world.cooking.fromAura") === true && foundry.utils.getProperty(i, "flags.world.cooking.playerRequest") === true);
if (stale.length) await actor.deleteEmbeddedDocuments("Item", stale.map(i => i.id));
`.trim();

const asTemplate = (item, sortBase) => {
  const data = structuredClone(item);
  data._id = randomId();
  data.folder = null;
  data.sort = sortBase;
  data.effects = (data.effects || []).map((ef) => ({
    ...ef,
    _id: randomId(),
    disabled: true,
    transfer: false,
    origin: null,
  }));
  data.flags = data.flags || {};
  data.flags.world = data.flags.world || {};
  data.flags.world.cooking = {
    ...(data.flags.world.cooking || {}),
    isTemplate: true,
  };
  delete data.flags.exportSource;
  return data;
};

const abilityBlock = (value) => ({
  value,
  proficient: 0,
  max: null,
  bonuses: { check: "", save: "" },
});

const makeUtilityActivity = ({ id, name, identifier, chatFlavor, condition = "" }) => ({
  _id: id,
  type: "utility",
  sort: 0,
  name,
  img: KITCHEN_IMG,
  activation: {
    type: "action",
    value: 1,
    condition,
    override: false,
  },
  consumption: {
    scaling: { allowed: false, max: "" },
    spellSlot: false,
    targets: [],
  },
  description: { chatFlavor },
  duration: {
    value: "",
    units: "inst",
    concentration: false,
    override: false,
  },
  effects: [],
  range: {
    value: null,
    units: "self",
    special: "",
    override: false,
  },
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
    affects: {
      count: "",
      type: "self",
      choice: false,
      special: "",
    },
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
  roll: {
    formula: "",
    name: "",
    prompt: false,
    visible: false,
  },
  useConditionText: "",
  useConditionReason: "",
  effectConditionText: "",
});

const makeMidiItemacroFlags = (macroName, command) => ({
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
    onUseMacroParts: {
      items: [{ macroName: "ItemMacro", option: "postActiveEffects" }],
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
        coreVersion: "12.331",
        systemId: "dnd5e",
        systemVersion: "4.4.4",
      },
    },
  },
});

const meals = fs
  .readdirSync(rankDir)
  .filter((f) => f.endsWith(".json"))
  .sort()
  .map((f, idx) =>
    asTemplate(JSON.parse(fs.readFileSync(path.join(rankDir, f), "utf8")), 100000 + idx * 1000),
  );

const dailies = fs
  .readdirSync(dailyDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => JSON.parse(fs.readFileSync(path.join(dailyDir, f), "utf8")))
  .sort(
    (a, b) =>
      Number(a.flags?.world?.cooking?.index ?? 0) - Number(b.flags?.world?.cooking?.index ?? 0),
  )
  .map((j, idx) => asTemplate(j, 200000 + idx * 1000));

const requestMealActivityId = randomId();
const requestMeal = {
  _id: randomId(),
  name: "Request Meal (Rank 1)",
  type: "feat",
  img: KITCHEN_IMG,
  system: {
    description: {
      value: `<p><strong>Request Meal (Rank 1)</strong> — GM handoff</p>
<ol>
<li><strong>Players:</strong> double-click the Felyne Cook token (within 10 ft) to open the camp kitchen menu.</li>
<li><strong>GM (optional):</strong> use this activity to hand off a complimentary cook-in to a nearby hunter.</li>
<li>Average three checks vs the meal DC. Success grants the meal feature; +4 / +8 → Daily Skills.</li>
</ol>
<p><em>Requires MidiQOL + Item Macro. Ask for a Meal remains available as a backup while in the kitchen aura.</em></p>`,
      chat: "<p>The Felyne Cook looks for a hunter within 10 feet.</p>",
    },
    source: {
      custom: "",
      book: "AGMH",
      page: "",
      license: "",
      rules: "2024",
      revision: 1,
    },
    identifier: "request-meal-rank-1",
    type: { value: "feat", subtype: "" },
    requirements: "Artisan Cooking (Rank 1)",
    properties: [],
    activities: {
      [requestMealActivityId]: makeUtilityActivity({
        id: requestMealActivityId,
        name: "Request Meal",
        identifier: "request-meal",
        chatFlavor: "Request a Rank 1 artisan meal from the Felyne Cook.",
        condition: "Speak with the Felyne Cook",
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
    ...makeMidiItemacroFlags("Request Meal (Rank 1)", gmMacroCommand),
    world: {
      cooking: {
        requestMeal: true,
        rank: 1,
      },
    },
  },
  _stats: {
    compendiumSource: null,
    duplicateSource: null,
    coreVersion: "12.331",
    systemId: "dnd5e",
    systemVersion: "4.4.4",
    createdTime: null,
    modifiedTime: null,
    lastModifiedBy: null,
  },
};

const askActivityId = randomId();
const askTemplate = {
  _id: randomId(),
  name: "Ask for a Meal (Rank 1) (Template)",
  type: "feat",
  img: KITCHEN_IMG,
  system: {
    description: {
      value: `<p><strong>Ask for a Meal (Rank 1)</strong></p>
<p><strong>Preferred:</strong> double-click the Felyne Cook token while within 10 feet to open the camp kitchen menu.</p>
<p>This feature is a backup while you remain in the kitchen aura. Request a Rank 1 meal for yourself (1 serving).</p>
<p><strong>Price:</strong> <strong>2 gp</strong> (paid when you confirm the order). If you cannot pay, the cook refuses the order.</p>
<p>Choose a meal, then assign ability scores to the three cooking steps chosen by the cook.</p>
<p><em>Granted automatically when you enter the Camp Kitchen Aura.</em></p>`,
      chat: "<p>Ask for a Rank 1 meal from the Felyne Cook (2 gp). Preferred: double-click the cook token.</p>",
    },
    source: {
      custom: "",
      book: "AGMH",
      page: "",
      license: "",
      rules: "2024",
      revision: 1,
    },
    identifier: "ask-for-a-meal-rank-1",
    type: { value: "feat", subtype: "" },
    requirements: "Within 10 ft of Felyne Cook",
    properties: [],
    activities: {
      [askActivityId]: makeUtilityActivity({
        id: askActivityId,
        name: "Ask for a Meal",
        identifier: "ask-for-a-meal-rank-1",
        chatFlavor: "Ask the Felyne Cook for a Rank 1 meal (2 gp).",
        condition: "Within 10 ft of the Felyne Cook",
      }),
    },
    enchant: {},
    prerequisites: { level: null, repeatable: false },
    uses: { spent: 0, max: "", recovery: [] },
  },
  effects: [],
  folder: null,
  sort: 5000,
  ownership: { default: 0 },
  flags: {
    ...makeMidiItemacroFlags("Ask for a Meal (Rank 1)", askMacroCommand),
    world: {
      cooking: {
        playerRequestTemplate: true,
        rank: 1,
      },
    },
  },
  _stats: {
    compendiumSource: null,
    duplicateSource: null,
    coreVersion: "12.331",
    systemId: "dnd5e",
    systemVersion: "4.4.4",
    createdTime: null,
    modifiedTime: null,
    lastModifiedBy: null,
  },
};

const kitchenAuraEffectId = randomId();
const refreshActivityId = randomId();
const kitchenAura = {
  _id: randomId(),
  name: "Camp Kitchen Aura",
  type: "feat",
  img: KITCHEN_IMG,
  system: {
    description: {
      value: `<p><strong>Camp Kitchen Aura (10 ft)</strong></p>
<p>Hunters within <strong>10 feet</strong> can <strong>double-click the Felyne Cook token</strong> to open the camp kitchen menu (Item Piles–style).</p>
<p>They also gain <strong>Ask for a Meal (Rank 1)</strong> on their sheet as a backup. Leaving the aura removes that feature.</p>
<p><strong>GM:</strong> after placing the cook, use <em>Refresh Kitchen Aura</em> once if PCs are already nearby. Shift+double-click / Alt+double-click opens the cook sheet.</p>
<p><em>Requires <strong>Active Auras</strong> for the visual/temp effect. Token interaction arms from the Amellwind module script (or Kitchen Sync).</em></p>`,
      chat: "<p>Kitchen aura: double-click the cook token (or Ask) for a Rank 1 meal.</p>",
    },
    source: {
      custom: "",
      book: "AGMH",
      page: "",
      license: "",
      rules: "2024",
      revision: 1,
    },
    identifier: "camp-kitchen-aura",
    type: { value: "feat", subtype: "" },
    requirements: "Felyne Cook",
    properties: [],
    activities: {
      [refreshActivityId]: makeUtilityActivity({
        id: refreshActivityId,
        name: "Refresh Kitchen Aura",
        identifier: "refresh-kitchen-aura",
        chatFlavor: "Refresh Ask for a Meal grants for hunters within 10 ft.",
        condition: "GM only",
      }),
    },
    enchant: {},
    prerequisites: { level: null, repeatable: false },
    uses: { spent: 0, max: "", recovery: [] },
  },
  effects: [
    {
      _id: kitchenAuraEffectId,
      name: "Camp Kitchen Aura (10 ft)",
      img: KITCHEN_IMG,
      type: "base",
      system: {},
      changes: [
        {
          key: "flags.world.cooking.nearFelyneCook",
          mode: 5,
          value: "1",
          priority: 20,
        },
      ],
      disabled: false,
      duration: {
        startTime: null,
        seconds: null,
        combat: null,
        rounds: null,
        turns: null,
        startRound: null,
        startTurn: null,
      },
      description:
        "You are near the Felyne Cook and can use Ask for a Meal (Rank 1).",
      origin: null,
      tint: "#ffffff",
      transfer: true,
      statuses: [],
      sort: 0,
      flags: {
        ActiveAuras: {
          isAura: true,
          aura: "Allies",
          radius: "10",
          alignment: "",
          type: "",
          customCheck: "",
          ignoreSelf: true,
          height: false,
          hidden: false,
          displayTemp: true,
          hostile: false,
          onlyOnce: false,
          wallsBlock: "system",
          statuses: [],
        },
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
        effectmacro: {
          onCreate: { script: effectMacroGrant },
          onDelete: { script: effectMacroRevoke },
        },
        world: {
          cooking: {
            isKitchenAura: true,
          },
        },
      },
      _stats: {
        coreVersion: "12.331",
        systemId: "dnd5e",
        systemVersion: "4.4.4",
        createdTime: null,
        modifiedTime: null,
        lastModifiedBy: null,
      },
    },
  ],
  folder: null,
  sort: 1000,
  ownership: { default: 0 },
  flags: {
    ...makeMidiItemacroFlags("Camp Kitchen Aura", refreshAuraMacro),
    world: {
      cooking: {
        isKitchenAuraItem: true,
        rank: 1,
      },
    },
  },
  _stats: {
    compendiumSource: null,
    duplicateSource: null,
    coreVersion: "12.331",
    systemId: "dnd5e",
    systemVersion: "4.4.4",
    createdTime: null,
    modifiedTime: null,
    lastModifiedBy: null,
  },
};

const actor = {
  _id: randomId(),
  name: "Felyne Cook",
  type: "npc",
  img: FELYNE_IMG,
  system: {
    abilities: {
      str: abilityBlock(8),
      dex: abilityBlock(14),
      con: abilityBlock(12),
      int: abilityBlock(10),
      wis: abilityBlock(14),
      cha: abilityBlock(16),
    },
    attributes: {
      ac: { flat: 12, calc: "flat", formula: "" },
      hp: {
        value: 22,
        max: 22,
        temp: 0,
        tempmax: 0,
        formula: "4d8+4",
      },
      init: { ability: "dex", bonus: "" },
      movement: {
        burrow: null,
        climb: null,
        fly: null,
        swim: null,
        walk: 30,
        units: "ft",
        hover: false,
      },
      attunement: { max: 3 },
      senses: {
        darkvision: 60,
        blindsight: 0,
        tremorsense: 0,
        truesight: 0,
        units: "ft",
        special: "",
      },
      spellcasting: "",
      exhaustion: 0,
      concentration: { ability: "" },
      death: { success: 0, failure: 0 },
      spell: { level: 0 },
    },
    details: {
      biography: {
        value: `<p>A cheerful Felyne artisan cook who keeps Rank 1 camp meals ready for hunters.</p>
<p><strong>Interact:</strong> players double-click this token (within 10 ft) to open the camp kitchen menu — same feel as Gather Resource nodes.</p>
<p><strong>Camp Kitchen Aura (10 ft):</strong> PCs in range also get <em>Ask for a Meal (Rank 1)</em> as a backup. GM: use <em>Refresh Kitchen Aura</em> once after placing the cook.</p>
<p><strong>GM:</strong> Shift+double-click or Alt+double-click opens the actor sheet. Request Meal can still hand off a complimentary cook-in.</p>
<p><em>Menus loaded: Rank 1 only. Daily Skills are inactive templates used for automatic grants.</em></p>`,
        public: "Double-click this Felyne cook for Rank 1 artisan meals at camp.",
      },
      alignment: "Neutral Good",
      race: "",
      type: {
        value: "humanoid",
        subtype: "Felyne",
        swarm: "",
        custom: "",
      },
      environment: "Camp / Settlement",
      cr: 0.125,
      spellLevel: 0,
      source: {
        custom: "",
        book: "AGMH",
        page: "",
        license: "",
        rules: "2024",
        revision: 1,
      },
      treasure: { value: [] },
    },
    traits: {
      size: "sm",
      di: { value: [], bypasses: [], custom: "" },
      dr: { value: [], bypasses: [], custom: "" },
      dv: { value: [], bypasses: [], custom: "" },
      ci: { value: [], custom: "" },
      languages: { value: ["common"], custom: "Felyne" },
    },
    currency: { pp: 0, gp: 2, ep: 0, sp: 15, cp: 0 },
    skills: {},
    tools: {},
    spells: {},
    bonuses: {
      mwak: { attack: "", damage: "" },
      rwak: { attack: "", damage: "" },
      msak: { attack: "", damage: "" },
      rsak: { attack: "", damage: "" },
      abilities: { check: "", save: "", skill: "" },
      spell: { dc: "" },
    },
    resources: {
      legact: { value: 0, max: 0 },
      legres: { value: 0, max: 0 },
      lair: { value: false, initiative: null, inside: false },
    },
  },
  prototypeToken: {
    name: "Felyne Cook",
    displayName: 20,
    actorLink: true,
    width: 1,
    height: 1,
    texture: {
      src: FELYNE_IMG,
      anchorX: 0.5,
      anchorY: 0.5,
      offsetX: 0,
      offsetY: 0,
      fit: "contain",
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      tint: "#ffffff",
      alphaThreshold: 0.75,
    },
    lockRotation: false,
    rotation: 0,
    alpha: 1,
    disposition: 1,
    displayBars: 40,
    bar1: { attribute: "attributes.hp" },
    bar2: { attribute: null },
    light: {
      negative: false,
      priority: 0,
      alpha: 0.5,
      angle: 360,
      bright: 0,
      color: null,
      coloration: 1,
      dim: 0,
      attenuation: 0.5,
      luminosity: 0.5,
      saturation: 0,
      contrast: 0,
      shadows: 0,
      animation: { type: null, speed: 5, intensity: 5, reverse: false },
      darkness: { min: 0, max: 1 },
    },
    sight: {
      enabled: true,
      range: 60,
      angle: 360,
      visionMode: "basic",
      color: null,
      attenuation: 0.1,
      brightness: 0,
      saturation: 0,
      contrast: 0,
    },
    detectionModes: [],
    // Player-readable marker so double-click works Item Piles–style without OWNER.
    flags: {
      world: {
        cooking: {
          cookNpc: true,
          isCookToken: true,
          enabled: true,
          kitchenAuraFt: 10,
          interactionDistance: 10,
          mealPriceGp: 2,
        },
      },
    },
    randomImg: false,
  },
  items: [kitchenAura, requestMeal, askTemplate, ...meals, ...dailies],
  effects: [],
  folder: null,
  sort: 0,
  // OBSERVER: players can resolve cook meals for double-click / Ask without OWNER.
  ownership: { default: CONST_PLAYER_OWNERSHIP },
  flags: {
    exportSource: {
      world: "amellwind-toolbox",
      system: "dnd5e",
      coreVersion: "12.331",
      systemVersion: "4.4.4",
    },
    world: {
      cooking: {
        cookNpc: true,
        isCookToken: true,
        enabled: true,
        ranks: [1],
        kitchenAuraFt: 10,
        interactionDistance: 10,
        mealPriceGp: 2,
      },
    },
  },
  _stats: {
    compendiumSource: null,
    duplicateSource: null,
    coreVersion: "12.331",
    systemId: "dnd5e",
    systemVersion: "4.4.4",
    createdTime: null,
    modifiedTime: null,
    lastModifiedBy: null,
  },
};

fs.writeFileSync(outPath, JSON.stringify(actor, null, 2));

const macroOutPath = path.join(__dirname, "fvtt-Macro-felyne-cook-kitchen-sync.json");
const macroDoc = {
  _id: randomId(),
  name: "Felyne Cook — Kitchen Sync",
  type: "script",
  img: FELYNE_IMG,
  command: kitchenSyncMacro,
  folder: null,
  sort: 0,
  ownership: { default: 0 },
  flags: {
    world: {
      cooking: {
        kitchenSyncMacro: true,
      },
    },
  },
  _stats: {
    coreVersion: "12.331",
    systemId: "dnd5e",
    systemVersion: "4.4.4",
  },
};
fs.writeFileSync(macroOutPath, JSON.stringify(macroDoc, null, 2));

console.log("Wrote", outPath);
console.log("Wrote", macroOutPath);
console.log(
  `items: ${actor.items.length} (aura + request + ask-template + ${meals.length} meals + ${dailies.length} daily)`,
);
console.log("gm macro bytes:", Buffer.byteLength(gmMacroCommand, "utf8"));
console.log("ask macro bytes:", Buffer.byteLength(askMacroCommand, "utf8"));
console.log("refresh macro bytes:", Buffer.byteLength(refreshAuraMacro, "utf8"));
if (!kitchenAura.effects[0].changes?.length) {
  console.warn("WARN: kitchen aura AE has no changes (Active Auras may skip it)");
}
if (!askMacroCommand.includes("Ask for a Meal") && !askMacroCommand.includes("ask-for-a-meal")) {
  console.warn("WARN: ask macro may not match new activity id");
}
