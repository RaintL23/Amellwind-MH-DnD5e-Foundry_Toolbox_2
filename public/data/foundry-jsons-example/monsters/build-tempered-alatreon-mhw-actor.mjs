/**
 * Builds fvtt-Actor-tempered-alatreon-mhw.json (Gargantuan Elder Dragon boss, CR 30).
 * Run: node public/data/foundry-jsons-example/monsters/build-tempered-alatreon-mhw-actor.mjs
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveFoundryMhTokenPath } from "../../../../scripts/mh-token-resolve.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "fvtt-Actor-tempered-alatreon-mhw.json");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";
const SOURCE = {
  custom: "Amellwind MH (RaintDM)",
  book: "MHMM-Patreon",
  page: "",
  license: "",
  rules: "2014",
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
  ignoreTraits: activity.ignoreTraits ?? { idi: false, idr: false, idv: false, ida: false },
  isOverTimeFlag: false,
  overTimeProperties: {
    saveRemoves: true,
    preRemoveConditionText: "",
    postRemoveConditionText: "",
  },
  otherActivityId:
    activity.otherActivityId
    ?? (activity.type === "attack" ? "" : "none"),
  ...(activity.type === "attack"
    ? { otherActivityUuid: "", attackMode: "oneHanded", ammunition: "" }
    : {}),
  useConditionText: activity.useConditionText ?? "",
  useConditionReason: activity.useConditionReason ?? "",
  effectConditionText: activity.effectConditionText ?? (activity.type === "attack" ? "false" : ""),
});

const wrapActivity = (activity) => ({ ...activity, ...envelope(activity) });

const itemMacroCommand = `// Tempered Alatreon (MHW) — Item Macro dispatcher
// MidiQOL On Use: [postActiveEffects]ItemMacro
try {
  const api = globalThis.__amellwindAlatreon;
  if (!api?.onUse) {
    ui.notifications?.warn("Tempered Alatreon automations are not armed. Enable the Amellwind MH (RaintDM) module.");
    return;
  }
  const payload = typeof args !== "undefined" ? args[0] : {};
  await api.onUse(payload);
} catch (err) {
  console.error("Tempered Alatreon | item macro", err);
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
  templateWidth = "",
  templateHeight = "",
  affectsType = "",
  affectsCount = "",
  prompt = true,
} = {}) => ({
  template: {
    count: templateCount,
    contiguous: false,
    type: templateType,
    size: templateSize,
    width: templateWidth,
    height: templateHeight,
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

const AMELLWIND_STATUS_KINDS = new Set([
  "bloodblight",
  "dragonblight",
  "frozen",
  "slick",
  "tarred",
  "stench",
  "thunderblight",
  "waterblight",
  "iceblight",
  "frenzy-virus",
  "prone",
]);

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
  daeExtra = {},
  extraFlags = {},
  durationSeconds = null,
}) => {
  const statusList = [...statuses];
  if (kind && AMELLWIND_STATUS_KINDS.has(kind) && !statusList.includes(kind)) {
    statusList.push(kind);
  }
  return {
    _id: id,
    name,
    img,
    type: "base",
    system: {},
    changes,
    disabled,
    duration: {
      startTime: null,
      seconds: durationSeconds,
      combat: null,
      rounds: durationSeconds ? 10 : null,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    description,
    origin: null,
    tint: "#ffffff",
    transfer,
    statuses: statusList,
    sort: 0,
    flags: {
      dae: daeFlags(daeExtra),
      world: { alatreon: { kind } },
      ...extraFlags,
    },
    _stats: stats(),
  };
};

const blightOverTime = (label) => ({
  "midi-qol": {
    overTime: `turn=end,saveAbility=con,saveDC=27,label=${label},saveRemove=true,killAnim=true`,
  },
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
  const flags = withMacro
    ? midiItemacroFlags(name)
    : {
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
    _id: stableId(`tempered-alatreon-mhw::item::${seed}`),
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
      world: { alatreon: { role } },
      ...extraFlags,
    },
    _stats: stats(),
  };
};

/**
 * @param {object} [otherSave] Optional Midi "other activity" save after a hit:
 *   { id, name, identifier, saveAbility, saveDc, effectIds, img? }
 */
