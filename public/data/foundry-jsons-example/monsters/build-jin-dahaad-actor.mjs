/**
 * Builds fvtt-Actor-jin-dahaad.json (Gargantuan Leviathan hunt boss).
 * Run: node public/data/foundry-jsons-example/monsters/build-jin-dahaad-actor.mjs
 *
 * Design (Amellwind hunt custom):
 * - Base HP 480 @ 3 hunters → ×1.5/×2/×2.5 at 4/5/6 (Alatreon mults)
 * - 4 armored plates @ 40 HP base (tokens on canvas); break → AC−1 + scaled body HP loss
 * - 4 phases (~8 rounds @ 4 hunters); Subzero ready on Phase 4 entry
 * - Frost Breath / Mist / Flash Freeze / Subzero on recharge
 *
 * Deliberate hunt tuning vs MHMM p.459 (keep unless the hunt design changes):
 * - HP 480 (MHMM 203); plates 40 HP / −10 body HP on break (MHMM 20 / −5)
 * - Frost Breath 10d8 (MHMM 8d8); Subzero 6d10 + 8d10, Recharge 6 (MHMM 4d10 + 5d10, short/long rest)
 * - Frost Mist / Flash Freeze are recharge Actions (MHMM legendary, cost 2 / 3)
 * - Subzero fail → Iceblight; fail by 5+ → Frozen (not in MHMM)
 */
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { resolveFoundryMhTokenPath } from "../../../../scripts/mh-token-resolve.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, "fvtt-Actor-jin-dahaad.json");

const CORE_VERSION = "12.331";
const SYSTEM_ID = "dnd5e";
const SYSTEM_VERSION = "4.4.4";
const SOURCE = {
  custom: "Amellwind MH (RaintDM)",
  book: "RAINTDM",
  page: "MHMM 459",
  license: "",
  rules: "2024",
  revision: 1,
};

const BASE_BOSS_HP = 480;
const BASE_PLATE_HP = 40;
const BASE_AC = 25;
const PLATE_BREAK_HP_LOSS = 10;
/** Same multipliers as Tempered Alatreon; the module engine reads them from actor flags. */
const HUNTER_HP_MULTIPLIER = Object.freeze({ 1: 1, 2: 1, 3: 1, 4: 1.5, 5: 2, 6: 2.5 });
const scaled = (base, hunters) => Math.round(base * HUNTER_HP_MULTIPLIER[hunters]);

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
  // Prefer native other-activity chaining (Alatreon pattern) over Item Macro riders.
  otherActivityId:
    activity.otherActivityId !== undefined
      ? activity.otherActivityId
      : activity.type === "attack"
        ? ""
        : "none",
  ...(activity.type === "attack"
    ? { otherActivityUuid: "", attackMode: "oneHanded", ammunition: "" }
    : {}),
  useConditionText: activity.useConditionText ?? "",
  useConditionReason: activity.useConditionReason ?? "",
  effectConditionText: activity.effectConditionText ?? (activity.type === "attack" ? "false" : ""),
});

const wrapActivity = (activity) => ({ ...activity, ...envelope(activity) });

/**
 * Item Macro is a last resort (canvas tokens, hunt HP scaling, phase flags,
 * custom Amellwind blight application). Prefer Activities + Active Effects + Midi.
 */
