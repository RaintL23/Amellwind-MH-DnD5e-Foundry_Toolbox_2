/**
 * Align Heavy Bowgun goldens with the catalog and Item Macro.
 * Run: node public/data/foundry-jsons-example/weapons-resources/ammo-hbg/apply-hbg-fixes.mjs
 * generate-uncommon.mjs / generate-rare.mjs call this after they write.
 */
import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const weaponDir = join(here, "..", "..", "weapons", "heavy-bowgun");
const macro = readFileSync(
  join(here, "..", "..", "..", "scripts", "weapons-resources", "ammo-hbg", "heavy-bowgun-item-macro.js"),
  "utf8",
);

const ON_USE = "[preTargeting]ItemMacro,[preambleComplete]ItemMacro,[preDamageRoll]ItemMacro,[postActiveEffects]ItemMacro";

const TIER = {
  common: {
    specialAmmoMax: 0,
    heart: null,
    guard: null,
    cluster: 2,
    extra: false,
    recover: false,
    piercer: null,
    ignitionMode: false,
    status: false,
    unlocked: ["normal"],
  },
  uncommon: {
    specialAmmoMax: 2,
    heart: "1d6",
    guard: "1d4",
    cluster: 2,
    extra: false,
    recover: false,
    piercer: null,
    ignitionMode: false,
    status: false,
    unlocked: ["normal", "pierce", "spread", "cluster", "recover"],
  },
  rare: {
    specialAmmoMax: 4,
    heart: "1d8",
    guard: "1d6",
    cluster: 2,
    extra: false,
    recover: false,
    piercer: null,
    ignitionMode: false,
    status: true,
    unlocked: ["normal", "pierce", "spread", "cluster", "recover", "poison", "paralysis", "sticky", "slicing", "wyvern"],
  },
  "very-rare": {
    specialAmmoMax: 6,
    heart: "1d10",
    guard: "1d6",
    cluster: 3,
    extra: true,
    recover: true,
    piercer: { dice: 2, line: 80 },
    ignitionMode: false,
    status: true,
    unlocked: ["normal", "pierce", "spread", "cluster", "recover", "poison", "paralysis", "sticky", "slicing", "wyvern"],
  },
  legendary: {
    specialAmmoMax: 8,
    heart: "1d10",
    guard: "1d6",
    cluster: 3,
    extra: true,
    recover: true,
    piercer: { dice: 4, line: 100 },
    ignitionMode: true,
    status: true,
    unlocked: ["normal", "pierce", "spread", "cluster", "recover", "poison", "paralysis", "sticky", "slicing", "wyvern"],
  },
};

const tierOfFile = (file) => {
  if (file.includes("very-rare")) return "very-rare";
  if (file.includes("legendary")) return "legendary";
  if (file.includes("uncommon")) return "uncommon";
  if (file.includes("rare")) return "rare";
  return "common";
};

const blankDuration = () => ({
  startTime: null,
  seconds: null,
  combat: null,
  rounds: null,
  turns: null,
  startRound: null,
  startTurn: null,
});

const stats = () => ({
  coreVersion: "12.331",
  systemId: "dnd5e",
  systemVersion: "4.4.4",
  createdTime: null,
  modifiedTime: null,
  lastModifiedBy: null,
});

const speedZero = () => ["walk", "fly", "swim", "climb", "burrow"].map((move) => ({
  key: `system.attributes.movement.${move}`,
  mode: 5,
  value: "0",
  priority: 20,
}));

const piercePart = (number, denomination) => ({
  number,
  denomination,
  types: ["piercing"],
  custom: { enabled: false, formula: "" },
  scaling: { mode: "", number: 1 },
  bonus: "",
});

const firePart = (number) => ({
  number,
  denomination: 6,
  types: ["fire"],
  custom: { enabled: false, formula: "" },
  scaling: { mode: "", number: 1 },
  bonus: "",
});

const actId = (act) => String(act?.midiProperties?.identifier ?? act?.identifier ?? "").toLowerCase();

const activitiesOf = (item) => item.system.activities ?? {};

const findAct = (item, identifier) => Object.values(activitiesOf(item)).find((a) => actId(a) === identifier);

