/**
 * Builds fvtt-Actor-dire-miralis.json (Gargantuan Elder Dragon boss).
 * Run: node public/data/foundry-jsons-example/monsters/build-dire-miralis-actor.mjs
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveFoundryMhTokenPath } from "../../../../scripts/mh-token-resolve.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "fvtt-Actor-dire-miralis.json");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";
const SOURCE = {
  custom: "Amellwind MH (RaintDM)",
  book: "RAINTDM",
  page: "",
  license: "",
  rules: "2024",
  revision: 1,
};

const ID_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const stableId = (seed) => {
  const hash = createHash("sha1").update(seed).digest();
  let id = "";
  for (let i = 0; i < 16; i += 1) id += ID_ALPHABET[hash[i] % ID_ALPHABET.length];
  return id;
};

const stats = () => ({
  compendiumSource: null,
  duplicateSource: null,
  coreVersion: CORE_VERSION,
  systemId: SYSTEM_ID,
  systemVersion: SYSTEM_VERSION,
  createdTime: null,
  modifiedTime: null,
  lastModifiedBy: null,
});

const midiProps = (identifier, extra = {}) => ({
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
});

const envelope = (activity) => ({
  macroData: { name: "", command: "" },
  ignoreTraits: { idi: false, idr: false, idv: false, ida: false },
  isOverTimeFlag: false,
  overTimeProperties: {
    saveRemoves: true,
    preRemoveConditionText: "",
    postRemoveConditionText: "",
  },
  otherActivityId: activity.type === "attack" ? "" : "none",
  ...(activity.type === "attack"
    ? { otherActivityUuid: "", attackMode: "oneHanded", ammunition: "" }
    : {}),
  useConditionText: activity.useConditionText ?? "",
  useConditionReason: activity.useConditionReason ?? "",
  effectConditionText: activity.effectConditionText ?? (activity.type === "attack" ? "false" : ""),
});

const wrapActivity = (activity) => ({ ...activity, ...envelope(activity) });

const itemMacroCommand = `// Dire Miralis — Item Macro dispatcher
// MidiQOL On Use: [postActiveEffects]ItemMacro
try {
  const api = globalThis.__amellwindDireMiralis;
  if (!api?.onUse) {
    ui.notifications?.warn("Dire Miralis automations are not armed. Enable the Amellwind MH (RaintDM) module.");
    return;
  }
  const payload = typeof args !== "undefined" ? args[0] : {};
  await api.onUse(payload);
} catch (err) {
  console.error("Dire Miralis | item macro", err);
}
`;

const midiItemacroFlags = (macroName) => ({
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
    toggleEffect: false,
    ignoreTotalCover: false,
    noConcentrationCheck: false,
  },
  itemacro: {
    macro: {
      name: macroName,
      type: "script",
      scope: "global",
      author: "",
      img: "icons/svg/dice-target.svg",
      command: itemMacroCommand,
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
});

const scorchingMidiFlags = () => {
  const flags = midiItemacroFlags("Scorching Hide");
  flags["midi-qol"].reactionCondition = "isHit && meleeAttack";
  flags["midi-qol"].onUseMacroName = "";
  flags["midi-qol"].onUseMacroParts = { items: [] };
  delete flags.itemacro;
  return flags;
};

const emptyUses = () => ({ spent: 0, max: "", recovery: [] });
const dayUses = (max) => ({
  spent: 0,
  max: String(max),
  recovery: [{ period: "day", type: "recoverAll", formula: "" }],
});
const rechargeUses = (formula) => ({
  spent: 0,
  max: "1",
  recovery: [{ period: "recharge", type: "recoverAll", formula }],
});

const damagePart = (number, denomination, type, bonus = "") => ({
  number,
  denomination,
  types: [type],
  custom: { enabled: false, formula: "" },
  scaling: { mode: "", number: 1 },
  bonus,
});

const targetBlock = ({
  templateType = "",
  templateSize = "",
  templateCount = "",
  affectsType = "",
  affectsCount = "",
  prompt = true,
} = {}) => ({
  template: {
    count: templateCount,
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
});

const rangeBlock = (value, units = "ft", special = "") => {
  if (units === "self" && (value === null || value === undefined || value === "")) {
    return { units: "self", special, override: false };
  }
  return { value: value ?? null, units, special, override: false };
};

const activation = (type, value = 1, condition = "") => ({
  type,
  value: type === "special" ? null : value,
  condition,
  override: false,
});

const consumption = (targets = []) => ({
  scaling: { allowed: false, max: "" },
  spellSlot: false,
  targets,
});

const consumeLegendary = (n) => [
  { type: "attribute", target: "resources.legact.value", value: String(n), scaling: { mode: "", formula: "" } },
];
const consumeItemUses = (n = "1") => [
  { type: "itemUses", target: "", value: String(n), scaling: { mode: "", formula: "" } },
];

const daeFlags = (extra = {}) => ({
  enableCondition: "",
  selfTarget: false,
  selfTargetAlways: false,
  stackable: "noneName",
  showIcon: true,
  durationExpression: "",
  specialDuration: [],
  disableIncapacitated: false,
  dontApply: false,
  ...extra,
});

const makeEffect = ({
  id,
  name,
  img,
  description = "",
  changes = [],
  disabled = false,
  transfer = true,
  statuses = [],
  kind,
  extraFlags = {},
}) => ({
  _id: id,
  name,
  img,
  type: "base",
  system: {},
  changes,
  disabled,
  duration: {
    startTime: null,
    seconds: null,
    combat: null,
    rounds: null,
    turns: null,
    startRound: null,
    startTurn: null,
  },
  description,
  origin: null,
  tint: "#ffffff",
  transfer,
  statuses,
  sort: 0,
  flags: {
    dae: daeFlags(),
    world: { direMiralis: { kind } },
    ...extraFlags,
  },
  _stats: stats(),
});

const makeFeat = ({
  seed,
  name,
  img,
  identifier,
  description,
  chat = "",
  role,
  activities = {},
  effects = [],
  uses = emptyUses(),
  requirements = "",
  withMacro = false,
  extraFlags = {},
  extraMidi = {},
  sort = 0,
}) => {
  const flags = withMacro ? midiItemacroFlags(name) : {
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
      toggleEffect: false,
      ignoreTotalCover: false,
      noConcentrationCheck: false,
    },
    ...extraMidi,
  };
  return {
    _id: stableId(`dire-miralis::item::${seed}`),
    name,
    type: "feat",
    img,
    system: {
      description: { value: description, chat },
      source: SOURCE,
      identifier,
      type: { value: "monster", subtype: "" },
      requirements,
      properties: [],
      activities,
      enchant: {},
      prerequisites: { level: null, repeatable: false },
      uses,
    },
    effects,
    folder: null,
    sort,
    ownership: { default: 0 },
    flags: {
      ...flags,
      world: { direMiralis: { role } },
      ...extraFlags,
    },
    _stats: stats(),
  };
};

const saveActivity = ({
  id,
  name,
  identifier,
  activationType,
  activationValue = 1,
  condition = "",
  img,
  range,
  target,
  saveAbility,
  saveDc,
  parts,
  onSave = "half",
  uses = emptyUses(),
  consume = [],
  effects = [],
  useConditionText = "",
  useConditionReason = "",
  effectConditionText = "",
  sort = 0,
  midiExtra = {},
}) =>
  wrapActivity({
    _id: id,
    type: "save",
    sort,
    name,
    img,
    activation: activation(activationType, activationValue, condition),
    consumption: consumption(consume),
    description: { chatFlavor: name },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects,
    range,
    target,
    uses,
    midiProperties: midiProps(identifier, midiExtra),
    damage: { parts, onSave },
    save: {
      ability: Array.isArray(saveAbility) ? saveAbility : [saveAbility],
      dc: { calculation: "", formula: String(saveDc) },
    },
    useConditionText,
    useConditionReason,
    effectConditionText,
  });

const attackActivity = ({
  id,
  name,
  identifier,
  activationType = "action",
  img,
  attackValue,
  ability,
  parts,
  includeBase = false,
  range,
  target,
  consume = [],
  uses = emptyUses(),
  sort = 0,
}) =>
  wrapActivity({
    _id: id,
    type: "attack",
    sort,
    name,
    img,
    activation: activation(activationType, 1, ""),
    consumption: consumption(consume),
    description: { chatFlavor: name },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range,
    target,
    uses,
    midiProperties: midiProps(identifier),
    attack: {
      ability,
      bonus: "",
      critical: { threshold: null },
      flat: false,
      type: { value: attackValue, classification: "weapon" },
    },
    damage: {
      critical: { bonus: "" },
      includeBase,
      parts,
    },
  });

const utilityActivity = ({
  id,
  name,
  identifier,
  activationType,
  activationValue = 1,
  condition = "",
  img,
  range,
  target,
  consume = [],
  uses = emptyUses(),
  useConditionText = "",
  useConditionReason = "",
  sort = 0,
}) =>
  wrapActivity({
    _id: id,
    type: "utility",
    sort,
    name,
    img,
    activation: activation(activationType, activationValue, condition),
    consumption: consumption(consume),
    description: { chatFlavor: name },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range,
    target,
    uses,
    midiProperties: midiProps(identifier),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText,
    useConditionReason,
  });

const damageActivity = ({
  id,
  name,
  identifier,
  activationType,
  condition = "",
  img,
  range,
  target,
  parts,
  consume = [],
  uses = emptyUses(),
  sort = 0,
}) =>
  wrapActivity({
    _id: id,
    type: "damage",
    sort,
    name,
    img,
    activation: activation(activationType, 1, condition),
    consumption: consumption(consume),
    description: { chatFlavor: name },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range,
    target,
    uses,
    midiProperties: midiProps(identifier),
    damage: {
      critical: { allow: false, bonus: "" },
      parts,
    },
  });

const ACTOR_TOKEN =
  resolveFoundryMhTokenPath("Dire Miralis") ??
  "icons/creatures/reptiles/lizard-mouth-glowing-red.webp";

const IMG = {
  actor: ACTOR_TOKEN,
  claw: "icons/creatures/claws/claw-talons-glowing-orange.webp",
  glob: "icons/magic/fire/explosion-fireball-medium-orange.webp",
  fire: "icons/magic/fire/explosion-fireball-medium-orange.webp",
  shell: "icons/commodities/biological/shell-turtle-grey.webp",
  hide: "icons/commodities/biological/wing-lizard-brown.webp",
  stance: "icons/skills/movement/figure-running-gray.webp",
  tail: "icons/commodities/biological/tail-spiked-green.webp",
  crush: "icons/creatures/magical/construct-iron-stomping-yellow.webp",
  vents: "icons/magic/fire/projectile-fireball-smoke-orange.webp",
  rain: "icons/magic/fire/beam-jet-stream-yellow.webp",
  lair: "icons/environment/settlement/quarry.webp",
  legendary: "icons/magic/symbols/runes-star-blue.webp",
  water: "icons/commodities/biological/fin-red-green.webp",
};

const abilityBlock = (value, proficient = 0) => ({
  value,
  proficient,
  max: null,
  bonuses: { check: "", save: "" },
});

// ─── Items ───────────────────────────────────────────────────────────────────

const amphibious = makeFeat({
  seed: "amphibious",
  name: "Amphibious",
  img: IMG.water,
  identifier: "amphibious",
  role: "amphibious",
  sort: 100000,
  description: `<p>The Dire Miralis can breathe air and water.</p>`,
  chat: `<p>The Dire Miralis can breathe air and water.</p>`,
});

const legendaryResistanceId = stableId("dire-miralis::act::legres");
const legendaryResistance = makeFeat({
  seed: "legendary-resistance",
  name: "Legendary Resistance",
  img: IMG.legendary,
  identifier: "legendary-resistance",
  role: "legendaryResistance",
  sort: 100100,
  uses: dayUses(3),
  description: `<p><strong>Legendary Resistance (3/Day).</strong> If the Dire Miralis fails a saving throw, it can choose to succeed instead.</p>`,
  chat: `<p>The Dire Miralis succeeds on a failed saving throw.</p>`,
  activities: {
    [legendaryResistanceId]: utilityActivity({
      id: legendaryResistanceId,
      name: "Succeed on a Failed Save",
      identifier: "legendary-resistance",
      activationType: "special",
      img: IMG.legendary,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      consume: consumeItemUses(1),
      uses: emptyUses(),
    }),
  },
});

const siegeMonster = makeFeat({
  seed: "siege-monster",
  name: "Siege Monster",
  img: IMG.crush,
  identifier: "siege-monster",
  role: "siegeMonster",
  sort: 100200,
  description: `<p>The Dire Miralis deals double damage to objects and structures.</p>`,
  chat: `<p>Double damage to objects and structures.</p>`,
});

const boilingAuraId = stableId("dire-miralis::fx::boiling");
const boilingPresence = makeFeat({
  seed: "boiling-presence",
  name: "Boiling Presence",
  img: IMG.fire,
  identifier: "boiling-presence",
  role: "boilingPresence",
  sort: 100300,
  description: `<p>The Dire Miralis radiates furnace heat. At the start of each of the Dire Miralis's turns, each creature within <strong>10 feet</strong> of it takes <strong>5 (1d10) fire damage</strong>.</p>
<p><em>Automated by the Amellwind module script at the start of its turn.</em></p>`,
  chat: `<p>Creatures within 10 feet take 1d10 fire damage at the start of the Dire Miralis's turn.</p>`,
  effects: [
    makeEffect({
      id: boilingAuraId,
      name: "Boiling Presence (10 ft)",
      img: IMG.fire,
      kind: "boilingPresence",
      description: "Furnace heat. Nearby creatures take 1d10 fire at the start of the Dire Miralis's turn.",
      changes: [
        { key: "flags.world.direMiralis.nearBoiling", mode: 5, value: "1", priority: 20 },
      ],
      extraFlags: {
        ActiveAuras: {
          isAura: true,
          aura: "Enemy",
          radius: "10",
          alignment: "",
          type: "",
          customCheck: "",
          ignoreSelf: true,
          height: false,
          hidden: false,
          displayTemp: true,
          hostile: true,
          onlyOnce: false,
          wallsBlock: "system",
          statuses: [],
        },
      },
    }),
  ],
});

const taintedSea = makeFeat({
  seed: "tainted-sea",
  name: "Tainted Sea Presence",
  img: IMG.water,
  identifier: "tainted-sea-presence",
  role: "taintedSea",
  sort: 100400,
  description: `<p>Any creature that <strong>enters</strong> or <strong>starts its turn</strong> in boiling/tainted water within <strong>60 feet</strong> of the Dire Miralis takes <strong>11 (2d10) fire damage</strong>. That water is difficult terrain for creatures other than the Dire Miralis.</p>
<p><em>Lava and tainted-water templates placed by Magma Glob, Volcanic Vents, and lair actions are automated. Mark other boiling water with those templates as needed.</em></p>`,
  chat: `<p>Boiling/tainted water within 60 ft: 2d10 fire on enter or start of turn; difficult terrain.</p>`,
});

const ventsActId = stableId("dire-miralis::act::vents");
const volcanicVents = makeFeat({
  seed: "volcanic-vents",
  name: "Volcanic Vents",
  img: IMG.vents,
  identifier: "volcanic-vents",
  role: "volcanicVents",
  sort: 100500,
  withMacro: true,
  description: `<p>At the end of each of the Dire Miralis's turns, choose up to <strong>two</strong> spaces the Dire Miralis can see within <strong>60 feet</strong>. Each creature in those spaces must succeed on a <strong>DC 17 Dexterity</strong> saving throw or take <strong>9 (2d8) fire damage</strong>. Those spaces become <strong>lava</strong> until the start of the Dire Miralis's next turn (see Magma Glob).</p>
<p><em>Place up to two 5-foot squares (empty or occupied). Creatures in those spaces make the save. Lava templates expire at the start of its next turn.</em></p>`,
  chat: `<p>DC 17 Dexterity vs 2d8 fire in up to two spaces; those spaces become lava.</p>`,
  activities: {
    [ventsActId]: saveActivity({
      id: ventsActId,
      name: "Volcanic Vents",
      identifier: "volcanic-vents",
      activationType: "special",
      condition: "End of the Dire Miralis's turn",
      img: IMG.vents,
      range: rangeBlock(60),
      target: targetBlock({
        templateType: "square",
        templateSize: "5",
        templateCount: "2",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 17,
      parts: [damagePart(2, 8, "fire")],
      onSave: "none",
      midiExtra: {
        autoTargetAction: "always",
        confirmTargets: "never",
      },
    }),
  },
});

const magmaArmorFxId = stableId("dire-miralis::fx::magma-armor");
const crackedFxId = stableId("dire-miralis::fx::cracked");
const magmaArmor = makeFeat({
  seed: "magma-armor",
  name: "Magma Armor",
  img: IMG.shell,
  identifier: "magma-armor",
  role: "magmaArmor",
  sort: 100600,
  description: `<p>When the Dire Miralis is reduced below <strong>70%</strong> hit points, its hide hardens into a slag shell. While Magma Armor is active:</p>
<ul>
<li>Its AC becomes <strong>22</strong>.</li>
<li>It has <strong>resistance to bludgeoning, piercing, and slashing damage</strong>.</li>
</ul>
<p><strong>Cracking the Shell.</strong> Magma Armor <strong>cracks</strong> (the Dire Miralis loses the resistance—and its AC returns to 18—until the end of its next turn) when any of the following happens:</p>
<ol>
<li>It takes <strong>cold damage</strong>, or</li>
<li>The hunters <strong>interrupt Calamity Rain</strong>.</li>
</ol>
<p>If Magma Armor has been cracked <strong>six</strong> times, the shell shatters: Magma Armor ends and can't return for the rest of the combat. Detonating Calamity Rain also cracks the shell once from heat shock (if it was active).</p>
<p><em>Armed automatically from the module script.</em></p>`,
  chat: `<p>Below 70% HP: AC 22 and resistance to B/P/S until cracked or shattered.</p>`,
  effects: [
    makeEffect({
      id: magmaArmorFxId,
      name: "Magma Armor",
      img: IMG.shell,
      kind: "magmaArmor",
      disabled: true,
      description: "AC 22. Resistance to bludgeoning, piercing, and slashing.",
      changes: [
        { key: "system.attributes.ac.calc", mode: 5, value: "flat", priority: 50 },
        { key: "system.attributes.ac.flat", mode: 5, value: "22", priority: 50 },
        { key: "system.traits.dr.value", mode: 2, value: "bludgeoning", priority: 20 },
        { key: "system.traits.dr.value", mode: 2, value: "piercing", priority: 20 },
        { key: "system.traits.dr.value", mode: 2, value: "slashing", priority: 20 },
      ],
    }),
    makeEffect({
      id: crackedFxId,
      name: "Cracked Shell",
      img: IMG.shell,
      kind: "crackedShell",
      disabled: true,
      description: "Magma Armor is cracked. AC 18; no physical resistance until the end of the Dire Miralis's next turn.",
      changes: [],
    }),
  ],
});

const bipedFxId = stableId("dire-miralis::fx::biped");
const quadFxId = stableId("dire-miralis::fx::quad");
const stance = makeFeat({
  seed: "stance",
  name: "Stance (Biped / Quadruped)",
  img: IMG.stance,
  identifier: "stance-biped-quadruped",
  role: "stance",
  sort: 100700,
  description: `<p>The Dire Miralis uses one stance at a time and can change it with <strong>Shift Stance</strong>.</p>
<ul>
<li><strong>Biped:</strong> melee reach <strong>15 feet</strong>; can use <strong>Crush</strong>.</li>
<li><strong>Quadruped:</strong> melee reach <strong>10 feet</strong>; can use <strong>Tail Sweep</strong>; advantage on saving throws against being knocked prone.</li>
</ul>
<p>Starts in <strong>Biped</strong>. Claw reach updates when the stance changes.</p>`,
  chat: `<p>Biped: 15-ft reach, Crush. Quadruped: 10-ft reach, Tail Sweep, advantage vs prone.</p>`,
  effects: [
    makeEffect({
      id: bipedFxId,
      name: "Biped Stance",
      img: IMG.stance,
      kind: "stanceBiped",
      disabled: false,
      description: "Melee reach 15 feet. Crush is available.",
      changes: [],
    }),
    makeEffect({
      id: quadFxId,
      name: "Quadruped Stance",
      img: IMG.stance,
      kind: "stanceQuadruped",
      disabled: true,
      description: "Melee reach 10 feet. Tail Sweep is available. Advantage on saves against being knocked prone.",
      changes: [],
    }),
  ],
});

const multiId = stableId("dire-miralis::act::multi");
const multiattack = makeFeat({
  seed: "multiattack",
  name: "Multiattack",
  img: IMG.claw,
  identifier: "multiattack",
  role: "multiattack",
  sort: 200000,
  description: `<p>The Dire Miralis makes two attacks, using <strong>Claw</strong>, <strong>Magma Glob</strong>, or one of each.</p>`,
  chat: `<p>Two attacks: Claw, Magma Glob, or one of each.</p>`,
  activities: {
    [multiId]: utilityActivity({
      id: multiId,
      name: "Multiattack",
      identifier: "multiattack",
      activationType: "action",
      img: IMG.claw,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
    }),
  },
});

const clawAtkId = stableId("dire-miralis::act::claw");
const claw = {
  _id: stableId("dire-miralis::item::claw"),
  name: "Claw",
  type: "weapon",
  img: IMG.claw,
  system: {
    source: SOURCE,
    description: {
      value: `<p><em>Melee Weapon Attack:</em> +11 to hit, reach 10 ft. (15 ft. in Biped), one target.</p>
<p><em>Hit:</em> <strong>25 (4d8 + 7)</strong> slashing damage plus <strong>4 (1d8)</strong> fire damage.</p>
<p>Reach is updated automatically when the Dire Miralis changes stance.</p>`,
      chat: `<p>+11 to hit, 4d8+7 slashing + 1d8 fire.</p>`,
    },
    identifier: "claw",
    quantity: 1,
    weight: { value: 0, units: "lb" },
    price: { value: 0, denomination: "gp" },
    attuned: false,
    attunement: "",
    equipped: true,
    rarity: "",
    identified: true,
    type: { value: "natural", baseItem: "" },
    ability: "str",
    damage: {
      base: {
        number: 4,
        denomination: 8,
        types: ["slashing"],
        custom: { enabled: false, formula: "" },
        scaling: { number: 1, mode: "" },
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
    properties: [],
    proficient: 1,
    range: { value: null, long: null, reach: 15, units: "ft" },
    mastery: "",
    ammunition: { type: "" },
    armor: { value: null },
    uses: emptyUses(),
    activities: {
      [clawAtkId]: attackActivity({
        id: clawAtkId,
        name: "Claw",
        identifier: "claw",
        img: IMG.claw,
        attackValue: "melee",
        ability: "str",
        includeBase: true,
        parts: [damagePart(1, 8, "fire")],
        range: rangeBlock(null, "ft", "Reach set by stance"),
        target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
      }),
    },
  },
  effects: [],
  folder: null,
  sort: 200100,
  ownership: { default: 0 },
  flags: {
    dnd5e: { riders: { activity: [], effect: [] } },
    world: { direMiralis: { role: "claw" } },
  },
  _stats: stats(),
};

const globAtkId = stableId("dire-miralis::act::glob");
const magmaGlob = makeFeat({
  seed: "magma-glob",
  name: "Magma Glob",
  img: IMG.glob,
  identifier: "magma-glob",
  role: "magmaGlob",
  sort: 200200,
  withMacro: true,
  description: `<p><em>Ranged Weapon Attack:</em> +7 to hit, range 80/320 ft., one target.</p>
<p><em>Hit:</em> <strong>27 (5d10)</strong> fire damage, and the target's space becomes <strong>lava</strong> for <strong>1 hour</strong>. On a miss, the lava appears in an unoccupied space within 5 feet of the target.</p>
<p>A creature that <strong>enters</strong> the lava or <strong>starts its turn</strong> there takes <strong>11 (2d10)</strong> fire damage. The lava ignites flammable objects not being worn or carried.</p>`,
  chat: `<p>+7 to hit, 5d10 fire; space becomes lava (miss: adjacent space).</p>`,
  activities: {
    [globAtkId]: attackActivity({
      id: globAtkId,
      name: "Magma Glob",
      identifier: "magma-glob",
      img: IMG.glob,
      attackValue: "ranged",
      ability: "dex",
      includeBase: false,
      parts: [damagePart(5, 10, "fire")],
      range: rangeBlock(80, "ft"),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
    }),
  },
});
magmaGlob.system.activities[globAtkId].range = {
  value: 80,
  units: "ft",
  special: "320 ft long range",
  override: false,
};

const proneFxId = stableId("dire-miralis::fx::crush-prone");
const crushActId = stableId("dire-miralis::act::crush");
const crush = makeFeat({
  seed: "crush",
  name: "Crush",
  img: IMG.crush,
  identifier: "crush",
  role: "crush",
  sort: 200300,
  withMacro: true,
  description: `<p><strong>Biped Only.</strong> The Dire Miralis slams down in a <strong>20-foot-by-20-foot square</strong> originating from an edge of its space. Each creature in that area must make a <strong>DC 19 Strength or Dexterity</strong> saving throw (target's choice).</p>
<p><em>Failure:</em> <strong>18 (4d8)</strong> bludgeoning + <strong>18 (4d8)</strong> fire damage, and the creature is knocked <strong>prone</strong>.</p>
<p><em>Success:</em> half damage, not prone, and the creature is pushed to the nearest unoccupied space outside the area (or falls prone in the Dire Miralis's space if none exists).</p>`,
  chat: `<p>Biped. 20-ft square, DC 19 Str/Dex: 4d8 bludgeoning + 4d8 fire, prone on a fail.</p>`,
  activities: {
    [crushActId]: saveActivity({
      id: crushActId,
      name: "Crush",
      identifier: "crush",
      activationType: "action",
      condition: "Biped stance only",
      img: IMG.crush,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "square",
        templateSize: "20",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: ["str", "dex"],
      saveDc: 19,
      parts: [damagePart(4, 8, "bludgeoning"), damagePart(4, 8, "fire")],
      effects: [{ _id: proneFxId, onSave: false }],
      effectConditionText: "failedSave",
      useConditionText: '@actor.flags.world.direMiralis.stance != "quadruped"',
      useConditionReason: "Crush can only be used in Biped stance.",
    }),
  },
  effects: [
    makeEffect({
      id: proneFxId,
      name: "Prone",
      img: "systems/dnd5e/icons/svg/statuses/prone.svg",
      kind: "crushProne",
      transfer: false,
      statuses: ["prone"],
      description: "Knocked prone by Crush.",
      changes: [],
    }),
  ],
});

const tailActId = stableId("dire-miralis::act::tail");
const tailSweep = makeFeat({
  seed: "tail-sweep",
  name: "Tail Sweep",
  img: IMG.tail,
  identifier: "tail-sweep",
  role: "tailSweep",
  sort: 200400,
  withMacro: true,
  description: `<p><strong>Quadruped Only.</strong> The Dire Miralis sweeps its tail in a <strong>30-foot cone</strong>. Each creature in that area must succeed on a <strong>DC 19 Dexterity</strong> saving throw or take <strong>22 (4d6 + 7)</strong> bludgeoning damage and be pushed <strong>10 feet</strong> away. On a success, half damage and no push.</p>`,
  chat: `<p>Quadruped. 30-ft cone, DC 19 Dex: 4d6+7 bludgeoning and 10-ft push.</p>`,
  activities: {
    [tailActId]: saveActivity({
      id: tailActId,
      name: "Tail Sweep",
      identifier: "tail-sweep",
      activationType: "action",
      condition: "Quadruped stance only",
      img: IMG.tail,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "cone",
        templateSize: "30",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 19,
      parts: [damagePart(4, 6, "bludgeoning", "+7")],
      useConditionText: '@actor.flags.world.direMiralis.stance == "quadruped"',
      useConditionReason: "Tail Sweep can only be used in Quadruped stance.",
    }),
  },
});

const fireballActId = stableId("dire-miralis::act::fireball");
const greaterFireball = makeFeat({
  seed: "greater-fireball",
  name: "Greater Fireball",
  img: IMG.fire,
  identifier: "greater-fireball",
  role: "greaterFireball",
  sort: 200500,
  uses: rechargeUses("5"),
  description: `<p><strong>Recharge 5–6.</strong> The Dire Miralis exhales a massive fireball centered on a point it can see within <strong>150 feet</strong>. Each creature in a <strong>25-foot-radius sphere</strong> must make a <strong>DC 17 Dexterity</strong> saving throw, taking <strong>38 (11d6)</strong> fire damage on a failed save, or half as much on a successful one.</p>`,
  chat: `<p>Recharge 5–6. 25-ft radius, 150 ft, DC 17 Dex, 11d6 fire.</p>`,
  activities: {
    [fireballActId]: saveActivity({
      id: fireballActId,
      name: "Greater Fireball",
      identifier: "greater-fireball",
      activationType: "action",
      img: IMG.fire,
      range: rangeBlock(150),
      target: targetBlock({
        templateType: "sphere",
        templateSize: "25",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 17,
      parts: [damagePart(11, 6, "fire")],
      consume: consumeItemUses(1),
      uses: emptyUses(),
    }),
  },
});

const calamityActId = stableId("dire-miralis::act::calamity");
const calamityFxId = stableId("dire-miralis::fx::calamity");
const calamityRain = makeFeat({
  seed: "calamity-rain",
  name: "Calamity Rain",
  img: IMG.rain,
  identifier: "calamity-rain",
  role: "calamityRain",
  sort: 200600,
  withMacro: true,
  uses: dayUses(1),
  description: `<p><strong>1/Day; Enrage Nova.</strong></p>
<p><strong>Charge (action):</strong> The Dire Miralis coils and glows. Until the start of its next turn it is visibly charging. Place <strong>six</strong> glowing markers in spaces it can see within <strong>120 feet</strong>. While charging, it can't take reactions, and damage it takes is tallied for the interrupt.</p>
<p><strong>Interrupt:</strong> If the Dire Miralis takes <strong>40 or more damage in one turn</strong> during the charge (before detonation), the nova fails. It is knocked <strong>prone</strong>, Magma Armor <strong>cracks</strong> (if active), and it can't use Legendary Actions until the end of its next turn.</p>
<p><strong>Detonation</strong> (start of its next turn, if not interrupted): Greater Fireball erupts on each detonation zone. After detonating, Magma Armor <strong>cracks</strong> once from the heat shock (if it was active).</p>
<p><em>Target up to six tokens/spaces as markers, then use Charge. Interrupt and detonation are automated.</em></p>`,
  chat: `<p>Charge: 6 markers within 120 ft. 40+ damage in one turn interrupts. Else Greater Fireball on each zone.</p>`,
  activities: {
    [calamityActId]: utilityActivity({
      id: calamityActId,
      name: "Calamity Rain — Charge",
      identifier: "calamity-rain-charge",
      activationType: "action",
      img: IMG.rain,
      range: rangeBlock(120),
      target: targetBlock({
        affectsType: "any",
        affectsCount: "6",
        prompt: true,
      }),
      consume: consumeItemUses(1),
      uses: emptyUses(),
    }),
  },
  effects: [
    makeEffect({
      id: calamityFxId,
      name: "Calamity Rain — Charging",
      img: IMG.rain,
      kind: "calamityCharging",
      disabled: true,
      description: "Coiling and glowing. Cannot take reactions. 40+ damage in one turn interrupts the nova.",
      changes: [],
    }),
  ],
});

const lumberId = stableId("dire-miralis::act::lumber");
const lumberingAdvance = makeFeat({
  seed: "lumbering-advance",
  name: "Lumbering Advance",
  img: IMG.stance,
  identifier: "lumbering-advance",
  role: "lumberingAdvance",
  sort: 300000,
  withMacro: true,
  description: `<p>The Dire Miralis moves up to <strong>half its speed</strong>. This movement doesn't provoke opportunity attacks if it ends the move in water or adjacent to a structure or Huge or larger object.</p>`,
  chat: `<p>Bonus action: move half speed. No OA if it ends in water or next to a structure / Huge+ object.</p>`,
  activities: {
    [lumberId]: utilityActivity({
      id: lumberId,
      name: "Lumbering Advance",
      identifier: "lumbering-advance",
      activationType: "bonus",
      img: IMG.stance,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
    }),
  },
});

const hideActId = stableId("dire-miralis::act::hide");
const scorchingHide = makeFeat({
  seed: "scorching-hide",
  name: "Scorching Hide",
  img: IMG.hide,
  identifier: "scorching-hide",
  role: "scorchingHide",
  sort: 400000,
  extraMidi: scorchingMidiFlags(),
  description: `<p>When the Dire Miralis is hit by a melee attack, the attacker takes <strong>9 (2d8)</strong> fire damage.</p>`,
  chat: `<p>Reaction: when hit by a melee attack, the attacker takes 2d8 fire.</p>`,
  activities: {
    [hideActId]: damageActivity({
      id: hideActId,
      name: "Scorching Hide",
      identifier: "scorching-hide",
      activationType: "reaction",
      condition: "When hit by a melee attack",
      img: IMG.hide,
      range: rangeBlock(5),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
      parts: [damagePart(2, 8, "fire")],
    }),
  },
});

const shiftToggleId = stableId("dire-miralis::act::shift-toggle");
const shiftMoveId = stableId("dire-miralis::act::shift-move");
const shiftStance = makeFeat({
  seed: "shift-stance",
  name: "Shift Stance",
  img: IMG.stance,
  identifier: "shift-stance",
  role: "shiftStance",
  sort: 500000,
  withMacro: true,
  description: `<p><strong>Legendary Action.</strong> The Dire Miralis switches between Biped and Quadruped, or moves up to <strong>half its speed</strong> without provoking opportunity attacks.</p>`,
  chat: `<p>Legendary: switch stance, or move half speed with no OA.</p>`,
  activities: {
    [shiftToggleId]: utilityActivity({
      id: shiftToggleId,
      name: "Switch Stance",
      identifier: "shift-stance-toggle",
      activationType: "legendary",
      img: IMG.stance,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      consume: consumeLegendary(1),
      sort: 0,
    }),
    [shiftMoveId]: utilityActivity({
      id: shiftMoveId,
      name: "Reposition (Half Speed)",
      identifier: "shift-stance-move",
      activationType: "legendary",
      img: IMG.stance,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      consume: consumeLegendary(1),
      sort: 1000,
    }),
  },
});

const tremorActId = stableId("dire-miralis::act::tremor");
const tremorProneId = stableId("dire-miralis::fx::tremor-prone");
const tremor = makeFeat({
  seed: "tremor",
  name: "Tremor",
  img: IMG.crush,
  identifier: "tremor",
  role: "tremor",
  sort: 500100,
  withMacro: true,
  description: `<p><strong>Legendary Action.</strong> Each creature on the ground within <strong>30 feet</strong> of the Dire Miralis must succeed on a <strong>DC 19 Dexterity</strong> saving throw or fall <strong>prone</strong>.</p>`,
  chat: `<p>Legendary: 30-ft, DC 19 Dex or prone.</p>`,
  activities: {
    [tremorActId]: saveActivity({
      id: tremorActId,
      name: "Tremor",
      identifier: "tremor",
      activationType: "legendary",
      img: IMG.crush,
      range: rangeBlock(30),
      target: targetBlock({
        templateType: "radius",
        templateSize: "30",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 19,
      parts: [],
      onSave: "none",
      consume: consumeLegendary(1),
      effects: [{ _id: tremorProneId, onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
  effects: [
    makeEffect({
      id: tremorProneId,
      name: "Prone",
      img: "systems/dnd5e/icons/svg/statuses/prone.svg",
      kind: "tremorProne",
      transfer: false,
      statuses: ["prone"],
      description: "Knocked prone by Tremor.",
      changes: [],
    }),
  ],
});

const magmaAtkLegId = stableId("dire-miralis::act::magma-leg");
const magmaAttack = makeFeat({
  seed: "magma-attack",
  name: "Magma Attack",
  img: IMG.glob,
  identifier: "magma-attack",
  role: "magmaGlob",
  sort: 500200,
  withMacro: true,
  description: `<p><strong>Legendary Action (Costs 2).</strong> The Dire Miralis makes one <strong>Magma Glob</strong> attack.</p>`,
  chat: `<p>Legendary (2): one Magma Glob attack.</p>`,
  activities: {
    [magmaAtkLegId]: attackActivity({
      id: magmaAtkLegId,
      name: "Magma Glob",
      identifier: "magma-attack",
      activationType: "legendary",
      img: IMG.glob,
      attackValue: "ranged",
      ability: "dex",
      includeBase: false,
      parts: [damagePart(5, 10, "fire")],
      range: rangeBlock(80, "ft"),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
      consume: consumeLegendary(2),
    }),
  },
});
magmaAttack.system.activities[magmaAtkLegId].activation.value = 2;
magmaAttack.system.activities[magmaAtkLegId].range.special = "320 ft long range";

const barrageActId = stableId("dire-miralis::act::barrage");
const ventBarrage = makeFeat({
  seed: "vent-barrage",
  name: "Vent Barrage",
  img: IMG.vents,
  identifier: "vent-barrage",
  role: "ventBarrage",
  sort: 500300,
  withMacro: true,
  description: `<p><strong>Legendary Action (Costs 2).</strong> The Dire Miralis uses <em>Volcanic Vents</em>, targeting up to <strong>three</strong> spaces instead of two.</p>`,
  chat: `<p>Legendary (2): Volcanic Vents on up to three spaces.</p>`,
  activities: {
    [barrageActId]: saveActivity({
      id: barrageActId,
      name: "Vent Barrage",
      identifier: "vent-barrage",
      activationType: "legendary",
      img: IMG.vents,
      range: rangeBlock(60),
      target: targetBlock({
        templateType: "square",
        templateSize: "5",
        templateCount: "3",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 17,
      parts: [damagePart(2, 8, "fire")],
      onSave: "none",
      consume: consumeLegendary(2),
      midiExtra: {
        autoTargetAction: "always",
        confirmTargets: "never",
      },
    }),
  },
});
ventBarrage.system.activities[barrageActId].activation.value = 2;

const tideActId = stableId("dire-miralis::act::tide");
const risingTide = makeFeat({
  seed: "rising-magma-tide",
  name: "Lair: Rising Magma Tide",
  img: IMG.lair,
  identifier: "lair-rising-magma-tide",
  role: "risingMagmaTide",
  sort: 600000,
  withMacro: true,
  description: `<p><strong>Arena Lair Action (Tainted Sea Cove) — Optional.</strong> On initiative count <strong>20</strong> (losing initiative ties).</p>
<p>Boiling water or lava spreads <strong>10 feet</strong> inland from the current waterline along a 40-foot-wide front. New spaces use <em>Boiling Presence</em> / lava hazards.</p>
<p>Cannot use the same lair effect two rounds in a row.</p>`,
  chat: `<p>Lair: 40-ft front of boiling water / lava spreads 10 ft inland.</p>`,
  activities: {
    [tideActId]: utilityActivity({
      id: tideActId,
      name: "Rising Magma Tide",
      identifier: "rising-magma-tide",
      activationType: "lair",
      img: IMG.lair,
      range: rangeBlock(60),
      target: targetBlock({ affectsType: "any", affectsCount: "1", prompt: true }),
    }),
  },
});

const wreckActId = stableId("dire-miralis::act::wreck");
const wreckCollapse = makeFeat({
  seed: "wreck-collapse",
  name: "Lair: Wreck Collapse",
  img: IMG.lair,
  identifier: "lair-wreck-collapse",
  role: "wreckCollapse",
  sort: 600100,
  withMacro: true,
  description: `<p><strong>Arena Lair Action (Tainted Sea Cove) — Optional.</strong> On initiative count <strong>20</strong>.</p>
<p>One shipwreck section within 60 feet partially collapses. Creatures in a <strong>15-foot square</strong> there must succeed on a <strong>DC 17 Dexterity</strong> saving throw or take <strong>14 (4d6)</strong> bludgeoning damage and be <strong>restrained</strong> (escape DC 17). The area becomes difficult terrain and provides half cover afterward.</p>
<p>Cannot use the same lair effect two rounds in a row.</p>`,
  chat: `<p>Lair: 15-ft square, DC 17 Dex, 4d6 bludgeoning and restrained; difficult terrain + half cover.</p>`,
  activities: {
    [wreckActId]: saveActivity({
      id: wreckActId,
      name: "Wreck Collapse",
      identifier: "wreck-collapse",
      activationType: "lair",
      img: IMG.lair,
      range: rangeBlock(60),
      target: targetBlock({
        templateType: "square",
        templateSize: "15",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 17,
      parts: [damagePart(4, 6, "bludgeoning")],
      onSave: "none",
    }),
  },
});

const steamActId = stableId("dire-miralis::act::steam");
const bloodRedSteam = makeFeat({
  seed: "blood-red-steam",
  name: "Lair: Blood-Red Steam",
  img: IMG.lair,
  identifier: "lair-blood-red-steam",
  role: "bloodRedSteam",
  sort: 600200,
  withMacro: true,
  description: `<p><strong>Arena Lair Action (Tainted Sea Cove) — Optional.</strong> On initiative count <strong>20</strong>.</p>
<p>A scalding steam cloud fills a <strong>20-foot cube</strong> the Dire Miralis can see within 60 feet until initiative count 20 on the next round. The area is heavily obscured; any creature that starts its turn there takes <strong>7 (2d6)</strong> fire damage.</p>
<p>Cannot use the same lair effect two rounds in a row.</p>`,
  chat: `<p>Lair: 20-ft cube of steam, heavily obscured, 2d6 fire at start of turn.</p>`,
  activities: {
    [steamActId]: utilityActivity({
      id: steamActId,
      name: "Blood-Red Steam",
      identifier: "blood-red-steam",
      activationType: "lair",
      img: IMG.lair,
      range: rangeBlock(60),
      target: targetBlock({
        templateType: "cube",
        templateSize: "20",
        affectsType: "any",
        prompt: true,
      }),
    }),
  },
});

const items = [
  amphibious,
  legendaryResistance,
  siegeMonster,
  boilingPresence,
  taintedSea,
  volcanicVents,
  magmaArmor,
  stance,
  multiattack,
  claw,
  magmaGlob,
  crush,
  tailSweep,
  greaterFireball,
  calamityRain,
  lumberingAdvance,
  scorchingHide,
  shiftStance,
  tremor,
  magmaAttack,
  ventBarrage,
  risingTide,
  wreckCollapse,
  bloodRedSteam,
];

const biography = `<h2>Dire Miralis</h2>
<p><em>Gargantuan Dragon (Elder), Unaligned — Challenge 11 (Boss; ~10,000 XP)</em></p>
<p>An Elder Dragon of boiling seas and volcanic vents. Place the token in the arena, roll initiative, and use the features on the sheet. Magma Armor, lava templates, Calamity Rain interrupt/detonation, Boiling Presence, and Scorching Hide run from the Amellwind module script.</p>
<h3>Combat notes</h3>
<ul>
<li><strong>Stance:</strong> starts Biped (15-ft Claw, Crush). Shift Stance (legendary) toggles Quadruped (Tail Sweep, advantage vs prone).</li>
<li><strong>Magma Armor:</strong> arms below 70% HP (161/230). Cold damage or an interrupted Calamity Rain cracks it; six cracks shatter it.</li>
<li><strong>Calamity Rain:</strong> target up to six spaces, Charge, then either 40+ damage in one turn interrupts or Greater Fireball detonates on each marker at the start of its next turn.</li>
<li><strong>Lair actions</strong> (optional, initiative 20): cannot repeat the same effect two rounds in a row.</li>
</ul>`;

const actor = {
  _id: stableId("dire-miralis::actor"),
  name: "Dire Miralis",
  type: "npc",
  img: IMG.actor,
  system: {
    abilities: {
      str: abilityBlock(24, 0),
      dex: abilityBlock(16, 1),
      con: abilityBlock(21, 1),
      int: abilityBlock(12, 0),
      wis: abilityBlock(15, 1),
      cha: abilityBlock(9, 1),
    },
    attributes: {
      ac: { flat: 18, calc: "flat", formula: "" },
      hp: {
        value: 230,
        max: 230,
        temp: 0,
        tempmax: 0,
        formula: "15d20 + 75",
      },
      init: { ability: "dex", bonus: "" },
      movement: {
        burrow: null,
        climb: null,
        fly: null,
        swim: 40,
        walk: 30,
        units: "ft",
        hover: false,
      },
      attunement: { max: 3 },
      senses: {
        darkvision: 0,
        blindsight: 120,
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
        value: biography,
        public: "A gargantuan Elder Dragon whose presence boils the sea.",
      },
      alignment: "Unaligned",
      race: "",
      type: {
        value: "dragon",
        subtype: "Elder",
        swarm: "",
        custom: "",
      },
      environment: "Coastal / Tainted Sea Cove",
      cr: 11,
      spellLevel: 0,
      source: SOURCE,
      treasure: { value: [] },
    },
    traits: {
      size: "grg",
      di: { value: ["fire"], bypasses: [], custom: "" },
      dr: { value: [], bypasses: [], custom: "" },
      dv: { value: [], bypasses: [], custom: "" },
      ci: { value: ["frightened"], custom: "" },
      languages: { value: ["draconic"], custom: "" },
    },
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    skills: {
      prc: { value: 1, ability: "", bonuses: { check: "", passive: "" } },
    },
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
      legact: { value: 3, max: 3 },
      legres: { value: 3, max: 3 },
      lair: { value: true, initiative: 20, inside: true },
    },
  },
  prototypeToken: {
    name: "Dire Miralis",
    displayName: 20,
    actorLink: true,
    appendNumber: false,
    prependAdjective: false,
    width: 4,
    height: 4,
    texture: {
      src: IMG.actor,
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
    hexagonalShape: 0,
    lockRotation: false,
    rotation: 0,
    alpha: 1,
    disposition: -1,
    displayBars: 40,
    bar1: { attribute: "attributes.hp" },
    bar2: { attribute: "resources.legact" },
    light: {
      negative: false,
      priority: 0,
      alpha: 0.45,
      angle: 360,
      bright: 5,
      color: "#ff5500",
      coloration: 1,
      dim: 15,
      attenuation: 0.5,
      luminosity: 0.4,
      saturation: 0,
      contrast: 0,
      shadows: 0,
      animation: { type: "torch", speed: 4, intensity: 4, reverse: false },
      darkness: { min: 0, max: 1 },
    },
    sight: {
      enabled: true,
      range: 120,
      angle: 360,
      visionMode: "basic",
      color: "#ffaa66",
      attenuation: 0.1,
      brightness: 0,
      saturation: 0,
      contrast: 0,
    },
    detectionModes: [{ id: "blindsight", enabled: true, range: 120 }],
    flags: {
      world: {
        direMiralis: {
          bossNpc: true,
        },
      },
    },
    randomImg: false,
  },
  items,
  effects: [],
  folder: null,
  sort: 0,
  ownership: { default: 0 },
  flags: {
    exportSource: {
      world: "amellwind-toolbox",
      system: "dnd5e",
      coreVersion: CORE_VERSION,
      systemVersion: SYSTEM_VERSION,
    },
    world: {
      direMiralis: {
        bossNpc: true,
        stance: "biped",
        magmaArmor: {
          unlocked: false,
          shattered: false,
          cracked: false,
          cracks: 0,
        },
        calamity: {
          charging: false,
          interrupted: false,
          damageByTurn: {},
          markerIds: [],
        },
      },
    },
  },
  _stats: stats(),
};

fs.writeFileSync(outPath, JSON.stringify(actor, null, 2));
console.log("Wrote", outPath);
console.log(`items: ${items.length}`);
console.log("actor id:", actor._id);