const itemMacroCommand = `// Jin Dahaad — Item Macro (canvas / hunt state only)
// MidiQOL On Use: [postActiveEffects]ItemMacro
try {
  const api = globalThis.__amellwindJinDahaad;
  if (!api?.onUse) {
    ui.notifications?.warn("Jin Dahaad automations are not armed. Enable the Amellwind MH (RaintDM) module.");
    return;
  }
  const payload = typeof args !== "undefined" ? args[0] : {};
  await api.onUse(payload);
} catch (err) {
  console.error("Jin Dahaad | item macro", err);
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
    height: "",
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
const consumeLegendaryResistance = (n) => [
  { type: "attribute", target: "resources.legres.value", value: String(n), scaling: { mode: "", formula: "" } },
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
  transfer = false,
  statuses = [],
  kind,
  durationSeconds = null,
  durationRounds = null,
  daeExtra = {},
  worldExtra = {},
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
    seconds: durationSeconds,
    combat: null,
    rounds: durationRounds,
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
    dae: daeFlags(daeExtra),
    world: { jinDahaad: { kind }, ...worldExtra },
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
      };
  return {
    _id: stableId(`jin-dahaad::item::${seed}`),
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
      world: { jinDahaad: { role } },
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
    // forceRollDialog always: show Advantage / Normal / Disadvantage even when Midi
    // world setting would otherwise auto–fast-forward saves. Never force silent rolls.
    midiProperties: midiProps(identifier, { ...midiExtra, forceRollDialog: "always" }),
    damage: { parts, onSave },
    save: {
      ability: Array.isArray(saveAbility) ? saveAbility : [saveAbility],
      dc: { calculation: "", formula: String(saveDc) },
    },
    useConditionText,
    useConditionReason,
    effectConditionText,
    // Envelope ignoreTraits stay false — Midi must apply resistance / immunity / vulnerability.
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
  effects = [],
  effectConditionText = "false",
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
    effects,
    range,
    target,
    uses,
    otherActivityId,
    effectConditionText,
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
  effects = [],
  effectConditionText = "",
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
    effects,
    range,
    target,
    uses,
    effectConditionText,
    midiProperties: midiProps(identifier, midiExtra),
    roll: { formula: "", name: "", prompt: false, visible: false },
    useConditionText,
    useConditionReason,
  });

/** Shared AE templates referenced by activities (native Midi apply-on-fail / on-use). */
const iceblightFxId = stableId("jin-dahaad::fx::iceblight");
const iceblightEffect = makeEffect({
  id: iceblightFxId,
  name: "Iceblight",
  img: "icons/magic/water/barrier-ice-wall-snow.webp",
  kind: "iceblight",
  durationSeconds: 60,
  // Status "iceblight" is registered by amellwind-conditions (halfMovement condition effect),
  // so speed is halved there — do not also multiply movement here.
  statuses: ["iceblight"],
  description:
    "No reactions; speed halved; can't make more than one attack on your turn. Repeat the DC 21 Constitution save at the end of each of your turns, ending the effect on a success.",
  changes: [
    { key: "flags.midi-qol.fail.reaction", mode: 0, value: "1", priority: 20 },
    {
      key: "flags.midi-qol.OverTime",
      mode: 0,
      value: "turn=end, saveAbility=con, saveDC=21, label=Iceblight",
      priority: 20,
    },
  ],
  daeExtra: { stackable: "noneName", showIcon: true },
  worldExtra: { amellwindConditions: { kind: "iceblight", afflictionKind: "disease" } },
});

const restrainedFxId = stableId("jin-dahaad::fx::restrained-ice");
const restrainedIceEffect = makeEffect({
  id: restrainedFxId,
  name: "Restrained (Ice)",
  img: "icons/magic/water/barrier-ice-crystal-wall-blue.webp",
  kind: "restrainedIce",
  durationSeconds: 60,
  statuses: ["restrained"],
  description: "Restrained by ice. Destroy the linked Ice Block token (AC 18; 20 HP; vulnerable to fire) or succeed on Str DC 18 to break free.",
});

const proneFxId = stableId("jin-dahaad::fx::prone");
const proneEffect = makeEffect({
  id: proneFxId,
  name: "Prone",
  img: "icons/svg/falling.svg",
  kind: "prone",
  statuses: ["prone"],
  description: "Knocked prone.",
});

const headExposedFxId = stableId("jin-dahaad::fx::head-exposed");
const headExposedEffect = makeEffect({
  id: headExposedFxId,
  name: "Head Plate Exposed",
  img: "icons/creatures/abilities/mouth-teeth-rows-red.webp",
  kind: "headVulnerable",
  durationRounds: 1,
  description: "Jin Dahaad's Head Plate can be targeted until the start of its next turn.",
  changes: [
    { key: "flags.world.jinDahaad.headVulnerable", mode: 5, value: "1", priority: 20 },
  ],
  daeExtra: {
    selfTargetAlways: true,
    specialDuration: ["turnStart"],
    showIcon: true,
  },
});

const subzeroChargeFxId = stableId("jin-dahaad::fx::subzero-charge");
const subzeroChargeEffect = makeEffect({
  id: subzeroChargeFxId,
  name: "Subzero Shockwave — Charging",
  img: "icons/magic/water/projectile-ice-snowball.webp",
  kind: "subzeroCharge",
  durationRounds: 1,
  description: "Speed 0; no legendary actions; total cover from outside the ice walls until detonation.",
  changes: [
    { key: "system.attributes.movement.walk", mode: 5, value: "0", priority: 20 },
    { key: "system.attributes.movement.climb", mode: 5, value: "0", priority: 20 },
    { key: "system.resources.legact.value", mode: 5, value: "0", priority: 20 },
  ],
  daeExtra: { selfTargetAlways: true, showIcon: true, specialDuration: ["turnStart"] },
});

const ACTOR_TOKEN =
  resolveFoundryMhTokenPath("Jin Dahaad") ??
  resolveFoundryMhTokenPath("Mizutsune") ??
  "icons/magic/water/barrier-ice-crystal-wall-blue.webp";

const IMG = {
  actor: ACTOR_TOKEN,
  bite: "icons/creatures/abilities/mouth-teeth-rows-red.webp",
  claw: "icons/creatures/claws/claw-talons-glowing-blue.webp",
  kick: "icons/skills/melee/strike-blade-hooked-orange-blue.webp",
  tail: "icons/commodities/biological/tail-spiked-green.webp",
  slam: "icons/creatures/magical/construct-iron-stomping-yellow.webp",
  breath: "icons/magic/water/projectile-ice-snowball.webp",
  mist: "icons/magic/air/fog-gas-smoke-dense-white.webp",
  freeze: "icons/magic/water/barrier-ice-crystal-wall-blue.webp",
  subzero: "icons/magic/water/orb-ice-glow.webp",
  plate: "icons/commodities/bones/armor-plate-blue.webp",
  hunters: "icons/skills/social/diplomacy-handshake-blue.webp",
  phase: "icons/magic/symbols/runes-star-blue.webp",
  legendary: "icons/magic/symbols/runes-star-blue.webp",
  charge: "icons/skills/movement/figure-running-gray.webp",
};

const abilityBlock = (value, proficient = 0) => ({
  value,
  proficient,
  max: null,
  bonuses: { check: "", save: "" },
});

// ─── Items ───────────────────────────────────────────────────────────────────

const armoredBody = makeFeat({
  seed: "armored-body",
  name: "Armored Body",
  img: IMG.plate,
  identifier: "armored-body",
  role: "armoredBody",
  sort: 100000,
  description: `<p>Jin Dahaad's body is covered in four sets of armored plates (Legs/Claws, Tail, Back, Head). Each plate can be attacked and destroyed (<strong>AC 20</strong>; HP scales with Hunters Quantity, base <strong>${BASE_PLATE_HP}</strong> at 3 hunters; immunity to poison and psychic).</p>
