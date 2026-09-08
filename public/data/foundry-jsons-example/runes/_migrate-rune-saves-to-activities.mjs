/**
 * Migrate on-hit/crit save runes to Midi save activities + thin combat orchestration.
 * Run: node public/data/foundry-jsons-example/runes/_migrate-rune-saves-to-activities.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { composeRuneItemMacroCommand } from "../../scripts/runes/compose-rune-itemacro.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FLAG = "amellwind-toolbox";

function id8() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let s = "";
  for (let i = 0; i < 16; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function saveActivity(id, name, opts = {}) {
  const {
    ability = ["con"],
    dcFormula = "14",
    effectIds = [],
    activationType = "special",
    condition = "",
    consumeItemUse = false,
    onSave = "none",
    chatFlavor = "",
    identifier = null,
  } = opts;
  return {
    _id: id,
    type: "save",
    sort: 0,
    name,
    img: "mh-icons/material-rune.webp",
    activation: { type: activationType, value: null, condition, override: false },
    consumption: {
      scaling: { allowed: false, max: "" },
      spellSlot: false,
      targets: consumeItemUse
        ? [{ type: "itemUses", value: "1", scaling: { mode: "", formula: "" } }]
        : [],
    },
    description: { chatFlavor },
    duration: { value: "", units: "inst", concentration: false, override: false },
    effects: effectIds.map((eid) => ({ _id: eid, onSave: false })),
    range: { value: null, units: "ft", special: "", override: false },
    target: {
      template: { count: "", contiguous: false, type: "", size: "", width: "", height: "", units: "ft" },
      affects: { count: "1", type: "creature", choice: false, special: "" },
      prompt: false,
      override: false,
    },
    uses: { spent: 0, max: "", recovery: [] },
    damage: { parts: [], onSave },
    save: { ability, dc: { calculation: "", formula: dcFormula } },
    midiProperties: {
      identifier: identifier ?? name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      displayActivityName: true,
      magicDamage: false,
    },
    roll: { formula: "", name: "", prompt: false, visible: false },
  };
}

function conditionEffect(id, name, status, opts = {}) {
  const {
    seconds = null,
    rounds = 1,
    specialDuration = ["turnEnd"],
    description = "",
    flagKey = "runeSaveEffect",
  } = opts;
  return {
    _id: id,
    name,
    img: opts.img ?? "icons/svg/poison.svg",
    type: "base",
    system: {},
    changes: [],
    disabled: false,
    duration: {
      startTime: null,
      seconds,
      combat: null,
      rounds,
      turns: null,
      startRound: null,
      startTurn: null,
    },
    description,
    origin: null,
    tint: "#ffffff",
    transfer: false,
    statuses: [status],
    sort: 0,
    flags: {
      dae: {
        enableCondition: "",
        selfTarget: false,
        selfTargetAlways: false,
        stackable: "noneName",
        showIcon: true,
        durationExpression: "",
        specialDuration,
        disableIncapacitated: false,
        dontApply: false,
      },
      [FLAG]: { [flagKey]: true, saveEffectBlueprint: true },
    },
  };
}

function combatHitSave(identifier, { critOnly = false, nat20Only = false } = {}) {
  const checks = [];
  if (critOnly) {
    checks.push(`
  const isCrit = Boolean(wf.isCritical || arg0?.isCritical);
  if (!isCrit) return;`);
  }
  if (nat20Only) {
    checks.push(`
  let isNat20 = Boolean(wf.isCritical || arg0?.isCritical);
  try {
    for (const d of (wf.attackRoll?.dice ?? arg0?.attackRoll?.dice ?? [])) {
      for (const r of (d.results ?? [])) {
        if (Number(r.result ?? r) === 20 && !r.discarded) isNat20 = true;
      }
    }
  } catch (_) {}
  if (!isNat20) return;`);
  }
  return `
if (pass.includes("postdamageroll") || pass.includes("postactiveeffects") || pass.includes("ishit") || pass.includes("iscritical")) {
  const applied = getRuneFlag(item, "applied");
  if (!applied || applied.side !== "weapon") return;
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actType = String(wf.activity?.type ?? arg0?.activity?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isWeaponAttack =
    itemType === "weapon"
    || ["mwak", "rwak"].includes(actionType)
    || (actType === "attack" && itemType !== "spell");
  if (!isWeaponAttack) return;
${checks.join("\n")}
  const hits = [...(arg0?.hitTargets ?? wf.hitTargets ?? [])];
  if (!hits.length) return;
  const targetUuids = hits.map((t) => t?.document?.uuid ?? t?.uuid ?? t?.actor?.uuid).filter(Boolean);
  if (!targetUuids.length) return;
  await useRuneSaveActivity({ identifier: "${identifier}", targetUuids });
  return;
}
`.trim();
}

const migrations = [
  {
    file: path.join(__dirname, "Nerscylla/fvtt-Item-nerscylla-nerscylla-chelicera-rune.json"),
    effectId: "nrsCheliPoisonEf01",
    activityId: "nrsCheliPoisonSv01",
    activityName: "Poisoned Strike",
    identifier: "poisoned-strike",
    dc: "13",
    status: "poisoned",
    effectName: "Poisoned (Chelicera)",
    effectOpts: {
      rounds: 1,
      specialDuration: ["turnEnd"],
      description: "Poisoned until the end of the creature's next turn.",
      img: "icons/svg/poison.svg",
      flagKey: "cheliceraPoison",
    },
    combat: () => combatHitSave("poisoned-strike"),
  },
  {
    file: path.join(__dirname, "Fey Nerscylla/fvtt-Item-fey-nerscylla-fey-nerscylla-chelicera-rune.json"),
    effectId: "feyCheliPoisonEf01",
    activityId: "feyCheliPoisonSv01",
    activityName: "Poisoned Strike",
    identifier: "poisoned-strike",
    dc: "14",
    status: "poisoned",
    effectName: "Poisoned (Fey Chelicera)",
    effectOpts: {
      rounds: 1,
      specialDuration: ["turnEnd"],
      description: "Poisoned until the end of the creature's next turn.",
      img: "icons/svg/poison.svg",
      flagKey: "cheliceraPoison",
    },
    combat: () => combatHitSave("poisoned-strike"),
  },
  {
    file: path.join(__dirname, "Somnacanth/fvtt-Item-somnacanth-somnacanth-gem-rune.json"),
    effectId: "somGemIncapEf0001",
    activityId: "somGemIncapSv0001",
    activityName: "Critical Status (Incapacitate)",
    identifier: "critical-status-incapacitate",
    dc: "14",
    status: "incapacitated",
    effectName: "Incapacitated (Somnacanth Gem)",
    effectOpts: {
      rounds: 1,
      specialDuration: ["turnEnd"],
      description: "Incapacitated until the end of its next turn.",
      img: "icons/svg/paralysis.svg",
      flagKey: "somnacanthCritStatus",
    },
    combat: () => combatHitSave("critical-status-incapacitate", { critOnly: true }),
  },
  {
    file: path.join(__dirname, "Viper Tobi-Kadachi/fvtt-Item-viper-tobi-kadachi-v-kadachi-gem-rune.json"),
    effectId: "vkadGemPoisonEf01",
    activityId: "vkadGemPoisonSv01",
    activityName: "Poison on Natural 20",
    identifier: "poison-on-natural-20",
    dc: "14",
    status: "poisoned",
    effectName: "Poisoned (V.Kadachi Gem)",
    effectOpts: {
      rounds: null,
      seconds: 60,
      specialDuration: [],
      description: "Poisoned for 1 minute.",
      img: "icons/svg/poison.svg",
      flagKey: "vKadachiPoison",
    },
    combat: () => combatHitSave("poison-on-natural-20", { nat20Only: true }),
  },
];

for (const m of migrations) {
  const j = JSON.parse(fs.readFileSync(m.file, "utf8"));
  // Remove prior save-effect blueprints we may have added (by flag)
  j.effects = (j.effects || []).filter((e) => !foundryFlag(e, "saveEffectBlueprint"));
  // Ensure effect + activity
  const ef = conditionEffect(m.effectId, m.effectName, m.status, m.effectOpts);
  j.effects.push(ef);

  j.system.activities = j.system.activities || {};
  // Drop old auto save activities with same identifier if re-run
  for (const [k, a] of Object.entries(j.system.activities)) {
    if (a?.midiProperties?.identifier === m.identifier || a?._id === m.activityId) {
      delete j.system.activities[k];
    }
  }
  j.system.activities[m.activityId] = saveActivity(m.activityId, m.activityName, {
    ability: ["con"],
    dcFormula: m.dc,
    effectIds: [m.effectId],
    condition: "Weapon side — automated on qualifying hit",
    chatFlavor: `${m.activityName} (DC ${m.dc} Con)`,
    identifier: m.identifier,
  });

  j.flags.itemacro.macro.command = composeRuneItemMacroCommand(m.combat());
  fs.writeFileSync(m.file, `${JSON.stringify(j, null, 2)}\n`);
  console.log("migrated", path.basename(m.file));
}

function foundryFlag(e, key) {
  return e?.flags?.[FLAG]?.[key];
}

// Stygian Zinogre — wire existing Necrotic Explosion
{
  const file = path.join(
    __dirname,
    "Stygian Zinogre/fvtt-Item-stygian-zinogre-s-zinogre-umbrage-rune.json",
  );
  const j = JSON.parse(fs.readFileSync(file, "utf8"));
  const weaponEf = (j.effects || []).find((e) => e?.flags?.[FLAG]?.runeSide === "weapon");
  if (weaponEf) {
    const hasOnUse = (weaponEf.changes || []).some((c) => String(c.key).includes("onUseMacroName"));
    if (!hasOnUse) {
      weaponEf.changes = weaponEf.changes || [];
      weaponEf.changes.push({
        key: "flags.midi-qol.onUseMacroName",
        mode: 0,
        value: `ItemMacro.${j.name},postDamageRoll`,
        priority: 20,
      });
    }
  }
  const combat = `
if (pass.includes("postdamageroll") || pass.includes("postactiveeffects") || pass.includes("ishit")) {
  const applied = getRuneFlag(item, "applied");
  if (!applied || applied.side !== "weapon") return;
  const wf = workflow ?? arg0?.workflow;
  if (!wf) return;
  const itemType = String(wf.item?.type ?? "").toLowerCase();
  const actType = String(wf.activity?.type ?? arg0?.activity?.type ?? "").toLowerCase();
  const actionType = String(arg0?.itemActionType ?? wf.itemActionType ?? "").toLowerCase();
  const isWeaponAttack =
    itemType === "weapon"
    || ["mwak", "rwak"].includes(actionType)
    || (actType === "attack" && itemType !== "spell");
  if (!isWeaponAttack) return;
  const hits = [...(arg0?.hitTargets ?? wf.hitTargets ?? [])];
  if (!hits.length) return;
  const usesMax = Number(item.system?.uses?.max ?? 0);
  const usesSpent = Number(item.system?.uses?.spent ?? 0);
  if (usesMax > 0 && usesSpent >= usesMax) {
    ui.notifications?.warn?.(\`\${runeName}: no rune charges remaining for Necrotic Explosion.\`);
    return;
  }
  const targetUuids = hits.map((t) => t?.document?.uuid ?? t?.uuid ?? t?.actor?.uuid).filter(Boolean);
  if (!targetUuids.length) return;
  await useRuneSaveActivity({ identifier: "necrotic-explosion", targetUuids });
  return;
}
`.trim();
  j.flags.itemacro.macro.command = composeRuneItemMacroCommand(combat);
  fs.writeFileSync(file, `${JSON.stringify(j, null, 2)}\n`);
  console.log("migrated", path.basename(file));
}

console.log("Save-activity migration complete.");