const consumeOne = () => ({
  scaling: { allowed: false, max: "" },
  spellSlot: false,
  targets: [{ type: "itemUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
});

const emptyTemplate = () => ({
  count: "",
  contiguous: false,
  type: "",
  size: "",
  width: "",
  height: "",
  units: "ft",
});

const rangedAttack = () => ({
  ability: "",
  bonus: "",
  critical: { threshold: null },
  flat: false,
  type: { value: "ranged", classification: "weapon" },
});

function ensureEffect(item, effect) {
  item.effects = item.effects ?? [];
  const idx = item.effects.findIndex((e) => e._id === effect._id || e.name === effect.name);
  if (idx >= 0) item.effects[idx] = { ...item.effects[idx], ...effect, _id: item.effects[idx]._id || effect._id };
  else item.effects.push(effect);
}

function statusEffects() {
  return [
    {
      _id: "hbgAmmoPoisoned1",
      name: "Ammo: Poisoned",
      img: "systems/dnd5e/icons/svg/statuses/poisoned.svg",
      type: "base",
      system: {},
      changes: [],
      disabled: false,
      duration: { ...blankDuration(), seconds: 60, rounds: 10 },
      description: "<p>Poisoned for 1 minute. Repeat a Constitution saving throw against the attacker's Ammo DC at the end of each of its turns.</p>",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: ["poisoned"],
      sort: 0,
      flags: {
        dae: {
          specialDuration: [],
          stackable: "noneName",
          showIcon: true,
          selfTarget: false,
          selfTargetAlways: false,
          dontApply: false,
        },
        world: { hbg: { isPoisonAmmo: true } },
      },
      _stats: stats(),
    },
    {
      _id: "hbgAmmoIncap0002",
      name: "Ammo: Incapacitated",
      img: "systems/dnd5e/icons/svg/statuses/incapacitated.svg",
      type: "base",
      system: {},
      changes: speedZero(),
      disabled: false,
      duration: blankDuration(),
      description: "<p>Incapacitated and Speed 0 until the end of the attacker's next turn. A failed save by 5 or more applies Paralyzed instead.</p>",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: ["incapacitated"],
      sort: 0,
      flags: {
        dae: {
          specialDuration: ["turnEndSource"],
          stackable: "noneName",
          showIcon: true,
          selfTarget: false,
          dontApply: false,
        },
        world: { hbg: { isParalysisIncap: true } },
      },
      _stats: stats(),
    },
    {
      _id: "hbgAmmoRestrain3",
      name: "Ammo: Restrained",
      img: "systems/dnd5e/icons/svg/statuses/restrained.svg",
      type: "base",
      system: {},
      changes: [],
      disabled: false,
      duration: { ...blankDuration(), seconds: 60, rounds: 10 },
      description: "<p>Restrained for 1 minute. The creature can use its action to escape (Strength check vs the attacker's Ammo DC). Use Sticky Ammo: Escape.</p>",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: ["restrained"],
      sort: 0,
      flags: {
        dae: {
          specialDuration: [],
          stackable: "noneName",
          showIcon: true,
          selfTarget: false,
          dontApply: false,
        },
        world: { hbg: { isStickyAmmo: true } },
      },
      _stats: stats(),
    },
    {
      _id: "hbgAmmoParalyz04",
      name: "Ammo: Paralyzed",
      img: "systems/dnd5e/icons/svg/statuses/paralyzed.svg",
      type: "base",
      system: {},
      changes: speedZero(),
      disabled: false,
      duration: blankDuration(),
      description: "<p>Paralyzed until the end of the attacker's next turn (Constitution save failed by 5 or more).</p>",
      origin: null,
      tint: "#ffffff",
      transfer: false,
      statuses: ["paralyzed"],
      sort: 0,
      flags: {
        dae: {
          specialDuration: ["turnEndSource"],
          stackable: "noneName",
          showIcon: true,
          selfTarget: false,
          dontApply: false,
        },
        world: { hbg: { isParalysisParalyzed: true } },
      },
      _stats: stats(),
    },
  ];
}

function linkEffect(act, id) {
  const links = act.effects ?? [];
  if (!links.some((e) => e._id === id)) links.push({ _id: id, onSave: false });
  else links.forEach((e) => { if (e._id === id) e.onSave = false; });
  act.effects = links;
}

function hasPierceRider(parts) {
  return (parts ?? []).some((p) =>
    Number(p.number) === 1 && Number(p.denomination) === 6 && (p.types ?? []).includes("piercing"),
  );
}

function embedMacro(item) {
  item.flags = item.flags ?? {};
  const midi = item.flags["midi-qol"] ?? {};
  midi.onUseMacroName = ON_USE;
  midi.onUseMacroParts = {
    items: [
      { macroName: "ItemMacro", option: "preTargeting" },
      { macroName: "ItemMacro", option: "preambleComplete" },
      { macroName: "ItemMacro", option: "preDamageRoll" },
      { macroName: "ItemMacro", option: "postActiveEffects" },
    ],
  };
  item.flags["midi-qol"] = midi;
  const prev = item.flags.itemacro?.macro ?? {};
  item.flags.itemacro = {
    macro: {
      _id: prev._id ?? null,
      name: "Heavy Bowgun",
      type: "script",
      author: prev.author ?? "",
      img: "icons/svg/dice-target.svg",
      scope: "global",
      command: macro,
      folder: null,
      sort: 0,
      ownership: { default: 0 },
      flags: {},
      _stats: { ...stats(), ...(prev._stats ?? {}) },
    },
  };
}

function setWorld(item, tier, spec) {
  item.flags.world = item.flags.world ?? {};
  const prev = item.flags.world.hbg ?? {};
  item.flags.world.hbg = {
    ...prev,
    isHeavyBowgun: true,
    tier: tier === "very-rare" ? "veryRare" : tier,
    specialAmmoMax: spec.specialAmmoMax,
    ignitionMax: 3,
    ignition: 0,
    ignitionOnHit: tier !== "common",
    unlockedAmmo: spec.unlocked,
    loadedAmmoKey: null,
    ...(spec.heart ? { wyvernheartBonus: spec.heart } : { wyvernheartBonus: undefined }),
    ...(spec.guard ? { guardDie: spec.guard } : { guardDie: undefined }),
  };
  if (!spec.heart) delete item.flags.world.hbg.wyvernheartBonus;
  if (!spec.guard) delete item.flags.world.hbg.guardDie;
}

function emptyMagazine(item) {
  const max = Number(item.system?.uses?.max);
  if (!Number.isFinite(max) || max <= 0) return;
  item.system.uses = { ...(item.system.uses ?? {}), spent: max, max: String(max), recovery: item.system.uses?.recovery ?? [] };
}

function dropPlainAttack(item, tier) {
  const acts = activitiesOf(item);
  for (const [key, act] of Object.entries(acts)) {
    const id = actId(act);
    const name = String(act.name ?? "");
    const isPlain = id === "attack" || name === "Attack";
    if (!isPlain) continue;
    if (tier === "common") {
      act.name = "Normal Ammo";
      act.midiProperties = { ...(act.midiProperties ?? {}), identifier: "normal-ammo", displayActivityName: true };
      act.consumption = consumeOne();
      act.activation = { type: "action", value: 1, override: false };
      act.description = { ...(act.description ?? {}), chatFlavor: "Base weapon damage (1d10 piercing). Spends 1 loaded round." };
      continue;
    }
    delete acts[key];
  }
}

function ensureReloadPair(item) {
  const acts = activitiesOf(item);
  const reloads = Object.values(acts).filter((a) => actId(a) === "reload" || /^reload\b/i.test(a.name ?? ""));
  if (!reloads.length) return;
  const source = reloads[0];
  source.midiProperties = { ...(source.midiProperties ?? {}), identifier: "reload" };
  source.description = {
    ...(source.description ?? {}),
    chatFlavor: "Action or Bonus Action. Choose ammunition from your inventory and fill the magazine.",
  };
  const has = (type) => reloads.some((a) => a.activation?.type === type) || Object.values(acts).some((a) => actId(a) === "reload" && a.activation?.type === type);
  const clone = (type, id, name, sort) => {
    if (has(type)) {
      const existing = Object.values(acts).find((a) => actId(a) === "reload" && a.activation?.type === type);
      if (existing) {
        existing.name = name;
        existing.activation = { ...(existing.activation ?? {}), type, value: 1, override: false };
      }
      return;
    }
    acts[id] = {
      ...structuredClone(source),
      _id: id,
      name,
      sort,
      activation: { type, value: 1, condition: "", override: false },
    };
    acts[id].midiProperties = { ...(acts[id].midiProperties ?? {}), identifier: "reload" };
  };
  clone("action", "reldHbgAct000001", "Reload", source.sort ?? 1000);
  clone("bonus", "reldHbgBa0000001", "Reload (Bonus Action)", (source.sort ?? 1000) + 1);
}

function patchCluster(item, dice) {
  const cluster = findAct(item, "cluster-ammo");
  if (cluster) {
    cluster.range = { value: 100, units: "ft", special: "", override: true };
    cluster.damage = { critical: { bonus: "" }, includeBase: false, parts: [] };
    cluster.midiProperties = {
      ...(cluster.midiProperties ?? {}),
      identifier: "cluster-ammo",
      triggeredActivityId: "none",
      triggeredActivityConditionText: "",
    };
    cluster.otherActivityId = "none";
    cluster.description = {
      ...(cluster.description ?? {}),
      chatFlavor: `On hit: no weapon damage. ${dice}d6 fire to the target and each creature within 5 feet.`,
    };
  }
  const burst = findAct(item, "cluster-burst");
  if (burst) {
    burst.midiProperties = { ...(burst.midiProperties ?? {}), identifier: "cluster-burst", automationOnly: true, triggeredActivityId: "none" };
    burst.damage = burst.damage ?? {};
    burst.damage.parts = [firePart(dice)];
    burst.description = { ...(burst.description ?? {}), chatFlavor: `${dice}d6 fire, 5-ft radius around the target (no save).` };
  }
}

function patchPierce(item, extra) {
  const act = findAct(item, "pierce-ammo");
  if (!act) return;
  act.range = { value: 40, units: "ft", special: "", override: true };
  act.midiProperties = { ...(act.midiProperties ?? {}), identifier: "pierce-ammo", rollAttackPerTarget: "never" };
  act.rollAttackPerTarget = "never";
  act.damage = act.damage ?? { includeBase: true, parts: [] };
  act.damage.includeBase = true;
  act.damage.parts = act.damage.parts ?? [];
  if (extra && !hasPierceRider(act.damage.parts)) act.damage.parts.push(piercePart(1, 6));
  if (!extra) act.damage.parts = act.damage.parts.filter((p) => !(Number(p.number) === 1 && Number(p.denomination) === 6));
  act.description = {
    ...(act.description ?? {}),
    chatFlavor: extra
      ? "40-ft line, 5 ft wide. One attack roll vs each creature. Weapon damage + 1d6 piercing."
      : "40-ft line, 5 ft wide. One attack roll vs each creature in the line.",
  };
}

function patchNormal(item, extra) {
  const act = findAct(item, "normal-ammo");
  if (!act) return;
  act.consumption = consumeOne();
  act.damage = act.damage ?? { includeBase: true, parts: [] };
  act.damage.includeBase = true;
  act.damage.parts = act.damage.parts ?? [];
  if (extra && !hasPierceRider(act.damage.parts)) act.damage.parts.push(piercePart(1, 6));
  if (!extra) act.damage.parts = act.damage.parts.filter((p) => !(Number(p.number) === 1 && Number(p.denomination) === 6));
  act.description = {
    ...(act.description ?? {}),
    chatFlavor: extra
      ? "Weapon damage + 1d6 piercing. Spends 1 loaded round."
      : "Weapon damage. Spends 1 loaded round.",
  };
}

function patchSpread(item, extra) {
  const act = findAct(item, "spread-ammo");
  if (!act) return;
  act.damage = act.damage ?? {};
  act.damage.onSave = "none";
  const parts = [piercePart(1, 10)];
  if (extra) parts.push(piercePart(1, 6));
  act.damage.parts = parts;
  act.range = { value: "", units: "self", special: "", override: true };
  act.description = {
    ...(act.description ?? {}),
    chatFlavor: extra
      ? "15-ft cone. Dexterity save. 1d10 + 1d6 piercing on a failure."
      : "15-ft cone. Dexterity save. 1d10 piercing on a failure.",
  };
}

function patchRecover(item, upgraded) {
  const act = findAct(item, "recover-ammo");
  if (!act) return;
  const healing = act.healing ?? {
    types: ["healing"],
    custom: { enabled: false, formula: "" },
    scaling: { mode: "", number: 1 },
  };
  healing.number = upgraded ? 2 : 1;
  healing.denomination = 4;
  healing.bonus = upgraded ? "@prof" : "";
  healing.types = healing.types?.length ? healing.types : ["healing"];
  act.healing = healing;
  act.description = {
    ...(act.description ?? {}),
    chatFlavor: upgraded
      ? "Willing creature regains 2d4 + proficiency bonus hit points."
      : "Willing creature regains 1d4 hit points.",
  };
}

function patchSlicing(item) {
  const act = findAct(item, "slicing-ammo");
  if (!act) return;
  act.range = { value: 400, long: 400, units: "ft", override: true };
  act.damage = act.damage ?? {};
  act.damage.onSave = "half";
  act.description = {
    ...(act.description ?? {}),
    chatFlavor: "Dexterity save, long range. 4d6 slashing (half on success). Advantage on the save beyond 100 feet.",
  };
}

function patchWyvernpiercer(item, spec) {
  if (!spec) return;
  let act = findAct(item, "wyvernpiercer");
  if (!act) return;
  act.type = "attack";
  act.name = "Wyvernpiercer";
  act.activation = { type: "action", value: 1, condition: "", override: false };
  act.consumption = consumeOne();
  act.attack = rangedAttack();
  act.damage = {
    critical: { bonus: "" },
    includeBase: true,
    parts: [piercePart(spec.dice, 10)],
  };
  delete act.save;
  act.range = { value: spec.line, units: "ft", special: "", override: true };
  act.target = {
    template: { count: "", contiguous: false, type: "line", size: String(spec.line), width: "5", height: "", units: "ft" },
    affects: { count: "", type: "", choice: false, special: "" },
    prompt: true,
    override: true,
  };
  act.midiProperties = {
    ...(act.midiProperties ?? {}),
    identifier: "wyvernpiercer",
    rollAttackPerTarget: "never",
    triggeredActivityId: "none",
    automationOnly: false,
  };
  act.rollAttackPerTarget = "never";
  act.description = {
    chatFlavor: `Spend 2 Ignition and 1 round. ${spec.line}-ft line, one attack roll vs each AC. Weapon damage + ${spec.dice}d10 piercing. No special ammo effect. Guard locks until your next turn starts.`,
  };
}

function ensurePiercerBonus(item, spec) {
  if (!spec || !findAct(item, "wyvernpiercer")) return;
  const acts = activitiesOf(item);
  let bonus = findAct(item, "wyvernpiercer-bonus");
  const base = findAct(item, "wyvernpiercer");
  if (!bonus) {
    bonus = structuredClone(base);
    bonus._id = "wyvnPrcBonus0001";
    acts[bonus._id] = bonus;
  }
  bonus.name = "Wyvernpiercer (Bonus Action)";
  bonus.activation = {
    type: "bonus",
    value: 1,
    condition: "While Ignition Mode is active",
    override: false,
  };
  bonus.midiProperties = { ...(bonus.midiProperties ?? {}), identifier: "wyvernpiercer-bonus", rollAttackPerTarget: "never" };
  bonus.sort = (base.sort ?? 0) + 1;
  bonus.description = {
    chatFlavor: "Ignition Mode only. Same shot as Wyvernpiercer, as a Bonus Action.",
  };
}

function patchGuard(item, die) {
  const act = findAct(item, "guard");
  if (!act || !die) return;
  act.activation = {
    ...(act.activation ?? {}),
    type: "reaction",
    value: 1,
    condition: "When a creature you can see hits you with an attack while you are wielding this weapon",
  };
  act.roll = { formula: "", name: "", prompt: false, visible: false };
  act.target = {
    ...(act.target ?? {}),
    affects: { count: "", type: "self", choice: false, special: "" },
    prompt: false,
  };
  act.description = {
    ...(act.description ?? {}),
    chatFlavor: `Add ${die} to your AC against the triggering attack (Midi rechecks). Cannot be used on a Wyvernheart turn, during Ignition Mode, or after Wyvernpiercer until your next turn.`,
  };
}

function patchWyvernheart(item, die) {
  const act = findAct(item, "wyvernheart");
  if (!act || !die) return;
  act.consumption = consumeOne();
  act.description = {
    ...(act.description ?? {}),
    chatFlavor: `Spend 1 Ignition and 1 round. Extra attack (no special ammo effect). +${die} piercing if you already hit with this weapon this turn.`,
  };
}

function patchWyverncounter(item) {
  const act = findAct(item, "wyverncounter");
  if (!act) return;
  act.activation = {
    type: "special",
    value: null,
    condition: "When Guard causes the triggering attack to miss (no additional action)",
    override: false,
  };
  act.consumption = consumeOne();
  act.description = {
    ...(act.description ?? {}),
    chatFlavor: "Spend 1 Ignition and 1 round. No special ammo effect. +1d8 piercing if the attacker is within 15 feet.",
  };
}

function ensureIgnitionMode(item) {
  const acts = activitiesOf(item);
  let act = findAct(item, "ignition-mode");
  if (!act) {
    act = {
      _id: "igniMode00000001",
      type: "utility",
      sort: 950000,
      name: "Ignition Mode",
      img: "icons/magic/fire/projectile-fireball-orange.webp",
      effects: [],
      uses: { spent: 0, max: "", recovery: [] },
      midiProperties: { identifier: "ignition-mode", automationOnly: false, triggeredActivityId: "none" },
    };
    acts[act._id] = act;
  }
  act.activation = { type: "bonus", value: 1, condition: "", override: false };
  act.consumption = {
    scaling: { allowed: false, max: "" },
    spellSlot: false,
    targets: [{ type: "activityUses", target: "", value: "1", scaling: { mode: "", formula: "" } }],
  };
  act.duration = { value: "1", units: "minute", concentration: false, override: true };
  act.uses = {
    spent: 0,
    max: "@prof",
    recovery: [{ period: "lr", type: "recoverAll", formula: "" }],
  };
  act.target = {
    template: emptyTemplate(),
    affects: { count: "", type: "self", choice: false, special: "" },
    prompt: false,
    override: false,
  };
  act.range = { value: null, units: "self", special: "", override: false };
  act.effects = [{ _id: "hbgIgnitionMode01" }];
  act.midiProperties = { ...(act.midiProperties ?? {}), identifier: "ignition-mode", triggeredActivityId: "none" };
  act.description = {
    chatFlavor: "1 minute. PB uses / Long Rest. Hits grant 2 Ignition (max 3). Guard and Wyverncounter are off. Wyvernpiercer can be a Bonus Action.",
  };
  ensureEffect(item, {
    _id: "hbgIgnitionMode01",
    name: "Ignition Mode",
    img: "icons/magic/fire/projectile-fireball-orange.webp",
    type: "base",
    system: {},
    changes: [],
    disabled: false,
    duration: { ...blankDuration(), seconds: 60, rounds: 10 },
    description: "<p>For 1 minute, hits grant 2 Ignition (maximum 3). You cannot use Guard or Wyverncounter. You can use Wyvernpiercer as a Bonus Action.</p>",
    origin: null,
    tint: "#ffffff",
    transfer: false,
    statuses: [],
    sort: 0,
    flags: {
      dae: { specialDuration: [], stackable: "noneName", showIcon: true },
      world: { hbg: { isIgnitionMode: true } },
    },
    _stats: stats(),
  });
}

function ensureStickyEscape(item) {
  const acts = activitiesOf(item);
  if (findAct(item, "sticky-escape")) return;
  const id = "stkyEscp00000001";
  acts[id] = {
    _id: id,
    type: "utility",
    sort: 860000,
    name: "Sticky Ammo: Escape",
    activation: {
      type: "special",
      value: null,
      condition: "The restrained creature spends its action to escape",
      override: false,
    },
    consumption: { scaling: { allowed: false, max: "" }, spellSlot: false, targets: [] },
    description: { chatFlavor: "Strength check vs Ammo DC. Success ends Restrained. Does not spend a round or the shooter's action." },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: [],
    range: { value: 100, units: "ft", special: "", override: true },
    target: {
      template: emptyTemplate(),
      affects: { count: "1", type: "creature", choice: false, special: "" },
      prompt: true,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    midiProperties: { identifier: "sticky-escape", triggeredActivityId: "none", automationOnly: false },
    roll: { formula: "", name: "", prompt: false, visible: false },
  };
}

function patchSaveLinks(item) {
  const poison = findAct(item, "poison-ammo-save");
  if (poison) linkEffect(poison, "hbgAmmoPoisoned1");
  const para = findAct(item, "paralysis-ammo-save");
  if (para) linkEffect(para, "hbgAmmoIncap0002");
  const sticky = findAct(item, "sticky-ammo-save");
  if (sticky) linkEffect(sticky, "hbgAmmoRestrain3");
}

function patchWeapon(item, tier) {
  const spec = TIER[tier];
  embedMacro(item);
  setWorld(item, tier, spec);
  emptyMagazine(item);
  dropPlainAttack(item, tier);
  ensureReloadPair(item);
  patchNormal(item, spec.extra);
  patchPierce(item, spec.extra);
  patchSpread(item, spec.extra);
  patchCluster(item, spec.cluster);
  patchRecover(item, spec.recover);
  patchSlicing(item);
  patchGuard(item, spec.guard);
  patchWyvernheart(item, spec.heart);
  patchWyverncounter(item);
  patchWyvernpiercer(item, spec.piercer);
  if (tier === "legendary") ensurePiercerBonus(item, spec.piercer);
  else {
    const acts = activitiesOf(item);
    for (const [key, act] of Object.entries(acts)) {
      if (actId(act) === "wyvernpiercer-bonus") delete acts[key];
    }
  }
  if (spec.ignitionMode) ensureIgnitionMode(item);
  if (spec.status) {
    for (const effect of statusEffects()) ensureEffect(item, effect);
    patchSaveLinks(item);
    ensureStickyEscape(item);
  }
}

const AMMO_NOTES = {
  "cluster-ammo": "<p><strong>Very Rare Heavy Bowgun:</strong> the burst deals 3d6 fire instead of 2d6.</p>",
  "recover-ammo": "<p><strong>Very Rare Heavy Bowgun:</strong> restores 2d4 + your proficiency bonus hit points.</p>",
  "normal-ammo": "<p><strong>Very Rare Heavy Bowgun:</strong> deals an extra 1d6 piercing.</p>",
  "pierce-ammo": "<p><strong>Very Rare Heavy Bowgun:</strong> deals an extra 1d6 piercing.</p>",
  "spread-ammo": "<p><strong>Very Rare Heavy Bowgun:</strong> deals an extra 1d6 piercing on a failed save.</p>",
};

function patchAmmo(item) {
  item.system.activities = {};
  item.system.uses = { spent: 0, max: "", recovery: [], autoDestroy: false };
  const key = item.system?.identifier;
  const note = AMMO_NOTES[key];
  if (!note) return;
  const html = item.system.description?.value ?? "";
  if (!html.includes("Very Rare Heavy Bowgun")) {
    item.system.description = item.system.description ?? {};
    item.system.description.value = `${html}${note}`;
  }
}

export function patchHbg() {
  const files = readdirSync(weaponDir).filter((f) => f.endsWith(".json")).sort();
  for (const file of files) {
    const path = join(weaponDir, file);
    const item = JSON.parse(readFileSync(path, "utf8"));
    patchWeapon(item, tierOfFile(file));
    writeFileSync(path, `${JSON.stringify(item, null, 2)}\n`);
    console.log("patched", file);
  }
  const ammoFiles = readdirSync(here).filter((f) => f.endsWith(".json"));
  for (const file of ammoFiles) {
    const path = join(here, file);
    const item = JSON.parse(readFileSync(path, "utf8"));
    patchAmmo(item);
    writeFileSync(path, `${JSON.stringify(item, null, 2)}\n`);
    console.log("patched", file);
  }
}

const isDirect = process.argv[1]?.replaceAll("\\", "/").endsWith("apply-hbg-fixes.mjs");
if (isDirect) patchHbg();