<ul>
<li><strong>Back</strong> plate sits at elevation (not reachable from the ground without climb/fly/ranged).</li>
<li><strong>Head</strong> plate is only damageable from the ground on rounds when Jin Dahaad makes a Bite attack.</li>
<li>For each plate destroyed, Jin Dahaad loses scaled hit points (base ${PLATE_BREAK_HP_LOSS} × hunter mult) and its AC is reduced by <strong>1</strong>.</li>
</ul>
<p><em>Use <strong>Deploy Armored Plates</strong> to place plate tokens on the canvas.</em></p>`,
  chat: `<p>Four plates (AC 20, scaled HP). Destroy: AC −1 + scaled body HP loss.</p>`,
});

const legendaryResistanceId = stableId("jin-dahaad::act::legres");
const legendaryResistance = makeFeat({
  seed: "legendary-resistance",
  name: "Legendary Resistance",
  img: IMG.legendary,
  identifier: "legendary-resistance",
  role: "legendaryResistance",
  sort: 100100,
  description: `<p><strong>Legendary Resistance (2/Day).</strong> If Jin Dahaad fails a saving throw, it can choose to succeed instead.</p>`,
  chat: `<p>Succeed on a failed saving throw.</p>`,
  activities: {
    [legendaryResistanceId]: utilityActivity({
      id: legendaryResistanceId,
      name: "Succeed on a Failed Save",
      identifier: "legendary-resistance",
      activationType: "special",
      img: IMG.legendary,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      consume: consumeLegendaryResistance(1),
    }),
  },
});

const huntersActs = {};
for (let n = 1; n <= 6; n += 1) {
  const id = stableId(`jin-dahaad::act::hunters-${n}`);
  huntersActs[id] = utilityActivity({
    id,
    name: `Set ${n} Hunter${n === 1 ? "" : "s"}`,
    identifier: `hunters-${n}`,
    activationType: "special",
    img: IMG.hunters,
    range: rangeBlock(null, "self"),
    target: targetBlock({ affectsType: "self", prompt: false }),
    sort: n,
  });
}
const huntersQuantity = makeFeat({
  seed: "hunters-quantity",
  name: "Hunters Quantity",
  img: IMG.hunters,
  identifier: "hunters-quantity",
  role: "huntersQuantity",
  sort: 100200,
  withMacro: true,
  description: `<p>Amellwind solo-boss HP scaling (same multipliers as Tempered Alatreon):</p>
<ul>
<li><strong>1–3 hunters:</strong> max HP × 1 (${BASE_BOSS_HP} body; ${BASE_PLATE_HP} per plate)</li>
${[4, 5, 6]
  .map(
    (n) =>
      `<li><strong>${n} hunters:</strong> × ${HUNTER_HP_MULTIPLIER[n]} (${scaled(BASE_BOSS_HP, n)} / ${scaled(BASE_PLATE_HP, n)})</li>`,
  )
  .join("\n")}
</ul>
<p>Plate-break body HP loss also scales (${PLATE_BREAK_HP_LOSS} × mult). Set hunters once after placing the token.</p>`,
  chat: `<p>Scale boss + plate HP for 1–6 hunters.</p>`,
  activities: huntersActs,
});

const deployPlatesId = stableId("jin-dahaad::act::deploy-plates");
const clearPlatesId = stableId("jin-dahaad::act::clear-plates");
const armoredPlates = makeFeat({
  seed: "deploy-armored-plates",
  name: "Deploy Armored Plates",
  img: IMG.plate,
  identifier: "deploy-armored-plates",
  role: "armoredPlates",
  sort: 100300,
  withMacro: true,
  description: `<p>Places four plate tokens on the current scene (Legs/Claws, Tail, Back at 15 ft, Head at 5 ft). Attack the tokens directly. HP scales with Hunters Quantity.</p>
<p>Use <strong>Clear Plate Tokens</strong> to remove them before redeploying after a Phase Shift.</p>`,
  chat: `<p>Spawn / clear the four armored plate tokens.</p>`,
  activities: {
    [deployPlatesId]: utilityActivity({
      id: deployPlatesId,
      name: "Deploy Armored Plates",
      identifier: "spawn-plates",
      activationType: "special",
      img: IMG.plate,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
    }),
    [clearPlatesId]: utilityActivity({
      id: clearPlatesId,
      name: "Clear Plate Tokens",
      identifier: "clear-plates",
      activationType: "special",
      img: IMG.plate,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      sort: 1,
    }),
  },
});

const phaseActs = {};
for (let n = 1; n <= 4; n += 1) {
  const id = stableId(`jin-dahaad::act::phase-${n}`);
  phaseActs[id] = utilityActivity({
    id,
    name: `Enter Phase ${n}`,
    identifier: `phase-${n}`,
    activationType: "special",
    img: IMG.phase,
    range: rangeBlock(null, "self"),
    target: targetBlock({ affectsType: "self", prompt: false }),
    sort: n,
  });
}
const phaseShift = makeFeat({
  seed: "phase-shift",
  name: "Phase Shift",
  img: IMG.phase,
  identifier: "phase-shift",
  role: "phaseShift",
  sort: 100400,
  withMacro: true,
  description: `<p>Jin Dahaad hunts across <strong>four areas</strong> (~2 rounds each at 4 hunters). Phases also advance automatically at <strong>75% / 50% / 25%</strong> body HP.</p>
