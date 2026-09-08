/**
 * Builds AGMH Siege Weapon Foundry Items (Dragonator, Dragonrazer, Large Boulder).
 * Source: Guide to Monster Hunting `object[]` (objectType SW).
 *
 * Output: `items-forge/siege-weapons/fvtt-Item-*.json`
 * Pack: Amellwind MH (RaintDM) → Items Forge → Siege Weapons
 *
 * Run: node public/data/foundry-jsons-example/items-forge/build-siege-weapons.mjs
 * (also invoked from build-items-forge.mjs)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../../../..");
const OUT_DIR = path.join(__dirname, "siege-weapons");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";

const ITEM_IDS = {
  dragonator: "DragonatorItem01",
  dragonrazer: "DragonrazerItem0",
  "large-boulder": "LargeBoulderItm1",
};

const ACTIVITY_IDS = {
  dragonatorAtk: "DragAtkAct000001",
  dragonrazerLoad: "DrazLoadAct00001",
  dragonrazerAim: "DrazAimAct000001",
  dragonrazerFire: "DrazFireAct00001",
  dragonrazerBoom: "DrazBoomAct00001",
  boulderDrop: "BoulderDropAct01",
};

const IMG = {
  dragonator: "icons/weapons/polearms/spear-flared-steel.webp",
  dragonrazer: "icons/weapons/artillery/cannon-engraved-gold.webp",
  "large-boulder": "icons/commodities/stone/ore-pile-grey.webp",
};

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function midiProps(identifier, extra = {}) {
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
    ...extra,
  };
}

function emptyUses() {
  return { spent: 0, max: "", recovery: [] };
}

function damagePart(number, denomination, type, bonus = "") {
  return {
    number,
    denomination,
    types: [type],
    custom: { enabled: false, formula: "" },
    scaling: { mode: "", number: 1 },
    bonus,
  };
}

function activation(type, value = 1, condition = "") {
  return { type, value, condition, override: false };
}

function consumption() {
  return { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [] };
}

function rangeBlock(value = null, units = "ft", special = "", long = null) {
  return {
    value,
    long,
    units,
    special,
    override: false,
  };
}

function targetBlock({
  templateType = "",
  templateSize = "",
  affectsType = "",
  affectsCount = "",
  prompt = true,
} = {}) {
  return {
    template: {
      count: "",
      contiguous: false,
      type: templateType,
      size: templateSize,
      width: "",
      height: "",
      units: "ft",
    },
    affects: {
      count: affectsCount,
      type: affectsType,
      choice: false,
      special: "",
    },
    prompt,
    override: false,
  };
}

function objectStatsHtml({ size, ac, hp, immunities }) {
  const immune = immunities.map((entry) => escapeHtml(entry)).join("; ");
  return `<p><strong>Size</strong> ${escapeHtml(size)}; <strong>Armor Class</strong> ${escapeHtml(String(ac))}; <strong>Hit Points</strong> ${escapeHtml(String(hp))}</p>
<p><strong>Damage Immunities</strong> ${immune}</p>`;
}

function wrapItem({ id, name, img, identifier, description, chat, activities, effects = [], sort, page }) {
  return {
    _id: id,
    name,
    type: "weapon",
    img,
    system: {
      description: { value: description, chat },
      source: {
        custom: "",
        book: "AGMH",
        page: page ? String(page) : "",
        license: "",
        rules: "2014",
        revision: 1,
      },
      identifier,
      quantity: 1,
      weight: { value: 0, units: "lb" },
      price: { value: 0, denomination: "gp" },
      rarity: "",
      identified: true,
      unidentified: { description: "", name: "Mysterious Siege Engine" },
      container: null,
      attunement: "",
      attuned: false,
      equipped: false,
      type: { value: "martialR", baseItem: "" },
      ability: "",
      damage: {
        base: {
          number: null,
          denomination: null,
          types: [],
          custom: { enabled: false, formula: "" },
          scaling: { mode: "", number: null },
          bonus: "",
        },
        versatile: {
          number: null,
          denomination: null,
          types: [],
          custom: { enabled: false, formula: "" },
          scaling: { number: 1 },
        },
      },
      magicalBonus: null,
      properties: ["siege", "two"],
      proficient: null,
      range: { value: null, long: null, reach: null, units: "ft" },
      mastery: "",
      ammunition: { type: "" },
      armor: { value: null },
      uses: { spent: 0, max: "", recovery: [], autoDestroy: false },
      activities,
    },
    effects,
    folder: null,
    sort,
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
      "amellwind-toolbox": {
        exportKind: "items-forge",
        resourceKind: "siege-weapon",
        siegeKey: identifier,
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

function attackActivity({
  id,
  name,
  identifier,
  img,
  attackType,
  bonus,
  parts,
  range,
  target,
  chatFlavor,
  sort = 0,
}) {
  return {
    _id: id,
    type: "attack",
    sort,
    name,
    img,
    activation: activation("action", 1, ""),
    consumption: consumption(),
    description: { chatFlavor },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range,
    target,
    uses: emptyUses(),
    midiProperties: midiProps(identifier),
    attack: {
      ability: "",
      bonus: String(bonus),
      critical: { threshold: null },
      flat: true,
      type: { value: attackType, classification: "weapon" },
    },
    damage: {
      critical: { bonus: "" },
      includeBase: false,
      parts,
    },
  };
}

function saveActivity({
  id,
  name,
  identifier,
  img,
  saveAbility,
  saveDc,
  parts,
  onSave = "half",
  range,
  target,
  chatFlavor,
  effects = [],
  effectConditionText = "",
  sort = 0,
  midiExtra = {},
}) {
  return {
    _id: id,
    type: "save",
    sort,
    name,
    img,
    activation: activation("action", 1, ""),
    consumption: consumption(),
    description: { chatFlavor },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects,
    range,
    target,
    uses: emptyUses(),
    midiProperties: midiProps(identifier, {
      forceRollDialog: "always",
      ...midiExtra,
    }),
    damage: { parts, onSave },
    save: {
      ability: Array.isArray(saveAbility) ? saveAbility : [saveAbility],
      dc: { calculation: "", formula: String(saveDc) },
    },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText,
  };
}

function utilityActivity({ id, name, identifier, img, chatFlavor, sort = 0 }) {
  return {
    _id: id,
    type: "utility",
    sort,
    name,
    img,
    activation: activation("action", 1, ""),
    consumption: consumption(),
    description: { chatFlavor },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: rangeBlock(null, "self"),
    target: targetBlock({ affectsType: "self", prompt: false }),
    uses: emptyUses(),
    midiProperties: midiProps(identifier),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  };
}

function makeProneEffect(id) {
  return {
    _id: id,
    name: "Prone",
    img: "systems/dnd5e/icons/svg/statuses/prone.svg",
    type: "base",
    origin: null,
    duration: { rounds: null, startTime: null, seconds: null, combat: null, turns: null, startRound: null, startTurn: null },
    disabled: false,
    transfer: false,
    statuses: ["prone"],
    changes: [],
    description: "Knocked prone by a falling boulder.",
    tint: "#ffffff",
    flags: {},
  };
}

function buildDragonator() {
  const img = IMG.dragonator;
  const description = `${objectStatsHtml({
    size: "Large",
    ac: 25,
    hp: 100,
    immunities: [
      "poison",
      "psychic",
      "all damage that isn't siege damage",
    ],
  })}
<p>A Dragonator is any powered melee system that deploys massive spikes used to damage monsters. They are regularly installed in strategic locations to help in battle with large monsters. Dragonators consist of at least three pieces: the machinery, the weapon, and the control unit. Little is known about the machinery, other than the fact that it uses pressurized steam to launch the weapon. The steam is provided by a coal-fed fire.</p>
<p>The weapon itself consists of two massive rod-like objects, which are separated by 5 feet of space between them, and propelled by the steam at high velocities outward striking any creature in a 15-foot line in front of them. A Huge or larger creature can be hit by both rods, while a Large or smaller creature can only be hit by one.</p>
<p>Default damage uses iron spears (<strong>3d6</strong> piercing). Complex spinning drills deal <strong>10d10</strong> piercing instead — edit the Attack activity damage if your table uses drills. On a miss, the creature takes half damage.</p>
<p><em>Source: AGMH p.83</em></p>`;

  return wrapItem({
    id: ITEM_IDS.dragonator,
    name: "Dragonator",
    img,
    identifier: "dragonator",
    page: 83,
    sort: 0,
    description,
    chat: "<p><strong>Dragonator</strong> — melee siege spikes, +12 to hit, 15 ft line.</p>",
    activities: {
      [ACTIVITY_IDS.dragonatorAtk]: attackActivity({
        id: ACTIVITY_IDS.dragonatorAtk,
        name: "Dragonator",
        identifier: "dragonator",
        img,
        attackType: "melee",
        bonus: 12,
        parts: [damagePart(3, 6, "piercing")],
        range: rangeBlock(null, "ft", "", null),
        target: targetBlock({
          templateType: "line",
          templateSize: "15",
          affectsType: "creature",
        }),
        chatFlavor:
          "Dragonator (+12). Reach 15 ft line. Miss: half damage. Huge+ can be hit by both rods.",
      }),
    },
  });
}

function buildDragonrazer() {
  const img = IMG.dragonrazer;
  const description = `${objectStatsHtml({
    size: "Large",
    ac: 19,
    hp: 100,
    immunities: [
      "poison",
      "psychic",
      "all damage that isn't siege damage",
    ],
  })}
<p>A Dragonrazer is a large cannon that uses dragonrazer fuel cells to propel a large explosive harpoon through the air at destructive speeds.</p>
<p>A dragonrazer is supported on a large swiveling metal platform. Before it can be fired, the dragonrazer must be loaded with two fuel cells (75 lbs each) and aimed. It takes one action to load each full cell, one action to aim it, and one action to fire it.</p>
<p><strong>Fire:</strong> +8 to hit, range 150/600 ft., one target. Hit: 27 (5d10) piercing damage and the harpoon explodes. Miss: the harpoon lands 1d8 spaces away in a random direction, then explodes. Creatures in a 20-foot-radius sphere make a DC 15 Dexterity saving throw, taking 28 (8d6) fire damage on a failed save, or half as much on a success.</p>
<p>Use <strong>Load Fuel Cell</strong> twice, then <strong>Aim</strong>, then <strong>Fire</strong>. Resolve the explosion with <strong>Harpoon Explosion</strong>.</p>
<p><em>Source: AGMH p.83</em></p>`;

  return wrapItem({
    id: ITEM_IDS.dragonrazer,
    name: "Dragonrazer",
    img,
    identifier: "dragonrazer",
    page: 83,
    sort: 100000,
    description,
    chat: "<p><strong>Dragonrazer</strong> — load ×2, aim, fire (+8 / 5d10), then explosion (DC 15 Dex, 8d6 fire).</p>",
    activities: {
      [ACTIVITY_IDS.dragonrazerLoad]: utilityActivity({
        id: ACTIVITY_IDS.dragonrazerLoad,
        name: "Load Fuel Cell",
        identifier: "load-fuel-cell",
        img,
        chatFlavor: "Load one dragonrazer fuel cell (75 lb). Two cells required before firing.",
        sort: 0,
      }),
      [ACTIVITY_IDS.dragonrazerAim]: utilityActivity({
        id: ACTIVITY_IDS.dragonrazerAim,
        name: "Aim",
        identifier: "aim-dragonrazer",
        img,
        chatFlavor: "Aim the Dragonrazer (required after loading, before Fire).",
        sort: 100000,
      }),
      [ACTIVITY_IDS.dragonrazerFire]: attackActivity({
        id: ACTIVITY_IDS.dragonrazerFire,
        name: "Fire",
        identifier: "fire-dragonrazer",
        img,
        attackType: "ranged",
        bonus: 8,
        parts: [damagePart(5, 10, "piercing")],
        range: rangeBlock(150, "ft", "", 600),
        target: targetBlock({
          affectsType: "creature",
          affectsCount: "1",
        }),
        chatFlavor:
          "Dragonrazer Fire (+8). Hit: harpoon explodes at target. Miss: lands 1d8 spaces away, then explodes. Use Harpoon Explosion.",
        sort: 200000,
      }),
      [ACTIVITY_IDS.dragonrazerBoom]: saveActivity({
        id: ACTIVITY_IDS.dragonrazerBoom,
        name: "Harpoon Explosion",
        identifier: "harpoon-explosion",
        img,
        saveAbility: "dex",
        saveDc: 15,
        parts: [damagePart(8, 6, "fire")],
        onSave: "half",
        range: rangeBlock(null, "ft"),
        target: targetBlock({
          templateType: "sphere",
          templateSize: "20",
          affectsType: "creature",
        }),
        chatFlavor: "Harpoon Explosion — DC 15 Dexterity, 20-ft sphere, 8d6 fire (half on save).",
        sort: 300000,
        midiExtra: {
          autoTargetAction: "always",
          confirmTargets: "never",
        },
      }),
    },
  });
}

function buildLargeBoulder() {
  const img = IMG["large-boulder"];
  const proneId = "BoulderProneFx001";
  const description = `${objectStatsHtml({
    size: "Varies",
    ac: "—",
    hp: "—",
    immunities: ["poison", "psychic"],
  })}
<p>A large boulder might be hanging from a large group of vines far overhead, or a chunk of the mountain side. In an arena, the boulder might be held above the arena floor by ropes and pulleys. The boulder doesn't necessarily have to be a boulder — it could be an ancient tree trunk or part of a building that comes toppling down.</p>
<p>The boulder can be knocked loose by attacking it, by a lever, or some other way to release it as a trap.</p>
<p>Any creature under the boulder when it hits the ground must make a DC 15 Dexterity saving throw or take 22 (4d10) bludgeoning damage and be knocked prone on a failed save. On a successful save, the creature takes half as much damage, is not knocked prone, and is pushed into an unoccupied space adjacent to the boulder.</p>
<p><em>Source: AGMH p.83</em></p>`;

  return wrapItem({
    id: ITEM_IDS["large-boulder"],
    name: "Large Boulder",
    img,
    identifier: "large-boulder",
    page: 83,
    sort: 200000,
    description,
    chat: "<p><strong>Large Boulder</strong> — DC 15 Dexterity, 4d10 bludgeoning; prone on a failed save.</p>",
    effects: [makeProneEffect(proneId)],
    activities: {
      [ACTIVITY_IDS.boulderDrop]: saveActivity({
        id: ACTIVITY_IDS.boulderDrop,
        name: "Falling Boulder",
        identifier: "falling-boulder",
        img,
        saveAbility: "dex",
        saveDc: 15,
        parts: [damagePart(4, 10, "bludgeoning")],
        onSave: "half",
        range: rangeBlock(null, "ft"),
        target: targetBlock({
          templateType: "cube",
          templateSize: "10",
          affectsType: "creature",
        }),
        chatFlavor:
          "Falling Boulder — DC 15 Dexterity. Fail: full damage + prone. Success: half damage, pushed to an adjacent space.",
        effects: [{ _id: proneId, onSave: false }],
        effectConditionText: "failedSave",
        midiExtra: {
          autoTargetAction: "always",
          confirmTargets: "never",
        },
      }),
    },
  });
}

export function buildSiegeWeapons() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const items = [
    { file: "fvtt-Item-dragonator.json", item: buildDragonator() },
    { file: "fvtt-Item-dragonrazer.json", item: buildDragonrazer() },
    { file: "fvtt-Item-large-boulder.json", item: buildLargeBoulder() },
  ];

  for (const { file, item } of items) {
    const outPath = path.join(OUT_DIR, file);
    fs.writeFileSync(outPath, `${JSON.stringify(item, null, 2)}\n`);
    console.log("Wrote", path.relative(ROOT, outPath));
  }

  console.log(`Items Forge siege weapons: ${items.length}`);
  return items.length;
}

const isDirectRun = process.argv[1]
  ? path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
  : false;

if (isDirectRun) {
  buildSiegeWeapons();
}