const makeNaturalWeapon = ({
  seed,
  name,
  img,
  identifier,
  role,
  description,
  chat,
  reach,
  baseNumber,
  baseDenom,
  baseType,
  extraParts = [],
  withMacro = false,
  effects = [],
  otherSave = null,
  sort = 0,
}) => {
  const atkId = stableId(`tempered-alatreon-mhw::act::${seed}`);
  const saveId = otherSave?.id ?? null;
  const flags = withMacro
    ? midiItemacroFlags(name)
    : {
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
      };
  const activities = {
    [atkId]: attackActivity({
      id: atkId,
      name,
      identifier,
      img,
      attackValue: "melee",
      ability: "str",
      includeBase: true,
      parts: extraParts,
      range: rangeBlock(null, "ft", `Reach ${reach} ft`),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
      otherActivityId: saveId ?? "",
    }),
  };
  if (otherSave && saveId) {
    activities[saveId] = saveActivity({
      id: saveId,
      name: otherSave.name,
      identifier: otherSave.identifier,
      activationType: "special",
      img: otherSave.img ?? img,
      range: rangeBlock(null, "ft", `Reach ${reach} ft`),
      target: targetBlock({ affectsType: "creature", affectsCount: "1", prompt: false }),
      saveAbility: otherSave.saveAbility,
      saveDc: otherSave.saveDc,
      parts: [],
      onSave: "none",
      effects: (otherSave.effectIds ?? []).map((effectId) => ({ _id: effectId, onSave: false })),
      effectConditionText: "failedSave",
      midiExtra: {
        autoTargetAction: "never",
        confirmTargets: "never",
        automationOnly: true,
      },
      sort: 1000,
    });
  }
  return {
    _id: stableId(`tempered-alatreon-mhw::item::${seed}`),
    name,
    type: "weapon",
    img,
    system: {
      source: SOURCE,
      description: { value: description, chat },
      identifier,
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
          number: baseNumber,
          denomination: baseDenom,
          types: [baseType],
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
      properties: ["mgc"],
      proficient: 1,
      range: { value: null, long: null, reach, units: "ft" },
      mastery: "",
      ammunition: { type: "" },
      armor: { value: null },
      uses: emptyUses(),
      activities,
    },
    effects,
    folder: null,
    sort,
    ownership: { default: 0 },
    flags: {
      ...flags,
      world: { alatreon: { role } },
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
    // forceRollDialog always: player saves must show Advantage / Normal / Disadvantage
    // even when the world has Midi auto–fast-forward saves enabled.
    midiProperties: midiProps(identifier, { ...midiExtra, forceRollDialog: "always" }),
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
  otherActivityId = "",
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
    otherActivityId,
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
  midiExtra = {},
  sort = 0,
  rollFormula = "",
  rollName = "",
  rollPrompt = false,
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
    midiProperties: midiProps(identifier, midiExtra),
    roll: { formula: rollFormula, name: rollName, prompt: rollPrompt, visible: Boolean(rollFormula) },
    useConditionText,
    useConditionReason,
  });

const ACTOR_TOKEN =
  resolveFoundryMhTokenPath("Alatreon") ??
  "icons/creatures/reptiles/dragon-horned-blue.webp";

const IMG = {
  actor: ACTOR_TOKEN,
  fire: "icons/magic/fire/explosion-fireball-medium-orange.webp",
  ice: "icons/magic/water/projectile-ice-snowball.webp",
  dragon: "icons/creatures/abilities/dragon-fire-breath-orange.webp",
  horn: "icons/commodities/bones/horn-engraved-orange.webp",
  legendary: "icons/magic/symbols/runes-star-blue.webp",
  magic: "icons/magic/symbols/rune-sigil-red-pink.webp",
  weapon: "icons/skills/melee/weapons-crossed-swords-yellow.webp",
  bite: "icons/creatures/abilities/fang-tooth-blood-red.webp",
  claw: "icons/creatures/claws/claw-talons-glowing-orange.webp",
  tail: "icons/commodities/biological/tail-spiked-green.webp",
  breath: "icons/magic/lightning/bolt-strike-blue.webp",
  escaton: "icons/magic/light/explosion-star-large-orange.webp",
  burst: "icons/magic/fire/explosion-mushroom-nuke-orange.webp",
  fly: "icons/skills/movement/figure-running-gray.webp",
  detect: "icons/magic/perception/eye-ringed-glow-yellow.webp",
  water: "icons/magic/water/projectile-water-rings.webp",
  lightning: "icons/magic/lightning/bolts-salvo-heavy-blue.webp",
  storm: "icons/magic/lightning/bolt-strike-cloud-blue.webp",
  rush: "icons/skills/melee/strike-sword-steel-yellow.webp",
  fireball: "icons/magic/fire/explosion-fireball-large-orange.webp",
  scorched: "icons/magic/fire/beam-jet-stream-yellow.webp",
  frost: "icons/magic/water/barrier-ice-crystal-wall-blue.webp",
  shards: "icons/magic/water/projectile-ice-faceted-blue.webp",
  blight: "icons/magic/unholy/strike-beam-blood-red-pink.webp",
  overload: "icons/magic/control/energy-stream-link-spiral-orange.webp",
  hunters: "icons/skills/social/diplomacy-handshake-blue.webp",
};

const abilityBlock = (value, proficient = 0) => ({
  value,
  proficient,
  max: null,
  bonuses: { check: "", save: "" },
});

const DRAGON_DR_TYPES = [
  "acid",
  "bludgeoning",
  "cold",
  "fire",
  "force",
  "lightning",
  "piercing",
  "radiant",
  "slashing",
  "thunder",
];

// ─── Traits ──────────────────────────────────────────────────────────────────

const fireStateFxId = stableId("tempered-alatreon-mhw::fx::fire-state");
const dragonStateFxId = stableId("tempered-alatreon-mhw::fx::dragon-state");
const iceStateFxId = stableId("tempered-alatreon-mhw::fx::ice-state");
const startFireCycleId = stableId("tempered-alatreon-mhw::act::start-fire-cycle");
const startIceCycleId = stableId("tempered-alatreon-mhw::act::start-ice-cycle");
const setFireStateId = stableId("tempered-alatreon-mhw::act::set-fire-state");
const setIceStateId = stableId("tempered-alatreon-mhw::act::set-ice-state");
const setDragonStateId = stableId("tempered-alatreon-mhw::act::set-dragon-state");

const activeState = makeFeat({
  seed: "active-state",
  name: "Active State (Mythic Trait)",
  img: IMG.dragon,
  identifier: "active-state",
  role: "activeState",
  sort: 100000,
  withMacro: true,
  description: `<p>The alatreon has three states: <strong>fire</strong>, <strong>dragon</strong>, and <strong>ice</strong>.</p>
<ul>
<li><strong>Fire State:</strong> immune to fire; vulnerable to cold. Token light turns orange-red.</li>
<li><strong>Dragon State:</strong> resistant to all damage except necrotic, poison, and psychic. Token light turns violet.</li>
<li><strong>Ice State:</strong> immune to cold; vulnerable to fire. Token light turns blue.</li>
</ul>
<p>It begins combat in fire or ice. Fire cycle order: fire → dragon → ice → dragon (repeat). Ice cycle order: ice → dragon → fire → dragon (repeat).</p>
<p>Whenever hit points are reduced by the <strong>Active State threshold</strong> in the current active state (base <strong>100</strong> HP at 820 max; scales with <strong>Hunters Quantity</strong>), it advances to the next state and uses <strong>Element Burst</strong> as a special reaction (even if it already used its reaction).</p>
<p><em>Use Start Fire Cycle / Start Ice Cycle for the opening order. Use Set Fire / Ice / Dragon State to jump manually (resets the state HP threshold; keeps the current cycle and resyncs Escaton readiness). Use Hunters Quantity before the fight to scale HP and thresholds.</em></p>`,
  chat: `<p>Mythic active state (fire / dragon / ice). Advance after the state HP threshold is lost; Element Burst special reaction. Manual Set State resets the threshold. Threshold scales with Hunters Quantity.</p>`,
  activities: {
    [startFireCycleId]: utilityActivity({
      id: startFireCycleId,
      name: "Start Fire Cycle",
      identifier: "start-fire-cycle",
      activationType: "special",
      img: IMG.fire,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      midiExtra: { autoTargetAction: "never", confirmTargets: "never" },
      sort: 0,
    }),
    [startIceCycleId]: utilityActivity({
      id: startIceCycleId,
      name: "Start Ice Cycle",
      identifier: "start-ice-cycle",
      activationType: "special",
      img: IMG.ice,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      midiExtra: { autoTargetAction: "never", confirmTargets: "never" },
      sort: 1000,
    }),
    [setFireStateId]: utilityActivity({
      id: setFireStateId,
      name: "Set Fire State",
      identifier: "set-fire-state",
      activationType: "special",
      img: IMG.fire,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      midiExtra: { autoTargetAction: "never", confirmTargets: "never" },
      sort: 2000,
    }),
    [setIceStateId]: utilityActivity({
      id: setIceStateId,
      name: "Set Ice State",
      identifier: "set-ice-state",
      activationType: "special",
      img: IMG.ice,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      midiExtra: { autoTargetAction: "never", confirmTargets: "never" },
      sort: 3000,
    }),
    [setDragonStateId]: utilityActivity({
      id: setDragonStateId,
      name: "Set Dragon State",
      identifier: "set-dragon-state",
      activationType: "special",
      img: IMG.dragon,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      midiExtra: { autoTargetAction: "never", confirmTargets: "never" },
      sort: 4000,
    }),
  },
  effects: [
    makeEffect({
      id: fireStateFxId,
      name: "Fire State",
      img: IMG.fire,
      kind: "fireState",
      disabled: false,
      daeExtra: { selfTargetAlways: true, showIcon: true },
      description:
        "Immune to fire. Vulnerable to cold. Suggested mythic legendary actions: Fireball, Fire Breath Y, Scorched Earth.",
      changes: [
        { key: "system.traits.di.value", mode: 2, value: "fire", priority: 20 },
        { key: "system.traits.dv.value", mode: 2, value: "cold", priority: 20 },
      ],
    }),
    makeEffect({
      id: dragonStateFxId,
      name: "Dragon State",
      img: IMG.dragon,
      kind: "dragonState",
      disabled: true,
      daeExtra: { selfTargetAlways: true, showIcon: true },
      description:
        "Resistant to all damage except necrotic, poison, and psychic. Suggested mythic legendary actions: Mythic Multiattack, Dragon Rush.",
      changes: DRAGON_DR_TYPES.map((t) => ({
        key: "system.traits.dr.value",
        mode: 2,
        value: t,
        priority: 20,
      })),
    }),
    makeEffect({
      id: iceStateFxId,
      name: "Ice State",
      img: IMG.ice,
      kind: "iceState",
      disabled: true,
      daeExtra: { selfTargetAlways: true, showIcon: true },
      description:
        "Immune to cold. Vulnerable to fire. Suggested mythic legendary actions: Frost Breath, Ice Shards.",
      changes: [
        { key: "system.traits.di.value", mode: 2, value: "cold", priority: 20 },
        { key: "system.traits.dv.value", mode: 2, value: "fire", priority: 20 },
      ],
    }),
  ],
});

const elementalOverload = makeFeat({
  seed: "elemental-overload",
  name: "Elemental Overload",
  img: IMG.overload,
  identifier: "elemental-overload",
  role: "elementalOverload",
  sort: 100100,
  uses: {
    // Displayed remaining = max - spent. Engine keeps remaining === current charges (0–60).
    spent: 60,
    max: "60",
    recovery: [],
  },
  description: `<p>The alatreon gains <strong>1 charge</strong> for every chunk of elemental damage (fire, cold, or lightning) it takes from a single attack or spell. The chunk size follows a soft <strong>Hunters Quantity</strong> curve (not 1:1 with boss HP): <strong>15</strong> (1–3 hunters), <strong>17</strong> (4), <strong>19</strong> (5), <strong>20</strong> (6; cap). Charges reduce Escaton Judgement by 1d6 each (max <strong>60</strong>, which zeroes Escaton from overload alone). Charges reset to 0 after <strong>Escaton Judgement</strong>.</p>
<p><em>Tracked on this feature's uses, on the token's second bar, and in <code>system.resources.overload</code> / <code>flags.world.alatreon.overloadCharges</code>.</em></p>`,
  chat: `<p>1 charge per soft-scaled elemental chunk (15→17→19→20 by hunters; max 60 charges). Shown on this feature and the token bar. Resets after Escaton Judgement.</p>`,
});

const huntersQuantityIds = Object.fromEntries(
  [1, 2, 3, 4, 5, 6].map((n) => [
    n,
    stableId(`tempered-alatreon-mhw::act::hunters-${n}`),
  ]),
);
const huntersQuantity = makeFeat({
  seed: "hunters-quantity",
  name: "Hunters Quantity",
  img: IMG.hunters,
  identifier: "hunters-quantity",
  role: "huntersQuantity",
  sort: 99900,
  withMacro: true,
  description: `<p>Scale Tempered Alatreon for the hunting party before combat. Uses Amellwind solo-boss HP rules, plus a toolbox extension for 6 hunters:</p>
<ul>
<li><strong>1–3 hunters:</strong> max HP (820) — Amellwind "maximize" baseline</li>
<li><strong>4 hunters:</strong> max HP + 50% (1230)</li>
<li><strong>5 hunters:</strong> max HP × 2 (1640)</li>
<li><strong>6 hunters:</strong> max HP × 2.5 (2050)</li>
</ul>
<p>Active State threshold and horn HP scale as fractions of boss max HP (100 / 820 and 200 / 820). Elemental Overload uses a soft curve: 15 (1–3) / 17 (4) / 19 (5) / 20 (6; cap).</p>
<p><em>Run one of the Set N Hunters activities once after placing the token. Current HP and unbroken horns scale proportionally; the state HP-lost counter resets.</em></p>`,
  chat: `<p>Apply Amellwind party HP scaling (1–5) + ×2.5 at 6. State threshold and horns scale with max HP; overload uses soft 15→20 curve.</p>`,
  activities: Object.fromEntries(
    [1, 2, 3, 4, 5, 6].map((n) => [
      huntersQuantityIds[n],
      utilityActivity({
        id: huntersQuantityIds[n],
        name: `Set ${n} Hunter${n === 1 ? "" : "s"}`,
        identifier: `hunters-${n}`,
        activationType: "special",
        img: IMG.hunters,
        range: rangeBlock(null, "self"),
        target: targetBlock({ affectsType: "self", prompt: false }),
        midiExtra: { autoTargetAction: "never", confirmTargets: "never" },
        sort: (n - 1) * 1000,
      }),
    ]),
  ),
});

const hornsSpawnId = stableId("tempered-alatreon-mhw::act::spawn-horns");
const hornsActId = stableId("tempered-alatreon-mhw::act::horns");
const horns = makeFeat({
  seed: "horns",
  name: "Horns",
  img: IMG.horn,
  identifier: "horns",
  role: "horns",
  sort: 100200,
  withMacro: true,
  description: `<p>The alatreon has two horns that can be attacked and broken separately:</p>
<ul>
<li><strong>AC 30</strong>; base <strong>200 hit points</strong> each at 820 boss HP (~200/820 of max). Scales with <strong>Hunters Quantity</strong>.</li>
<li>Resistant to bludgeoning, piercing, and slashing that do not deal siege damage.</li>
<li>Immune to poison, psychic, and the damage immunity from its current active state.</li>
<li>Deployed horn tokens sit at <strong>15 ft elevation</strong> (harder for grounded melee).</li>
</ul>
<p>Damage to a horn does not damage the alatreon. When a horn is broken, the alatreon reverts to its previous active state and Escaton Judgement loses <strong>10d6</strong>.</p>
<p><em>Use Deploy Horn Tokens to place both horns on the VTT (Foundry icon <code>icons/creatures/mammals/ox-bull-horned-glowing-orange.webp</code>). Attack those tokens, or use Apply Horn Damage as a manual fallback. Apply Hunters Quantity before deploying if the party is not 3 hunters. Deploy persists horn actor/token ids on the boss in <code>flags.world.alatreon.hornRefs</code>.</em></p>`,
  chat: `<p>Two horns: AC 30, HP scales with Hunters Quantity (base 200 at 820 boss HP), 15 ft elevation. Breaking a horn reverts the previous active state and weakens Escaton.</p>`,
  activities: {
    [hornsSpawnId]: utilityActivity({
      id: hornsSpawnId,
      name: "Deploy Horn Tokens",
      identifier: "spawn-horns",
      activationType: "special",
      img: "icons/creatures/mammals/ox-bull-horned-glowing-orange.webp",
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      midiExtra: { autoTargetAction: "never", confirmTargets: "never" },
      sort: 0,
    }),
    [hornsActId]: utilityActivity({
      id: hornsActId,
      name: "Apply Horn Damage",
      identifier: "apply-horn-damage",
      activationType: "special",
      img: IMG.horn,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      midiExtra: { autoTargetAction: "never", confirmTargets: "never" },
      sort: 1000,
    }),
  },
});

const legendaryLimit = makeFeat({
  seed: "legendary-limit",
  name: "Legendary Limit",
  img: IMG.legendary,
  identifier: "legendary-limit",
  role: "legendaryLimit",
  sort: 100300,
  description: `<p>The alatreon can only use each legendary action once per round.</p>
<p><em>Enforced via actor flags (<code>world.alatreon.legendaryUsedThisRound</code>).</em></p>`,
  chat: `<p>Each legendary action option once per round.</p>`,
});

const legendaryResistanceId = stableId("tempered-alatreon-mhw::act::legres");
const legendaryResistance = makeFeat({
  seed: "legendary-resistance",
  name: "Legendary Resistance (3/Day)",
  img: IMG.legendary,
  identifier: "legendary-resistance",
  role: "legendaryResistance",
  sort: 100400,
  uses: dayUses(3),
  description: `<p>If the alatreon fails a saving throw, it can choose to succeed instead.</p>`,
  chat: `<p>Succeed on a failed saving throw (3/Day).</p>`,
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

const magicResFxId = stableId("tempered-alatreon-mhw::fx::magic-res");
const magicResistance = makeFeat({
  seed: "magic-resistance",
  name: "Magic Resistance",
  img: IMG.magic,
  identifier: "magic-resistance",
  role: "magicResistance",
  sort: 100500,
  description: `<p>The alatreon has advantage on saving throws against spells and other magical effects.</p>`,
  chat: `<p>Advantage on saves against spells and magical effects.</p>`,
  effects: [
    makeEffect({
      id: magicResFxId,
      name: "Magic Resistance",
      img: IMG.magic,
      kind: "magicResistance",
      daeExtra: { selfTargetAlways: true, showIcon: true },
      description: "Advantage on saving throws against spells and other magical effects.",
      changes: [
        { key: "flags.midi-qol.magicResistance.all", mode: 5, value: "1", priority: 20 },
      ],
    }),
  ],
});

const magicWeapons = makeFeat({
  seed: "magic-weapons",
  name: "Magic Weapons",
  img: IMG.weapon,
  identifier: "magic-weapons",
  role: "magicWeapons",
  sort: 100600,
  description: `<p>The alatreon's weapon attacks count as magical for the purpose of overcoming resistance and immunity to nonmagical attacks and damage.</p>
<p><em>Natural weapons include the Magical (<code>mgc</code>) property.</em></p>`,
  chat: `<p>Weapon attacks count as magical.</p>`,
});

// ─── Actions ─────────────────────────────────────────────────────────────────

const multiId = stableId("tempered-alatreon-mhw::act::multi");
const multiattack = makeFeat({
  seed: "multiattack",
  name: "Multiattack",
  img: IMG.claw,
  identifier: "multiattack",
  role: "multiattack",
  sort: 200000,
  description: `<p>The alatreon makes two <strong>Claw</strong> attacks and one <strong>Bite</strong> or <strong>Tail</strong> attack.</p>`,
  chat: `<p>Two Claws and one Bite or Tail.</p>`,
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

const dragonblightBiteId = stableId("tempered-alatreon-mhw::fx::dragonblight-bite");
const biteSaveId = stableId("tempered-alatreon-mhw::act::bite-dragonblight-save");
const bite = makeNaturalWeapon({
  seed: "bite",
  name: "Bite",
  img: IMG.bite,
  identifier: "bite",
  role: "bite",
  reach: 15,
  baseNumber: 4,
  baseDenom: 8,
  baseType: "piercing",
  extraParts: [damagePart(1, 6, "necrotic")],
  withMacro: true,
  sort: 200100,
  description: `<p><em>Melee Weapon Attack:</em> +19 to hit, reach 15 ft., one target.</p>
<p><em>Hit:</em> <strong>28 (4d8 + 10)</strong> piercing damage plus <strong>3 (1d6)</strong> necrotic damage, and the target must succeed on a <strong>DC 27 Constitution</strong> saving throw or be afflicted with <strong>dragonblight</strong> for 1 minute. Repeat the save at the end of each of its turns, ending the blight on a success.</p>
<p><em>On hit, Midi runs the linked Constitution save (player owner); Dragonblight applies on a fail.</em></p>`,
  chat: `<p>+19 to hit, 4d8+10 piercing + 1d6 necrotic; DC 27 Con or dragonblight.</p>`,
  otherSave: {
    id: biteSaveId,
    name: "Dragonblight Save",
    identifier: "bite-dragonblight-save",
    saveAbility: "con",
    saveDc: 27,
    effectIds: [dragonblightBiteId],
    img: IMG.blight,
  },
  effects: [
    makeEffect({
      id: dragonblightBiteId,
      name: "Dragonblight",
      img: IMG.blight,
      kind: "dragonblight",
      transfer: false,
      durationSeconds: 60,
      description: "Afflicted with dragonblight. DC 27 Con at end of turn to end.",
      changes: [
        { key: "flags.world.alatreon.dragonblight", mode: 5, value: "1", priority: 20 },
      ],
      extraFlags: blightOverTime("Dragonblight"),
    }),
  ],
});

const dragonblightClawId = stableId("tempered-alatreon-mhw::fx::dragonblight-claw");
const clawsSaveId = stableId("tempered-alatreon-mhw::act::claws-dragonblight-save");
const claws = makeNaturalWeapon({
  seed: "claws",
  name: "Claws",
  img: IMG.claw,
  identifier: "claws",
  role: "claws",
  reach: 10,
  baseNumber: 2,
  baseDenom: 6,
  baseType: "slashing",
  extraParts: [damagePart(1, 6, "necrotic")],
  withMacro: true,
  sort: 200200,
  description: `<p><em>Melee Weapon Attack:</em> +19 to hit, reach 10 ft., one target.</p>
<p><em>Hit:</em> <strong>17 (2d6 + 10)</strong> slashing damage plus <strong>3 (1d6)</strong> necrotic damage, and the target must succeed on a <strong>DC 27 Constitution</strong> saving throw or be afflicted with <strong>dragonblight</strong> for 1 minute. Repeat the save at the end of each of its turns, ending the blight on a success.</p>
<p><em>On hit, Midi runs the linked Constitution save (player owner); Dragonblight applies on a fail.</em></p>`,
  chat: `<p>+19 to hit, 2d6+10 slashing + 1d6 necrotic; DC 27 Con or dragonblight.</p>`,
  otherSave: {
    id: clawsSaveId,
    name: "Dragonblight Save",
    identifier: "claws-dragonblight-save",
    saveAbility: "con",
    saveDc: 27,
    effectIds: [dragonblightClawId],
    img: IMG.blight,
  },
  effects: [
    makeEffect({
      id: dragonblightClawId,
      name: "Dragonblight",
      img: IMG.blight,
      kind: "dragonblight",
      transfer: false,
      durationSeconds: 60,
      description: "Afflicted with dragonblight. DC 27 Con at end of turn to end.",
      changes: [
        { key: "flags.world.alatreon.dragonblight", mode: 5, value: "1", priority: 20 },
      ],
      extraFlags: blightOverTime("Dragonblight"),
    }),
  ],
});

const proneTailId = stableId("tempered-alatreon-mhw::fx::tail-prone");
const tailSaveId = stableId("tempered-alatreon-mhw::act::tail-prone-save");
const tail = makeNaturalWeapon({
  seed: "tail",
  name: "Tail",
  img: IMG.tail,
  identifier: "tail",
  role: "tail",
  reach: 20,
  baseNumber: 4,
  baseDenom: 10,
  baseType: "bludgeoning",
  extraParts: [],
  withMacro: true,
  sort: 200300,
  description: `<p><em>Melee Weapon Attack:</em> +19 to hit, reach 20 ft., one target.</p>
<p><em>Hit:</em> <strong>32 (4d10 + 10)</strong> bludgeoning damage, and the target must succeed on a <strong>DC 27 Strength</strong> saving throw or be knocked <strong>prone</strong>.</p>
<p><em>On hit, Midi runs the linked Strength save (player owner); Prone applies on a fail.</em></p>`,
  chat: `<p>+19 to hit, 4d10+10 bludgeoning; DC 27 Str or prone.</p>`,
  otherSave: {
    id: tailSaveId,
    name: "Knock Prone",
    identifier: "tail-prone-save",
    saveAbility: "str",
    saveDc: 27,
    effectIds: [proneTailId],
    img: "systems/dnd5e/icons/svg/statuses/prone.svg",
  },
  effects: [
    makeEffect({
      id: proneTailId,
      name: "Prone",
      img: "systems/dnd5e/icons/svg/statuses/prone.svg",
      kind: "prone",
      transfer: false,
      statuses: ["prone"],
      description: "Knocked prone by Tail.",
      changes: [],
    }),
  ],
});

const breathActId = stableId("tempered-alatreon-mhw::act::elemental-breath");
const elementalBreath = makeFeat({
  seed: "elemental-breath",
  name: "Elemental Breath",
  img: IMG.breath,
  identifier: "elemental-breath",
  role: "elementalBreath",
  sort: 200400,
  withMacro: true,
  uses: rechargeUses("5"),
  description: `<p><strong>Recharge 5–6.</strong> Roll a d4 to determine the element: 1 fire, 2 cold, 3 necrotic, 4 lightning. The alatreon exhales that element in a <strong>120-foot line</strong> that is <strong>10 feet</strong> wide. Each creature in the line must make a <strong>DC 27 Dexterity</strong> saving throw, taking <strong>63 (18d6)</strong> damage of the rolled type on a failed save, or half as much on a successful one.</p>
<p><em>Place the line template for targeting. Midi runs the Dex save only; the module rolls the d4 + 18d6 of that type and applies half on a successful save.</em></p>`,
  chat: `<p>Recharge 5–6. 120-ft × 10-ft line, DC 27 Dex, 18d6 (type by d4).</p>`,
  activities: {
    [breathActId]: saveActivity({
      id: breathActId,
      name: "Elemental Breath",
      identifier: "elemental-breath",
      activationType: "action",
      img: IMG.breath,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "line",
        templateSize: "120",
        templateWidth: "10",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 27,
      // No Midi damage — engine rolls d4 type + 18d6 after the save (Midi always kept fire).
      parts: [],
      onSave: "none",
      consume: consumeItemUses(1),
      uses: emptyUses(),
      midiExtra: {
        autoTargetAction: "default",
        confirmTargets: "never",
      },
    }),
  },
});

const escatonChargeId = stableId("tempered-alatreon-mhw::act::escaton-charge");
const escatonReleaseId = stableId("tempered-alatreon-mhw::act::escaton-release");
const escatonChargingFxId = stableId("tempered-alatreon-mhw::fx::escaton-charging");
const escatonJudgement = makeFeat({
  seed: "escaton-judgement",
  name: "Escaton Judgement",
  img: IMG.escaton,
  identifier: "escaton-judgement",
  role: "escatonJudgement",
  sort: 200500,
  withMacro: true,
  description: `<p><strong>Suggested timing:</strong> once during the second dragon state each time the active-state order repeats (the module still tracks readiness for GM whispers, but Charge/Release can be used anytime from the sheet).</p>
<p><strong>Charge (action):</strong> The alatreon swoops down (no opportunity attacks) if airborne and gathers energy until the start of its next turn. While charging it is immune to incapacitated, stunned, paralyzed, and unconscious.</p>
<p><strong>Release (action, next turn):</strong> Energy erupts in a <strong>600-foot-radius sphere</strong>. Terrain above ground level in the area is obliterated. Each creature must make a <strong>DC 30 Dexterity</strong> saving throw, taking <strong>210 (60d6)</strong> force damage on a failed save, or half as much on a success.</p>
<p>Against this damage, force traits are inverted: <strong>immunity</strong> becomes resistance, <strong>resistance</strong> becomes normal damage, and creatures with neither are <strong>vulnerable</strong>.</p>
<p>Reduce damage by <strong>10d6</strong> per broken horn, and by an additional <strong>#d6</strong> equal to Elemental Overload charges.</p>
<p><em>Release is a Midi save activity (player owners roll). The module sets dice from horns/overload and applies force-trait inversion after the save. Automation chat is whispered to GMs only.</em></p>`,
  chat: `<p>Charge, then Release anytime from the sheet: 600-ft sphere, DC 30 Dex, 60d6 force (reduced by horns and overload; force traits invert).</p>`,
  activities: {
    [escatonChargeId]: utilityActivity({
      id: escatonChargeId,
      name: "Charge",
      identifier: "escaton-charge",
      activationType: "action",
      img: IMG.escaton,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      midiExtra: { autoTargetAction: "never", confirmTargets: "never" },
      sort: 0,
    }),
    [escatonReleaseId]: saveActivity({
      id: escatonReleaseId,
      name: "Release",
      identifier: "escaton-release",
      activationType: "action",
      img: IMG.escaton,
      range: rangeBlock(600),
      target: targetBlock({
        templateType: "sphere",
        templateSize: "600",
        affectsType: "creature",
        prompt: false,
      }),
      saveAbility: "dex",
      saveDc: 30,
      // No Midi damage — engine rolls Nd6 (horns/overload) and applies force-trait inversion.
      parts: [],
      onSave: "none",
      midiExtra: {
        autoTargetAction: "never",
        confirmTargets: "never",
      },
      sort: 1000,
    }),
  },
  effects: [
    makeEffect({
      id: escatonChargingFxId,
      name: "Escaton Judgement — Charging",
      img: IMG.escaton,
      kind: "escatonCharging",
      disabled: true,
      daeExtra: { selfTargetAlways: true, showIcon: true },
      description: "Gathering energy. Immune to incapacitated, stunned, paralyzed, and unconscious.",
      changes: [
        { key: "system.traits.ci.value", mode: 2, value: "incapacitated", priority: 20 },
        { key: "system.traits.ci.value", mode: 2, value: "stunned", priority: 20 },
        { key: "system.traits.ci.value", mode: 2, value: "paralyzed", priority: 20 },
        { key: "system.traits.ci.value", mode: 2, value: "unconscious", priority: 20 },
      ],
    }),
  ],
});

// ─── Reactions ───────────────────────────────────────────────────────────────

const burstActId = stableId("tempered-alatreon-mhw::act::element-burst");
const elementBurst = makeFeat({
  seed: "element-burst",
  name: "Element Burst",
  img: IMG.burst,
  identifier: "element-burst",
  role: "elementBurst",
  sort: 300000,
  withMacro: true,
  description: `<p>When the alatreon changes active states, it can use this special reaction to release elemental energy. Each creature in a <strong>30-foot-radius sphere</strong> must make a <strong>DC 27 Dexterity</strong> saving throw, taking <strong>24 (7d6)</strong> damage on a failed save, or half as much on a success.</p>
<p>Damage type matches the <strong>new</strong> state: fire (fire), necrotic (dragon), cold (ice).</p>
<p><em>Midi runs the Dex save only (no Midi damage). The module rolls 7d6 of the state type and applies half on a successful save — same pattern as Escaton Release.</em></p>`,
  chat: `<p>Special reaction on state change: 30-ft sphere, DC 27 Dex, 7d6 (type by new state).</p>`,
  activities: {
    [burstActId]: saveActivity({
      id: burstActId,
      name: "Element Burst",
      identifier: "element-burst",
      activationType: "reaction",
      condition: "When the alatreon changes active states",
      img: IMG.burst,
      range: rangeBlock(null, "self"),
      // Engine passes targetUuids via completeActivityUse — same as Escaton Release.
      // prompt/autoTarget would place a template and wipe those targets → "No targets to save".
      target: targetBlock({
        templateType: "sphere",
        templateSize: "30",
        affectsType: "creature",
        prompt: false,
      }),
      saveAbility: "dex",
      saveDc: 27,
      // No Midi damage — engine rolls 7d6 of the Active State type after the save.
      parts: [],
      onSave: "none",
      midiExtra: {
        autoTargetAction: "never",
        confirmTargets: "never",
      },
    }),
  },
});

// ─── Legendary Actions ───────────────────────────────────────────────────────

const flyActId = stableId("tempered-alatreon-mhw::act::fly");
const fly = makeFeat({
  seed: "fly",
  name: "Fly",
  img: IMG.fly,
  identifier: "fly",
  role: "fly",
  sort: 400000,
  description: `<p><strong>Legendary Action.</strong> The alatreon flies up to half its fly speed without provoking opportunity attacks.</p>`,
  chat: `<p>Legendary: fly up to half fly speed, no OA.</p>`,
  activities: {
    [flyActId]: utilityActivity({
      id: flyActId,
      name: "Fly",
      identifier: "fly",
      activationType: "legendary",
      img: IMG.fly,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      consume: consumeLegendary(1),
    }),
  },
});

const detectActId = stableId("tempered-alatreon-mhw::act::detect");
const detect = makeFeat({
  seed: "detect",
  name: "Detect",
  img: IMG.detect,
  identifier: "detect",
  role: "detect",
  sort: 400100,
  description: `<p><strong>Legendary Action.</strong> The alatreon makes a Wisdom (Perception) check.</p>`,
  chat: `<p>Legendary: Wisdom (Perception) check.</p>`,
  activities: {
    [detectActId]: utilityActivity({
      id: detectActId,
      name: "Detect",
      identifier: "detect",
      activationType: "legendary",
      img: IMG.detect,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      consume: consumeLegendary(1),
      rollFormula: "1d20 + @skills.prc.total",
      rollName: "Perception",
      rollPrompt: true,
    }),
  },
});

const waterblightId = stableId("tempered-alatreon-mhw::fx::waterblight");
const waterBreathActId = stableId("tempered-alatreon-mhw::act::water-breath");
const waterBreath = makeFeat({
  seed: "water-breath",
  name: "Water Breath",
  img: IMG.water,
  identifier: "water-breath",
  role: "waterBreath",
  sort: 400200,
  withMacro: true,
  description: `<p><strong>Legendary Action.</strong> The alatreon fires five water globules at different points within a <strong>150-foot cone</strong>. Each creature within <strong>5 feet</strong> of a point must make a <strong>DC 27 Dexterity</strong> saving throw or take <strong>14 (4d6)</strong> acid damage and be afflicted with <strong>waterblight</strong> for 1 minute (half damage and no blight on a success). A creature in more than one globule's area makes the save at disadvantage but takes no extra damage. Repeat Con save at end of turn to end waterblight.</p>
<p><em>Template is a 150-ft cone for placement; engine applies waterblight on failed saves.</em></p>`,
  chat: `<p>Legendary: 150-ft cone (5-ft globules), DC 27 Dex, 4d6 acid + waterblight.</p>`,
  activities: {
    [waterBreathActId]: saveActivity({
      id: waterBreathActId,
      name: "Water Breath",
      identifier: "water-breath",
      activationType: "legendary",
      img: IMG.water,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "cone",
        templateSize: "150",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 27,
      parts: [damagePart(4, 6, "acid")],
      consume: consumeLegendary(1),
      effects: [{ _id: waterblightId, onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
  effects: [
    makeEffect({
      id: waterblightId,
      name: "Waterblight",
      img: IMG.water,
      kind: "waterblight",
      transfer: false,
      durationSeconds: 60,
      description: "Afflicted with waterblight. DC 27 Con at end of turn to end.",
      changes: [],
      extraFlags: blightOverTime("Waterblight"),
    }),
  ],
});

const thunderblightArcId = stableId("tempered-alatreon-mhw::fx::thunderblight-arc");
const arcLightningActId = stableId("tempered-alatreon-mhw::act::arc-lightning");
const arcLightning = makeFeat({
  seed: "arc-lightning",
  name: "Arc Lightning",
  img: IMG.lightning,
  identifier: "arc-lightning",
  role: "arcLightning",
  sort: 400300,
  withMacro: true,
  description: `<p><strong>Legendary Action.</strong> Lightning strikes from a space within 120 feet along a <strong>45-foot line</strong> (5 feet wide), then a second 45-foot line that begins in or passes through a 5-foot space of the first. Each creature in a line must make a <strong>DC 27 Dexterity</strong> saving throw or take <strong>22 (5d8)</strong> lightning damage and be afflicted with <strong>thunderblight</strong> for 1 minute (half damage and no blight on a success). Creatures in more than one line save at disadvantage with no extra damage.</p>
<p><em>Place the primary line; engine applies thunderblight on fail.</em></p>`,
  chat: `<p>Legendary: 45-ft line(s), DC 27 Dex, 5d8 lightning + thunderblight.</p>`,
  activities: {
    [arcLightningActId]: saveActivity({
      id: arcLightningActId,
      name: "Arc Lightning",
      identifier: "arc-lightning",
      activationType: "legendary",
      img: IMG.lightning,
      range: rangeBlock(120),
      target: targetBlock({
        templateType: "line",
        templateSize: "45",
        templateWidth: "5",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 27,
      parts: [damagePart(5, 8, "lightning")],
      consume: consumeLegendary(1),
      effects: [{ _id: thunderblightArcId, onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
  effects: [
    makeEffect({
      id: thunderblightArcId,
      name: "Thunderblight",
      img: IMG.lightning,
      kind: "thunderblight",
      transfer: false,
      durationSeconds: 60,
      description: "Afflicted with thunderblight. DC 27 Con at end of turn to end.",
      changes: [
        { key: "flags.world.alatreon.thunderblight", mode: 5, value: "1", priority: 20 },
      ],
      extraFlags: blightOverTime("Thunderblight"),
    }),
  ],
});

const thunderblightStormId = stableId("tempered-alatreon-mhw::fx::thunderblight-storm");
const lightningStormActId = stableId("tempered-alatreon-mhw::act::lightning-storm");
const lightningStorm = makeFeat({
  seed: "lightning-storm",
  name: "Lightning Storm",
  img: IMG.storm,
  identifier: "lightning-storm",
  role: "lightningStorm",
  sort: 400400,
  withMacro: true,
  description: `<p><strong>Legendary Action.</strong> Choose three creatures within <strong>120 feet</strong>. Each must make a <strong>DC 27 Dexterity</strong> saving throw, taking <strong>22 (4d10)</strong> lightning damage and <strong>thunderblight</strong> for 1 minute on a failed save, or half damage and no blight on a success. Repeat Con save at end of turn to end thunderblight.</p>
<p><em>Engine applies thunderblight on failed saves.</em></p>`,
  chat: `<p>Legendary: 3 creatures within 120 ft, DC 27 Dex, 4d10 lightning + thunderblight.</p>`,
  activities: {
    [lightningStormActId]: saveActivity({
      id: lightningStormActId,
      name: "Lightning Storm",
      identifier: "lightning-storm",
      activationType: "legendary",
      img: IMG.storm,
      range: rangeBlock(120),
      target: targetBlock({
        affectsType: "creature",
        affectsCount: "3",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 27,
      parts: [damagePart(4, 10, "lightning")],
      consume: consumeLegendary(1),
      effects: [{ _id: thunderblightStormId, onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
  effects: [
    makeEffect({
      id: thunderblightStormId,
      name: "Thunderblight",
      img: IMG.lightning,
      kind: "thunderblight",
      transfer: false,
      durationSeconds: 60,
      description: "Afflicted with thunderblight. DC 27 Con at end of turn to end.",
      changes: [
        { key: "flags.world.alatreon.thunderblight", mode: 5, value: "1", priority: 20 },
      ],
      extraFlags: blightOverTime("Thunderblight"),
    }),
  ],
});

// ─── Mythic Legendary Actions ────────────────────────────────────────────────

const mythicMultiId = stableId("tempered-alatreon-mhw::act::mythic-multi");
const mythicMultiattack = makeFeat({
  seed: "mythic-multiattack",
  name: "Mythic Multiattack",
  img: IMG.claw,
  identifier: "mythic-multiattack",
  role: "mythicMultiattack",
  sort: 500000,
  description: `<p><strong>Legendary Action (suggested in Dragon State).</strong> The alatreon uses its Multiattack.</p>`,
  chat: `<p>Legendary (dragon): use Multiattack.</p>`,
  activities: {
    [mythicMultiId]: utilityActivity({
      id: mythicMultiId,
      name: "Mythic Multiattack",
      identifier: "mythic-multiattack",
      activationType: "legendary",
      img: IMG.claw,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      consume: consumeLegendary(1),
    }),
  },
});

const dragonRushProneId = stableId("tempered-alatreon-mhw::fx::dragon-rush-prone");
const dragonRushActId = stableId("tempered-alatreon-mhw::act::dragon-rush");
const dragonRush = makeFeat({
  seed: "dragon-rush",
  name: "Dragon Rush",
  img: IMG.rush,
  identifier: "dragon-rush",
  role: "dragonRush",
  sort: 500100,
  withMacro: true,
  description: `<p><strong>Legendary Action (suggested in Dragon State).</strong> The alatreon moves up to half its fly speed in a straight line, moving through creatures without provoking opportunity attacks. Each creature or object it moves through must succeed on a <strong>DC 27 Dexterity</strong> saving throw or take <strong>17 (2d6 + 10)</strong> slashing plus <strong>10 (3d6)</strong> necrotic damage and be knocked <strong>prone</strong> (half damage and not prone on a success).</p>`,
  chat: `<p>Legendary (dragon): rush, DC 27 Dex, 2d6+10 slash + 3d6 necrotic, prone on fail.</p>`,
  activities: {
    [dragonRushActId]: saveActivity({
      id: dragonRushActId,
      name: "Dragon Rush",
      identifier: "dragon-rush",
      activationType: "legendary",
      img: IMG.rush,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "line",
        templateSize: "60",
        templateWidth: "15",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 27,
      parts: [damagePart(2, 6, "slashing", "+10"), damagePart(3, 6, "necrotic")],
      consume: consumeLegendary(1),
      effects: [{ _id: dragonRushProneId, onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
  effects: [
    makeEffect({
      id: dragonRushProneId,
      name: "Prone",
      img: "systems/dnd5e/icons/svg/statuses/prone.svg",
      kind: "prone",
      transfer: false,
      statuses: ["prone"],
      description: "Knocked prone by Dragon Rush.",
      changes: [],
    }),
  ],
});

const fireballActId = stableId("tempered-alatreon-mhw::act::fireball");
const fireball = makeFeat({
  seed: "fireball",
  name: "Fireball",
  img: IMG.fireball,
  identifier: "fireball",
  role: "fireball",
  sort: 500200,
  description: `<p><strong>Legendary Action (suggested in Fire State).</strong> The alatreon exhales a fireball that explodes at a point within <strong>120 feet</strong>. Each creature in a <strong>15-foot-radius sphere</strong> must make a <strong>DC 27 Dexterity</strong> saving throw, taking <strong>28 (8d6)</strong> fire damage on a failed save, or half as much on a success.</p>`,
  chat: `<p>Legendary (fire): 15-ft sphere within 120 ft, DC 27 Dex, 8d6 fire.</p>`,
  activities: {
    [fireballActId]: saveActivity({
      id: fireballActId,
      name: "Fireball",
      identifier: "fireball",
      activationType: "legendary",
      img: IMG.fireball,
      range: rangeBlock(120),
      target: targetBlock({
        templateType: "sphere",
        templateSize: "15",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 27,
      parts: [damagePart(8, 6, "fire")],
      consume: consumeLegendary(1),
    }),
  },
});

const fireBreathYActId = stableId("tempered-alatreon-mhw::act::fire-breath-y");
const fireBreathY = makeFeat({
  seed: "fire-breath-y",
  name: "Fire Breath Y",
  img: IMG.fire,
  identifier: "fire-breath-y",
  role: "fireBreathY",
  sort: 500300,
  withMacro: true,
  description: `<p><strong>Legendary Action (suggested in Fire State).</strong> The alatreon exhales fire in a <strong>45-foot line</strong> (5 feet wide) that splits into two more 30-foot lines forming a "Y". Each creature in a line must make a <strong>DC 27 Dexterity</strong> saving throw, taking <strong>35 (10d6)</strong> fire damage on a failed save, or half as much on a success.</p>
<p><em>Primary line is the template; fork placement may be assisted by the engine.</em></p>`,
  chat: `<p>Legendary (fire): Y-shaped lines, DC 27 Dex, 10d6 fire.</p>`,
  activities: {
    [fireBreathYActId]: saveActivity({
      id: fireBreathYActId,
      name: "Fire Breath Y",
      identifier: "fire-breath-y",
      activationType: "legendary",
      img: IMG.fire,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "line",
        templateSize: "45",
        templateWidth: "5",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 27,
      parts: [damagePart(10, 6, "fire")],
      consume: consumeLegendary(1),
    }),
  },
});

const scorchedEarthActId = stableId("tempered-alatreon-mhw::act::scorched-earth");
const scorchedEarth = makeFeat({
  seed: "scorched-earth",
  name: "Scorched Earth",
  img: IMG.scorched,
  identifier: "scorched-earth",
  role: "scorchedEarth",
  sort: 500400,
  withMacro: true,
  description: `<p><strong>Legendary Action (suggested in Fire State).</strong> The alatreon rises 30 feet (no OA) and exhales flames covering the ground in a <strong>30-foot radius</strong> centered on a point directly below it. The ground burns until the start of its next turn. Creatures that start their turn in the area or enter it take <strong>10 (3d6)</strong> fire and ignite (2d6 fire at start of their turns until doused). Moving through the area deals <strong>7 (2d6)</strong> fire per 5 feet.</p>
<p><em>Places a burning-ground template (engine).</em></p>`,
  chat: `<p>Legendary (fire): 30-ft burning ground until start of next turn.</p>`,
  activities: {
    [scorchedEarthActId]: utilityActivity({
      id: scorchedEarthActId,
      name: "Scorched Earth",
      identifier: "scorched-earth",
      activationType: "legendary",
      img: IMG.scorched,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "radius",
        templateSize: "30",
        affectsType: "creature",
        prompt: true,
      }),
      consume: consumeLegendary(1),
    }),
  },
});

const iceblightFrostId = stableId("tempered-alatreon-mhw::fx::iceblight-frost");
const frostBreathActId = stableId("tempered-alatreon-mhw::act::frost-breath");
const frostZoneTurnActId = stableId("tempered-alatreon-mhw::act::frost-zone-turn");
const frostBreath = makeFeat({
  seed: "frost-breath",
  name: "Frost Breath",
  img: IMG.frost,
  identifier: "frost-breath",
  role: "frostBreath",
  sort: 500500,
  withMacro: true,
  description: `<p><strong>Legendary Action (suggested in Ice State).</strong> The alatreon rises 30 feet (no OA) and exhales frost covering the ground in a <strong>30-foot radius</strong> below it until the start of its next turn. Each creature that starts its turn there must make a <strong>DC 27 Constitution</strong> saving throw or take <strong>17 (5d6)</strong> cold damage and <strong>iceblight</strong> for 1 minute (half damage and no blight on a success). Moving through the area deals <strong>7 (2d6)</strong> cold per 5 feet.</p>
<p><em>Places an ice-zone template. Start-of-turn ticks use the Frost Zone — Start of Turn save activity (Midi / player owners). Movement cold stays module-scripted.</em></p>`,
  chat: `<p>Legendary (ice): 30-ft frost zone, DC 27 Con, 5d6 cold + iceblight.</p>`,
  activities: {
    [frostBreathActId]: saveActivity({
      id: frostBreathActId,
      name: "Frost Breath",
      identifier: "frost-breath",
      activationType: "legendary",
      img: IMG.frost,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "radius",
        templateSize: "30",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "con",
      saveDc: 27,
      parts: [damagePart(5, 6, "cold")],
      consume: consumeLegendary(1),
      effects: [{ _id: iceblightFrostId, onSave: false }],
      effectConditionText: "failedSave",
    }),
    [frostZoneTurnActId]: saveActivity({
      id: frostZoneTurnActId,
      name: "Frost Zone — Start of Turn",
      identifier: "frost-zone-turn",
      activationType: "special",
      img: IMG.frost,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "creature", affectsCount: "1", prompt: false }),
      saveAbility: "con",
      saveDc: 27,
      parts: [damagePart(5, 6, "cold")],
      effects: [{ _id: iceblightFrostId, onSave: false }],
      effectConditionText: "failedSave",
      midiExtra: {
        autoTargetAction: "never",
        confirmTargets: "never",
        automationOnly: true,
      },
      sort: 1000,
    }),
  },
  effects: [
    makeEffect({
      id: iceblightFrostId,
      name: "Iceblight",
      img: IMG.ice,
      kind: "iceblight",
      transfer: false,
      durationSeconds: 60,
      description: "Speed halved. Restricted reactions/attacks per iceblight rules. DC 27 Con at end of turn to end.",
      changes: [
        { key: "system.attributes.movement.all", mode: 1, value: "0.5", priority: 20 },
      ],
      extraFlags: blightOverTime("Iceblight"),
    }),
  ],
});

const iceShardsProneId = stableId("tempered-alatreon-mhw::fx::ice-shards-prone");
const iceShardsActId = stableId("tempered-alatreon-mhw::act::ice-shards");
const iceShards = makeFeat({
  seed: "ice-shards",
  name: "Ice Shards",
  img: IMG.shards,
  identifier: "ice-shards",
  role: "iceShards",
  sort: 500600,
  withMacro: true,
  description: `<p><strong>Legendary Action (suggested in Ice State).</strong> Ice shards form above each creature in a <strong>90-foot radius</strong> and plummet. Each creature must make a <strong>DC 27 Dexterity</strong> saving throw, taking <strong>13 (3d8)</strong> cold plus <strong>18 (4d8)</strong> bludgeoning damage, being pushed 5 feet, and knocked <strong>prone</strong> on a fail (half damage, pushed, not prone on a success). Ice-chunk <strong>tokens</strong> remain on the canvas until the start of the alatreon's next turn (AC 10; 10 HP; vulnerable to fire; immune to cold, poison, psychic). If an ice shard takes necrotic damage, it explodes in a 15-ft radius for 1d8 piercing.</p>
<p><em>Engine spawns Ice Shard tokens for creatures in the area, applies prone on fail, melts tokens on Alatreon's next turn, and auto-explodes on necrotic.</em></p>`,
  chat: `<p>Legendary (ice): 90-ft radius, DC 27 Dex, 3d8 cold + 4d8 bludgeoning, prone on fail; ice-chunk tokens on canvas.</p>`,
  activities: {
    [iceShardsActId]: saveActivity({
      id: iceShardsActId,
      name: "Ice Shards",
      identifier: "ice-shards",
      activationType: "legendary",
      img: IMG.shards,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "radius",
        templateSize: "90",
        affectsType: "creature",
        prompt: true,
      }),
      saveAbility: "dex",
      saveDc: 27,
      parts: [damagePart(3, 8, "cold"), damagePart(4, 8, "bludgeoning")],
      consume: consumeLegendary(1),
      effects: [{ _id: iceShardsProneId, onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
  effects: [
    makeEffect({
      id: iceShardsProneId,
      name: "Prone",
      img: "systems/dnd5e/icons/svg/statuses/prone.svg",
      kind: "prone",
      transfer: false,
      statuses: ["prone"],
      description: "Knocked prone by Ice Shards.",
      changes: [],
    }),
  ],
});

// ─── Assemble ────────────────────────────────────────────────────────────────

const items = [
  huntersQuantity,
  activeState,
  elementalOverload,
  horns,
  legendaryLimit,
  legendaryResistance,
  magicResistance,
  magicWeapons,
  multiattack,
  bite,
  claws,
  tail,
  elementalBreath,
  escatonJudgement,
  elementBurst,
  fly,
  detect,
  waterBreath,
  arcLightning,
  lightningStorm,
  mythicMultiattack,
  dragonRush,
  fireball,
  fireBreathY,
  scorchedEarth,
  frostBreath,
  iceShards,
];

const biography = `<h2>Tempered Alatreon (MHW)</h2>
<p><em>Gargantuan dragon (elder), unaligned — Challenge 30</em></p>
<p>An Elder Dragon that cycles through fire, dragon, and ice states. Place the token, set the opening cycle with Active State, and use sheet features. State changes, horn tracking, Elemental Overload, Element Burst, Escaton Judgement, and blight applications run from the Amellwind module script.</p>
<h3>Combat notes</h3>
<ul>
<li><strong>Hunters Quantity:</strong> set 1–6 before the fight. Amellwind solo-boss HP (3 max / 4 +50% / 5 ×2) plus ×2.5 at 6. State threshold (~100/820) and horn HP (~200/820) scale with max HP. Overload soft curve: 15 / 17 / 19 / 20 (cap).</li>
<li><strong>Active State:</strong> starts Fire (or Ice via Start Ice Cycle). Advance after the scaled state HP threshold is lost; Element Burst as a special reaction. Set Fire / Ice / Dragon State jumps manually and resets the threshold. Token light follows the state (fire orange, ice blue, dragon violet).</li>
<li><strong>Horns:</strong> Deploy Horn Tokens (AC 30, base 200 HP each at 820 boss HP, 15 ft elevation). Breaking a horn reverts the previous state and cuts Escaton by 10d6. Apply Horn Damage remains as a manual fallback.</li>
<li><strong>Elemental Overload:</strong> 1 charge per soft-scaled elemental chunk (15→20 by hunters; max 60). Tracked on the token's second bar and on the Elemental Overload feature uses; reduces Escaton dice.</li>
<li><strong>Escaton Judgement:</strong> Charge then Release anytime from the sheet (suggested once during the second dragon state). 60d6 force, reduced by horns and charges; force immunity→resistance, resistance→normal, else vulnerability. Module chat is GM-whisper only.</li>
<li><strong>Legendary Limit:</strong> each legendary option once per round. Mythic options are suggested by Active State (advisory notes on the AE / state chat; not blocked).</li>
</ul>`;

const actor = {
  _id: stableId("tempered-alatreon-mhw::actor"),
  name: "Tempered Alatreon (MHW)",
  type: "npc",
  img: IMG.actor,
  system: {
    abilities: {
      str: abilityBlock(30, 0),
      dex: abilityBlock(12, 1),
      con: abilityBlock(30, 1),
      int: abilityBlock(14, 0),
      wis: abilityBlock(23, 0),
      cha: abilityBlock(24, 0),
    },
    attributes: {
      ac: { flat: 24, calc: "flat", formula: "" },
      hp: {
        value: 820,
        max: 820,
        temp: 0,
        tempmax: 0,
        formula: "39d20 + 390",
      },
      init: { ability: "dex", bonus: "" },
      movement: {
        burrow: null,
        climb: null,
        fly: 120,
        swim: null,
        walk: 60,
        units: "ft",
        hover: false,
      },
      attunement: { max: 3 },
      senses: {
        darkvision: 240,
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
        public: "A tempered Elder Dragon that cycles through fire, dragon, and ice states.",
      },
      alignment: "Unaligned",
      race: "",
      type: {
        value: "dragon",
        subtype: "elder",
        swarm: "",
        custom: "",
      },
      environment: "",
      cr: 30,
      spellLevel: 0,
      source: SOURCE,
      treasure: { value: [] },
    },
    traits: {
      size: "grg",
      di: { value: [], bypasses: [], custom: "" },
      dr: {
        value: ["lightning", "bludgeoning", "piercing", "slashing"],
        bypasses: ["ada"],
        custom: "",
      },
      dv: { value: [], bypasses: [], custom: "" },
      ci: { value: ["charmed", "frightened", "poisoned"], custom: "" },
      languages: { value: ["draconic"], custom: "" },
    },
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
    skills: {
      ath: { value: 1, ability: "", bonuses: { check: "", passive: "" } },
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
      lair: { value: false, initiative: 20, inside: false },
      overload: { value: 0, max: 60 },
    },
  },
  prototypeToken: {
    name: "Tempered Alatreon (MHW)",
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
    bar2: { attribute: "resources.overload" },
    light: {
      negative: false,
      priority: 0,
      alpha: 0.5,
      angle: 360,
      bright: 5,
      color: "#ff5522",
      coloration: 1,
      dim: 15,
      attenuation: 0.5,
      luminosity: 0.55,
      saturation: 0,
      contrast: 0,
      shadows: 0,
      animation: { type: "torch", speed: 4, intensity: 4, reverse: false },
      darkness: { min: 0, max: 1 },
    },
    sight: {
      enabled: true,
      range: 240,
      angle: 360,
      visionMode: "basic",
      color: "#ffaa88",
      attenuation: 0.1,
      brightness: 0,
      saturation: 0,
      contrast: 0,
    },
    detectionModes: [{ id: "blindsight", enabled: true, range: 120 }],
    flags: {
      world: {
        alatreon: {
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
      alatreon: {
        bossNpc: true,
        huntersQuantity: 3,
        activeState: "fire",
        cycle: "fire",
        cycleIndex: 0,
        previousState: null,
        stateHpLost: 0,
        overloadCharges: 0,
        horns: {
          left: { hp: 200, broken: false },
          right: { hp: 200, broken: false },
        },
        hornRefs: {
          left: { actorId: null, tokenId: null, sceneId: null },
          right: { actorId: null, tokenId: null, sceneId: null },
        },
        escaton: {
          charging: false,
          ready: false,
          usedThisCycle: false,
          dragonStateCount: 0,
        },
        legendaryUsedThisRound: {},
      },
    },
  },
  _stats: stats(),
};

fs.writeFileSync(outPath, JSON.stringify(actor, null, 2));
console.log("Wrote", outPath);
console.log(`items: ${items.length}`);
console.log("actor id:", actor._id);
console.log("token:", IMG.actor);
console.log("item names:");
for (const item of items) console.log(" -", item.name);