<ol>
<li><strong>Cliff Approach</strong> — melee pressure, deploy plates</li>
<li><strong>Frozen Basin</strong> — Breath / Mist; first Subzero window</li>
<li><strong>Vertical Spire</strong> — climb play, Flash Freeze, head/back plates</li>
<li><strong>Rime Crater (Absolute Zero)</strong> — Subzero is <em>ready</em> on entry</li>
</ol>
<p>Manual buttons force a phase (and whisper the area change). Redeploy unbroken plates after relocating.</p>`,
  chat: `<p>Advance or set hunt phase (1–4). Phase 4 readies Subzero.</p>`,
  activities: phaseActs,
});

const multiId = stableId("jin-dahaad::act::multi");
const multiattack = makeFeat({
  seed: "multiattack",
  name: "Multiattack",
  img: IMG.claw,
  identifier: "multiattack",
  role: "multiattack",
  sort: 200000,
  description: `<p>Jin Dahaad makes one Bite or Claw attack and one Kick or Tail attack.</p>`,
  chat: `<p>Bite or Claw + Kick or Tail.</p>`,
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

const biteAtkId = stableId("jin-dahaad::act::bite");
const biteSaveId = stableId("jin-dahaad::act::bite-iceblight");
const bite = makeFeat({
  seed: "bite",
  name: "Bite",
  img: IMG.bite,
  identifier: "bite",
  role: "bite",
  sort: 200100,
  // Native: attack → otherActivity Con save + Iceblight AE; self Head Plate Exposed AE.
  description: `<p><em>Melee Weapon Attack:</em> +12 to hit, reach 15 ft., one target. <em>Hit:</em> 16 (4d8 + 7) piercing + 4 (1d8) cold. The target must succeed on a DC 21 Constitution saving throw or be afflicted with <strong>iceblight</strong> for 1 minute.</p>
<p><em>Native Midi:</em> on-hit other activity (save + Iceblight AE). Using Bite applies <strong>Head Plate Exposed</strong> to Jin Dahaad until the start of its next turn.</p>`,
  chat: `<p>+12, 15 ft. 4d8+7 piercing + 1d8 cold; DC 21 Con or iceblight. Unlocks Head Plate.</p>`,
  effects: [iceblightEffect, headExposedEffect],
  activities: {
    [biteAtkId]: attackActivity({
      id: biteAtkId,
      name: "Bite",
      identifier: "bite",
      img: IMG.bite,
      attackValue: "melee",
      ability: "str",
      parts: [damagePart(4, 8, "piercing", "7"), damagePart(1, 8, "cold")],
      range: rangeBlock(15),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
      otherActivityId: biteSaveId,
      effects: [{ _id: headExposedFxId, onSave: false }],
      effectConditionText: "",
    }),
    [biteSaveId]: saveActivity({
      id: biteSaveId,
      name: "Iceblight",
      identifier: "bite-iceblight",
      activationType: "special",
      img: IMG.freeze,
      range: rangeBlock(15),
      target: targetBlock({ affectsType: "creature", affectsCount: "1", prompt: false }),
      saveAbility: "con",
      saveDc: 21,
      parts: [],
      onSave: "none",
      effects: [{ _id: iceblightFxId, onSave: false }],
      effectConditionText: "failedSave",
      midiExtra: {
        autoTargetAction: "never",
        confirmTargets: "never",
        automationOnly: true,
      },
      sort: 1,
    }),
  },
});

const clawAtkId = stableId("jin-dahaad::act::claw");
const claw = makeFeat({
  seed: "claw",
  name: "Claw",
  img: IMG.claw,
  identifier: "claw",
  role: "claw",
  sort: 200200,
  withMacro: true,
  description: `<p><em>Melee Weapon Attack:</em> +12 to hit, reach 10 ft., one target. <em>Hit:</em> 14 (2d6 + 7) slashing + 7 (2d6) cold. Each creature within 5 feet of the target takes damage equal to the cold damage dealt.</p>
<p><em>Module:</em> on hit, the rolled cold damage is applied to every other creature within 5 ft of the target (resistance / immunity respected).</p>`,
  chat: `<p>+12, 10 ft. 2d6+7 slashing + 2d6 cold (splash cold to adjacent).</p>`,
  activities: {
    [clawAtkId]: attackActivity({
      id: clawAtkId,
      name: "Claw",
      identifier: "claw",
      img: IMG.claw,
      attackValue: "melee",
      ability: "str",
      parts: [damagePart(2, 6, "slashing", "7"), damagePart(2, 6, "cold")],
      range: rangeBlock(10),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
    }),
  },
});

const kickAtkId = stableId("jin-dahaad::act::kick");
const kickSaveId = stableId("jin-dahaad::act::kick-prone");
const kick = makeFeat({
  seed: "kick",
  name: "Kick",
  img: IMG.kick,
  identifier: "kick",
  role: "kick",
  sort: 200300,
  description: `<p><em>Melee Weapon Attack:</em> +12 to hit, reach 5 ft., one target. <em>Hit:</em> 16 (2d8 + 7) bludgeoning. Target must succeed on a DC 20 Strength saving throw or be knocked prone.</p>
