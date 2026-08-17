/**
 * One-shot builder for Heavy Bowgun (Uncommon) Foundry item + ammo stacks.
 * Run: node public/data/foundry-jsons-example/weapons-resources/ammo-hbg/generate-uncommon.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const macro = readFileSync(join(here, "heavy-bowgun-item-macro.js"), "utf8");

const id = (s) => s;

const midi = (identifier, extra = {}) => ({
  ignoreTraits: [],
  triggeredActivityId: extra.triggeredActivityId ?? "none",
  triggeredActivityConditionText: extra.triggeredActivityConditionText ?? "",
  triggeredActivityTargets: extra.triggeredActivityTargets ?? "targets",
  triggeredActivityRollAs: extra.triggeredActivityRollAs ?? "self",
  autoConsume: false,
  forceConsumeDialog: "default",
  forceRollDialog: "default",
  forceDamageDialog: "default",
  confirmTargets: "default",
  autoTargetType: "any",
  autoTargetAction: "default",
  automationOnly: extra.automationOnly ?? false,
  otherActivityCompatible: extra.otherActivityCompatible ?? true,
  identifier,
  displayActivityName: true,
  rollMode: "default",
  chooseEffects: false,
  toggleEffect: false,
  ignoreFullCover: false,
  removeChatButtons: "default",
  magicEffect: extra.magicEffect ?? false,
  magicDamage: extra.magicDamage ?? false,
  noConcentrationCheck: false,
  autoCEEffects: "default",
});

const ignoreTraits = {
  idi: false,
  idr: false,
  idv: false,
  ida: false,
};

const overTime = {
  saveRemoves: true,
  preRemoveConditionText: "",
  postRemoveConditionText: "",
};

const emptyTemplate = {
  count: "",
  contiguous: false,
  type: "",
  size: "",
  width: "",
  height: "",
  units: "ft",
};

const consumeMag = {
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
};

const noConsume = {
  scaling: { allowed: false, max: "" },
  spellSlot: false,
  targets: [],
};

const card = (border, titleColor, title, body, upgrades = []) => {
  const kids = upgrades
    .map(
      ([uBorder, uColor, uTitle, uBody]) =>
        `<div style="margin:0.45em 0 0.1em 0.35em;padding:0.4em 0.55em;border-left:2px solid ${uBorder};background:rgba(255,255,255,0.03);border-radius:0 3px 3px 0"><p>▸ Upgrade — <strong style="color:${uColor}">${uTitle}</strong></p>${uBody}</div>`,
    )
    .join("");
  return `<div style="margin:0.65em 0;padding:0.55em 0.7em;border-left:3px solid ${border};background:rgba(255,255,255,0.04);border-radius:0 4px 4px 0"><p><strong style="color:${titleColor}">${title}</strong></p>${body}${kids}</div>`;
};

const chatCard = (border, title, extras = "") =>
  `<div style="margin:0.4em 0;padding:0.35em 0.55em;border-left:3px solid ${border};background:rgba(255,255,255,0.04);border-radius:0 4px 4px 0"><p><strong style="color:#c0c0c0">${title}</strong></p>${extras}</div>`;

const GRAY = "#c0c0c0";
const GREEN = "#1eff00";

const descriptionValue = [
  "<p>Requires Attunement</p>",
  "<p>Ammo DC = 8 + your proficiency bonus + your Dexterity modifier</p>",
  "<hr><h3>Features</h3>",
  card(
    GRAY,
    GRAY,
    "Mastery (Slow)",
    "<p>If you hit a creature with this weapon and deal damage to it, you can reduce its Speed by 10 feet until the start of your next turn. If the creature is hit more than once by weapons that have this property, the Speed reduction doesn't exceed 10 feet.</p>",
  ),
  card(
    GREEN,
    GRAY,
    "Magazine",
    "<p>The weapon holds a maximum of 4 loaded rounds at a time. When the magazine reaches 0, you must reload it before you can fire again.</p>",
    [
      [
        GREEN,
        GREEN,
        "Magazine Upgrade I",
        "<p>Your magazine capacity increases to 6 rounds of standard ammunition (Normal, Pierce, or Spread).</p>",
      ],
    ],
  ),
  card(
    GRAY,
    GRAY,
    "Reload",
    "<p><strong>Action.</strong></p><p>You can fully reload your magazine using an Action or a Bonus Action. When you do so, you choose the type of ammunition the weapon will contain.</p>",
  ),
  card(
    GREEN,
    GREEN,
    "Ignition",
    "<p>Whenever you hit a creature with this weapon, you gain 1 Ignition (maximum 3). Ignition remains until you spend it and is not lost when the magazine is empty.</p>",
  ),
  card(
    GREEN,
    GREEN,
    "Wyvernheart",
    "<p><strong>Bonus Action.</strong></p><p>Spend 1 Ignition to make one additional attack with this weapon as a Bonus Action. If you already hit a creature with this weapon this turn, this extra attack deals an extra [[/r 1d6]] Piercing damage.</p>",
    [
      [
        GREEN,
        GREEN,
        "Wyvernheart Upgrade I",
        "<p>When you use Wyvernheart after already hitting a creature with this weapon this turn, the extra damage increases to [[/r 1d8]] Piercing.</p>",
      ],
    ],
  ),
  card(
    GREEN,
    GREEN,
    "Guard",
    "<p><strong>Reaction.</strong></p><p>When a creature you can see hits you with an attack while you are wielding this weapon, you can use your Reaction to roll [[/r 1d4]] and add it to your AC against that attack, potentially causing it to miss. You cannot use Guard on the same turn you used Wyvernheart.</p>",
  ),
  card(
    GREEN,
    GREEN,
    "Special Ammo",
    "<p>Due to barrel pressure limits, you can load a maximum of 2 Special Ammo rounds into the magazine during a reload. Once these are expended, you must reload to switch back to another ammunition type.</p>",
  ),
  "<h3>Ammunition</h3>",
  card(
    GRAY,
    GRAY,
    "Normal Ammo",
    "<p>Deals the weapon's base damage ([[/r 1d10]] Piercing) to a single target.</p>",
  ),
  card(
    GREEN,
    GREEN,
    "Pierce Ammo",
    "<p>You fire in a 40-foot line that is 5 feet wide. Make a single attack roll and compare it against the AC of each creature in that line. All creatures hit take the weapon's normal damage.</p>",
  ),
  card(
    GREEN,
    GREEN,
    "Spread Ammo",
    "<p>Instead of making an attack roll, you fire a 15-foot cone. Each creature in the cone must make a Dexterity saving throw against your Ammo DC. On a failed save, a creature takes [[/r 1d10]] Piercing damage.</p>",
  ),
  card(
    GREEN,
    GREEN,
    "Cluster Ammo",
    "<p>This ammo deals no weapon damage. On a hit, it explodes, dealing [[/r 2d6]] Fire damage to the target and each creature within 5 feet of it.</p>",
  ),
  card(
    GREEN,
    GREEN,
    "Recover Ammo",
    "<p>Instead of taking damage, a willing creature hit by this ammo regains [[/r 1d4]] hit points.</p>",
  ),
].join("");

const descriptionChat = [
  "<p>Requires Attunement</p>",
  "<p>Ammo DC = 8 + your proficiency bonus + your Dexterity modifier</p><hr>",
  chatCard(GRAY, "Mastery (Slow)"),
  chatCard(
    GREEN,
    "Magazine",
    '<p style="margin:0.2em 0 0 0.35em">▸ <strong style="color:#1eff00">Magazine Upgrade I</strong></p>',
  ),
  chatCard(GRAY, "Reload", "<p><strong>Action.</strong></p>"),
  chatCard(GREEN, "Ignition"),
  chatCard(
    GREEN,
    "Wyvernheart",
    '<p><strong>Bonus Action.</strong></p><p style="margin:0.2em 0 0 0.35em">▸ <strong style="color:#1eff00">Wyvernheart Upgrade I</strong></p>',
  ),
  chatCard(GREEN, "Guard", "<p><strong>Reaction.</strong></p>"),
  chatCard(GREEN, "Special Ammo"),
].join("");

const rangedAttack = {
  ability: "",
  bonus: "",
  critical: { threshold: null },
  flat: false,
  type: { value: "ranged", classification: "weapon" },
};

const includeBase = {
  critical: { bonus: "" },
  includeBase: true,
  parts: [],
};

const activities = {
  nrmlAmmo00000001: {
    _id: "nrmlAmmo00000001",
    type: "attack",
    sort: 0,
    name: "Normal Ammo",
    activation: { type: "action", value: 1, override: false },
    consumption: consumeMag,
    description: {},
    duration: { units: "inst", concentration: false, override: false },
    effects: [],
    range: { units: "self", override: false },
    target: {
      template: { contiguous: false, units: "ft" },
      affects: { choice: false },
      override: false,
      prompt: true,
    },
    uses: { spent: 0, recovery: [] },
    useConditionText: "",
    effectConditionText: "false",
    attack: rangedAttack,
    damage: includeBase,
    midiProperties: midi("normal-ammo"),
    macroData: { name: "", command: "" },
    ignoreTraits,
    isOverTimeFlag: false,
    overTimeProperties: overTime,
    otherActivityId: "",
    otherActivityUuid: "",
    attackMode: "oneHanded",
    ammunition: "",
    useConditionReason: "",
  },
  wyvrnHrt00000002: {
    _id: "wyvrnHrt00000002",
    sort: 200000,
    name: "Wyvernheart",
    img: "icons/weapons/ammunition/shot-round-red.webp",
    activation: {
      type: "bonus",
      value: 1,
      condition: "",
      override: false,
    },
    consumption: consumeMag,
    description: {
      chatFlavor:
        "Spend 1 Ignition. One extra attack; +1d8 piercing if you already hit with this weapon this turn.",
    },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: null, units: "", special: "", override: false },
    target: {
      template: emptyTemplate,
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midi("wyvernheart"),
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
    type: "attack",
    attack: rangedAttack,
    damage: includeBase,
    macroData: { name: "", command: "" },
    ignoreTraits,
    isOverTimeFlag: false,
    overTimeProperties: overTime,
    otherActivityId: "",
    otherActivityUuid: "",
    attackMode: "oneHanded",
    ammunition: "",
  },
  reldHbg000000003: {
    _id: "reldHbg000000003",
    sort: 400000,
    name: "Reload",
    activation: { type: "bonus", value: 1, condition: "", override: false },
    consumption: noConsume,
    description: {
      chatFlavor:
        "Fully reload magazine (also usable as an Action). Set spent uses to 0 for standard ammo, or to max − Special Ammo capacity when loading Special Ammo.",
    },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { units: "self", special: "", override: false },
    target: {
      template: emptyTemplate,
      affects: { count: "", type: "self", choice: false, special: "" },
      prompt: false,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midi("reload"),
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
    type: "utility",
    roll: { formula: "", name: "", prompt: false, visible: false },
    macroData: { name: "", command: "" },
    ignoreTraits,
    isOverTimeFlag: false,
    overTimeProperties: overTime,
    otherActivityId: "none",
  },
  gardHbg000000004: {
    _id: "gardHbg000000004",
    sort: 500000,
    name: "Guard",
    img: "icons/skills/melee/shield-block-gray-orange.webp",
    activation: {
      type: "reaction",
      value: 1,
      condition:
        "When a creature you can see hits you with an attack while you are wielding this weapon",
      override: false,
    },
    consumption: noConsume,
    description: {
      chatFlavor:
        "Add 1d4 to your AC against that attack. Cannot be used on a turn you used Wyvernheart.",
    },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { units: "self", special: "", override: false },
    target: {
      template: emptyTemplate,
      affects: { count: "", type: "self", choice: false, special: "" },
      prompt: false,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midi("guard"),
    type: "utility",
    roll: { formula: "1d4", name: "Guard", prompt: false, visible: true },
    macroData: { name: "", command: "" },
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
    ignoreTraits,
    isOverTimeFlag: false,
    overTimeProperties: overTime,
    otherActivityId: "none",
  },
  prceAmmo00000005: {
    _id: "prceAmmo00000005",
    type: "attack",
    sort: 600000,
    name: "Pierce Ammo",
    img: "",
    activation: { type: "action", value: 1, condition: "", override: false },
    consumption: consumeMag,
    description: {
      chatFlavor: "40-ft line (5 ft wide). One attack roll vs each creature in the line.",
    },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: "", units: "self", special: "", override: false },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "line",
        size: "40",
        width: "5",
        height: "",
        units: "ft",
      },
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midi("pierce-ammo", { otherActivityCompatible: false }),
    attack: rangedAttack,
    damage: includeBase,
    attackMode: "oneHanded",
    ammunition: "",
    otherActivityId: "none",
    otherActivityUuid: "",
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "false",
  },
  sprdAmmo00000006: {
    _id: "sprdAmmo00000006",
    type: "save",
    sort: 700000,
    name: "Spread Ammo",
    img: "",
    activation: { type: "action", value: 1, condition: "", override: false },
    consumption: consumeMag,
    description: {
      chatFlavor: "15-ft cone. Dexterity save vs Ammo DC; 1d10 piercing on a failed save.",
    },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: "", units: "self", special: "", override: false },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "cone",
        size: "15",
        width: "",
        height: "",
        units: "ft",
      },
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midi("spread-ammo", { otherActivityCompatible: false }),
    damage: {
      parts: [
        {
          number: 1,
          denomination: 10,
          types: ["piercing"],
          custom: { enabled: false, formula: "" },
          scaling: { mode: "", number: 1 },
          bonus: "",
        },
      ],
      onSave: "none",
    },
    save: {
      ability: ["dex"],
      dc: { calculation: "dex", formula: "" },
    },
    otherActivityId: "none",
    otherActivityUuid: "",
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
  },
  clstAmmo00000007: {
    _id: "clstAmmo00000007",
    type: "attack",
    sort: 800000,
    name: "Cluster Ammo",
    img: "",
    activation: { type: "action", value: 1, condition: "", override: false },
    consumption: consumeMag,
    description: {
      chatFlavor: "On hit: no weapon damage. 2d6 fire to the target and each creature within 5 feet.",
    },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: "", units: "self", special: "", override: false },
    target: {
      template: emptyTemplate,
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midi("cluster-ammo", {
      triggeredActivityId: "clstBrst00000008",
      triggeredActivityConditionText: "hits > 0",
      triggeredActivityTargets: "hit",
      otherActivityCompatible: true,
    }),
    attack: rangedAttack,
    damage: {
      critical: { bonus: "" },
      includeBase: false,
      parts: [],
    },
    attackMode: "oneHanded",
    ammunition: "",
    otherActivityId: "clstBrst00000008",
    otherActivityUuid: "",
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "false",
  },
  clstBrst00000008: {
    _id: "clstBrst00000008",
    type: "damage",
    sort: 810000,
    name: "Cluster Burst",
    activation: {
      type: "special",
      value: null,
      condition: "On hit with Cluster Ammo",
      override: false,
    },
    consumption: noConsume,
    description: {
      chatFlavor: "2d6 fire to the target and each creature within 5 feet (no save).",
    },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: "", units: "self", special: "", override: false },
    target: {
      template: {
        count: "",
        contiguous: false,
        type: "radius",
        size: "5",
        width: "",
        height: "",
        units: "ft",
      },
      affects: { count: "", type: "", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midi("cluster-burst", { automationOnly: true }),
    damage: {
      critical: { allow: false, bonus: "" },
      parts: [
        {
          number: 2,
          denomination: 6,
          types: ["fire"],
          custom: { enabled: false, formula: "" },
          scaling: { mode: "", number: 1 },
          bonus: "",
        },
      ],
    },
    otherActivityId: "none",
    otherActivityUuid: "",
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "",
    macroData: { name: "", command: "" },
    ignoreTraits,
    isOverTimeFlag: false,
    overTimeProperties: overTime,
  },
  rcvrAmmo00000009: {
    _id: "rcvrAmmo00000009",
    type: "heal",
    sort: 900000,
    name: "Recover Ammo",
    img: "",
    activation: {
      type: "action",
      value: 1,
      condition: "Willing creature",
      override: false,
    },
    consumption: consumeMag,
    description: { chatFlavor: "Willing creature regains 1d4 hit points." },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: "100", units: "ft", special: "", override: false },
    target: {
      template: emptyTemplate,
      affects: { count: "1", type: "creature", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: midi("recover-ammo", {
      otherActivityCompatible: false,
      magicEffect: false,
      magicDamage: false,
    }),
    healing: {
      number: 1,
      denomination: 4,
      types: ["healing"],
      custom: { enabled: false, formula: "" },
      scaling: { mode: "", number: 1 },
      bonus: "",
    },
    otherActivityId: "none",
    otherActivityUuid: "",
    useConditionText: "",
    useConditionReason: "",
    effectConditionText: "false",
  },
};

const weapon = {
  _id: "HvyBgnUncmmn0001",
  name: "Heavy Bowgun (Uncommon)",
  type: "weapon",
  img: "mh-icons/weapon_heavybowgun.webp",
  system: {
    source: {
      custom: "",
      book: "RAINTDM",
      page: "",
      license: "",
      rules: "2024",
      revision: 1,
    },
    description: {
      value: descriptionValue,
      chat: descriptionChat,
    },
    identifier: "heavybowgun",
    quantity: 1,
    weight: { value: 18, units: "lb" },
    price: { value: 50, denomination: "gp" },
    attuned: false,
    attunement: "required",
    equipped: false,
    rarity: "uncommon",
    identified: true,
    type: { value: "martialR", baseItem: "heavybowgun" },
    damage: {
      base: {
        number: 1,
        denomination: 10,
        types: ["piercing"],
        custom: { enabled: false },
        scaling: { number: 1, mode: "" },
        bonus: "",
      },
      versatile: {
        number: null,
        denomination: null,
        types: [],
        custom: { enabled: false },
        scaling: { number: 1 },
      },
    },
    magicalBonus: null,
    properties: ["amm", "hvy", "two"],
    proficient: null,
    range: { value: 100, long: 400, reach: null, units: "ft" },
    mastery: "slow",
    ammunition: { type: "" },
    armor: { value: null },
    uses: { spent: 0, recovery: [], max: "6" },
    activities,
    container: null,
    cover: null,
    crewed: false,
    unidentified: { description: "" },
  },
  effects: [
    {
      _id: "hbgMstrySlow0001",
      name: "Mastery (Slow)",
      img: "systems/dnd5e/icons/svg/items/equipment.svg",
      description: "",
      changes: [],
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
      origin: null,
      transfer: true,
      statuses: [],
      type: "base",
      system: {},
      tint: "#ffffff",
      sort: 0,
      flags: {},
      _stats: {
        compendiumSource: null,
        duplicateSource: null,
        coreVersion: "12.331",
        systemId: "dnd5e",
        systemVersion: "4.4.4",
        createdTime: 1786122242801,
        modifiedTime: 1786122242801,
        lastModifiedBy: null,
      },
    },
  ],
  folder: null,
  sort: 100000,
  ownership: { default: 0 },
  flags: {
    "amellwind-toolbox": {
      baseWeaponName: "Heavy Bowgun",
      exportKind: "weapon-forge",
    },
    dnd5e: { riders: { activity: [], effect: [] } },
    "midi-qol": {
      onUseMacroName:
        "[preTargeting]ItemMacro,[postAttackRoll]ItemMacro,[preDamageRoll]ItemMacro",
      onUseMacroParts: {
        items: [
          { macroName: "ItemMacro", option: "preTargeting" },
          { macroName: "ItemMacro", option: "postAttackRoll" },
          { macroName: "ItemMacro", option: "preDamageRoll" },
        ],
      },
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
    exportSource: {
      world: "amellwind-toolbox",
      system: "dnd5e",
      coreVersion: "12.331",
      systemVersion: "4.4.4",
    },
    world: {
      hbg: {
        isHeavyBowgun: true,
        tier: "uncommon",
        specialAmmoMax: 2,
        ignitionMax: 3,
        ignition: 0,
        unlockedAmmo: ["normal", "pierce", "spread", "cluster", "recover"],
        loadedAmmoKey: null,
      },
    },
    itemacro: {
      macro: {
        _id: null,
        name: "Heavy Bowgun",
        type: "script",
        author: "",
        img: "icons/svg/dice-target.svg",
        scope: "global",
        command: macro,
        folder: null,
        sort: 0,
        ownership: { default: 0 },
        flags: {},
        _stats: {
          coreVersion: "12.331",
          systemId: "dnd5e",
          systemVersion: "4.4.4",
          createdTime: null,
          modifiedTime: null,
          lastModifiedBy: null,
        },
      },
    },
  },
  _stats: {
    compendiumSource: null,
    duplicateSource: null,
    coreVersion: "12.331",
    systemId: "dnd5e",
    systemVersion: "4.4.4",
    createdTime: 1786122242801,
    modifiedTime: 1786122242801,
    lastModifiedBy: null,
  },
};

const weaponsDir = join(here, "..", "..", "weapons");
writeFileSync(
  join(weaponsDir, "fvtt-Item-heavy-bowgun-uncommon.json"),
  `${JSON.stringify(weapon, null, 2)}\n`,
  "utf8",
);

function ammoItem({
  _id,
  name,
  identifier,
  ammoKey,
  isSpecial,
  quantity,
  price,
  valueHtml,
  chatHtml,
}) {
  return {
    _id,
    name,
    type: "consumable",
    img: "mh-icons/bowgun-ammo.webp",
    system: {
      description: { value: valueHtml, chat: chatHtml },
      source: {
        custom: "",
        book: "RAINTDM",
        page: "",
        license: "",
        rules: "2024",
        revision: 1,
      },
      identifier,
      quantity,
      weight: { value: 0.05, units: "lb" },
      price: { value: price, denomination: "gp" },
      rarity: "",
      identified: true,
      unidentified: { description: "", name: "Mysterious Ammo" },
      container: null,
      attunement: "",
      attuned: false,
      equipped: false,
      type: { value: "ammo", subtype: "bolt" },
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
      uses: { spent: 0, max: "1", recovery: [], autoDestroy: false },
      activities: {
        loadAmmoType0001: {
          _id: "loadAmmoType0001",
          type: "utility",
          sort: 0,
          name: "Load Ammo Type",
          img: "mh-icons/bowgun-ammo.webp",
          activation: {
            type: "special",
            value: null,
            condition: "When you Reload the Heavy Bowgun",
            override: false,
          },
          consumption: noConsume,
          description: {
            chatFlavor: `Choose ${name} when reloading the Heavy Bowgun magazine.`,
          },
          duration: {
            value: "",
            units: "inst",
            concentration: false,
            override: false,
          },
          effects: [],
          range: { value: null, units: "self", special: "", override: false },
          target: {
            template: emptyTemplate,
            affects: { count: "", type: "self", choice: false, special: "" },
            prompt: false,
            override: false,
          },
          uses: { spent: 0, max: "", recovery: [] },
          midiProperties: midi("load-ammo-type", {
            magicEffect: false,
            magicDamage: false,
          }),
          roll: { formula: "", name: "", prompt: false, visible: false },
          otherActivityId: "none",
        },
      },
    },
    effects: [],
    folder: null,
    sort: 0,
    ownership: { default: 0 },
    flags: {
      "amellwind-toolbox": {
        exportKind: "raintdm-ammo",
        baseWeaponName: "Heavy Bowgun",
      },
      world: {
        hbg: { isAmmo: true, ammoKey, isSpecial },
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
  };
}

const ammoDefs = [
  {
    file: "fvtt-Item-normal-ammo.json",
    _id: "hbgNrmlAmmo00001",
    name: "Normal Ammo",
    identifier: "normal-ammo",
    ammoKey: "normal",
    isSpecial: false,
    quantity: 20,
    price: 1,
    valueHtml:
      "<p><strong>Normal Ammo</strong> (Heavy Bowgun)</p><p>Deals the weapon's base damage ([[/r 1d10]] Piercing) to a single target. Loaded into the Magazine on Reload.</p>",
    chatHtml:
      "<p><strong>Normal Ammo</strong></p><p>Base weapon damage (1d10 piercing).</p>",
  },
  {
    file: "fvtt-Item-pierce-ammo.json",
    _id: "hbgPrcAmmo000002",
    name: "Pierce Ammo",
    identifier: "pierce-ammo",
    ammoKey: "pierce",
    isSpecial: false,
    quantity: 20,
    price: 2,
    valueHtml:
      "<p><strong>Pierce Ammo</strong> (Heavy Bowgun)</p><p>Fire in a 40-foot line that is 5 feet wide. Make a single attack roll vs each creature in the line. All creatures hit take the weapon's normal damage.</p>",
    chatHtml: "<p><strong>Pierce Ammo</strong></p><p>40-ft line (5 ft wide).</p>",
  },
  {
    file: "fvtt-Item-spread-ammo.json",
    _id: "hbgSprdAmmo00003",
    name: "Spread Ammo",
    identifier: "spread-ammo",
    ammoKey: "spread",
    isSpecial: false,
    quantity: 20,
    price: 3,
    valueHtml:
      "<p><strong>Spread Ammo</strong> (Heavy Bowgun)</p><p>15-foot cone. Each creature must make a Dexterity saving throw against your Ammo DC. On a failed save, a creature takes [[/r 1d10]] Piercing damage.</p>",
    chatHtml:
      "<p><strong>Spread Ammo</strong></p><p>15-ft cone, Dex save, 1d10 piercing.</p>",
  },
  {
    file: "fvtt-Item-cluster-ammo.json",
    _id: "hbgClstAmmo00004",
    name: "Cluster Ammo",
    identifier: "cluster-ammo",
    ammoKey: "cluster",
    isSpecial: true,
    quantity: 2,
    price: 5,
    valueHtml:
      "<p><strong>Cluster Ammo</strong> (Heavy Bowgun · Special)</p><p>Deals no weapon damage. On a hit, explodes for [[/r 2d6]] Fire damage to the target and each creature within 5 feet. Loaded into the Magazine on Reload (Special Ammo capacity).</p>",
    chatHtml:
      "<p><strong>Cluster Ammo</strong></p><p>2d6 fire burst, 5-ft radius (no save).</p>",
  },
  {
    file: "fvtt-Item-recover-ammo.json",
    _id: "hbgRcvrAmmo00005",
    name: "Recover Ammo",
    identifier: "recover-ammo",
    ammoKey: "recover",
    isSpecial: true,
    quantity: 4,
    price: 5,
    valueHtml:
      "<p><strong>Recover Ammo</strong> (Heavy Bowgun · Special)</p><p>Instead of taking damage, a willing creature hit by this ammo regains [[/r 1d4]] hit points. Loaded into the Magazine on Reload (Special Ammo capacity).</p>",
    chatHtml: "<p><strong>Recover Ammo</strong></p><p>Heal 1d4 HP (willing).</p>",
  },
];

for (const def of ammoDefs) {
  const { file, ...rest } = def;
  writeFileSync(
    join(here, file),
    `${JSON.stringify(ammoItem(rest), null, 2)}\n`,
    "utf8",
  );
}

void id;
console.log("Wrote Heavy Bowgun (Uncommon) weapon + 5 ammo stacks.");