<p><em>Native Midi:</em> on-hit other activity (Str save + Prone AE).</p>`,
  chat: `<p>+12, 5 ft. 2d8+7 bludgeoning; DC 20 Str or prone.</p>`,
  effects: [proneEffect],
  activities: {
    [kickAtkId]: attackActivity({
      id: kickAtkId,
      name: "Kick",
      identifier: "kick",
      img: IMG.kick,
      attackValue: "melee",
      ability: "str",
      parts: [damagePart(2, 8, "bludgeoning", "7")],
      range: rangeBlock(5),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
      otherActivityId: kickSaveId,
    }),
    [kickSaveId]: saveActivity({
      id: kickSaveId,
      name: "Knock Prone",
      identifier: "kick-prone",
      activationType: "special",
      img: IMG.kick,
      range: rangeBlock(5),
      target: targetBlock({ affectsType: "creature", affectsCount: "1", prompt: false }),
      saveAbility: "str",
      saveDc: 20,
      parts: [],
      onSave: "none",
      effects: [{ _id: proneFxId, onSave: false }],
      effectConditionText: "failedSave",
      midiExtra: {
        autoTargetAction: "never",
        confirmTargets: "never",
        automationOnly: true,
      },
      sort: 1,
    }),
  },
});

const tailAtkId = stableId("jin-dahaad::act::tail");
const tail = makeFeat({
  seed: "tail",
  name: "Tail",
  img: IMG.tail,
  identifier: "tail",
  role: "tail",
  sort: 200400,
  description: `<p><em>Melee Weapon Attack:</em> +12 to hit, reach 30 ft., one target. <em>Hit:</em> 29 (4d10 + 7) slashing.</p>`,
  chat: `<p>+12, 30 ft. 4d10+7 slashing.</p>`,
  activities: {
    [tailAtkId]: attackActivity({
      id: tailAtkId,
      name: "Tail",
      identifier: "tail",
      img: IMG.tail,
      attackValue: "melee",
      ability: "str",
      parts: [damagePart(4, 10, "slashing", "7")],
      range: rangeBlock(30),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
    }),
  },
});

const slamId = stableId("jin-dahaad::act::body-slam");
const proneSlamFxId = stableId("jin-dahaad::fx::prone-slam");
const bodySlam = makeFeat({
  seed: "body-slam",
  name: "Body Slam",
  img: IMG.slam,
  identifier: "body-slam",
  role: "bodySlam",
  sort: 200500,
  withMacro: true,
  description: `<p>Jin Dahaad slams its body on the ground in its space. Each creature on the ground within 30 feet must make a DC 20 Dexterity saving throw. Failed: 9 (2d10) bludgeoning + 14 (4d6) cold, pushed 10 feet, knocked prone. Success: half damage, no push/prone.</p>
<p><em>Native:</em> Prone AE on a failed save. <em>Module:</em> pushes failed creatures 10 ft away (GM is whispered when a wall blocks the push).</p>`,
  chat: `<p>30 ft: DC 20 Dex, 2d10 bludgeoning + 4d6 cold, push/prone.</p>`,
  effects: [{ ...proneEffect, _id: proneSlamFxId }],
  activities: {
    [slamId]: saveActivity({
      id: slamId,
      name: "Body Slam",
      identifier: "body-slam",
      activationType: "action",
      img: IMG.slam,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "radius",
        templateSize: "30",
        affectsType: "creature",
      }),
      saveAbility: "dex",
      saveDc: 20,
      parts: [damagePart(2, 10, "bludgeoning"), damagePart(4, 6, "cold")],
      effects: [{ _id: proneSlamFxId, onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
});

const breathId = stableId("jin-dahaad::act::frost-breath");
const breathLineId = stableId("jin-dahaad::act::frost-breath-line");
const frostBreathSave = (overrides) =>
  saveActivity({
    activationType: "action",
    img: IMG.breath,
    range: rangeBlock(null, "self"),
    saveAbility: "con",
    saveDc: 21,
    parts: [damagePart(10, 8, "cold")],
    consume: consumeItemUses(1),
    // Restrained (Ice) only on fail by 5+ — applied by the module with the Ice Block token.
    effects: [],
    ...overrides,
  });
const frostBreath = makeFeat({
  seed: "frost-breath",
  name: "Frost Breath",
  img: IMG.breath,
  identifier: "frost-breath",
  role: "frostBreath",
  sort: 200600,
  // Item Macro only places Ice Block tokens after fail-by-5 (canvas). Save/damage/restrain AE are native.
  withMacro: true,
  uses: rechargeUses("5"),
  description: `<p><strong>Recharge 5–6.</strong> Exhales ice and snow in a 45-foot cone or a 90-foot line that is 10 feet wide. DC 21 Constitution save: <strong>45 (10d8) cold</strong> on a failed save, or half on a success. If the save fails by 5 or more, the creature is restrained by ice.</p>
<p><em>Native:</em> Midi save activity — pick <strong>Cone</strong> or <strong>Line</strong> (damage respects resistance / immunity / vulnerability). <em>Module:</em> fail by 5+ applies Restrained (Ice) and spawns an Ice Block token (AC 18 / 20 HP; vulnerable to fire).</p>`,
  chat: `<p>Recharge 5–6. Cone 45 or line 90×10: DC 21 Con, 10d8 cold; fail by 5+ ice block.</p>`,
  // Template for the module's fail-by-5 restraint (not applied by the activities).
  effects: [restrainedIceEffect],
  activities: {
    [breathId]: frostBreathSave({
      id: breathId,
      name: "Frost Breath (Cone)",
      identifier: "frost-breath",
      target: targetBlock({
        templateType: "cone",
        templateSize: "45",
        affectsType: "creature",
      }),
    }),
    [breathLineId]: frostBreathSave({
      id: breathLineId,
      name: "Frost Breath (Line)",
      identifier: "frost-breath-line",
      target: targetBlock({
        templateType: "line",
        templateSize: "90",
        templateWidth: "10",
        affectsType: "creature",
      }),
      sort: 1,
    }),
  },
});

const mistId = stableId("jin-dahaad::act::frost-mist");
const frostMist = makeFeat({
  seed: "frost-mist",
  name: "Frost Mist",
  img: IMG.mist,
  identifier: "frost-mist",
  role: "frostMist",
  sort: 200700,
  withMacro: true,
  uses: rechargeUses("5"),
  description: `<p><strong>Recharge 5–6.</strong> Freezing mist within 10 feet on the ground. DC 21 Strength save or restrained by ice.</p>
<p><em>Native:</em> Midi save + Restrained AE on fail. <em>Module:</em> Ice Block token (AC 18 / 20 HP; vulnerable to fire).</p>`,
  chat: `<p>Recharge 5–6. 10 ft: DC 21 Str or restrained + ice block.</p>`,
  effects: [
    {
      ...restrainedIceEffect,
      _id: stableId("jin-dahaad::fx::restrained-mist"),
    },
  ],
  activities: {
    [mistId]: saveActivity({
      id: mistId,
      name: "Frost Mist",
      identifier: "frost-mist",
      activationType: "action",
      img: IMG.mist,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "radius",
        templateSize: "10",
        affectsType: "creature",
      }),
      saveAbility: "str",
      saveDc: 21,
      parts: [],
      onSave: "none",
      consume: consumeItemUses(1),
      effects: [{ _id: stableId("jin-dahaad::fx::restrained-mist"), onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
});

const flashId = stableId("jin-dahaad::act::flash-freeze");
const flashFreeze = makeFeat({
  seed: "flash-freeze",
  name: "Flash Freeze",
  img: IMG.freeze,
  identifier: "flash-freeze",
  role: "flashFreeze",
  sort: 200800,
  withMacro: true,
  uses: rechargeUses("6"),
  description: `<p><strong>Recharge 6.</strong> Freezes the ground in a 60-foot radius. DC 21 Strength save or take 14 (4d6) cold and become restrained by ice.</p>
<p><em>Native:</em> Midi save (cold respects traits) + Restrained AE. <em>Module:</em> Ice Block token.</p>`,
  chat: `<p>Recharge 6. 60 ft: DC 21 Str, 4d6 cold + ice block.</p>`,
  effects: [
    {
      ...restrainedIceEffect,
      _id: stableId("jin-dahaad::fx::restrained-flash"),
    },
  ],
  activities: {
    [flashId]: saveActivity({
      id: flashId,
      name: "Flash Freeze",
      identifier: "flash-freeze",
      activationType: "action",
      img: IMG.freeze,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "radius",
        templateSize: "60",
        affectsType: "creature",
      }),
      saveAbility: "str",
      saveDc: 21,
      parts: [damagePart(4, 6, "cold")],
      onSave: "none",
      consume: consumeItemUses(1),
      effects: [{ _id: stableId("jin-dahaad::fx::restrained-flash"), onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
});

const subzeroChargeId = stableId("jin-dahaad::act::subzero-charge");
const subzeroDetonateId = stableId("jin-dahaad::act::subzero-detonate");
const subzeroShockwave = makeFeat({
  seed: "subzero-shockwave",
  name: "Subzero Shockwave",
  img: IMG.subzero,
  identifier: "subzero-shockwave",
  role: "subzeroShockwave",
  sort: 200900,
  // Charge self-AE is native; module sets charging flag + detonation riders (iceblight/Frozen shells).
  withMacro: true,
  uses: rechargeUses("6"),
  description: `<p><strong>Ultimate — Recharge 6.</strong> Automatically <em>ready</em> when Jin Dahaad enters <strong>Phase 4</strong>.</p>
<p><strong>Charge:</strong> Ice walls rise; creatures within 5 ft are pushed 5 ft away. Native AE until the start of Jin Dahaad's next turn: speed 0, no legendary actions. Module: wind-pressure saves (player Adv/Disadv dialogs); at the start of its next turn the charge ends and the GM is prompted to Detonate.</p>
<p><strong>Detonate:</strong> Native Midi save — <strong>33 (6d10) piercing + 44 (8d10) cold</strong> (traits respected). Module: fail → Iceblight; fail by 5+ → Frozen + ice shell.</p>`,
  chat: `<p>Recharge 6 ultimate. Charge (native AE) then Detonate (Midi save + module riders).</p>`,
  effects: [subzeroChargeEffect],
  activities: {
    [subzeroChargeId]: utilityActivity({
      id: subzeroChargeId,
      name: "Subzero Shockwave: Charge",
      identifier: "subzero-charge",
      activationType: "action",
      img: IMG.subzero,
      range: rangeBlock(null, "self"),
      target: targetBlock({ affectsType: "self", prompt: false }),
      consume: consumeItemUses(1),
      effects: [{ _id: subzeroChargeFxId, onSave: false }],
      effectConditionText: "",
    }),
    [subzeroDetonateId]: saveActivity({
      id: subzeroDetonateId,
      name: "Subzero Shockwave: Detonate",
      identifier: "subzero-detonate",
      activationType: "special",
      img: IMG.subzero,
      range: rangeBlock(null, "self"),
      target: targetBlock({
        templateType: "radius",
        templateSize: "80",
        affectsType: "creature",
      }),
      saveAbility: "con",
      saveDc: 21,
      parts: [damagePart(6, 10, "piercing"), damagePart(8, 10, "cold")],
      sort: 1,
    }),
  },
});

const legClawId = stableId("jin-dahaad::act::leg-claw");
const legKickId = stableId("jin-dahaad::act::leg-kick");
const legKickSaveId = stableId("jin-dahaad::act::leg-kick-prone");
const legendaryAttack = makeFeat({
  seed: "legendary-attack",
  name: "Legendary: Attack",
  img: IMG.claw,
  identifier: "legendary-attack",
  role: "legendaryAttack",
  sort: 300000,
  withMacro: true,
  description: `<p>Jin Dahaad makes one Claw attack or Kick attack.</p>
<p><em>Native:</em> Kick chains to a Str save + Prone AE (other activity). <em>Module:</em> Claw cold splash (same as Claw).</p>`,
  chat: `<p>Legendary: one Claw or Kick.</p>`,
  effects: [
    {
      ...proneEffect,
      _id: stableId("jin-dahaad::fx::prone-leg"),
    },
  ],
  activities: {
    [legClawId]: attackActivity({
      id: legClawId,
      name: "Claw",
      identifier: "legendary-claw",
      activationType: "legendary",
      img: IMG.claw,
      attackValue: "melee",
      ability: "str",
      parts: [damagePart(2, 6, "slashing", "7"), damagePart(2, 6, "cold")],
      range: rangeBlock(10),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
      consume: consumeLegendary(1),
    }),
    [legKickId]: attackActivity({
      id: legKickId,
      name: "Kick",
      identifier: "legendary-kick",
      activationType: "legendary",
      img: IMG.kick,
      attackValue: "melee",
      ability: "str",
      parts: [damagePart(2, 8, "bludgeoning", "7")],
      range: rangeBlock(5),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
      consume: consumeLegendary(1),
      otherActivityId: legKickSaveId,
      sort: 1,
    }),
    [legKickSaveId]: saveActivity({
      id: legKickSaveId,
      name: "Knock Prone",
      identifier: "legendary-kick-prone",
      activationType: "special",
      img: IMG.kick,
      range: rangeBlock(5),
      target: targetBlock({ affectsType: "creature", affectsCount: "1", prompt: false }),
      saveAbility: "str",
      saveDc: 20,
      parts: [],
      onSave: "none",
      effects: [{ _id: stableId("jin-dahaad::fx::prone-leg"), onSave: false }],
      effectConditionText: "failedSave",
      midiExtra: {
        autoTargetAction: "never",
        confirmTargets: "never",
        automationOnly: true,
      },
      sort: 2,
    }),
  },
});

const lungingId = stableId("jin-dahaad::act::lunging-bite");
const lungingSaveId = stableId("jin-dahaad::act::lunging-iceblight");
const lungingBite = makeFeat({
  seed: "lunging-bite",
  name: "Legendary: Lunging Bite",
  img: IMG.bite,
  identifier: "lunging-bite",
  role: "lungingBite",
  sort: 300100,
  description: `<p>Jin Dahaad moves 10 feet toward a target and makes one Bite attack against it.</p>
<p><em>Native Midi:</em> other activity Iceblight save + Head Plate Exposed AE (same as Bite).</p>`,
  chat: `<p>Legendary: move 10 ft + Bite.</p>`,
  effects: [
    {
      ...iceblightEffect,
      _id: stableId("jin-dahaad::fx::iceblight-lunging"),
    },
    {
      ...headExposedEffect,
      _id: stableId("jin-dahaad::fx::head-exposed-lunging"),
    },
  ],
  activities: {
    [lungingId]: attackActivity({
      id: lungingId,
      name: "Lunging Bite",
      identifier: "lunging-bite",
      activationType: "legendary",
      img: IMG.bite,
      attackValue: "melee",
      ability: "str",
      parts: [damagePart(4, 8, "piercing", "7"), damagePart(1, 8, "cold")],
      range: rangeBlock(15),
      target: targetBlock({ affectsType: "creature", affectsCount: "1" }),
      consume: consumeLegendary(1),
      otherActivityId: lungingSaveId,
      effects: [{ _id: stableId("jin-dahaad::fx::head-exposed-lunging"), onSave: false }],
    }),
    [lungingSaveId]: saveActivity({
      id: lungingSaveId,
      name: "Iceblight",
      identifier: "lunging-iceblight",
      activationType: "special",
      img: IMG.freeze,
      range: rangeBlock(15),
      target: targetBlock({ affectsType: "creature", affectsCount: "1", prompt: false }),
      saveAbility: "con",
      saveDc: 21,
      parts: [],
      onSave: "none",
      effects: [{ _id: stableId("jin-dahaad::fx::iceblight-lunging"), onSave: false }],
      effectConditionText: "failedSave",
      midiExtra: {
        autoTargetAction: "never",
        confirmTargets: "never",
        automationOnly: true,
      },
      sort: 1,
    }),
  },
});

const chargeId = stableId("jin-dahaad::act::charge");
const proneChargeFxId = stableId("jin-dahaad::fx::prone-charge");
const charge = makeFeat({
  seed: "charge",
  name: "Legendary: Charge",
  img: IMG.charge,
  identifier: "charge",
  role: "charge",
  sort: 300200,
  withMacro: true,
  description: `<p><strong>Costs 2 legendary actions.</strong> Jin Dahaad moves up to its speed through creatures' spaces without opportunity attacks. Each creature it moves through must succeed on a DC 20 Dexterity save or take 20 (3d8 + 7) bludgeoning, be pushed 15 feet, and knocked prone.</p>
<p><em>Use:</em> move the token, target the creatures it passed through, then use Charge. <em>Native:</em> Prone AE on a failed save. <em>Module:</em> pushes failed creatures 15 ft away from Jin Dahaad.</p>`,
  chat: `<p>Legendary ×2: move through creatures; DC 20 Dex or 3d8+7, push 15, prone.</p>`,
  effects: [{ ...proneEffect, _id: proneChargeFxId }],
  activities: {
    [chargeId]: saveActivity({
      id: chargeId,
      name: "Charge",
      identifier: "charge",
      activationType: "legendary",
      img: IMG.charge,
      range: rangeBlock(60),
      target: targetBlock({ affectsType: "creature", affectsCount: "", prompt: true }),
      saveAbility: "dex",
      saveDc: 20,
      parts: [damagePart(3, 8, "bludgeoning", "7")],
      onSave: "none",
      consume: consumeLegendary(2),
      effects: [{ _id: proneChargeFxId, onSave: false }],
      effectConditionText: "failedSave",
    }),
  },
});

const items = [
  armoredBody,
  legendaryResistance,
  huntersQuantity,
  armoredPlates,
  phaseShift,
  multiattack,
  bite,
  claw,
  kick,
  tail,
  bodySlam,
  frostBreath,
  frostMist,
  flashFreeze,
  subzeroShockwave,
  legendaryAttack,
  lungingBite,
  charge,
];

const biography = `<h2>Jin Dahaad</h2>
<p><em>Gargantuan leviathan, unaligned — Challenge 16 (Amellwind Hunt Boss)</em></p>
<p>Ice-cliff apex predator. Place the token, set <strong>Hunters Quantity</strong>, <strong>Deploy Armored Plates</strong>, and run the four-phase hunt (~8 rounds at 4 hunters).</p>
<h3>Combat notes</h3>
<ul>
<li><strong>Hunters Quantity:</strong> body ${BASE_BOSS_HP} / plates ${BASE_PLATE_HP} at 1–3; ×1.5 / ×2 / ×2.5 at 4 / 5 / 6.</li>
<li><strong>Plates:</strong> four tokens (AC 20). Break → AC −1 + scaled body HP loss. Head only after Bite. Back elevated.</li>
<li><strong>Phases:</strong> auto at 75% / 50% / 25% HP (or Phase Shift). Phase 4 readies Subzero.</li>
<li><strong>Recharge ice:</strong> Frost Breath (5–6), Frost Mist (5–6), Flash Freeze (6), Subzero Shockwave (6).</li>
<li><strong>Native first:</strong> attacks chain Midi <em>other activities</em> (Iceblight / Prone); frost saves apply Restrained AE; Body Slam / Charge apply Prone; Subzero Charge applies self AE. Item Macro only for canvas tokens, hunters HP, phases, ice blocks, pushes / pulls, Claw cold splash, and Amellwind blight riders.</li>
</ul>`;

const emptyPlateState = () => {
  const plates = {};
  for (const key of ["legs", "tail", "back", "head"]) {
    plates[key] = { hp: BASE_PLATE_HP, broken: false };
  }
  return plates;
};

const actor = {
  _id: stableId("jin-dahaad::actor"),
  name: "Jin Dahaad",
  type: "npc",
  img: IMG.actor,
  system: {
    abilities: {
      str: abilityBlock(24, 1),
      dex: abilityBlock(8, 0),
      con: abilityBlock(26, 1),
      int: abilityBlock(10, 0),
      wis: abilityBlock(16, 0),
      cha: abilityBlock(12, 0),
    },
    attributes: {
      ac: { flat: BASE_AC, calc: "flat", formula: "" },
      hp: {
        value: BASE_BOSS_HP,
        max: BASE_BOSS_HP,
        temp: 0,
        tempmax: 0,
        formula: "24d20 + 192",
      },
      init: { ability: "dex", bonus: "" },
      movement: {
        burrow: null,
        climb: 60,
        fly: null,
        swim: null,
        walk: 60,
        units: "ft",
        hover: false,
      },
      attunement: { max: 3 },
      senses: {
        darkvision: 120,
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
        value: biography,
        public: "A gargantuan ice-cliff leviathan hunt boss.",
      },
      alignment: "Unaligned",
      race: "",
      type: {
        value: "monstrosity",
        subtype: "Leviathan",
        swarm: "",
        custom: "",
      },
      environment: "Arctic / Iceshard Cliffs",
      cr: 16,
      spellLevel: 0,
      source: SOURCE,
      treasure: { value: [] },
    },
    traits: {
      size: "grg",
      di: { value: ["cold"], bypasses: [], custom: "" },
      dr: { value: [], bypasses: [], custom: "" },
      dv: { value: [], bypasses: [], custom: "" },
      ci: { value: ["charmed", "frightened"], custom: "" },
      languages: { value: [], custom: "" },
    },
    currency: { pp: 0, gp: 0, ep: 0, sp: 0, cp: 0 },
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
      legact: { value: 3, max: 3 },
      legres: { value: 2, max: 2 },
      lair: { value: false, initiative: 20, inside: false },
    },
  },
  prototypeToken: {
    name: "Jin Dahaad",
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
      range: 120,
      angle: 360,
      visionMode: "basic",
      color: "#aaddff",
      attenuation: 0.1,
      brightness: 0,
      saturation: 0,
      contrast: 0,
    },
    detectionModes: [{ id: "basicSight", enabled: true, range: 120 }],
    flags: {
      world: {
        jinDahaad: {
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
      jinDahaad: {
        bossNpc: true,
        baseline: {
          bossHp: BASE_BOSS_HP,
          plateHp: BASE_PLATE_HP,
          ac: BASE_AC,
          plateBreakHpLoss: PLATE_BREAK_HP_LOSS,
          hunterMultipliers: { ...HUNTER_HP_MULTIPLIER },
        },
        huntersQuantity: 3,
        phase: 1,
        headVulnerable: false,
        plates: emptyPlateState(),
        plateRefs: {},
        subzero: { charging: false, detonationDue: false, chargedRound: null },
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
console.log(`HP ${BASE_BOSS_HP} @3h → ${scaled(BASE_BOSS_HP, 4)} @4h; plates ${BASE_PLATE_HP} → ${scaled(BASE_PLATE_HP, 4)}`);
